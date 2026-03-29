import { c as createAstro, d as createComponent, f as renderComponent, r as renderTemplate, m as maybeRenderHead, e as addAttribute } from '../../../chunks/astro/server_DiwlOya4.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../../chunks/Layout_BEggCXFP.mjs';
import { $ as $$Block } from '../../../chunks/Block_BM_1FbFm.mjs';
/* empty css                                        */
export { renderers } from '../../../renderers.mjs';

const $$Astro = createAstro("https://benjaminarnedo.com");
const prerender = false;
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const TINA_TOKEN = "2599ea25e0f2837c5e8bd4352f6276e52a8505a0";
  const { slug } = Astro2.params;
  const apiUrl = `https://content.tinajs.io/content/${"8941095a-bd26-4e92-bf7a-621e1545d94b"}/github/${"main"}`;
  const query = `
  query GetProject($relativePath: String!) {
    projects(relativePath: $relativePath) {
      slug
      title
      category
      year
      cover
      coverAspect
      backgroundColor
      info {
        about
        date
        place
        client
      }
      blocks {
        __typename
        ... on ProjectsBlocksHero {
          src
          alt
          aspectRatio
          parallax
        }
        ... on ProjectsBlocksGallery {
          columns
          images {
            src
            alt
            aspectRatio
          }
        }
        ... on ProjectsBlocksVideo {
          provider
          src
          id
          poster
          caption
        }
        ... on ProjectsBlocksText {
          heading
          body
        }
      }
    }
  }
`;
  let project = null;
  let fetchError = null;
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": TINA_TOKEN
      },
      body: JSON.stringify({
        query,
        variables: { relativePath: `${slug}.json` }
      })
    });
    if (!res.ok) {
      fetchError = `Tina API returned ${res.status}`;
    } else {
      const json = await res.json();
      if (json.errors) {
        fetchError = json.errors.map((e) => e.message).join(", ");
      } else {
        project = json.data?.projects ?? null;
      }
    }
  } catch (err) {
    fetchError = err?.message ?? "Unknown fetch error";
  }
  if (!project) {
    return new Response(fetchError ? `Preview error: ${fetchError}` : "Project not found", {
      status: fetchError ? 502 : 404
    });
  }
  const blocks = (project.blocks ?? []).map((b) => {
    const typeName = b.__typename ?? "";
    const _template = typeName.replace(/^ProjectsBlocks/, "").toLowerCase();
    return { ...b, _template };
  });
  const info = project.info ?? {};
  const projectSchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    creator: { "@type": "Person", name: "Benjamin Arnedo" },
    ...project.info?.about ? { description: project.info.about } : {},
    ...project.year ? { dateCreated: String(project.year) } : {},
    ...project.cover ? { image: `https://benjaminarnedo.com${project.cover}` } : {},
    ...info.client ? { sponsor: { "@type": "Organization", name: info.client } } : {}
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `[PREVIEW] ${project.title} — Benjamin Arnedo`, "pageBackground": project.backgroundColor, "jsonLd": projectSchema, "data-astro-cid-bwqouvvz": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page project-page"${addAttribute(project.backgroundColor ? `--color-bg: ${project.backgroundColor}; background: ${project.backgroundColor}` : "", "style")} data-astro-cid-bwqouvvz> <div class="preview-banner" data-astro-cid-bwqouvvz> <span data-astro-cid-bwqouvvz>Draft preview — <a${addAttribute(`/work/${project.slug}`, "href")} data-astro-cid-bwqouvvz>view live</a></span> </div> <div class="project-back" data-animate="fade-up" data-astro-cid-bwqouvvz> <a href="/" class="btn btn--ghost" data-astro-cid-bwqouvvz>&larr; All projects</a> </div> <div class="cover-transition"${addAttribute(`--aspect: ${project.coverAspect ?? "16/9"}`, "style")} data-astro-cid-bwqouvvz> <div class="img-container" data-astro-cid-bwqouvvz> <img${addAttribute(project.cover, "src")}${addAttribute(project.title, "alt")} loading="eager" decoding="async" data-astro-cid-bwqouvvz> </div> </div> <header class="project-header" data-animate="fade-up" data-astro-cid-bwqouvvz> <h1 class="project-title" data-astro-cid-bwqouvvz>${project.title}</h1> <div class="project-meta" data-astro-cid-bwqouvvz> <p class="label" data-astro-cid-bwqouvvz>${project.category}</p> <p class="label" data-astro-cid-bwqouvvz>${project.year}</p> </div> </header> ${(info.about || info.date || info.place || info.client) && renderTemplate`<div class="project-info" data-animate="fade-up" data-astro-cid-bwqouvvz> ${info.about && renderTemplate`<div class="project-info-item" data-astro-cid-bwqouvvz> <span class="project-info-label" data-astro-cid-bwqouvvz>About</span> <span class="project-info-value" data-astro-cid-bwqouvvz>${info.about}</span> </div>`} ${info.date && renderTemplate`<div class="project-info-item" data-astro-cid-bwqouvvz> <span class="project-info-label" data-astro-cid-bwqouvvz>Date</span> <span class="project-info-value" data-astro-cid-bwqouvvz>${info.date}</span> </div>`} ${info.place && renderTemplate`<div class="project-info-item" data-astro-cid-bwqouvvz> <span class="project-info-label" data-astro-cid-bwqouvvz>Place</span> <span class="project-info-value" data-astro-cid-bwqouvvz>${info.place}</span> </div>`} ${info.client && renderTemplate`<div class="project-info-item" data-astro-cid-bwqouvvz> <span class="project-info-label" data-astro-cid-bwqouvvz>Client</span> <span class="project-info-value" data-astro-cid-bwqouvvz>${info.client}</span> </div>`} </div>`} <div class="project-content" data-astro-cid-bwqouvvz> ${blocks.map((block) => renderTemplate`${renderComponent($$result2, "Block", $$Block, { "block": block, "data-astro-cid-bwqouvvz": true })}`)} </div> </div> ` })} `;
}, "/Users/budaloco/zstudios Dropbox/Benjamin Arnedo/2026/Benjamin Arnedo/photofolio/src/pages/preview/work/[slug].astro", void 0);
const $$file = "/Users/budaloco/zstudios Dropbox/Benjamin Arnedo/2026/Benjamin Arnedo/photofolio/src/pages/preview/work/[slug].astro";
const $$url = "/preview/work/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
