import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

// Phase 2:
// - R2 を恒久キャッシュとして使い、Worker インスタンス内では regional cache で更に高速化
// - revalidate 後の再生成は Durable Objects キュー (NEXT_CACHE_DO_QUEUE) でバックグラウンド実行
// - D1 tag cache は on-demand revalidation を使うまで保留 (現状コードで未使用)
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: "long-lived",
    bypassTagCacheOnCacheHit: true,
  }),
  queue: doQueue,
});
