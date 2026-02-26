import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: process.env.SITE_URL ?? process.env.CONVEX_SITE_URL!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
