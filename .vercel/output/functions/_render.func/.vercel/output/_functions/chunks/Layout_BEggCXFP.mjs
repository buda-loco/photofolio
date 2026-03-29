import { c as createAstro, d as createComponent, e as addAttribute, r as renderTemplate, h as renderSlot, i as renderHead, u as unescapeHTML, f as renderComponent } from './astro/server_DiwlOya4.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                         */

const $$Astro$1 = createAstro("https://benjaminarnedo.com");
const $$ViewTransitions = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$ViewTransitions;
  const { fallback = "animate" } = Astro2.props;
  return renderTemplate`<meta name="astro-view-transitions-enabled" content="true"><meta name="astro-view-transitions-fallback"${addAttribute(fallback, "content")}>`;
}, "/Users/budaloco/zstudios Dropbox/Benjamin Arnedo/2026/Benjamin Arnedo/photofolio/node_modules/astro/components/ViewTransitions.astro", void 0);

const colors = {
	background: "#000000",
	text: "#ffffff",
	textMuted: "#767676",
	textBright: "#ffffff",
	border: "rgba(255, 255, 255, 0.1)",
	labelColor: "#f4ff26"
};
const typography = {
	sans: "'Adrianna', system-ui, -apple-system, sans-serif",
	display: "'Adrianna Extended', system-ui, sans-serif",
	headings: {
		weight: "700",
		letterSpacing: "0.01em",
		lineHeight: "1.05"
	},
	labels: {
		size: "0.6875rem",
		letterSpacing: "0.15em"
	},
	body: {
		size: "0.8125rem",
		lineHeight: "1.8"
	}
};
const textBlock = {
	headingSize: "clamp(2.5rem, 5vw, 5.5rem)",
	headingWeight: "300",
	headingLetterSpacing: "0em",
	headingLineHeight: "1.0",
	bodySize: "1rem",
	bodyLineHeight: "1.85",
	maxWidth: "52ch",
	gap: "2.5rem"
};
const buttons = {
	fontSize: "0.6875rem",
	letterSpacing: "0.15em",
	paddingV: "0.7rem",
	paddingH: "1.75rem"
};
const design = {
	colors: colors,
	typography: typography,
	textBlock: textBlock,
	buttons: buttons
};

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a, _b;
const $$Astro = createAstro("https://benjaminarnedo.com");
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const {
    title = "Benjamin Arnedo \u2014 Photographer & Cinematographer",
    description = "Benjamin Arnedo is a photographer and cinematographer specializing in motion and light.",
    pageBackground,
    jsonLd
  } = Astro2.props;
  const siteUrl = "https://benjaminarnedo.com";
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Benjamin Arnedo",
    jobTitle: "Photographer & Cinematographer",
    url: siteUrl,
    email: "hello@benjaminarnedo.com",
    sameAs: [
      "https://instagram.com/benjaminarnedo",
      "https://vimeo.com/benjaminarnedo"
    ]
  };
  const schemas = [personSchema, ...jsonLd ? [jsonLd] : []];
  function extractHex(css) {
    const m = css.match(/#([0-9a-f]{6}|[0-9a-f]{3})\b/i);
    if (!m) return null;
    let h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return "#" + h;
  }
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }
  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }
  function hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2 = (t) => {
      t = (t % 1 + 1) % 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const r = s === 0 ? l : hue2(h + 1 / 3);
    const g = s === 0 ? l : hue2(h);
    const b = s === 0 ? l : hue2(h - 1 / 3);
    const toHex = (n) => Math.round(n * 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  function luminance(r, g, b) {
    return [r, g, b].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    }).reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);
  }
  function contrastRatio(hex1, hex2) {
    const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2);
    const l1 = luminance(c1.r, c1.g, c1.b);
    const l2 = luminance(c2.r, c2.g, c2.b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function accessibleText(pillBg) {
    return contrastRatio(pillBg, "#ffffff") >= 4.5 ? "#ffffff" : "#000000";
  }
  function pillColors(bgCss, offset = 0) {
    const fallback = { bg: design.colors.labelColor, text: "#000000" };
    const hex = extractHex(bgCss);
    if (!hex) return fallback;
    const { r, g, b } = hexToRgb(hex);
    const { h, s, l } = rgbToHsl(r, g, b);
    if (s < 8) return fallback;
    const compH = (h + 180 + offset + 360) % 360;
    const compL = l < 50 ? Math.max(55, 100 - l * 0.4) : Math.min(35, l * 0.4);
    const compS = Math.min(100, Math.max(60, s));
    const bg = hslToHex(compH, compS, compL);
    return { bg, text: accessibleText(bg) };
  }
  const bgSource = pageBackground ?? design.colors.background ?? "#000000";
  const navItems = [
    { href: "/", label: "Work", offset: 0 },
    { href: "/about", label: "About", offset: 15 },
    { href: "/how-i-work", label: "Process", offset: -15 },
    { href: "/contact", label: "Contact", offset: 30 }
  ];
  const navPills = navItems.map((item) => ({
    ...item,
    pill: pillColors(bgSource, item.offset)
  }));
  const designCss = `
:root {
  /* \u2500\u2500 Colors \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  --color-bg:          ${design.colors.background};
  --color-text:        ${design.colors.text};
  --color-text-muted:  ${design.colors.textMuted};
  --color-text-bright: ${design.colors.textBright};
  --color-border:      ${design.colors.border};
  --color-label:       ${design.colors.labelColor};

  /* \u2500\u2500 Typography \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  --font-sans:     ${design.typography.sans};
  --font-display:  ${design.typography.display};

  --heading-weight:         ${design.typography.headings.weight};
  --heading-letter-spacing: ${design.typography.headings.letterSpacing};
  --heading-line-height:    ${design.typography.headings.lineHeight};

  --label-size:          ${design.typography.labels.size};
  --label-letter-spacing:${design.typography.labels.letterSpacing};

  --body-size:       ${design.typography.body.size};
  --body-line-height:${design.typography.body.lineHeight};

  /* \u2500\u2500 Text block \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  --tb-heading-size:          ${design.textBlock.headingSize};
  --tb-heading-weight:        ${design.textBlock.headingWeight};
  --tb-heading-letter-spacing:${design.textBlock.headingLetterSpacing};
  --tb-heading-line-height:   ${design.textBlock.headingLineHeight};
  --tb-body-size:             ${design.textBlock.bodySize};
  --tb-body-line-height:      ${design.textBlock.bodyLineHeight};
  --tb-max-width:             ${design.textBlock.maxWidth};
  --tb-gap:                   ${design.textBlock.gap};

  /* \u2500\u2500 Buttons \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  --btn-font-size:      ${design.buttons.fontSize};
  --btn-letter-spacing: ${design.buttons.letterSpacing};
  --btn-padding-v:      ${design.buttons.paddingV};
  --btn-padding-h:      ${design.buttons.paddingH};
}
`;
  return renderTemplate(_b || (_b = __template(['<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1"><meta name="color-scheme" content="dark"><title>', '</title><meta name="description"', '><meta name="theme-color"', '><!-- Open Graph --><meta property="og:title"', '><meta property="og:description"', '><meta property="og:type" content="website"><meta property="og:site_name" content="Benjamin Arnedo"><!-- Twitter Card --><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"', '><meta name="twitter:description"', '><!-- Canonical --><link rel="canonical"', "><!-- JSON-LD structured data -->", `<!-- Font preloads \u2014 the 3 faces used most --><link rel="preload" href="/fonts/Adrianna Light.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/fonts/Adrianna Extended Light.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/fonts/Adrianna Extended Bold.woff2" as="font" type="font/woff2" crossorigin><!-- Restore a11y preferences before first paint to avoid flash.
       '1' = explicit on, '0' = explicit off (overrides OS), null = use OS --><script>
    (function() {
      var html = document.documentElement
      var m = localStorage.getItem('reduce-motion')
      if (m === '1' || (m === null && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
        html.classList.add('reduce-motion')
      }
      if (localStorage.getItem('high-contrast') === '1') {
        html.classList.add('high-contrast')
      }
    })()
  <\/script>`, "<!-- Design tokens from design.json \u2014 override tokens.css defaults --><style>", "</style>", '</head> <body> <a href="#main-content" class="skip-nav">Skip to content</a> <nav class="site-nav" aria-label="Main navigation"> <a href="/" class="nav-logo"> <img src="/logo.svg" alt="Benjamin Arnedo" class="nav-logo-img" width="200" height="50"> </a> <ul class="nav-links" role="list"> ', ' </ul> </nav> <main id="main-content"> ', ' </main> <!-- Accessibility widget --> <div class="a11y-widget" aria-label="Accessibility options"> <button class="a11y-btn" id="a11y-motion" aria-pressed="false" title="Toggle reduced motion">\nMotion\n</button> <button class="a11y-btn" id="a11y-contrast" aria-pressed="false" title="Toggle high contrast">\nContrast\n</button> </div>  </body> </html>'])), title, addAttribute(description, "content"), addAttribute(design.colors.background, "content"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(`${siteUrl}${Astro2.url.pathname}`, "href"), schemas.map((schema) => renderTemplate(_a || (_a = __template(['<script type="application/ld+json">', "<\/script>"])), unescapeHTML(JSON.stringify(schema)))), renderComponent($$result, "ViewTransitions", $$ViewTransitions, {}), unescapeHTML(designCss), renderHead(), navPills.map(({ href, label, pill }, i) => renderTemplate`<li${addAttribute(`--i:${i}`, "style")}> <a${addAttribute(href, "href")} class="nav-link"${addAttribute(`--pill-bg:${pill.bg};--pill-text:${pill.text}`, "style")}>${label}</a> </li>`), renderSlot($$result, $$slots["default"]));
}, "/Users/budaloco/zstudios Dropbox/Benjamin Arnedo/2026/Benjamin Arnedo/photofolio/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
