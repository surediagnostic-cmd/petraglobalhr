import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // A stray lockfile at /Users/mac (unrelated to this project) makes
  // Next.js guess the wrong workspace root — pin it explicitly.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
