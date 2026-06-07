import "./styles.css";
import { getAttribution, identifyWaitlistUser, initAnalytics, trackEvent } from "./analytics.js";

const WAITLIST_ENDPOINT = "/api/waitlist";
const SUCCESS_RESET_MS = 1800;
const ALERT_CLOSE_MS = 180;
const attribution = getAttribution();

const app = document.querySelector("#app");

app.innerHTML = `
  <div class="page-shell">
    <header class="site-header">
      <a class="brand" href="#top" aria-label="imaan.app home">
        <img class="brand-logo" src="/logo.png" alt="imaan.app logo" />
        <div class="brand-copy">
          <span class="brand-name">imaan.app</span>
          <span class="brand-subtitle">Prayer streaks with friends</span>
        </div>
      </a>
    </header>

    <main id="top">
      <section class="hero-section">
        <div class="hero-copy">
          <p class="eyebrow">Coming soon to iPhone</p>
          <h1>Prayer streaks with friends.</h1>
          <p class="hero-text">
            Confirm each salah, keep your run alive, and climb the leaderboard
            with friends trying to stay consistent too.
          </p>

          <div class="hero-store-lockup" aria-label="Coming soon to the App Store">
            <div class="app-store-badge">
              <svg class="app-store-badge-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M15.89 12.63C15.91 14.79 17.79 15.51 17.81 15.52C17.79 15.57 17.51 16.57 16.8 17.62C16.18 18.53 15.54 19.45 14.52 19.47C13.52 19.49 13.2 18.88 12.06 18.88C10.91 18.88 10.57 19.45 9.63 19.48C8.66 19.52 7.91 18.49 7.27 17.59C5.98 15.7 4.99 12.24 6.32 9.96C6.98 8.83 8.17 8.1 9.45 8.09C10.4 8.07 11.29 8.73 11.87 8.73C12.45 8.73 13.53 7.93 14.68 8.04C15.16 8.06 16.5 8.25 17.36 9.54C17.3 9.58 15.87 10.45 15.89 12.63ZM13.98 6.94C14.49 6.34 14.82 5.49 14.73 4.64C13.99 4.67 13.08 5.14 12.55 5.75C12.08 6.29 11.66 7.17 11.78 7.99C12.61 8.06 13.46 7.57 13.98 6.94Z"
                  fill="currentColor"
                />
              </svg>
              <div class="app-store-badge-copy">
                <span>Coming soon to the</span>
                <strong>App Store</strong>
              </div>
            </div>
          </div>

          <form class="waitlist-form" data-waitlist-form data-state="idle" novalidate>
            <label class="sr-only" for="waitlist-email">Email address</label>
            <div class="waitlist-row" data-waitlist-row data-invalid="false">
              <div class="waitlist-input-shell">
                <input
                  id="waitlist-email"
                  class="waitlist-input"
                  data-waitlist-email
                  type="email"
                  inputmode="email"
                  autocomplete="email"
                  placeholder="Enter your email"
                  aria-describedby="waitlist-note waitlist-status waitlist-field-error"
                  required
                />
                <p
                  class="waitlist-field-error"
                  id="waitlist-field-error"
                  data-waitlist-field-error
                  aria-live="polite"
                ></p>
              </div>

              <button class="button button-primary waitlist-button" data-waitlist-submit type="submit">
                <span class="waitlist-button-face waitlist-button-face-idle">Join the waitlist</span>
                <span class="waitlist-button-face waitlist-button-face-loading" aria-hidden="true">
                  <span class="waitlist-spinner"></span>
                  <span>Submitting</span>
                </span>
                <span class="waitlist-button-face waitlist-button-face-success" aria-hidden="true">
                  <svg class="waitlist-checkmark" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M4.75 10.5L8.25 14L15.5 6.75"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.25"
                    />
                  </svg>
                </span>
              </button>
            </div>

            <p class="waitlist-note" id="waitlist-note">
              Built for friendly accountability, daily consistency, and the push to keep going.
            </p>
            <p class="waitlist-status sr-only" id="waitlist-status" data-waitlist-status aria-live="polite"></p>
          </form>
        </div>

        <div class="hero-stage" aria-hidden="true">
          <div class="hero-glow hero-glow-gold"></div>
          <div class="hero-glow hero-glow-green"></div>
          <div class="app-shot-cluster">
            <div class="app-shot app-shot-primary">
              <picture>
                <source srcset="/app-today.webp" type="image/webp" />
                <img src="/app-today.png" alt="" loading="eager" />
              </picture>
            </div>

            <div class="app-shot app-shot-secondary">
              <picture>
                <source srcset="/app-board.webp" type="image/webp" />
                <img src="/app-board.png" alt="" loading="eager" />
              </picture>
            </div>
          </div>
        </div>
      </section>

      <section class="faq-section" aria-label="Frequently asked questions">
        <div class="faq-heading">
          <h2>Common questions before launch.</h2>
        </div>

        <div class="faq-list">
          <details class="faq-item">
            <summary><span>What is imaan.app?</span><span class="faq-icon" aria-hidden="true">+</span></summary>
            <p>
              imaan.app is a prayer streak app for Muslims who want friendly accountability with friends.
            </p>
          </details>

          <details class="faq-item">
            <summary><span>How does it work?</span><span class="faq-icon" aria-hidden="true">+</span></summary>
            <p>
              Confirm each salah, protect your salah run, and see where you rank on your friends leaderboard.
            </p>
          </details>

          <details class="faq-item">
            <summary><span>Can I use it with friends?</span><span class="faq-icon" aria-hidden="true">+</span></summary>
            <p>
              Yes. imaan is built around friend leaderboards so you can stay consistent together and push each other to keep the run alive.
            </p>
          </details>

          <details class="faq-item">
            <summary><span>When will it launch?</span><span class="faq-icon" aria-hidden="true">+</span></summary>
            <p>
              We are preparing the first iPhone beta. Join the waitlist and we will email invites when early access opens.
            </p>
          </details>

          <details class="faq-item">
            <summary><span>What happens if I join the waitlist?</span><span class="faq-icon" aria-hidden="true">+</span></summary>
            <p>
              You will get a small number of launch-related emails only, including beta invites, release updates, and the App Store go-live notice.
            </p>
          </details>

          <details class="faq-item">
            <summary><span>Will it be on iPhone first?</span><span class="faq-icon" aria-hidden="true">+</span></summary>
            <p>
              Yes. This page is currently collecting interest for the upcoming App Store release first.
            </p>
          </details>
        </div>
      </section>
    </main>
  </div>

  <div class="waitlist-alert-backdrop" data-waitlist-alert hidden>
    <div
      class="waitlist-alert"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="waitlist-alert-title"
      aria-describedby="waitlist-alert-body"
    >
      <button class="waitlist-alert-close" data-waitlist-alert-close type="button" aria-label="Close alert">
        <span aria-hidden="true">+</span>
      </button>
      <p class="waitlist-alert-kicker">Submission issue</p>
      <h2 class="waitlist-alert-title" id="waitlist-alert-title">The waitlist could not be submitted</h2>
      <p class="waitlist-alert-body" id="waitlist-alert-body" data-waitlist-alert-body">
        Please try again shortly.
      </p>
      <button class="button button-primary waitlist-alert-button" data-waitlist-alert-dismiss type="button">
        Try again
      </button>
    </div>
  </div>
`;

const form = document.querySelector("[data-waitlist-form]");
const row = document.querySelector("[data-waitlist-row]");
const emailInput = document.querySelector("[data-waitlist-email]");
const submitButton = document.querySelector("[data-waitlist-submit]");
const fieldErrorNode = document.querySelector("[data-waitlist-field-error]");
const statusNode = document.querySelector("[data-waitlist-status]");
const alertBackdrop = document.querySelector("[data-waitlist-alert]");
const alertBodyNode = document.querySelector("[data-waitlist-alert-body]");
const alertDismissButton = document.querySelector("[data-waitlist-alert-dismiss]");
const alertCloseButton = document.querySelector("[data-waitlist-alert-close]");
const faqItems = [...document.querySelectorAll(".faq-item")];

let successResetTimer = null;
let alertCloseTimer = null;
let lastFocusedElement = null;

initAnalytics();
trackEvent("landing_page_viewed", {
  page_title: document.title,
});

function setStatus(message) {
  statusNode.textContent = message;
}

function setFormState(state) {
  form.dataset.state = state;
  submitButton.disabled = state === "submitting" || state === "success";
}

function clearFieldError() {
  row.dataset.invalid = "false";
  fieldErrorNode.textContent = "";
  emailInput.removeAttribute("aria-invalid");
}

function triggerInvalidAnimation() {
  row.classList.remove("waitlist-row-shake");
  void row.offsetWidth;
  row.classList.add("waitlist-row-shake");
}

function showFieldError(message) {
  row.dataset.invalid = "true";
  fieldErrorNode.textContent = message;
  emailInput.setAttribute("aria-invalid", "true");
  setStatus(message);
  triggerInvalidAnimation();
}

function isAlertOpen() {
  return !alertBackdrop.hidden;
}

function openAlert(message) {
  if (alertCloseTimer) {
    window.clearTimeout(alertCloseTimer);
    alertCloseTimer = null;
  }

  alertBodyNode.textContent = message;
  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  alertBackdrop.hidden = false;
  document.body.classList.add("waitlist-alert-open");

  requestAnimationFrame(() => {
    alertBackdrop.dataset.open = "true";
    alertDismissButton.focus();
  });

  setStatus(message);
}

function closeAlert() {
  if (!isAlertOpen()) {
    return;
  }

  alertBackdrop.dataset.open = "false";
  document.body.classList.remove("waitlist-alert-open");

  alertCloseTimer = window.setTimeout(() => {
    alertBackdrop.hidden = true;
    alertCloseTimer = null;
    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  }, ALERT_CLOSE_MS);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function submitWaitlist(payload) {
  const response = await fetch(WAITLIST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseBody = await parseResponse(response);

  if (!response.ok || !responseBody?.ok) {
    throw new Error(
      responseBody?.message || "The waitlist could not be submitted right now. Please try again shortly.",
    );
  }
}

function resetSuccessStateSoon() {
  if (successResetTimer) {
    window.clearTimeout(successResetTimer);
  }

  successResetTimer = window.setTimeout(() => {
    setFormState("idle");
    setStatus("");
    successResetTimer = null;
  }, SUCCESS_RESET_MS);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim().toLowerCase();

  closeAlert();
  clearFieldError();

  if (!isValidEmail(email)) {
    setFormState("idle");
    showFieldError("Enter a valid email address to join the waitlist.");
    trackEvent("waitlist_email_invalid", {
      reason: "invalid_email",
    });
    emailInput.focus();
    return;
  }

  setFormState("submitting");
  setStatus("Submitting your email to the waitlist.");
  trackEvent("waitlist_submit_clicked", {
    cta_location: "hero",
  });

  const payload = {
    email,
    source: attribution.source === "direct" ? "landing_waitlist" : `${attribution.source}_waitlist`,
    submittedAtUtc: new Date().toISOString(),
    locale: navigator.language,
    page: window.location.href,
  };

  try {
    await submitWaitlist(payload);
    emailInput.value = "";
    setFormState("success");
    setStatus("You are on the list. We will email you when imaan.app is ready.");
    identifyWaitlistUser(email, {
      waitlist_source: payload.source,
      waitlist_joined_at_utc: payload.submittedAtUtc,
    });
    trackEvent("waitlist_email_submitted", {
      cta_location: "hero",
      result: "success",
    });
    resetSuccessStateSoon();
  } catch (error) {
    console.error(error);
    setFormState("idle");
    trackEvent("waitlist_email_submit_failed", {
      cta_location: "hero",
      message: error instanceof Error ? error.message : "unknown_error",
    });
    openAlert(error instanceof Error ? error.message : "Please try again shortly.");
  }
});

emailInput.addEventListener("input", () => {
  if (row.dataset.invalid === "true") {
    clearFieldError();
  }

  if (form.dataset.state === "success") {
    if (successResetTimer) {
      window.clearTimeout(successResetTimer);
      successResetTimer = null;
    }

    setFormState("idle");
  }

  setStatus("");
});

row.addEventListener("animationend", () => {
  row.classList.remove("waitlist-row-shake");
});

alertBackdrop.addEventListener("click", (event) => {
  if (event.target === alertBackdrop) {
    closeAlert();
  }
});

alertDismissButton.addEventListener("click", () => {
  closeAlert();
});

alertCloseButton.addEventListener("click", () => {
  closeAlert();
});

faqItems.forEach((item) => {
  const summary = item.querySelector("summary");

  summary?.addEventListener("click", (event) => {
    event.preventDefault();
  });

  item.addEventListener("click", () => {
    item.open = !item.open;
  });

  item.addEventListener("toggle", () => {
    if (!item.open) {
      return;
    }

    const question = item.querySelector("summary span")?.textContent?.trim() || "unknown";
    trackEvent("faq_opened", { question });
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isAlertOpen()) {
    closeAlert();
  }
});
