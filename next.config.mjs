/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "crafthead.net",
          pathname: "/avatar/**", // ✅ Allow avatar images
        },
      ],
    },
  };
  
  export default nextConfig;  