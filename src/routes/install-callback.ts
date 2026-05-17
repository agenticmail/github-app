import { Hono } from "hono";

export function createInstallCallbackRoute() {
  const app = new Hono();

  app.get("/app/install/callback", (c) => {
    const installationId = c.req.query("installation_id");
    if (!installationId) {
      return c.json({ error: "installation_id required" }, 400);
    }

    const org = c.req.query("org") ?? "unknown";
    return c.redirect(`https://agenticmail.io/github/installed?org=${encodeURIComponent(org)}`, 302);
  });

  return app;
}
