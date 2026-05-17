import type { AgentInvokeContext } from "../types";

interface InvokeRequest {
  agent: string;
  source: "github";
  task: string;
  context: AgentInvokeContext;
}

interface InvokeResponse {
  ok: boolean;
  reply: string;
}

export async function invokeAgent(
  baseUrl: string,
  payload: InvokeRequest,
): Promise<InvokeResponse> {
  const response = await fetch(`${baseUrl}/inject-message`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Agent runtime failed: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as InvokeResponse;
  if (!json.ok) throw new Error("Agent runtime returned ok=false");
  return json;
}
