export interface SecureVault {
  getSecret(key: string): Promise<string>;
}

export interface Logger {
  info(payload: Record<string, unknown>, message?: string): void;
  warn(payload: Record<string, unknown>, message?: string): void;
  error(payload: Record<string, unknown>, message?: string): void;
  debug?(payload: Record<string, unknown>, message?: string): void;
}

export interface GitHubAppDeps {
  vault: SecureVault;
  agentRuntimeBaseUrl: string;
  logger: Logger;
  config: {
    appId: string;
    webhookSecret: string;
    clientId: string;
    clientSecret: string;
    privateKeySecretPath: string;
  };
}

export interface MentionCommand {
  verb: "summarize" | "triage" | "email" | "reply" | "handoff" | "link";
  args: string;
}

export interface TriggerContext {
  user: string;
  commentId: number;
  args: string;
}

export interface AgentInvokeContext {
  repo: string;
  kind: "issue" | "pull_request";
  number: number;
  url: string;
  title: string;
  body: string;
  comments: Array<{ user: string; body: string }>;
  trigger: TriggerContext;
}
