import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

const appDir = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: { unoptimized: true },
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    root: appDir,
  },
}

export default nextConfig
