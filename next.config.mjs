import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

// next dev 実行中に Cloudflare のバインディング (env / ctx / cf) を
// `getCloudflareContext()` 経由で参照できるようにする。
initOpenNextCloudflareForDev();

export default nextConfig;
