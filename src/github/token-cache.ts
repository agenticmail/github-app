interface CachedToken {
  token: string;
  expiresAt: number;
}

export class InstallationTokenCache {
  private readonly cache = new Map<number, CachedToken>();
  private readonly ttlMs = 50 * 60 * 1000;

  get(installationId: number): string | null {
    const item = this.cache.get(installationId);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(installationId);
      return null;
    }
    return item.token;
  }

  set(installationId: number, token: string): void {
    this.cache.set(installationId, {
      token,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  size(): number {
    return this.cache.size;
  }

  delete(installationId: number): void {
    this.cache.delete(installationId);
  }
}
