/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The query API loads the bylaw index into memory and calls the model hub.
  // It runs on the Node.js runtime (not Edge): see app/api/ask/route.ts.
  // Keep the seed-only PDF dependency out of the app bundle.
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
