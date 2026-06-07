import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY?.trim();
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

function getPathSource(pathname) {
  const firstSegment = pathname.split("/").filter(Boolean)[0]?.toLowerCase();

  if (firstSegment === "ig") {
    return "instagram";
  }

  if (firstSegment === "tiktok") {
    return "tiktok";
  }

  return "";
}

function getReferrerSource(referrer) {
  if (!referrer) {
    return "";
  }

  try {
    const hostname = new URL(referrer).hostname.toLowerCase();

    if (hostname.includes("instagram.com") || hostname.includes("threads.net")) {
      return "instagram";
    }

    if (hostname.includes("tiktok.com")) {
      return "tiktok";
    }
  } catch {
    return "";
  }

  return "";
}

export function getAttribution() {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source")?.trim().toLowerCase() || "";
  const pathSource = getPathSource(window.location.pathname);
  const referrerSource = getReferrerSource(document.referrer);
  const source = utmSource || pathSource || referrerSource || "direct";

  return {
    source,
    path_source: pathSource || null,
    referrer_source: referrerSource || null,
    utm_source: utmSource || null,
    utm_medium: params.get("utm_medium") || null,
    utm_campaign: params.get("utm_campaign") || null,
    utm_content: params.get("utm_content") || null,
    landing_path: window.location.pathname,
    landing_search: window.location.search || null,
    referrer: document.referrer || null,
  };
}

export function initAnalytics() {
  if (!POSTHOG_KEY) {
    if (import.meta.env.DEV) {
      console.info("[analytics] VITE_POSTHOG_KEY is not configured; PostHog is disabled.");
    }

    return false;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    autocapture: true,
    disable_session_recording: isLocalhost,
    loaded: (client) => {
      client.register(getAttribution());
    },
  });

  return true;
}

export function trackEvent(eventName, properties = {}) {
  if (!POSTHOG_KEY) {
    return;
  }

  posthog.capture(eventName, {
    ...getAttribution(),
    ...properties,
  });
}

export function identifyWaitlistUser(email, properties = {}) {
  if (!POSTHOG_KEY) {
    return;
  }

  posthog.identify(email, {
    email,
    ...getAttribution(),
    ...properties,
  });
}
