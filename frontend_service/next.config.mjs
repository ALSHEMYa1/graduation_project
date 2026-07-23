/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.EXPORT === "true" && { output: "export" }),
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
