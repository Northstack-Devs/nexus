import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { Resend } from "resend";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalQuery } from "./_generated/server";

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

type EmailSettingsContext = {
  db?: any;
  runQuery?: (query: any, args: Record<string, unknown>) => Promise<any>;
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
      profile: (params, _ctx) => {
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
  ],
  callbacks: {
    afterUserCreatedOrUpdated: async (ctx, args) => {
      if (args.existingUserId !== null || args.type !== "credentials") {
        return;
      }

      const user = await ctx.db.get("users", args.userId);
      if (!user?.email) {
        return;
      }

      await ctx.scheduler.runAfter(0, internal.auth.sendWelcomeEmail, {
        userId: args.userId,
      });
    },
  },
});
