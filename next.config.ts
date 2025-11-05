import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "books.google.com",
        port: "",
        pathname: "/books/content**",
      },
      {
        protocol: "https",
        hostname: "books.google.com",
        port: "",
        pathname: "/books/content**",
      },
    ],
  },

  webpack: (config) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    });
    return config;
  },
};

export default withNextIntl(nextConfig);
