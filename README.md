# AgenticMail for GitHub

> Mention `@agenticmail` in any issue or pull request and an AgenticMail agent
> reads the thread, does the work, and replies — right inside GitHub.

<!-- screenshot:hero -->
<!-- PLACEHOLDER — 1280×640 hero GIF: a user types "@agenticmail summarize"
     in an issue comment, the bot reacts 👀, then posts a 2-paragraph summary.
     File: docs/screenshots/hero.gif -->
<p align="center"><em>[ hero GIF — see docs/screenshots/hero.gif ]</em></p>

[![Marketplace](https://img.shields.io/badge/GitHub%20Marketplace-AgenticMail%20for%20GitHub-2da44e)](https://github.com/marketplace/agenticmail-for-github)
[![Price](https://img.shields.io/badge/price-free-2da44e)](https://github.com/marketplace/agenticmail-for-github)
[![Node](https://img.shields.io/badge/node-22-339933)](https://nodejs.org)

---

## What it does

AgenticMail for GitHub is a mention bot. Drop `@agenticmail` into a comment on
any issue or PR and the App invokes an AgenticMail agent against that thread.
The agent posts its result back as a comment — usually within a couple of
seconds, after dropping a 👀 reaction so you know it's working.

It also runs **automatically** on new issues (triage) and new PRs (summary), so
your backlog gets a first pass without anyone lifting a finger.

No new infrastructure: the App mounts as a route on your existing AgenticMail
deployment and reuses the agent runtime you already run.

---

## Install

### From GitHub Marketplace (recommended)

1. Open **[AgenticMail for GitHub](https://github.com/marketplace/agenticmail-for-github)** on the Marketplace.
2. Click **Install it for free**.
3. Choose the account/org, then pick **All repositories** or a specific set.
4. Approve the requested permissions (see below) and confirm.
5. You'll land on the AgenticMail welcome page, and the account owner gets a
   welcome email with a direct link to the App's settings.

That's it — the bot is live on the repos you selected.

<!-- screenshot:install -->
<!-- PLACEHOLDER — 1280×800 PNG of the Marketplace install screen.
     File: docs/screenshots/install.png -->
<p align="center"><em>[ install screen — see docs/screenshots/install.png ]</em></p>

### Permissions requested

| Scope          | Access     | Why                                          |
| -------------- | ---------- | -------------------------------------------- |
| Issues         | Read/Write | Read thread context, post comments & reactions |
| Pull requests  | Read/Write | Summarize PRs, post review-comment replies   |
| Metadata       | Read       | Required by GitHub for any App               |

The bot **suggests** issue labels in a comment — it does **not** apply or remove
labels, close issues, or push code. Triage is advisory in v1.

---

## Use

In any issue or PR comment, type `@agenticmail` followed by a verb:

| Command                          | What happens                                              |
| --------------------------------- | --------------------------------------------------------- |
| `@agenticmail summarize`          | Posts a 2-paragraph summary of the thread.                |
| `@agenticmail triage`             | Suggests labels, a priority, and similar issues.          |
| `@agenticmail email <addr>`       | Sends the thread context to a real inbox via AgenticMail. |
| `@agenticmail reply <prompt>`     | Drafts a follow-up comment from your prompt.               |
| `@agenticmail handoff to <agent>` | Re-routes the request to another agent in your org.       |
| `@agenticmail link related`       | Finds and links related open issues by similarity.        |

Notes:
- A bare `@agenticmail` with no verb defaults to **summarize**.
- An unknown verb posts a short help comment — no agent call is made.
- Only the **first** `@agenticmail` mention in a comment is acted on.
- Comments from bots are ignored (loop guard).

### Runs automatically

- **New issue opened** → `triage` runs and posts suggested labels + priority.
- **New PR opened** → `summarize` runs against the description and diff stat.

<!-- screenshot:comment -->
<!-- PLACEHOLDER — 1280×720 PNG of a posted summarize comment with the
     "— AgenticMail · summarize" footer.
     File: docs/screenshots/comment.png -->
<p align="center"><em>[ example reply — see docs/screenshots/comment.png ]</em></p>

---

## For operators — deploying the App

This repo is the package `@agenticmail/github-app`. It ships **no `listen()`** —
it is a library that mounts into your existing `@agenticmail/enterprise` server.

```ts
import { createGitHubApp } from "@agenticmail/github-app";

const { router } = createGitHubApp({
  vault,                                    // SecureVault — reads the App private key
  agentRuntimeBaseUrl: "http://127.0.0.1:3101",
  logger,
  config: { appId, webhookSecret, clientId, clientSecret },
});

app.route("/", router);                     // one process, one port
```

### GitHub App settings

When you register the App at **Settings → Developer settings → GitHub Apps**:

- **Webhook URL:** `https://<your-enterprise-host>/webhooks/github`
- **Webhook secret:** a strong random string — store it in SecureVault.
- **Permissions:** Issues R/W, Pull requests R/W, Metadata R.
- **Subscribe to events:** `issue_comment`, `pull_request_review_comment`,
  `issues`, `pull_request`, `installation`.
- **Callback URL:** `https://<your-enterprise-host>/app/install/callback`

### Secrets (SecureVault)

| Item              | Stored in        | Used for                     |
| ----------------- | ---------------- | ---------------------------- |
| App ID            | enterprise config | identifying the App          |
| Webhook secret    | SecureVault      | HMAC signature verification  |
| App private key   | SecureVault      | RS256 JWT signing            |
| OAuth id/secret   | SecureVault      | install callback             |

### Routes

| Route                       | Purpose                              |
| --------------------------- | ------------------------------------ |
| `POST /webhooks/github`     | Receives all GitHub webhook events.  |
| `GET  /app/install/callback`| Post-install landing redirect.       |
| `GET  /app/github/health`   | Liveness for the App subsystem.      |

### Build & run

```sh
npm install
npm run typecheck      # tsc --noEmit
npm run build          # compiles to dist/
```

A sample webhook payload for local testing lives at
`scripts/fixture-issue-comment.json`.

---

## How it works

```
GitHub comment  →  POST /webhooks/github
                   ├─ verify HMAC (timing-safe)
                   ├─ dedup on X-GitHub-Delivery UUID
                   └─ enqueue + 202 in <100ms
                          │
                   async worker
                   ├─ 👀 reaction on the trigger comment (~1s)
                   ├─ parse mention → verb + args
                   ├─ fetch thread context via Octokit
                   ├─ invoke agent runtime (inject-message)
                   └─ post the agent's reply as a comment
```

The webhook never blocks on agent work — GitHub gets its `202` immediately and
all the real work happens off the request path. See [`design.md`](./design.md)
for the full API contract.

### Security

- HMAC-SHA256 verification on every webhook, compared with `timingSafeEqual`.
- Delivery-UUID dedup so GitHub retries never double-post.
- Per-installation tokens, cached 50 min, minted from a vault-held private key.
- Rate-limit backoff (403/429) handled in the worker, never on the ack path.

---

## Related

- **[agenticmail/send-email-action](https://github.com/agenticmail/send-email-action)** —
  send email straight from a GitHub Actions workflow step. Different tool, same
  family: that's for CI pipelines, this is for issue/PR conversations.

---

## License

MIT © AgenticMail
