import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ship the build-time-seeded SQLite file with every serverless function so
  // the zero-config demo (no Postgres) has data to read/copy at runtime.
  // Harmless when deploying with Postgres (the file is simply unused).
  outputFileTracingIncludes: {
    "**": ["./prisma/build.db"],
  },
};

export default nextConfig;
