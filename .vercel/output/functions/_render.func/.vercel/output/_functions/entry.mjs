import { renderers } from './renderers.mjs';
import { c as createExports } from './chunks/entrypoint_B-tMvHd9.mjs';
import { manifest } from './manifest_DBhtJdfd.mjs';

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/about.astro.mjs');
const _page2 = () => import('./pages/contact.astro.mjs');
const _page3 = () => import('./pages/how-i-work.astro.mjs');
const _page4 = () => import('./pages/preview/work/_slug_.astro.mjs');
const _page5 = () => import('./pages/sitemap.xml.astro.mjs');
const _page6 = () => import('./pages/work/_slug_.astro.mjs');
const _page7 = () => import('./pages/index.astro.mjs');

const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/about.astro", _page1],
    ["src/pages/contact.astro", _page2],
    ["src/pages/how-i-work.astro", _page3],
    ["src/pages/preview/work/[slug].astro", _page4],
    ["src/pages/sitemap.xml.js", _page5],
    ["src/pages/work/[slug].astro", _page6],
    ["src/pages/index.astro", _page7]
]);
const serverIslandMap = new Map();
const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "f781847d-40d3-4bfe-8089-70e219ffe168",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;

export { __astrojsSsrVirtualEntry as default, pageMap };
