import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { Resend } from "resend";
import { v } from "convex/values";
import type {
  FunctionReference,
  FunctionReturnType,
  OptionalRestArgs,
} from "convex/server";
import { internal } from "./_generated/api";
import { internalAction, internalQuery } from "./_generated/server";
import type { DatabaseReader, DatabaseWriter } from "./_generated/server";

const DEFAULT_RESET_SUBJECT = "Reset your Nexus password";
const DEFAULT_RESET_HTML = `
  <p>Someone requested a password reset for your Nexus account.</p>
  <p><a href="{{resetUrl}}">Reset your password</a></p>
  <p>If you did not request this, you can ignore this email.</p>
`;
const DEFAULT_WELCOME_SUBJECT = "Welcome to Nexus";
const DEFAULT_WELCOME_HTML = `
  <p>Welcome to Nexus{{name}},</p>
  <p>Your account is ready. You can sign in anytime to manage your workspace.</p>
`;

const renderTemplate = (template: string, variables: Record<string, string>) =>
  template.replace(/{{\s*(\w+)\s*}}/g, (_, key: string) => {
    return variables[key] ?? "";
  });

const ROLE_PRESETS = [
  {
    name: "admin",
    description: "Full access to manage users, roles, and settings.",
    permissions: [
      "users.read",
      "users.write",
      "roles.manage",
      "audit.read",
      "subscriptions.read",
      "subscriptions.manage",
      "billing.manage",
      "settings.manage",
    ],
  },
  {
    name: "author",
    description: "Create and maintain content with limited access.",
    permissions: ["users.read", "subscriptions.read"],
  },
  {
    name: "user",
    description: "Default access with minimal administrative permissions.",
    permissions: ["subscriptions.read"],
  },
];

const ensureRolePresets = async (db: DatabaseWriter) => {
  for (const preset of ROLE_PRESETS) {
    const existing = await db
      .query("roles")
      .withIndex("name", (q) => q.eq("name", preset.name))
      .first();
    if (!existing) {
      await db.insert("roles", preset);
    }
  }
};

type RunQuery = <
  Query extends FunctionReference<"query", "public" | "internal">,
>(
  query: Query,
  ...args: OptionalRestArgs<Query>
) => Promise<FunctionReturnType<Query>>;

type EmailSettingsContext = {
  db?: DatabaseReader;
  runQuery?: RunQuery;
};

const fetchEmailSettings = async (ctx?: EmailSettingsContext) => {
  if (ctx?.db) {
    return await ctx.db.query("emailSettings").first();
  }
  if (ctx?.runQuery) {
    return await ctx.runQuery(internal.admin.getEmailSettingsInternal, {});
  }
  return null;
};

export const getEmailSettingsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("emailSettings").first();
  },
});

const sendEmail = async ({
  ctx,
  to,
  subject,
  html,
}: {
  ctx?: EmailSettingsContext;
  to: string;
  subject: string;
  html: string;
}) => {
  const settings = await fetchEmailSettings(ctx);
  const resendApiKey = settings?.resendApiKey ?? process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return;
  }

  const resend = new Resend(resendApiKey);
  const from =
    settings?.from ?? process.env.AUTH_EMAIL_FROM ?? "no-reply@upty.dev";
  const replyTo = settings?.replyTo ?? process.env.AUTH_EMAIL_REPLY_TO;

  await resend.emails.send({
    from,
    to,
    subject,
    html,
    replyTo: replyTo ? [replyTo] : undefined,
  });
};

const passwordResetProvider = {
  id: "password-reset",
  type: "email" as const,
  name: "Password reset",
  from: process.env.AUTH_EMAIL_FROM ?? "no-reply@upty.dev",
  maxAge: 60 * 60,
  sendVerificationRequest: async (
    {
      identifier,
      url,
    }: {
      identifier: string;
      url: string;
    },
    ctx?: EmailSettingsContext,
  ) => {
    const settings = await fetchEmailSettings(ctx);
    const subject = settings?.resetSubject ?? DEFAULT_RESET_SUBJECT;
    const html = renderTemplate(settings?.resetHtml ?? DEFAULT_RESET_HTML, {
      resetUrl: url,
      email: identifier,
    });

    await sendEmail({
      ctx,
      to: identifier,
      subject,
      html,
    });
  },
};

export const sendWelcomeEmail = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.auth.getWelcomeEmailUser, {
      userId: args.userId,
    });
    if (!user?.email) {
      return;
    }

    const settings = await fetchEmailSettings({ runQuery: ctx.runQuery });
    const subject = settings?.welcomeSubject ?? DEFAULT_WELCOME_SUBJECT;
    const nameSuffix = user.name ? ` ${user.name}` : "";
    const html = renderTemplate(settings?.welcomeHtml ?? DEFAULT_WELCOME_HTML, {
      name: nameSuffix,
      email: user.email,
    });

    await sendEmail({
      ctx: { runQuery: ctx.runQuery },
      to: user.email,
      subject,
      html,
    });
  },
});

export const getWelcomeEmailUser = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      reset: passwordResetProvider,
      profile: (params) => {
        const email = String(params.email ?? "")
          .trim()
          .toLowerCase();
        if (!email) {
          throw new Error("Email is required");
        }
        const rawName = typeof params.name === "string" ? params.name : "";
        const name = rawName.trim().toLowerCase();
        const profile = {
          email,
          ...(name.length > 0 ? { name } : {}),
        };
        return profile;
      },
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID ?? "",
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? "",
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
  ],
  callbacks: {
    afterUserCreatedOrUpdated: async (ctx, args) => {
      if (args.existingUserId !== null) {
        return;
      }

      await ensureRolePresets(ctx.db);

      const user = await ctx.db.get("users", args.userId);
      if (!user) {
        return;
      }

      if (!user.role) {
        const existingAdmin = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("role"), "admin"))
          .first();
        const defaultRole = existingAdmin ? "user" : "admin";
        await ctx.db.patch(args.userId, {
          role: defaultRole,
        });
      }

      if (args.type !== "credentials" || !user.email) {
        return;
      }

      await ctx.scheduler.runAfter(0, internal.auth.sendWelcomeEmail, {
        userId: args.userId,
      });
    },
  },
});
