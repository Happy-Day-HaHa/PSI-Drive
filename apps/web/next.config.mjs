/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages는 정적 파일(`out/`)을, Docker는 Node 서버(standalone)를 쓴다.
  output: process.env.NEXT_OUTPUT === "export" ? "export" : "standalone",
  trailingSlash: true,
  outputFileTracingRoot: import.meta.dirname,
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
