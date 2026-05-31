import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

// Pin Turbopack to this app only. Without this, Next.js walks up to
// ~/package-lock.json and treats your entire home folder as the workspace.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.39",
    "192.168.*.*",
    "10.*.*.*",
  ],
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
