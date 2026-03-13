import "./styles.css";

const WAITLIST_ENDPOINT = "/api/waitlist";
const SUCCESS_RESET_MS = 1800;
const ALERT_CLOSE_MS = 180;

const app = document.querySelector("#app");

app.innerHTML = `
  <div class="page-shell">
    <header class="site-header">
      <a class="brand" href="#top" aria-label="imaan.app home">
        <img class="brand-logo" src="/logo.png" alt="imaan.app logo" />
        <div class="brand-copy">
          <span class="brand-name">imaan.app</span>
          <span class="brand-subtitle">A calmer Muslim companion</span>
        </div>
      </a>
    </header>

    <main id="top">
      <section class="hero-section">
        <div class="hero-copy">
          <p class="eyebrow">Coming soon</p>
          <h1>A spiritual companion for the moments that pull at the heart.</h1>
          <p class="hero-text">
            imaan.app is being crafted as a calmer Muslim companion for daily friction, quiet grounding,
            and gentle continuity. Join the waitlist to be notified when the App Store release goes live.
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
                <span class="waitlist-button-face waitlist-button-face-idle">Notify me</span>
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
              We will only email you when the app is ready, early access opens, or the App Store launch is live.
            </p>
            <p class="waitlist-status sr-only" id="waitlist-status" data-waitlist-status aria-live="polite"></p>
          </form>
        </div>

        <div class="hero-stage" aria-hidden="true">
          <div class="hero-glow hero-glow-gold"></div>
          <div class="hero-glow hero-glow-blue"></div>
          <div class="phone-cluster">
            <div class="phone-shell phone-shell-side phone-shell-left">
              <div class="phone-frame">
                <div class="phone-notch"></div>

                <div class="phone-screen">
                  <div class="screen-topbar">
                    <span class="screen-time">9:41</span>
                    <img class="screen-logo" src="/logo.png" alt="" />
                  </div>

                  <div class="screen-header">
                    <span class="screen-label">imaan.app</span>
                    <div class="screen-title-block">
                      <div class="screen-title-line screen-title-line-short"></div>
                      <div class="screen-title-line"></div>
                    </div>
                  </div>

                  <div class="screen-preview">
                    <div class="screen-preview-orb"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="phone-shell phone-shell-center">
              <div class="phone-frame">
                <div class="phone-notch"></div>

                <div class="phone-screen">
                  <div class="screen-topbar">
                    <span class="screen-time">9:41</span>
                    <img class="screen-logo" src="/logo.png" alt="" />
                  </div>

                  <div class="screen-header">
                    <span class="screen-label">imaan.app</span>
                    <div class="screen-title-block">
                      <div class="screen-title-line screen-title-line-short"></div>
                      <div class="screen-title-line"></div>
                      <div class="screen-title-line screen-title-line-mid"></div>
                    </div>
                  </div>

                  <div class="screen-preview">
                    <div class="screen-preview-orb"></div>
                  </div>

                  <div class="screen-stack">
                    <div class="screen-card screen-card-primary">
                      <div class="screen-card-line screen-card-line-short"></div>
                      <div class="screen-card-line"></div>
                    </div>
                    <div class="screen-card-row">
                      <div class="screen-card screen-card-compact"></div>
                      <div class="screen-card screen-card-compact"></div>
                    </div>
                    <div class="screen-cta">
                      <div class="screen-cta-dot"></div>
                      <div class="screen-cta-line"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="phone-shell phone-shell-side phone-shell-right">
              <div class="phone-frame">
                <div class="phone-notch"></div>

                <div class="phone-screen">
                  <div class="screen-topbar">
                    <span class="screen-time">9:41</span>
                    <img class="screen-logo" src="/logo.png" alt="" />
                  </div>

                  <div class="screen-header">
                    <span class="screen-label">imaan.app</span>
                    <div class="screen-title-block">
                      <div class="screen-title-line screen-title-line-short"></div>
                      <div class="screen-title-line"></div>
                    </div>
                  </div>

                  <div class="screen-preview">
                    <div class="screen-preview-orb"></div>
                  </div>
                </div>
              </div>
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
              imaan.app is a Muslim spiritual companion being built to feel calm, grounded, and genuinely supportive in everyday moments.
            </p>
          </details>

          <details class="faq-item">
            <summary><span>When will it launch?</span><span class="faq-icon" aria-hidden="true">+</span></summary>
            <p>
              The first release is in progress now. Join the waitlist and we will email you as soon as the App Store launch date is locked in.
            </p>
          </details>

          <details class="faq-item">
            <summary><span>What happens if I join the waitlist?</span><span class="faq-icon" aria-hidden="true">+</span></summary>
            <p>
              You will get a small number of launch-related emails only, including release updates, early access news, and the App Store go-live notice.
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

let successResetTimer = null;
let alertCloseTimer = null;
let lastFocusedElement = null;

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
    emailInput.focus();
    return;
  }

  setFormState("submitting");
  setStatus("Submitting your email to the waitlist.");

  const payload = {
    email,
    source: "landing_waitlist",
    submittedAtUtc: new Date().toISOString(),
    locale: navigator.language,
    page: window.location.href,
  };

  try {
    await submitWaitlist(payload);
    emailInput.value = "";
    setFormState("success");
    setStatus("You are on the list. We will email you when imaan.app is ready.");
    resetSuccessStateSoon();
  } catch (error) {
    console.error(error);
    setFormState("idle");
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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isAlertOpen()) {
    closeAlert();
  }
});
