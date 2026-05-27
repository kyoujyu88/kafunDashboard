import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Phase 1: 最小構成。インクリメンタルキャッシュ・タグキャッシュ・キューは
// Cloudflare 側のリソース (R2/D1/Durable Objects) を作成してから Phase 2 で有効化する。
export default defineCloudflareConfig({});
