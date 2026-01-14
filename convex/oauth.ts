import { query } from "./_generated/server";

const OAUTH_PROVIDERS = [
  {
    id: "github",
    name: "GitHub",
    env: {
      clientId: "AUTH_GITHUB_ID",
      clientSecret: "AUTH_GITHUB_SECRET",
    },
  },
  {
    id: "google",
    name: "Google",
    env: {
      clientId: "AUTH_GOOGLE_ID",
      clientSecret: "AUTH_GOOGLE_SECRET",
    },
  },
] as const;

export const listOAuthProviders = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("oauthSettings").collect();
    const recordMap = new Map(
      records.map((record) => [record.provider, record]),
    );

    return OAUTH_PROVIDERS.map((provider) => {
      const record = recordMap.get(provider.id);
      const envClientId = process.env[provider.env.clientId];
      const envClientSecret = process.env[provider.env.clientSecret];
      return {
        id: provider.id,
        name: provider.name,
        enabled: record?.enabled ?? false,
        configured: Boolean(envClientId && envClientSecret),
      };
    }).filter((provider) => provider.enabled);
  },
});
