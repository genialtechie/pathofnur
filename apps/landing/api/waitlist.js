const WAITLIST_WEBHOOK_URL = process.env.WAITLIST_WEBHOOK_URL?.trim();
const WAITLIST_WEBHOOK_KEY = process.env.WAITLIST_WEBHOOK_KEY?.trim();

function sendJson(response, status, payload) {
  response.status(status).json(payload);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function readRawBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function parseBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  if (typeof request.body === "string" && request.body) {
    return JSON.parse(request.body);
  }

  const rawBody = await readRawBody(request);

  if (!rawBody) {
    return {};
  }

  return JSON.parse(rawBody);
}

function buildWebhookUrl() {
  if (!WAITLIST_WEBHOOK_URL) {
    return null;
  }

  if (!WAITLIST_WEBHOOK_KEY) {
    return WAITLIST_WEBHOOK_URL;
  }

  const separator = WAITLIST_WEBHOOK_URL.includes("?") ? "&" : "?";
  return `${WAITLIST_WEBHOOK_URL}${separator}key=${encodeURIComponent(WAITLIST_WEBHOOK_KEY)}`;
}

export default async function handler(request, response) {
  if (request.method === "OPTIONS") {
    response.setHeader("Allow", "POST, OPTIONS");
    return response.status(204).end();
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    return sendJson(response, 405, {
      ok: false,
      error: "method_not_allowed",
      message: "Only POST requests are supported.",
    });
  }

  if (!WAITLIST_WEBHOOK_URL || !WAITLIST_WEBHOOK_KEY) {
    return sendJson(response, 500, {
      ok: false,
      error: "missing_configuration",
      message: "Waitlist submission is not configured on the server.",
    });
  }

  let body;

  try {
    body = await parseBody(request);
  } catch {
    return sendJson(response, 400, {
      ok: false,
      error: "invalid_payload",
      message: "Request body must be valid JSON.",
    });
  }

  const email = normalizeText(body.email).toLowerCase();
  const source = normalizeText(body.source) || "landing_waitlist";
  const submittedAtUtc = normalizeText(body.submittedAtUtc) || new Date().toISOString();
  const locale = normalizeText(body.locale);
  const page = normalizeText(body.page);

  if (!isValidEmail(email)) {
    return sendJson(response, 400, {
      ok: false,
      error: "invalid_email",
      message: "Enter a valid email address to join the waitlist.",
    });
  }

  const webhookUrl = buildWebhookUrl();

  try {
    const upstreamResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-key": WAITLIST_WEBHOOK_KEY,
      },
      body: JSON.stringify({
        email,
        source,
        submittedAtUtc,
        locale,
        page,
      }),
    });

    if (!upstreamResponse.ok) {
      const upstreamText = await upstreamResponse.text();
      console.error("Waitlist webhook failed", {
        status: upstreamResponse.status,
        body: upstreamText.slice(0, 300),
      });

      return sendJson(response, 502, {
        ok: false,
        error: "upstream_failed",
        message: "The waitlist could not be submitted right now. Please try again shortly.",
      });
    }

    return sendJson(response, 200, { ok: true });
  } catch (error) {
    console.error("Waitlist relay failed", error);

    return sendJson(response, 502, {
      ok: false,
      error: "relay_failed",
      message: "The waitlist could not be submitted right now. Please try again shortly.",
    });
  }
}
