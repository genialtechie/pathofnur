import "./styles.css";

document.querySelector("#app").innerHTML = `
  <div class="page-shell">
    <header class="site-header">
      <a class="brand" href="#top" aria-label="imaan.app home">
        <img class="brand-logo" src="/logo.png" alt="imaan.app logo" />
        <div class="brand-copy">
          <span class="brand-name">imaan.app</span>
          <span class="brand-subtitle">Native intervention companion</span>
        </div>
      </a>

      <nav class="site-nav" aria-label="Primary">
        <a href="#model">Model</a>
        <a href="#memory">Memory</a>
        <a href="#trust">Trust</a>
      </nav>
    </header>

    <main id="top">
      <section class="hero-section">
        <div class="hero-copy">
          <p class="eyebrow">Built for the exact point of spiritual friction</p>
          <h1>Not a passive dashboard. A calm intervention when the heart feels pressure.</h1>
          <p class="hero-text">
            imaan.app is being rebuilt as a state-driven spiritual companion for Muslims. It listens for grief, anxiety,
            urgency, and practical questions, then responds with the right shape of grounded help instead of forcing users
            to browse through utilities.
          </p>

          <div class="hero-actions">
            <a class="button button-primary" href="#model">See the intervention model</a>
            <a class="button button-secondary" href="#memory">Explore the memory layer</a>
          </div>

          <div class="source-row" aria-label="Source coverage">
            <span>Quran</span>
            <span>Hadith</span>
            <span>Seerah</span>
            <span>Fiqh</span>
          </div>
        </div>

        <div class="hero-stage">
          <div class="hero-glow hero-glow-gold"></div>
          <div class="hero-glow hero-glow-blue"></div>

          <div class="phone-card">
            <div class="phone-card-top">
              <span class="phone-pill">What is on your mind?</span>
              <img class="phone-logo" src="/logo.png" alt="" />
            </div>

            <div class="phone-card-copy">
              <p class="phone-label">Contextual Anchor</p>
              <h2>The app begins where the pressure is.</h2>
              <p>
                Deep emotional friction gets grounding first. Acute moments get quick validation. Practical questions get a concise ruling with citation.
              </p>
            </div>

            <div class="phone-image-frame">
              <img src="/hero-mark.webp" alt="imaan.app launch artwork" />
            </div>

            <div class="phone-metrics">
              <div class="metric-box">
                <span class="metric-label">Response shape</span>
                <strong>Anchor, validation, or ruling</strong>
              </div>
              <div class="metric-box">
                <span class="metric-label">Companion layer</span>
                <strong>Remembers what brought you back</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="content-section" id="model">
        <div class="section-heading">
          <p class="eyebrow">Three intervention types</p>
          <h2>One input. The right response.</h2>
          <p>
            The system is organized around the user’s state, not around feature browsing. That keeps the product fast, calm, and focused.
          </p>
        </div>

        <div class="card-grid">
          <article class="feature-card anchor-card">
            <p class="card-number">01</p>
            <h3>The Contextual Anchor</h3>
            <p>For grief, anxiety, shame, and emotional heaviness. Start with reviewed grounding before the dua arrives.</p>
          </article>

          <article class="feature-card validation-card">
            <p class="card-number">02</p>
            <h3>The Quick Validation</h3>
            <p>For acute friction happening right now. Validate briefly, remove hesitation, and deliver the needed dua immediately.</p>
          </article>

          <article class="feature-card ruling-card">
            <p class="card-number">03</p>
            <h3>The Concise Ruling</h3>
            <p>For practical lifestyle and fiqh questions. Keep it short, direct, and cited without burying the answer in fluff.</p>
          </article>
        </div>
      </section>

      <section class="content-section split-section" id="memory">
        <div class="split-copy">
          <p class="eyebrow">Memory, not streak pressure</p>
          <h2>The product proves it is a companion by remembering.</h2>
          <p>
            Home becomes the intervention space. Journey and Ledger become the memory layer that keeps track of what has been heavy,
            what helped, and what deserves a follow-up.
          </p>

          <ul class="memory-list">
            <li>Journey tracks positive momentum without turning spiritual life into a scoreboard.</li>
            <li>Ledger records past stressors, interventions, and follow-ups in one place.</li>
            <li>Utilities move out of the core flow so the main action stays spiritually focused.</li>
          </ul>
        </div>

        <div class="memory-panel">
          <div class="memory-cell">
            <span class="memory-label">Ledger</span>
            <strong>What brought you here</strong>
            <p>Stressors and interventions do not disappear into isolated sessions.</p>
          </div>

          <div class="memory-divider"></div>

          <div class="memory-cell">
            <span class="memory-label">Journey</span>
            <strong>What kept you steady</strong>
            <p>Follow-ups and positive movement build calm continuity instead of raw streak pressure.</p>
          </div>
        </div>
      </section>

      <section class="content-section" id="trust">
        <div class="section-heading">
          <p class="eyebrow">Trust is the product</p>
          <h2>Grounded, narrow, and deliberately cited.</h2>
          <p>
            imaan.app is not a generic productivity layer, a passive content browser, or an uncited spiritual chatbot.
            It is a focused intervention tool shaped around reviewed Islamic material and memory-backed continuity.
          </p>
        </div>

        <div class="trust-grid">
          <article class="trust-card">
            <h3>Reviewed source pool</h3>
            <p>Quran, hadith, seerah, and practical rulings form the citation backbone for grounding and intervention.</p>
          </article>

          <article class="trust-card">
            <h3>Zero-judgment tone</h3>
            <p>The app meets users where they are instead of forcing them through a utility maze before help arrives.</p>
          </article>

          <article class="trust-card">
            <h3>Native-first continuity</h3>
            <p>The refactor centers account-backed memory, intervention flow, and a more serious backend foundation.</p>
          </article>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div>
        <p class="eyebrow">imaan.app</p>
        <h2>A spiritual companion for moments of friction.</h2>
      </div>
      <a class="button button-primary" href="#top">Back to top</a>
    </footer>
  </div>
`;
