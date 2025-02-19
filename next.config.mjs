/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "crafthead.net",
        pathname: "/**", // ✅ Allow avatar images
      },
      {
        protocol: "https",
        hostname: "cloud.appwrite.io", // ✅ Allow Appwrite storage images
        pathname: "/v1/storage/buckets/**", // ✅ Allow all stored images
      },
      {
        protocol: "https",
        hostname: "fonts.gstatic.com",
        pathname: "/**",
      }
    ],
  },
};

export default nextConfig;