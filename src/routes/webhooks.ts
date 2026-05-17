import { Hono } from "hono";
import type { GitHubAppDeps } from "../types";
import type { DeliveryDedupCache } from "../webhook/dedup";
import { verifyWebhookSignature } from "../webhook/verify";
import { parseMention } from "../mention/parse";
import { dispatchMention } from "../mention/dispatch";
import type { InMemoryQueue } from "../worker/queue";
import type { GitHubClientFactory } from "../github/octokit";

export type WebhookJob = {
  payload: Record<string, unknown>;
  event: string;
};

export function createWebhookRoute(deps: {
  appDeps: GitHubAppDeps;
  dedup: DeliveryDedupCache;
  queue: InMemoryQueue<WebhookJob>;
}) {
  const app = new Hono();

  app.post("/webhooks/github", async (c) => {
    const signature = c.req.header("x-hub-signature-256");
    const event = c.req.header("x-github-event") ?? "unknown";
    const delivery = c.req.header("x-github-delivery") ?? "";

    const raw = new Uint8Array(await c.req.arrayBuffer());
    const valid = verifyWebhookSignature(deps.appDeps.config.webhookSecret, signature, raw);
    if (!valid) return c.json({ error: "bad signature" }, 401);

    if (!delivery) return c.json({ error: "malformed payload" }, 400);
    if (deps.dedup.seen(delivery)) return c.json({ ok: true, deduped: true }, 202);

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(Buffer.from(raw).toString("utf8")) as Record<string, unknown>;
    } catch {
      return c.json({ error: "malformed payload" }, 400);
    }

    deps.queue.push({ payload, event });
    return c.json({ ok: true, delivery }, 202);
  });

  return app;
}

export async function processWebhookJob(
  job: WebhookJob,
  deps: { appDeps: GitHubAppDeps; githubFactory: GitHubClientFactory },
): Promise<void> {
  if (job.event !== "issue_comment") return;

  const action = (job.payload.action as string | undefined) ?? "";
  if (action !== "created") return;

  const comment = job.payload.comment as Record<string, unknown> | undefined;
  const issue = job.payload.issue as Record<string, unknown> | undefined;
  const repository = job.payload.repository as Record<string, unknown> | undefined;
  const installation = job.payload.installation as Record<string, unknown> | undefined;

  if (!comment || !issue || !repository || !installation) return;

  const user = comment.user as Record<string, unknown> | undefined;
  if ((user?.type as string | undefined) === "Bot") return;

  const body = (comment.body as string | undefined) ?? "";
  const command = parseMention(body);
  if (!command) return;

  const issueNumber = issue.number as number | undefined;
  const commentId = comment.id as number | undefined;
  const repoFullName = repository.full_name as string | undefined;
  const installationId = installation.id as number | undefined;
  const triggerUser = (user?.login as string | undefined) ?? "unknown";

  if (!issueNumber || !commentId || !repoFullName || !installationId) return;

  await dispatchMention(deps.appDeps, deps.githubFactory, command, {
    installationId,
    repoFullName,
    issueNumber,
    commentId,
    triggerUser,
    commentBody: body,
  });
}
