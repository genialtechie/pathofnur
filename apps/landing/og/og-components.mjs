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

function line(x1, y1, x2, y2, opacity = 1) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(245,240,230,${opacity})" stroke-width="12" stroke-linecap="round" />`;
}

export function buildOgCard() {
  const title = [
    "A spiritual",
    "companion for",
    "the moments",
    "that pull at",
    "the heart.",
  ];

  const titleNodes = title
    .map((lineText, index) =>
      textNode(lineText, 80, 160 + index * 78, {
        fontSize: 66,
        fontFamily: "Georgia, serif",
        fontWeight: 700,
      }),
    )
    .join("");

  const bodyNodes = [
    "Join the imaan.app waitlist for launch updates,",
    "App Store release news, and early access.",
  ]
    .map((lineText, index) =>
      textNode(lineText, 80, 540 + index * 34, {
        fontSize: 26,
        fontFamily: "Arial, sans-serif",
        fontWeight: 400,
        fill: "#BDC5D2",
      }),
    )
    .join("");

  const badge = `
    <g transform="translate(80 44)">
      <rect width="250" height="68" rx="18" fill="rgba(10,18,31,0.72)" stroke="rgba(255,255,255,0.08)" />
      <path d="M36.1 33.8c0 4.4 3.8 5.9 3.8 5.9-.1.1-.7 2.1-2.1 4.1-1.2 1.7-2.3 3.3-4.1 3.4-1.7.1-2.2-1-4.2-1-2 0-2.6 1-4.1 1.1-1.6.1-3-1.7-4.2-3.4-2.4-3.4-4.2-9.5-1.8-13.6 1.2-2 3.2-3.2 5.5-3.3 1.6 0 3 1.1 4 1.1s2.7-1.4 4.6-1.2c.8 0 3 .3 4.5 2.3-.1 0-3.8 2.3-3.8 6.6zm-5-10.3c.9-1.1 1.5-2.6 1.3-4.1-1.5.1-3.3 1-4.4 2.1-1 1.2-1.9 2.8-1.6 4.3 1.7.1 3.6-.9 4.7-2.3z" fill="#F5F0E6"/>
      ${textNode("Coming soon to the", 72, 28, { fontSize: 14, fontFamily: "Arial, sans-serif", fill: "#D9E0EA", fontWeight: 500 })}
      ${textNode("App Store", 72, 52, { fontSize: 28, fontFamily: "Arial, sans-serif", fill: "#F5F0E6", fontWeight: 700 })}
    </g>
  `;

  const phone = `
    <g transform="translate(850 96)">
      <rect width="220" height="430" rx="34" fill="#0F1621" stroke="#02060D" stroke-width="8" />
      <rect x="72" y="10" width="76" height="10" rx="6" fill="#02060D" />
      <rect x="16" y="24" width="188" height="390" rx="26" fill="url(#phoneBg)" stroke="rgba(255,255,255,0.05)" />
      ${textNode("9:41", 34, 66, { fontSize: 16, fontFamily: "Arial, sans-serif", fill: "#D9E0EA", fontWeight: 500 })}
      <rect x="165" y="43" width="24" height="24" rx="8" fill="rgba(8,24,44,0.92)" />
      ${textNode("imaan.app", 34, 108, { fontSize: 14, fontFamily: "Arial, sans-serif", fill: "#D6B25C", fontWeight: 700, letterSpacing: "2" })}
      ${line(34, 132, 126, 132)}
      ${line(34, 154, 182, 154)}
      ${line(34, 176, 154, 176)}
      <rect x="34" y="198" width="152" height="92" rx="16" fill="url(#cardBg)" stroke="rgba(255,255,255,0.06)" />
      <circle cx="110" cy="244" r="28" fill="none" stroke="#D6B25C" stroke-width="2.2" />
      <rect x="34" y="306" width="152" height="48" rx="14" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" />
      ${line(46, 324, 116, 324, 0.9)}
      ${line(46, 344, 174, 344, 0.9)}
      <rect x="34" y="364" width="66" height="30" rx="14" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" />
      <rect x="110" y="364" width="76" height="30" rx="14" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" />
      <rect x="34" y="404" width="152" height="36" rx="14" fill="rgba(214,178,92,0.12)" stroke="rgba(255,255,255,0.08)" />
      <circle cx="48" cy="422" r="5" fill="#D6B25C" />
      ${line(62, 422, 138, 422, 0.9)}
    </g>
  `;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
          <stop stop-color="#08111D" />
          <stop offset="0.58" stop-color="#06101A" />
          <stop offset="1" stop-color="#050D17" />
        </linearGradient>
        <linearGradient id="phoneBg" x1="16" y1="24" x2="204" y2="414" gradientUnits="userSpaceOnUse">
          <stop stop-color="#0B121D" />
          <stop offset="1" stop-color="#070C14" />
        </linearGradient>
        <linearGradient id="cardBg" x1="34" y1="198" x2="186" y2="290" gradientUnits="userSpaceOnUse">
          <stop stop-color="#08182C" />
          <stop offset="1" stop-color="#060F1B" />
        </linearGradient>
        <filter id="blur" x="-120" y="-120" width="1440" height="870" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="40" />
        </filter>
      </defs>

      <rect width="1200" height="630" fill="url(#bg)" />
      <circle cx="1090" cy="268" r="96" fill="rgba(214,178,92,0.18)" filter="url(#blur)" />
      <circle cx="742" cy="444" r="72" fill="rgba(67,101,168,0.16)" filter="url(#blur)" />
      ${textNode("imaan.app", 80, 52, { fontSize: 18, fontFamily: "Arial, sans-serif", fill: "#F5F0E6", fontWeight: 700 })}
      ${badge}
      ${titleNodes}
      ${bodyNodes}
      ${phone}
    </svg>
  `;
}
