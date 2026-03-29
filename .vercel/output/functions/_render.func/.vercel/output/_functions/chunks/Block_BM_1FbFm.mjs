import { c as createAstro, d as createComponent, m as maybeRenderHead, e as addAttribute, r as renderTemplate } from './astro/server_DiwlOya4.mjs';
import 'kleur/colors';
import 'clsx';

const $$Astro = createAstro("https://benjaminarnedo.com");
const $$Block = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Block;
  const { block } = Astro2.props;
  const blockType = block._template ?? block.type;
  function dropboxUrl(src) {
    if (!src?.includes("dropbox.com")) return src;
    const base = src.replace(/[?&]dl=\d/, "").replace(/\?$/, "");
    return base + (src.includes("?") ? "&raw=1" : "?raw=1");
  }
  function splitWords(text) {
    return text.split(" ");
  }
  return renderTemplate`${blockType === "hero" && renderTemplate`${maybeRenderHead()}<div class="block-hero img-reveal"${addAttribute(block.aspectRatio ? `--aspect: ${block.aspectRatio}` : void 0, "style")}><div class="img-container"><img${addAttribute(block.src, "src")}${addAttribute(block.alt ?? "", "alt")} loading="lazy" decoding="async"${addAttribute(block.parallax ?? void 0, "data-parallax")}></div>${block.caption && renderTemplate`<p class="block-caption label">${block.caption}</p>`}</div>`}${blockType === "gallery" && renderTemplate`<div class="block-gallery"${addAttribute(String(block.columns ?? 2), "data-cols")}>${block.images.map((img) => renderTemplate`<div class="gallery-item img-reveal"${addAttribute(img.aspectRatio ? `--aspect: ${img.aspectRatio}` : void 0, "style")}><div class="img-container"><img${addAttribute(img.src, "src")}${addAttribute(img.alt ?? "", "alt")} loading="lazy" decoding="async"></div></div>`)}</div>`}${blockType === "video" && renderTemplate`<div class="block-video"><div class="video-container">${block.provider === "youtube" ? renderTemplate`<iframe${addAttribute(`https://www.youtube.com/embed/${block.id}?rel=0`, "src")}${addAttribute(block.caption ?? "Project video", "title")} frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` : block.provider === "vimeo" ? renderTemplate`<iframe${addAttribute(`https://player.vimeo.com/video/${block.id}?badge=0&autopause=0`, "src")}${addAttribute(block.caption ?? "Project video", "title")} frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>` : renderTemplate`<video${addAttribute(dropboxUrl(block.src), "src")}${addAttribute(block.poster ?? void 0, "poster")} controls playsinline preload="metadata"></video>`}</div>${block.caption && renderTemplate`<p class="block-caption label">${block.caption}</p>`}</div>`}${blockType === "text" && renderTemplate`<div class="block-text">${block.heading && renderTemplate`<h2 class="block-heading" data-animate="word-reveal">${splitWords(block.heading).map((word, i, arr) => renderTemplate`<span class="word-clip"><span class="word-inner">${word}${i < arr.length - 1 ? "\xA0" : ""}</span></span>`)}</h2>`}${block.body && renderTemplate`<div class="block-body" data-animate="line-reveal">${block.body.split("\n").filter((l) => l.trim()).map((line) => renderTemplate`<p class="text-line">${line}</p>`)}</div>`}</div>`}`;
}, "/Users/budaloco/zstudios Dropbox/Benjamin Arnedo/2026/Benjamin Arnedo/photofolio/src/components/Block.astro", void 0);

export { $$Block as $ };
