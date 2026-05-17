import { Hono } from "hono";
import type { DeliveryDedupCache } from "../webhook/dedup";
import type { GitHubClientFactory } from "../github/octokit";

export function createHealthRoute(deps: {
  dedup: DeliveryDedupCache;
  github: GitHubClientFactory;
  startedAt: number;
}) {
  const app = new Hono();

  app.get("/app/github/health", (c) => {
    return c.json({
      ok: true,
      subsystem: "github-app",
      tokenCache: { size: deps.github.tokenCacheSize() },
      dedupCache: { size: deps.dedup.size() },
      uptimeSec: Math.floor((Date.now() - deps.startedAt) / 1000),
    });
  });

  return app;
}
