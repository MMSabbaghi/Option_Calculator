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
];
