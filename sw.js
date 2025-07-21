const cacheName = "OptionCalculatorCache";
const assetsToCache = [
  "/Option_Calculator/",
  "/Option_Calculator/index.html",
  "/Option_Calculator/app.js",
  "/Option_Calculator/manifest.json",
  "/Option_Calculator/style.css",
  "/Option_Calculator/font/Shabnam.eot",
  "/Option_Calculator/font/Shabnam.ttf",
  "/Option_Calculator/font/Shabnam.woff",
  "/Option_Calculator/icons/bootstrap-icons.min.css",
  "/Option_Calculator/icons/fonts/bootstrap-icons.woff",
  "/Option_Calculator/icons/fonts/bootstrap-icons.woff2",
  "/Option_Calculator/logo/icon512_maskable.png",
  "/Option_Calculator/logo/icon512_rounded.png",
  "/Option_Calculator/logo/logo.svg",
  "/Option_Calculator/utils/confirm.js",
  "/Option_Calculator/utils/jalaali.min.js",
  "/Option_Calculator/utils/alert.js",
  "/Option_Calculator/utils/utils.js",
  "/Option_Calculator/strategy_calculator/steategy_calc.css",
  "/Option_Calculator/strategy_calculator/steategy_calc.html",
  "/Option_Calculator/strategy_calculator/steategy_calc.js",
  "/Option_Calculator/strategy_calculator/strategies.js",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(cacheName).then(function (cache) {
      return cache.addAll(assetsToCache);
    })
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      if (!response) console.log(event.request);
      return response || fetch(event.request);
    })
  );
});
