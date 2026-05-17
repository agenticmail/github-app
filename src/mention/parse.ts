import type { MentionCommand } from "../types";

const TRIGGER = /(^|\s)@agenticmail\b/i;
const KNOWN = new Set(["summarize", "triage", "email", "reply", "handoff", "link"]);

export function parseMention(body: string): MentionCommand | null {
  if (!TRIGGER.test(body)) return null;

  const mentionIdx = body.toLowerCase().indexOf("@agenticmail");
  const suffix = body.slice(mentionIdx + "@agenticmail".length).trim();
  if (!suffix) return { verb: "summarize", args: "" };

  const [rawVerb, ...rest] = suffix.split(/\s+/);
  const verb = rawVerb.toLowerCase();
  let args = rest.join(" ").trim();

  if (!KNOWN.has(verb)) return null;
  if (verb === "handoff") args = args.replace(/^to\s+/i, "");

  return { verb: verb as MentionCommand["verb"], args };
}
