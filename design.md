# AgenticMail for GitHub — Design Snapshot

This implementation follows the Phase 1 contract from Atlas on 2026-05-17:
- Standalone package: `@agenticmail/github-app`
- Mount-only API: `createGitHubApp(deps)` returns router/webhooks, no `listen()`
- Routes: `POST /webhooks/github`, `GET /app/install/callback`, `GET /app/github/health`
- Webhook flow: verify HMAC -> dedup by `X-GitHub-Delivery` -> enqueue -> 202
- Async worker handles `issue_comment.created` and `@agenticmail <verb>`
- Agent invocation via `POST {agentRuntimeBaseUrl}/inject-message`

See `src/` for implementation details.
