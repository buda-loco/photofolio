import 'cookie';
import 'kleur/colors';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_DyJe_NXu.mjs';
import 'es-module-lexer';
import { j as decodeKey } from './chunks/astro/server_DiwlOya4.mjs';
import 'clsx';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///Users/budaloco/zstudios%20Dropbox/Benjamin%20Arnedo/2026/Benjamin%20Arnedo/photofolio/","adapterName":"@astrojs/vercel/serverless","routes":[{"file":"about/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/about","isIndex":false,"type":"page","pattern":"^\\/about\\/?$","segments":[[{"content":"about","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/about.astro","pathname":"/about","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"contact/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/contact","isIndex":false,"type":"page","pattern":"^\\/contact\\/?$","segments":[[{"content":"contact","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/contact.astro","pathname":"/contact","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"how-i-work/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/how-i-work","isIndex":false,"type":"page","pattern":"^\\/how-i-work\\/?$","segments":[[{"content":"how-i-work","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/how-i-work.astro","pathname":"/how-i-work","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"sitemap.xml","links":[],"scripts":[],"styles":[],"routeData":{"route":"/sitemap.xml","isIndex":false,"type":"endpoint","pattern":"^\\/sitemap\\.xml\\/?$","segments":[[{"content":"sitemap.xml","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/sitemap.xml.js","pathname":"/sitemap.xml","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/hoisted.BzlzMwsA.js"}],"styles":[{"type":"inline","content":".preview-banner[data-astro-cid-bwqouvvz]{position:fixed;top:0;left:50%;transform:translate(-50%);background:#f4ff26;color:#000;font-size:.75rem;letter-spacing:.1em;padding:.35rem 1rem;border-radius:0 0 6px 6px;z-index:9999;white-space:nowrap}.preview-banner[data-astro-cid-bwqouvvz] a[data-astro-cid-bwqouvvz]{color:inherit;text-decoration:underline}\n"},{"type":"external","src":"/_astro/about.DcIRZb3U.css"}],"routeData":{"route":"/preview/work/[slug]","isIndex":false,"type":"page","pattern":"^\\/preview\\/work\\/([^/]+?)\\/?$","segments":[[{"content":"preview","dynamic":false,"spread":false}],[{"content":"work","dynamic":false,"spread":false}],[{"content":"slug","dynamic":true,"spread":false}]],"params":["slug"],"component":"src/pages/preview/work/[slug].astro","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}}],"site":"https://benjaminarnedo.com","base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/Users/budaloco/zstudios Dropbox/Benjamin Arnedo/2026/Benjamin Arnedo/photofolio/src/pages/work/[slug].astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/work/[slug]@_@astro",{"propagation":"in-tree","containsHead":false}],["\u0000@astrojs-ssr-virtual-entry",{"propagation":"in-tree","containsHead":false}],["/Users/budaloco/zstudios Dropbox/Benjamin Arnedo/2026/Benjamin Arnedo/photofolio/src/pages/index.astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/index@_@astro",{"propagation":"in-tree","containsHead":false}],["/Users/budaloco/zstudios Dropbox/Benjamin Arnedo/2026/Benjamin Arnedo/photofolio/src/pages/about.astro",{"propagation":"none","containsHead":true}],["/Users/budaloco/zstudios Dropbox/Benjamin Arnedo/2026/Benjamin Arnedo/photofolio/src/pages/contact.astro",{"propagation":"none","containsHead":true}],["/Users/budaloco/zstudios Dropbox/Benjamin Arnedo/2026/Benjamin Arnedo/photofolio/src/pages/how-i-work.astro",{"propagation":"none","containsHead":true}],["/Users/budaloco/zstudios Dropbox/Benjamin Arnedo/2026/Benjamin Arnedo/photofolio/src/pages/preview/work/[slug].astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(o,t)=>{let i=async()=>{await(await o())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var s=(i,t)=>{let a=async()=>{await(await i())()};if(t.value){let e=matchMedia(t.value);e.matches?a():e.addEventListener(\"change\",a,{once:!0})}};(self.Astro||(self.Astro={})).media=s;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var l=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let a of e)if(a.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=l;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000noop-middleware":"_noop-middleware.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astro-page:src/pages/about@_@astro":"pages/about.astro.mjs","\u0000@astro-page:src/pages/contact@_@astro":"pages/contact.astro.mjs","\u0000@astro-page:src/pages/preview/work/[slug]@_@astro":"pages/preview/work/_slug_.astro.mjs","\u0000@astro-page:src/pages/sitemap.xml@_@js":"pages/sitemap.xml.astro.mjs","\u0000@astro-page:src/pages/work/[slug]@_@astro":"pages/work/_slug_.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astro-page:src/pages/how-i-work@_@astro":"pages/how-i-work.astro.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","/Users/budaloco/zstudios Dropbox/Benjamin Arnedo/2026/Benjamin Arnedo/photofolio/node_modules/astro/dist/env/setup.js":"chunks/astro/env-setup_Cr6XTFvb.mjs","\u0000@astrojs-manifest":"manifest_DBhtJdfd.mjs","/astro/hoisted.js?q=0":"_astro/hoisted.BzlzMwsA.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/about.DcIRZb3U.css","/logo.svg","/robots.txt","/_astro/hoisted.BzlzMwsA.js","/fonts/Adrianna Bold Italic.woff2","/fonts/Adrianna Bold.woff2","/fonts/Adrianna Condensed DemiBold Italic.woff2","/fonts/Adrianna Condensed DemiBold.woff2","/fonts/Adrianna Condensed Italic.woff2","/fonts/Adrianna Condensed Light Italic.woff2","/fonts/Adrianna Condensed Light.woff2","/fonts/Adrianna Condensed Regular.woff2","/fonts/Adrianna Condensed Thin Italic.woff2","/fonts/Adrianna Condensed Thin.woff2","/fonts/Adrianna Demibold Italic.woff2","/fonts/Adrianna Demibold.woff2","/fonts/Adrianna Extended Bold Italic.woff2","/fonts/Adrianna Extended Bold.woff2","/fonts/Adrianna Extended DemiBold Italic.woff2","/fonts/Adrianna Extended DemiBold.woff2","/fonts/Adrianna Extended ExtraBold Italic.woff2","/fonts/Adrianna Extended ExtraBold.woff2","/fonts/Adrianna Extended Italic.woff2","/fonts/Adrianna Extended Light Italic.woff2","/fonts/Adrianna Extended Light.woff2","/fonts/Adrianna Extended Regular.woff2","/fonts/Adrianna Extended Thin Italic.woff2","/fonts/Adrianna Extended Thin.woff2","/fonts/Adrianna Extrabold Italic.woff2","/fonts/Adrianna Extrabold.woff2","/fonts/Adrianna Italic.woff2","/fonts/Adrianna Light Italic.woff2","/fonts/Adrianna Light.woff2","/fonts/Adrianna Regular.woff2","/fonts/Adrianna Thin Italic.woff2","/fonts/Adrianna Thin.woff2","/images/projects/dickson/cover.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Crowds-11.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Crowds-20.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Crowds-33.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Crowds-57.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-DJ-8.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Food-5.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Gallery-2.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Gallery-7.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Lions-10.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Lions-19.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Performers-105.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Performers-124.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Performers-154.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Performers-175.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Performers-233.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Performers-28.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Performers-46.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Performers-69.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Shops-4.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Stage-2-3.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Stage-2-7.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Stage-2.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Stage-22.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Stage-38.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Stage-65.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Stage-67.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Stalls-17.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Stalls-41.jpg","/images/projects/lny2026/260221-LNY-2026-By-Buda-Stalls-64.jpg","/images/projects/lny2026/cover.jpg","/images/projects/dickson/full/dickson-Bulk-Whole-Foods-by-ben-arnedo-23.jpg","/images/projects/dickson/full/dickson-Capital-Chemist-by-ben-arnedo-18.jpg","/images/projects/dickson/full/dickson-Centerpiece-by-ben-arnedo-11.jpg","/images/projects/dickson/full/dickson-Dickson-Sports-Centre-by-ben-arnedo-33.jpg","/images/projects/dickson/full/dickson-Flowers-Gardens-by-ben-arnedo-4.jpg","/images/projects/dickson/full/dickson-Murray-Fisher-by-ben-arnedo-5.jpg","/images/projects/dickson/full/dickson-Princess-Nails-by-ben-arnedo-17.jpg","/images/projects/dickson/full/dickson-Trove-Canberra-by-ben-arnedo-13.jpg","/images/projects/dickson/full/dickson-Yu-Cafe-by-ben-arnedo-2.jpg","/images/projects/dickson/full/dickson-best-one-barber-by-ben-arnedo-5.jpg","/images/projects/dickson/full/dickson-iV-Learning-by-ben-arnedo-2.jpg","/images/projects/dickson/full/dickson-modern-dental-by-ben-arnedo-19.jpg","/about/index.html","/contact/index.html","/how-i-work/index.html","/sitemap.xml","/index.html"],"buildFormat":"directory","checkOrigin":false,"serverIslandNameMap":[],"key":"yie70uRxU6gpADfVZua+AIPfB2fV8of7+4+YbRPojd0=","experimentalEnvGetSecretEnabled":false});

export { manifest };
