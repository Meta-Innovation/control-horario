/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/control-horario",
  assetPrefix: '/control-horario/',
  output: "export",
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions:false,
  },
}

export default nextConfig;
