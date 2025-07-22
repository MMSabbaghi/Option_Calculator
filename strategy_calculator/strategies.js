const COMMISSION = 0.00102;

const strategies = [
  {
    name: "coveredcall",
    displayName: "کاوردکال",
    learnHref:
      "https://optionbaaz.ir/article/78/%D8%A7%D8%B3%D8%AA%D8%B1%D8%A7%D8%AA%DA%98%DB%8C-%DA%A9%D8%A7%D9%88%D8%B1%D8%AF-%DA%A9%D8%A7%D9%84-Covered-Call-%D8%A7%D8%AE%D8%AA%DB%8C%D8%A7%D8%B1-%D9%85%D8%B9%D8%A7%D9%85%D9%84%D9%87",

    tips: [
      "موقعیت ایده‌آل جهت اجرای این استراتژی: انتظار صعودی بودن ملایم سهم یا از آن بهتر، رنج زدن سهم زیر قیمت اعمال تا موعد سررسید.",
    ],
    getMaxProfit: (stockPrice, contracts) => {
      const { strike, premium } = contracts.callOption;
      const grossProfit = strike - stockPrice + premium;
      const commission = (stockPrice + premium) * COMMISSION;
      const netProfit = grossProfit - commission;
      const percentageProfit = ((netProfit / stockPrice) * 100).toFixed(2);

      return {
        maxProfit: percentageProfit,
        tip: ` حداکثر سود زمانی محقق می‌شود که قیمت سهم در سررسید به ${toPersianDigits(
          strike
        )} یا بالاتر برسد. در این صورت اختیار فروش اعمال شده و سود ناشی از دریافت پرمیوم و تفاوت قیمت سررسید با قیمت خرید به دست می‌آید.`,
      };
    },

    getMaxLoss: (stockPrice, contracts) => {
      const { premium } = contracts.callOption;
      const grossLoss = stockPrice - premium;
      const commission = (stockPrice + premium) * COMMISSION;
      const netLoss = grossLoss + commission;
      const percentageLoss = ((netLoss / stockPrice) * 100).toFixed(2);

      return {
        maxLoss: percentageLoss,
        tip: `حداکثر زیان زمانی رخ می‌دهد که قیمت سهم به صفر برسد. در این حالت، تنها مبلغ دریافت‌شده به‌عنوان پرمیوم می‌تواند بخشی از زیان را جبران کند.`,
      };
    },
    inputs: [{ type: "call", position: "short", key: "callOption" }],
  },
  {
    name: "conversion",
    displayName: "کانورژن",
    tips: ["قراردادها باید دارای سررسید و قیمت اعمال یکسان باشند."],
    learnHref:
      "https://optionbaaz.ir/article/73/%D8%A7%D8%B3%D8%AA%D8%B1%D8%A7%D8%AA%DA%98%DB%8C-%DA%A9%D8%A7%D9%86%D9%88%D8%B1%DA%98%D9%86-Conversion-%D8%A7%D8%AE%D8%AA%DB%8C%D8%A7%D8%B1-%D9%85%D8%B9%D8%A7%D9%85%D9%84%D9%87",

    getMaxProfit: (stockPrice, contracts) => {
      const { premium: callPremium } = contracts.callOption;
      const { premium: putPremium } = contracts.putOption;
      const grossProfit = callPremium - putPremium;
      const commission =
        (callPremium + putPremium + stockPrice) * COMMISSION * 2;
      const netProfit = grossProfit - commission;
      const percentageProfit = ((netProfit / stockPrice) * 100).toFixed(2);

      return {
        maxProfit: percentageProfit,
        tip: "این سود بدون ریسک زمانی حاصل می‌شود که اختلاف پرمیوم دریافتی از فروش اختیار خرید و پرداختی بابت اختیار فروش، پس از کسر کارمزد، مثبت باشد. سود به صورت تضمینی از تفاوت پرمیوم‌ها تأمین می‌شود.",
      };
    },

    getMaxLoss: () => {
      return {
        maxLoss: 0,
        tip: "در این استراتژی (کانورژن) ریسک وجود ندارد، زیرا سود بدون ریسک از اختلاف پرمیوم‌ها بدست می‌آید و سهم خنثی است.",
      };
    },

    inputs: [
      { type: "call", position: "short", key: "callOption" },
      { type: "put", position: "long", key: "putOption" },
    ],
  },
  {
    name: "collar",
    displayName: "کولار",
    tips: [
      "با فروش اختیار خرید (Call) درآمد کسب می‌کنید و با خرید اختیار فروش (Put) از زیان احتمالی جلوگیری می‌شود.",
      "قراردادها دارای سررسید یکسان و قیمت اعمال متفاوت هستند.",
    ],
    learnHref:
      "https://optionbaaz.ir/article/141/%D8%A7%D8%B3%D8%AA%D8%B1%D8%A7%D8%AA%DA%98%DB%8C-%DA%A9%D9%88%D9%84%D8%A7%D8%B1-collar",
    getMaxProfit: (stockPrice, contracts) => {
      const { strike: callStrike, premium: callPremium } = contracts.callOption;
      const { premium: putPremium } = contracts.putOption;

      const grossProfit = callStrike - stockPrice + (callPremium - putPremium);
      const commission =
        (callPremium + putPremium + stockPrice) * COMMISSION * 2;

      const netProfit = grossProfit - commission;
      const percentageProfit = ((netProfit / stockPrice) * 100).toFixed(2);

      return {
        maxProfit: percentageProfit,
        tip: "حداکثر سود زمانی محقق می‌شود که قیمت سهم در سررسید به بالاتر از قیمت اعمال اختیار خرید برسد و سهم به قیمت تعیین‌شده فروخته شود. در این حالت، سود ناشی از رشد سهم تا قیمت اعمال، به‌علاوه درآمد حاصل از فروش اختیار خرید، منهای هزینه خرید اختیار فروش و کارمزدها خواهد بود.",
      };
    },

    getMaxLoss: (stockPrice, contracts) => {
      const { strike: putStrike, premium: putPremium } = contracts.putOption;
      const { premium: callPremium } = contracts.callOption;

      const grossLoss = stockPrice - putStrike + (putPremium - callPremium);
      const commission =
        (callPremium + putPremium + stockPrice) * COMMISSION * 2;

      const netLoss = grossLoss + commission;
      const percentageLoss = ((netLoss / stockPrice) * 100).toFixed(2);

      return {
        maxLoss: percentageLoss,
        tip: "حداکثر زیان زمانی رخ می‌دهد که قیمت سهم در سررسید به پایین‌تر از قیمت اعمال اختیار فروش برسد. در این حالت، زیان کاهش قیمت سهم، با اعمال اختیار فروش محدود می‌شود و هزینه پرمیوم‌ها و کارمزدها به آن اضافه می‌شود.",
      };
    },

    inputs: [
      { type: "call", position: "short", key: "callOption" },
      { type: "put", position: "long", key: "putOption" },
    ],
  },
  {
    name: "ironCondor",
    displayName: "آیرون کاندور",
    tips: [
      "در استراتژی آیرون کاندور، از نوسان محدود قیمت سهم در محدوده بین دو قیمت اعمال بهره می‌برید.",
      "این استراتژی از چهار قرارداد تشکیل شده است: فروش یک Call و خرید یک Call با قیمت اعمال بالاتر، و فروش یک Put و خرید یک Put با قیمت اعمال پایین‌تر.",
    ],
    learnHref:
      "https://optionas.ir/blog/71/%D8%A7%D8%B3%D8%AA%D8%B1%D8%A7%D8%AA%DA%98%DB%8C-Iron-Condor-%D8%AF%D8%B1-%D9%85%D8%B9%D8%A7%D9%85%D9%84%D8%A7%D8%AA-%D8%A2%D9%BE%D8%B4%D9%86:-%DA%A9%D8%B3%D8%A8-%D8%B3%D9%88%D8%AF-%D8%AF%D8%B1-%D8%A8%D8%A7%D8%B2%D8%A7%D8%B1%D9%87%D8%A7%DB%8C-%DA%A9%D9%85%E2%80%8C%D9%86%D9%88%D8%B3%D8%A7%D9%86",
    getMaxProfit: (stockPrice, contracts) => {
      const { premium: callShortPremium } = contracts.callShort;
      const { premium: callLongPremium } = contracts.callLong;
      const { premium: putShortPremium } = contracts.putShort;
      const { premium: putLongPremium } = contracts.putLong;

      const grossProfit =
        callShortPremium + putShortPremium - (callLongPremium + putLongPremium);

      const commission =
        (callShortPremium +
          putShortPremium +
          callLongPremium +
          putLongPremium +
          stockPrice) *
        COMMISSION *
        2;

      const netProfit = grossProfit - commission;
      const percentageProfit = ((netProfit / stockPrice) * 100).toFixed(2);

      return {
        maxProfit: percentageProfit,
        tip: "حداکثر سود زمانی محقق می‌شود که قیمت سهم در سررسید بین قیمت‌های اعمال اختیارهای فروش و خرید قرار گیرد و هیچ‌یک از آپشن‌ها اعمال نشوند. در این حالت، درآمد خالص ناشی از فروش آپشن‌ها منهای هزینه خرید آپشن‌ها و کارمزدها خواهد بود.",
      };
    },

    getMaxLoss: (stockPrice, contracts) => {
      const { strike: callShortStrike } = contracts.callShort;
      const { strike: callLongStrike } = contracts.callLong;
      const { strike: putShortStrike } = contracts.putShort;
      const { strike: putLongStrike } = contracts.putLong;

      const { premium: callShortPremium } = contracts.callShort;
      const { premium: callLongPremium } = contracts.callLong;
      const { premium: putShortPremium } = contracts.putShort;
      const { premium: putLongPremium } = contracts.putLong;

      const widthCallSpread = callLongStrike - callShortStrike;
      const widthPutSpread = putShortStrike - putLongStrike;

      const maxSpread = Math.max(widthCallSpread, widthPutSpread);

      const netCredit =
        callShortPremium + putShortPremium - (callLongPremium + putLongPremium);

      const grossLoss = maxSpread - netCredit;

      const commission =
        (callShortPremium +
          putShortPremium +
          callLongPremium +
          putLongPremium +
          stockPrice) *
        COMMISSION *
        2;

      const netLoss = grossLoss + commission;
      const percentageLoss = ((netLoss / stockPrice) * 100).toFixed(2);

      return {
        maxLoss: percentageLoss,
        tip: "حداکثر زیان زمانی رخ می‌دهد که قیمت سهم در سررسید به بیرون از محدوده دو قیمت اعمال (پایین‌تر از اختیار فروش دورتر یا بالاتر از اختیار خرید دورتر) حرکت کند و یکی از اسپردها به طور کامل فعال شود.",
      };
    },

    inputs: [
      { type: "call", position: "short", key: "callShort" },
      { type: "call", position: "long", key: "callLong" },
      { type: "put", position: "short", key: "putShort" },
      { type: "put", position: "long", key: "putLong" },
    ],
  },
  {
    name: "bullCallSpread",
    displayName: "کال اسپرد صعودی",
    tips: [
      "در این استراتژی با خرید یک Call و فروش یک Call دیگر با قیمت اعمال بالاتر، روی رشد محدود قیمت سهم شرط‌بندی می‌کنید.",
      "حداکثر سود و زیان هر دو محدود و از قبل مشخص هستند.",
    ],
    learnHref:
      "https://optionbaaz.ir/article/80/%D8%A7%D8%B3%D8%AA%D8%B1%D8%A7%D8%AA%DA%98%DB%8C-%D8%A7%D8%B3%D9%BE%D8%B1%D8%AF-%D8%B5%D8%B9%D9%88%D8%AF%DB%8C-%D8%A7%D8%AE%D8%AA%DB%8C%D8%A7%D8%B1-%D8%AE%D8%B1%DB%8C%D8%AF-Bull-Call-Spread",
    getMaxProfit: (stockPrice, contracts) => {
      const { strike: callLongStrike, premium: callLongPremium } =
        contracts.callLong;
      const { strike: callShortStrike, premium: callShortPremium } =
        contracts.callShort;

      const spreadWidth = callShortStrike - callLongStrike;
      const netPremium = callLongPremium - callShortPremium;

      const grossProfit = spreadWidth - netPremium;
      const commission =
        (callLongPremium + callShortPremium + stockPrice) * COMMISSION * 2;

      const netProfit = grossProfit - commission;
      const percentageProfit = ((netProfit / stockPrice) * 100).toFixed(2);

      return {
        maxProfit: percentageProfit,
        tip: "حداکثر سود زمانی محقق می‌شود که قیمت سهم در سررسید به بالاتر از قیمت اعمال اختیار خرید فروخته‌شده برسد. در این حالت، تفاوت بین قیمت‌های اعمال منهای هزینه خالص پرمیوم‌ها و کارمزدها به عنوان سود شناسایی می‌شود.",
      };
    },

    getMaxLoss: (stockPrice, contracts) => {
      const { premium: callLongPremium } = contracts.callLong;
      const { premium: callShortPremium } = contracts.callShort;

      const netPremium = callLongPremium - callShortPremium;
      const commission =
        (callLongPremium + callShortPremium + stockPrice) * COMMISSION * 2;

      const netLoss = netPremium + commission;
      const percentageLoss = ((netLoss / stockPrice) * 100).toFixed(2);

      return {
        maxLoss: percentageLoss,
        tip: "حداکثر زیان زمانی رخ می‌دهد که قیمت سهم در سررسید پایین‌تر از قیمت اعمال اختیار خرید خریداری‌شده باقی بماند و هر دو آپشن بی‌ارزش منقضی شوند. در این حالت، کل هزینه خالص پرمیوم‌ها و کارمزدها به عنوان زیان ثبت می‌شود.",
      };
    },

    inputs: [
      { type: "call", position: "long", key: "callLong" },
      { type: "call", position: "short", key: "callShort" },
    ],
  },
  {
    name: "bearPutSpread",
    displayName: "پوت اسپرد نزولی",
    tips: [
      "در این استراتژی با خرید یک Put و فروش یک Put دیگر با قیمت اعمال پایین‌تر، روی افت محدود قیمت سهم شرط‌بندی می‌کنید.",
      "حداکثر سود و زیان هر دو محدود و قابل محاسبه هستند.",
    ],
    learnHref:
      "https://optionbaaz.ir/article/123/%D9%BE%D9%88%D8%AA-%D8%A7%D8%B3%D9%BE%D8%B1%D8%AF-%D9%86%D8%B2%D9%88%D9%84%DB%8C-Bear-put-spread",
    getMaxProfit: (stockPrice, contracts) => {
      const { strike: putLongStrike, premium: putLongPremium } =
        contracts.putLong;
      const { strike: putShortStrike, premium: putShortPremium } =
        contracts.putShort;

      const spreadWidth = putLongStrike - putShortStrike;
      const netPremium = putLongPremium - putShortPremium;

      const grossProfit = spreadWidth - netPremium;
      const commission =
        (putLongPremium + putShortPremium + stockPrice) * COMMISSION * 2;

      const netProfit = grossProfit - commission;
      const percentageProfit = ((netProfit / stockPrice) * 100).toFixed(2);

      return {
        maxProfit: percentageProfit,
        tip: "حداکثر سود زمانی محقق می‌شود که قیمت سهم در سررسید به زیر قیمت اعمال اختیار فروش خریداری‌شده برسد و اسپرد به طور کامل فعال شود.",
      };
    },

    getMaxLoss: (stockPrice, contracts) => {
      const { premium: putLongPremium } = contracts.putLong;
      const { premium: putShortPremium } = contracts.putShort;

      const netPremium = putLongPremium - putShortPremium;
      const commission =
        (putLongPremium + putShortPremium + stockPrice) * COMMISSION * 2;

      const netLoss = netPremium + commission;
      const percentageLoss = ((netLoss / stockPrice) * 100).toFixed(2);

      return {
        maxLoss: percentageLoss,
        tip: "حداکثر زیان زمانی رخ می‌دهد که قیمت سهم در سررسید بالاتر از قیمت اعمال اختیار فروش فروخته‌شده باقی بماند و هر دو آپشن بی‌ارزش منقضی شوند.",
      };
    },

    inputs: [
      { type: "put", position: "long", key: "putLong" },
      { type: "put", position: "short", key: "putShort" },
    ],
  },
  {
    name: "longStraddle",
    displayName: "لانگ استرادل",
    tips: [
      "در استراتژی لانگ استرادل همزمان یک اختیار خرید و یک اختیار فروش با قیمت اعمال یکسان خریداری می‌شود.",
      "این استراتژی در بازارهای پرنوسان مفید است؛ چه قیمت سهم صعود کند، چه نزول شدید داشته باشد، سود خواهید برد.",
    ],
    learnHref:
      "https://optionbaaz.ir/article/60/%D8%A7%D8%B3%D8%AA%D8%B1%D8%A7%D8%AA%DA%98%DB%8C-%D9%85%D8%B9%D8%A7%D9%85%D9%84%D8%A7%D8%AA%DB%8C-%D8%A7%D8%B3%D8%AA%D8%B1%D8%A7%D8%AF%D9%84-%D8%AE%D8%B1%DB%8C%D8%AF-Long-straddle",
    getMaxProfit: (stockPrice, contracts) => {
      const { premium: callPremium } = contracts.callOption;
      const { premium: putPremium } = contracts.putOption;

      const grossProfit = "نامحدود"; // سود نامحدود در صورت افزایش شدید قیمت

      return {
        maxProfit: grossProfit,
        tip: "حداکثر سود در صورت افزایش شدید قیمت سهم به دست می‌آید (سود نامحدود از اختیار خرید) یا افت شدید قیمت (سود بالا از اختیار فروش).",
      };
    },

    getMaxLoss: (stockPrice, contracts) => {
      const { premium: callPremium } = contracts.callOption;
      const { premium: putPremium } = contracts.putOption;

      const grossLoss = callPremium + putPremium;
      const commission =
        (callPremium + putPremium + stockPrice) * COMMISSION * 2;

      const netLoss = grossLoss + commission;
      const percentageLoss = ((netLoss / stockPrice) * 100).toFixed(2);

      return {
        maxLoss: percentageLoss,
        tip: "حداکثر زیان زمانی رخ می‌دهد که قیمت سهم در سررسید تقریباً نزدیک قیمت اعمال باقی بماند و هر دو آپشن بی‌ارزش منقضی شوند.",
      };
    },

    inputs: [
      { type: "call", position: "long", key: "callOption" },
      { type: "put", position: "long", key: "putOption" },
    ],
  },
];
