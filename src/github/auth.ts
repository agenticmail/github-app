import { createSign } from "node:crypto";

export function createAppJwt(appId: string, privateKeyPem: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iat: now - 30,
      exp: now + 9 * 60,
      iss: appId,
    }),
  );

  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer.sign(privateKeyPem, "base64url");

  return `${unsigned}.${signature}`;
}

function base64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}
