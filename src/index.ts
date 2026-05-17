import { Hono } from "hono";
import type { GitHubAppDeps } from "./types";
import { DeliveryDedupCache } from "./webhook/dedup";
import { InMemoryQueue } from "./worker/queue";
import { GitHubClientFactory } from "./github/octokit";
import { createWebhookRoute, processWebhookJob } from "./routes/webhooks";
import type { WebhookJob } from "./routes/webhooks";
import { createInstallCallbackRoute } from "./routes/install-callback";
import { createHealthRoute } from "./routes/health";

export function createGitHubApp(appDeps: GitHubAppDeps) {
  const app = new Hono();
  const dedup = new DeliveryDedupCache();
  const githubFactory = new GitHubClientFactory(appDeps);

  const queue = new InMemoryQueue<WebhookJob>(
    async (job) => {
      await processWebhookJob(job, { appDeps, githubFactory });
    },
    (error, job) => {
      appDeps.logger.error(
        { err: error, event: job.event },
        "webhook job failed",
      );
    },
  );

  app.route("/", createWebhookRoute({ appDeps, dedup, queue }));
  app.route("/", createInstallCallbackRoute());
  app.route("/", createHealthRoute({ dedup, github: githubFactory, startedAt: Date.now() }));

  return { router: app, webhooks: app };
}
