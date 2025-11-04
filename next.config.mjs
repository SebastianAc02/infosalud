/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 🚫 No hacer fallar el build aunque haya errores de ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 🚫 No hacer fallar el build aunque haya errores de tipos
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
