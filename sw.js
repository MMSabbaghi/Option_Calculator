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
  "/Option_Calculator/logo/16x16.png",
  "/Option_Calculator/logo/32x32.png",
  "/Option_Calculator/logo/72x72.png",
  "/Option_Calculator/logo/96x96.png",
  "/Option_Calculator/logo/120x120.png",
  "/Option_Calculator/logo/128x128.png",
  "/Option_Calculator/logo/144x144.png",
  "/Option_Calculator/logo/152x152.png",
  "/Option_Calculator/logo/180x180.png",
  "/Option_Calculator/logo/192x192.png",
  "/Option_Calculator/logo/384x384.png",
  "/Option_Calculator/logo/512x512.png",
  "/Option_Calculator/logo/logo.svg",
  "/Option_Calculator/utils/confirm.js",
  "/Option_Calculator/utils/jalaali.min.js",
  "/Option_Calculator/utils/alert.js",
  "/Option_Calculator/utils/utils.js",
  "/Option_Calculator/strategy_calculator/steategy_calc.css",
  "/Option_Calculator/strategy_calculator/steategy_calc.html",
  "/Option_Calculator/strategy_calculator/steategy_calc.js",
  "/Option_Calculator/strategy_calculator/strategies.js",
  "/Option_Calculator/2way_trading_calc/2way_calc.css",
  "/Option_Calculator/2way_trading_calc/2way_calc.html",
  "/Option_Calculator/2way_trading_calc/2way_calc.js",
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
