import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ship the build-time-seeded SQLite file with every serverless function so
  // the zero-config demo (no Postgres) has data to read/copy at runtime.
  // Harmless when deploying with Postgres (the file is simply unused).
  outputFileTracingIncludes: {
    "**": ["./prisma/build.db"],
  },
  // Baseline security headers applied to every response.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
