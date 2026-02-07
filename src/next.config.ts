import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Azure Static Web Apps deployment
  // This generates a fully static site that can be served from a CDN
  output: 'export',
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
