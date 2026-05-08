/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /** Helps Prisma resolve the workerd build when bundling for OpenNext / Cloudflare. */
  serverExternalPackages: ["@prisma/client", "prisma"],
  /** Ensure Prisma’s `.node` query engine is included in server traces (Cloudflare Worker bundle). */
  outputFileTracingIncludes: {
    "/*": [
      "node_modules/.prisma/client/**/*",
      "node_modules/@prisma/client/**/*",
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.local/**",
          "**/.cache/**",
        ],
      };
    }
    return config;
  },
};

module.exports = nextConfig;
