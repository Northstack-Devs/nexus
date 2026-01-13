import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

const passwordResetProvider = {
  id: "password-reset",
  type: "email" as const,
  name: "Password reset",
  from: process.env.AUTH_EMAIL_FROM ?? "no-reply@upty.dev",
  maxAge: 60 * 60,
  sendVerificationRequest: async ({
    identifier,
    url,
  }: {
    identifier: string;
    url: string;
  }) => {
    console.log(`Password reset requested for ${identifier}`);
    console.log(`Reset link: ${url}`);
  },
};

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
});
