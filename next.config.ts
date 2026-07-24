import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'uuanzogrkoomekskvxab.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'kvhjzpqkzydvjwdtqswr.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://api.razorpay.com https://www.googletagmanager.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://kvhjzpqkzydvjwdtqswr.supabase.co https://images.unsplash.com https://res.cloudinary.com https://images.pexels.com https://www.googletagmanager.com https://www.google-analytics.com https://lumberjack-cx.razorpay.com https://lh3.googleusercontent.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com; connect-src 'self' https://kvhjzpqkzydvjwdtqswr.supabase.co wss://kvhjzpqkzydvjwdtqswr.supabase.co https://lumberjack-cx.razorpay.com https://api.razorpay.com https://checkout.razorpay.com https://www.google-analytics.com https://static.cloudflareinsights.com;",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/sitemap-events.xml',
        destination: '/sitemap-events',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/become-host',
        destination: '/members/become-host',
        permanent: true,
      },
    ];
  },
  serverExternalPackages: ['razorpay'],
  experimental: {
    serverActions: {
      bodySizeLimit: '5MB',
    },
  },
};

export default nextConfig;
