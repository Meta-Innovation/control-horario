/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/control-horario",
  assetPrefix: '/control-horario/',
  output: "export",
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
}

export default nextConfig;
