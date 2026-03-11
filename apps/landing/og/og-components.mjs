function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function attrs(attributes) {
  return Object.entries(attributes)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => ` ${key}="${escapeHtml(value)}"`)
    .join("");
}

function element(tag, attributes = {}, children = "") {
  return `<${tag}${attrs(attributes)}>${children}</${tag}>`;
}

function textNode(label, x, y, options = {}) {
  return element(
    "text",
    {
      x,
      y,
      fill: options.fill ?? "#F5F0E6",
      "font-size": options.fontSize ?? 32,
      "font-family": options.fontFamily ?? "Georgia, serif",
      "font-weight": options.fontWeight ?? 600,
      "letter-spacing": options.letterSpacing,
    },
    escapeHtml(label),
  );
}

export function buildOgCard() {
  const title = [
    "A spiritual companion",
    "for the moments that",
    "pull at the heart."
  ];

  const titleNodes = title
    .map((lineText, index) =>
      textNode(lineText, 100, 240 + index * 90, {
        fontSize: 76,
        fontFamily: "Georgia, serif",
        fontWeight: 400,
        fill: "#F5F0E6",
        letterSpacing: "0.5"
      }),
    )
    .join("");

  const bodyNodes = [
    "Join the imaan.app waitlist for launch updates,",
    "App Store release news, and early access.",
  ]
    .map((lineText, index) =>
      textNode(lineText, 100, 520 + index * 36, {
        fontSize: 28,
        fontFamily: "Arial, sans-serif",
        fontWeight: 400,
        fill: "#BDC5D2",
      }),
    )
    .join("");

  const logoNode = textNode("imaan.app", 100, 100, { fontSize: 24, fontFamily: "Arial, sans-serif", fill: "#D6B25C", fontWeight: 700, letterSpacing: "2" });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
          <stop stop-color="#08111D" />
          <stop offset="0.6" stop-color="#06101A" />
          <stop offset="1" stop-color="#050D17" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="80" />
        </filter>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="30" />
        </filter>
        <linearGradient id="archGrad" x1="850" y1="250" x2="850" y2="630" gradientUnits="userSpaceOnUse">
          <stop stop-color="rgba(214,178,92,0.15)" />
          <stop offset="1" stop-color="rgba(214,178,92,0)" />
        </linearGradient>
      </defs>

      <rect width="1200" height="630" fill="url(#bg)" />
      
      <!-- Abstract floating orbs / gradients to make it look premium and spiritual -->
      <circle cx="900" cy="150" r="180" fill="rgba(214,178,92,0.15)" filter="url(#glow)" />
      <circle cx="1050" cy="450" r="280" fill="rgba(67,101,168,0.2)" filter="url(#glow)" />
      <circle cx="600" cy="300" r="300" fill="rgba(214,178,92,0.05)" filter="url(#glow)" />

      <!-- Minimalist arch accent (subtle Islamic geometric nod) -->
      <path d="M 800 630 L 800 300 A 180 180 0 0 1 1160 300 L 1160 630" stroke="url(#archGrad)" stroke-width="2" fill="none" filter="url(#softGlow)" />
      <path d="M 780 630 L 780 300 A 200 200 0 0 1 1180 300 L 1180 630" stroke="rgba(214,178,92,0.05)" stroke-width="1" fill="none" />
      
      ${logoNode}
      ${titleNodes}
      ${bodyNodes}
    </svg>
  `;
}
