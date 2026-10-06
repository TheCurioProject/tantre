// Minimal operational events using Sentry's envelope protocol. No request body,
// cookies, email address, IP address, query string or exception message is sent.
let retryAfter = 0;
export async function reportFailure(
  dsn: string | undefined,
  kind: string,
  route: string,
) {
  if (!dsn || Date.now() < retryAfter) return;
  try {
    const target = new URL(dsn),
      project = target.pathname.split("/").filter(Boolean).pop();
    if (target.protocol !== "https:" || !project || !/^\d+$/.test(project))
      return;
    const id = crypto.randomUUID().replaceAll("-", "");
    const event = {
      event_id: id,
      timestamp: Date.now() / 1000,
      platform: "javascript",
      level: "error",
      logger: "tantre",
      message: `TANTRE ${kind}`,
      tags: { route },
      fingerprint: ["tantre", kind, route],
    };
    const envelope =
      [
        JSON.stringify({
          event_id: id,
          dsn,
          sent_at: new Date().toISOString(),
        }),
        JSON.stringify({ type: "event" }),
        JSON.stringify(event),
      ].join("\n") + "\n";
    const response = await fetch(`${target.origin}/api/${project}/envelope/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7,sentry_key=${target.username},sentry_client=tantre/1.0`,
      },
      body: envelope,
      signal: AbortSignal.timeout(4000),
    });
    if (response.status === 429)
      retryAfter =
        Date.now() +
        Math.max(60, Number(response.headers.get("Retry-After")) || 60) * 1000;
  } catch {
    /* Monitoring must never prevent a booking or an error response. */
  }
}
