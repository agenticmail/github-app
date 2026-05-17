import { Octokit } from "@octokit/rest";
import { createAppJwt } from "./auth";
import { InstallationTokenCache } from "./token-cache";
import type { GitHubAppDeps } from "../types";

export class GitHubClientFactory {
  private readonly tokenCache = new InstallationTokenCache();

  constructor(private readonly deps: GitHubAppDeps) {}

  tokenCacheSize(): number {
    return this.tokenCache.size();
  }

  async forInstallation(installationId: number): Promise<Octokit> {
    const cached = this.tokenCache.get(installationId);
    if (cached) return new Octokit({ auth: cached });

    const privateKey = await this.deps.vault.getSecret(this.deps.config.privateKeySecretPath);
    const appJwt = createAppJwt(this.deps.config.appId, privateKey);

    const appClient = new Octokit({ auth: appJwt });
    const tokenResponse = await appClient.request(
      "POST /app/installations/{installation_id}/access_tokens",
      { installation_id: installationId },
    );

    const token = tokenResponse.data.token;
    this.tokenCache.set(installationId, token);
    return new Octokit({ auth: token });
  }
}
