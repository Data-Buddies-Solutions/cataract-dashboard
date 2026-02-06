import { createHmac, timingSafeEqual } from "crypto";

const TOLERANCE_IN_SECONDS = 30 * 60; // 30 minutes

interface WebhookEvent {
  type: string;
  event_timestamp: number;
  data: Record<string, unknown>;
}

export function constructWebhookEvent(
  body: string,
  signatureHeader: string,
  secret: string
): WebhookEvent {
  const { timestamp, signature } = parseHeader(signatureHeader);

  if (!timestamp || !signature) {
    throw new Error(
      "Invalid signature header: missing timestamp or signature"
    );
  }

  verifyTimestamp(timestamp);
  verifySignature(body, timestamp, signature, secret);

  return JSON.parse(body) as WebhookEvent;
}

function parseHeader(header: string): {
  timestamp: string;
  signature: string;
} {
  let timestamp = "";
  let signature = "";

  const parts = header.split(",");
  for (const part of parts) {
    const [key, value] = part.split("=", 2);
    if (key === "t") {
      timestamp = value;
    } else if (key === "v0") {
      signature = value;
    }
  }

  return { timestamp, signature };
}

function verifyTimestamp(timestampStr: string): void {
  const now = Math.floor(Date.now() / 1000);
  const timestamp = parseInt(timestampStr, 10);

  if (isNaN(timestamp)) {
    throw new Error("Invalid signature header: timestamp is not a number");
  }

  if (now - timestamp > TOLERANCE_IN_SECONDS) {
    throw new Error("Webhook timestamp is too old");
  }
}

function verifySignature(
  body: string,
  timestamp: string,
  signature: string,
  secret: string
): void {
  const signedContent = `${timestamp}.${body}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(signedContent)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(signature, "hex");

  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw new Error("Invalid webhook signature");
  }
}
