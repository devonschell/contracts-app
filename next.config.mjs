/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    console.log(">> next.config: aliasing 'canvas' -> false");
    config.resolve = config.resolve || {};
    config.resolve.alias = { ...(config.resolve.alias || {}), canvas: false };
    return config;
  },
};
export default nextConfig;
