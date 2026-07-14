const CACHE_NAME = "skogskalkyl-2.0.0-alpha.1-digital-thinning-template.3";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/variables.css",
  "./css/layout.css",
  "./css/components.css",
  "./css/forms.css",
  "./css/dashboard.css",
  "./css/mobile.css",
  "./js/app.js",
  "./js/router.js",
  "./js/config.js",
  "./js/storage.js",
  "./js/theme.js",
  "./js/ui.js",
  "./js/views/dashboard.js",
  "./js/views/dgv.js",
  "./js/views/height.js",
  "./js/views/skotselkollen.js",
  "./js/views/curve-review.js",
  "./js/views/rojning.js",
  "./js/views/forest-plan-pricing.js",
  "./js/views/quote.js",
  "./js/views/customers.js",
  "./js/views/settings.js",
  "./js/calculators/dgvCalculator.js",
  "./js/calculators/heightCalculator.js",
  "./js/calculators/skotselCalculator.js",
  "./js/calculators/skotselReport.js",
  "./js/calculators/skotselKnowledgeBase.js",
  "./js/calculators/norraThinningValues.js",
  "./js/calculators/curveReview.js",
  "./js/calculators/siteIndexCalculator.js",
  "./js/calculators/siteIndexCurves.js",
  "./js/calculators/customerArchive.js",
  "./js/calculators/quoteCalculator.js",
  "./js/calculators/pricingEngine.js",
  "./data/norra-thinning-review-drafts.json",
  "./data/norra-thinning-reviewed-candidates.json",
  "./data/norra-thinning-import-batch-03-assisted.csv",
  "./data/generated/norra-thinning-assisted-extraction.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // addAll avbryter hela installationen vid en enda 404.
      // Separata förfrågningar gör att service workern förblir robust under alpha-fasen.
      await Promise.allSettled(
        CORE_ASSETS.map((asset) =>
          fetch(asset, { cache: "reload" }).then((response) => {
            if (response.ok) {
              return cache.put(asset, response);
            }
            return undefined;
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          if (response.ok) {
            cache.put(event.request, copy);
          }
        });
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) {
            return cached;
          }
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return new Response("", { status: 408, statusText: "Offline" });
        })
      )
  );
});
