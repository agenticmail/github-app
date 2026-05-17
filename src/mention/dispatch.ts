import { invokeAgent } from "../agent/invoke";
import type { GitHubClientFactory } from "../github/octokit";
import type { GitHubAppDeps, MentionCommand } from "../types";
import type { RequestError } from "@octokit/request-error";

interface Trigger {
  installationId: number;
  repoFullName: string;
  issueNumber: number;
  commentId: number;
  triggerUser: string;
  commentBody: string;
}

export async function dispatchMention(
  deps: GitHubAppDeps,
  githubFactory: GitHubClientFactory,
  command: MentionCommand,
  trigger: Trigger,
): Promise<void> {
  const [owner, repo] = trigger.repoFullName.split("/");
  const github = await githubFactory.forInstallation(trigger.installationId);
  const requestWithRetry = async <T>(fn: () => Promise<T>): Promise<T> =>
    withRateLimitRetry(fn, deps.logger, command.verb);

  await requestWithRetry(() =>
    github.request("POST /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions", {
      owner,
      repo,
      comment_id: trigger.commentId,
      content: "eyes",
    }),
  );

  const issue = await requestWithRetry(() =>
    github.request("GET /repos/{owner}/{repo}/issues/{issue_number}", {
      owner,
      repo,
      issue_number: trigger.issueNumber,
    }),
  );

  const comments = await requestWithRetry(() =>
    github.request("GET /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner,
      repo,
      issue_number: trigger.issueNumber,
      per_page: 100,
    }),
  );

  const context = {
    repo: trigger.repoFullName,
    kind: issue.data.pull_request ? "pull_request" : "issue",
    number: issue.data.number,
    url: issue.data.html_url,
    title: issue.data.title,
    body: issue.data.body ?? "",
    comments: comments.data.map((c) => ({ user: c.user?.login ?? "unknown", body: c.body ?? "" })),
    trigger: {
      user: trigger.triggerUser,
      commentId: trigger.commentId,
      args: command.args,
    },
  } as const;

  try {
    const response = await invokeAgent(deps.agentRuntimeBaseUrl, {
      agent: "atlas",
      source: "github",
      task: command.verb,
      context,
    });

    await requestWithRetry(() =>
      github.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner,
        repo,
        issue_number: trigger.issueNumber,
        body: `${response.reply}\n\n— AgenticMail · ${command.verb}`,
      }),
    );
  } catch (error) {
    deps.logger.error({ err: error, command: command.verb }, "agent invoke failed");
    await requestWithRetry(() =>
      github.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner,
        repo,
        issue_number: trigger.issueNumber,
        body: "I hit an internal error while processing that mention. Please retry in a minute.",
      }),
    );
  }
}

function isRetryableGitHubRateLimit(error: unknown): error is RequestError {
  if (typeof error !== "object" || error === null) return false;
  const maybeStatus = (error as { status?: unknown }).status;
  return maybeStatus === 403 || maybeStatus === 429;
}

function retryDelayMs(error: RequestError, attempt: number): number {
  const retryAfter = Number(error.response?.headers?.["retry-after"]);
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.max(250, retryAfter * 1000);
  }

  const resetEpoch = Number(error.response?.headers?.["x-ratelimit-reset"]);
  if (Number.isFinite(resetEpoch) && resetEpoch > 0) {
    const untilReset = resetEpoch * 1000 - Date.now();
    if (untilReset > 0) return untilReset;
  }

  const exponential = 500 * 2 ** (attempt - 1);
  const jitter = Math.floor(Math.random() * 250);
  return exponential + jitter;
}

async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  logger: GitHubAppDeps["logger"],
  command: MentionCommand["verb"],
): Promise<T> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (!isRetryableGitHubRateLimit(error) || attempt === maxAttempts) {
        throw error;
      }

      const delayMs = retryDelayMs(error, attempt);
      logger.warn(
        { attempt, delayMs, status: error.status, command },
        "github rate limited, retrying",
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error("unreachable");
}
