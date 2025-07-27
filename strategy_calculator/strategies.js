const COMMISSION = 0.005;
const EXERCISE_FEE_RATE = 0.001;
const OPTION_FEE_RATE = 0.004;
const STOCK_FEE_RATE = 0.005;

const isValidPrice = (num) => {
  return typeof num === "number" && num > 0;
};

const strategies = [
  {
    name: "coveredcall",
    displayName: "کاوردکال",
    learnHref:
      "https://optionbaaz.ir/article/78/%D8%A7%D8%B3%D8%AA%D8%B1%D8%A7%D8%AA%DA%98%DB%8C-%DA%A9%D8%A7%D9%88%D8%B1%D8%AF-%DA%A9%D8%A7%D9%84-Covered-Call-%D8%A7%D8%AE%D8%AA%DB%8C%D8%A7%D8%B1-%D9%85%D8%B9%D8%A7%D9%85%D9%84%D9%87",

    tips: [
      "موقعیت ایده‌آل جهت اجرای این استراتژی: انتظار صعودی بودن ملایم سهم یا از آن بهتر، رنج زدن سهم زیر قیمت اعمال تا موعد سررسید.",
    ],
    validateStrategyInputs: (stockPrice, contracts) => {
      const { strike } = contracts.callOption;
      let message = null;
      if (!isValidPrice(stockPrice)) message = "قیمت سهم نامعتبر است.";
      else if (stockPrice >= strike)
        message = "قیمت اعمال قرارداد باید از قیمت فعلی سهم بالاتر باشد.";
      return { isValid: !!!message, message };
    },
    calculateResults: (stockPrice, contracts) => {
      const { strike, premium, expiry } = contracts.callOption;

      const tradeFee =
        stockPrice * OPTION_FEE_RATE + stockPrice * STOCK_FEE_RATE;
      const exerciseFee = strike * EXERCISE_FEE_RATE;

      const collateral = stockPrice - premium;
      const block = collateral + tradeFee;

      const receive = strike - stockPrice + premium;
      const profit = receive - tradeFee - exerciseFee;

      const profitPercent = (profit / block) * 100;
      const toStrike = ((strike - stockPrice) / stockPrice) * 100;

      const daysUntilMaturity = getDaysUntilMaturity(expiry.toString());
      const iv = impliedVolatility(
        premium,
        stockPrice,
        strike,
        daysUntilMaturity
      );

      const probability =
        (1 - Math.exp(-iv * Math.sqrt(daysUntilMaturity / 365))) * 100;

      return [
        {
          value: profitPercent.toFixed(2),
          lbl: "حداکثر سود",
          tip: "حداکثر سود زمانی محقق می‌شود که قیمت سهم در سررسید به قیمت اعمال یا بالاتر برسد. در این صورت اختیار اعمال شده و سود ناشی از دریافت پرمیوم و تفاوت قیمت سررسید با قیمت خرید به دست می‌آید.",
        },
        {
          value: toStrike.toFixed(2),
          lbl: "فاصله تا قیمت اعمال",
          tip: "درصد فاصله قیمتی بین قیمت فعلی سهم و قیمت اعمال اختیار.",
        },
        {
          value: probability.toFixed(2),
          lbl: "احتمال موفقیت",
          tip: "احتمال اینکه قیمت سهم در سررسید بالاتر از قیمت اعمال باقی بماند بر اساس نوسان ضمنی.",
        },
        {
          value: ((premium / stockPrice) * 100).toFixed(2),
          lbl: "پوشش سرمایه",
          tip: "درصدی از قیمت دارایی پایه که با فروش اختیار پوشش داده شده و ریسک را کاهش می‌دهد.",
        },
      ];
    },
    inputs: [{ type: "call", position: "short", key: "callOption" }],
  },
  {
    name: "conversion",
    displayName: "کانورژن",
    tips: ["قراردادها باید دارای سررسید و قیمت اعمال یکسان باشند."],
    learnHref:
      "https://optionbaaz.ir/article/73/%D8%A7%D8%B3%D8%AA%D8%B1%D8%A7%D8%AA%DA%98%DB%8C-%DA%A9%D8%A7%D9%86%D9%88%D8%B1%DA%98%D9%86-Conversion-%D8%A7%D8%AE%D8%AA%DB%8C%D8%A7%D8%B1-%D9%85%D8%B9%D8%A7%D9%85%D9%84%D9%87",

    validateStrategyInputs: (stockPrice, contracts) => {
      const { callOption, putOption } = contracts;
      let message = null;

      if (!isValidPrice(stockPrice)) message = "قیمت سهم نامعتبر است.";
      else if (callOption.strike !== putOption.strike)
        message = "قیمت اعمال قراردادها باید یکسان باشد.";
      else if (callOption.expiry !== putOption.expiry)
        message = "تاریخ سررسیدقرارداد ها باید یکسان باشد.";

      return { isValid: !!!message, message };
    },
    calculateResults: (stockPrice, contracts) => {
      const { callOption, putOption } = contracts;
      const strikePrice = callOption.strike;
      // قیمت‌های اختیارها
      const callPrice = callOption.premium;
      const putPrice = putOption.premium;

      // سود ناخالص: تفاوت پرمیوم‌ها و تفاوت قیمت اعمال تا سهم
      const grossProfit = strikePrice - stockPrice + (callPrice - putPrice);

      // کارمزدها
      const optionFees = (callPrice + putPrice) * OPTION_FEE_RATE;
      const stockFee = stockPrice * STOCK_FEE_RATE;
      const exerciseFee =
        stockPrice > strikePrice || stockPrice < strikePrice
          ? strikePrice * EXERCISE_FEE_RATE
          : 0;

      const totalFees = optionFees + stockFee + exerciseFee;

      // سود خالص
      const netProfit = grossProfit - totalFees;

      // سرمایه مورد نیاز
      const capital = stockPrice + (putPrice - callPrice);

      // بازده نهایی به درصد
      const totalReturn = ((netProfit / capital) * 100).toFixed(2);

      return [
        {
          value: totalReturn,
          lbl: "سود خالص",
          tip: "سود نهایی پس از کسر تمام کارمزدها (معامله، اعمال، سهم پایه) محاسبه شده است.",
        },
      ];
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
    validateStrategyInputs: (stockPrice, contracts) => {
      const { callOption, putOption } = contracts;
      let message = null;

      if (!isValidPrice(stockPrice)) message = "قیمت سهم نامعتبر است.";
      else if (callOption.strike <= stockPrice)
        message = "قیمت اعمال اختیار خرید باید بالاتر از قیمت سهم باشد.";
      else if (putOption.strike >= stockPrice)
        message = "قیمت اعمال اختیار فروش باید پایین‌تر از قیمت سهم باشد.";
      else if (callOption.expiry !== putOption.expiry)
        message = "تاریخ سررسید قرارداد ها باید یکسان باشد.";

      return { isValid: !!!message, message };
    },
    calculateResults: (stockPrice, contracts) => {
      const { callOption, putOption } = contracts;
      const {
        strike: callStrike,
        premium: callPremium,
        expiry: maturityDate,
      } = callOption;
      const { strike: putStrike, premium: putPremium } = putOption;

      const tradeFee =
        callPremium * OPTION_FEE_RATE +
        putPremium * OPTION_FEE_RATE +
        stockPrice * STOCK_FEE_RATE;
      const exerciseFee = (callStrike + putStrike) * EXERCISE_FEE_RATE;
      const commission = COMMISSION * (stockPrice + callPremium + putPremium);
      const totalFee = tradeFee + exerciseFee + commission;

      const capital = stockPrice + putPremium - callPremium + totalFee;
      const maxProfit = callStrike - capital;
      const maxLoss = putStrike - capital;

      const maxProfitPercent = ((maxProfit / capital) * 100).toFixed(2);
      const maxLossPercent = ((maxLoss / capital) * 100).toFixed(2);
      const rewardRisk = Math.abs(maxProfit / Math.abs(maxLoss)).toFixed(2);

      const daysUntilMaturity = getDaysUntilMaturity(maturityDate.toString());
      const monthlyReturn = MP(parseFloat(maxProfitPercent), daysUntilMaturity);

      return [
        {
          value: maxProfitPercent,
          lbl: "حداکثر سود",
          tip: `اگر قیمت سهم در سررسید بالاتر از ${toPersianDigits(
            callStrike
          )} باشد، بیشترین سود محقق می‌شود.`,
        },
        {
          value: maxLossPercent,
          lbl: "حداکثر زیان",
          tip: `اگر قیمت سهم در سررسید پایین‌تر از ${toPersianDigits(
            putStrike
          )} باشد، بیشترین زیان متوجه سرمایه‌گذار خواهد شد.`,
        },
        {
          value: rewardRisk,
          lbl: "نسبت سود به زیان",
          tip: "نسبت بین بیشترین سود ممکن به بیشترین زیان ممکن در استراتژی",
          noPercent: true,
        },
        {
          value: monthlyReturn.toFixed(2),
          lbl: "سود ماهیانه",
          tip: "بازدهی ماهیانه با در نظر گرفتن سود نهایی و روزهای باقی‌مانده تا سررسید",
        },
      ];
    },
    inputs: [
      { type: "call", position: "short", key: "callOption" },
      { type: "put", position: "long", key: "putOption" },
    ],
  },
  // {
  //   name: "bullCallSpread",
  //   displayName: "کال اسپرد صعودی",
  //   tips: [
  //     "در این استراتژی با خرید یک Call و فروش یک Call دیگر با قیمت اعمال بالاتر، روی رشد محدود قیمت سهم شرط‌بندی می‌کنید.",
  //     "حداکثر سود و زیان هر دو محدود و از قبل مشخص هستند.",
  //   ],
  //   learnHref:
  //     "https://optionbaaz.ir/article/80/%D8%A7%D8%B3%D8%AA%D8%B1%D8%A7%D8%AA%DA%98%DB%8C-%D8%A7%D8%B3%D9%BE%D8%B1%D8%AF-%D8%B5%D8%B9%D9%88%D8%AF%DB%8C-%D8%A7%D8%AE%D8%AA%DB%8C%D8%A7%D8%B1-%D8%AE%D8%B1%DB%8C%D8%AF-Bull-Call-Spread",

  //   validateStrategyInputs: (stockPrice, contracts) => {
  //     const { callLong, callShort } = contracts;
  //     let message = null;
  //     if (!isValidPrice(stockPrice)) message = "قیمت سهم نامعتبر است.";
  //     else if (callLong.expiry !== callShort.expiry)
  //       message = "تاریخ سررسید دو قرارداد باید یکسان باشد.";
  //     else if (callLong.strike >= callShort.strike)
  //       message = "قیمت اعمال قرارداد خریداری‌شده باید پایین تر باشد.";

  //     return { isValid: !!!message, message };
  //   },
  //   getMaxProfit: (stockPrice, contracts) => {
  //     const { strike: callLongStrike, premium: callLongPremium } =
  //       contracts.callLong;
  //     const { strike: callShortStrike, premium: callShortPremium } =
  //       contracts.callShort;

  //     const spreadWidth = callShortStrike - callLongStrike;
  //     const netPremium = callLongPremium - callShortPremium;

  //     const grossProfit = spreadWidth - netPremium;
  //     const commission =
  //       (callLongPremium + callShortPremium + stockPrice) * COMMISSION * 2;

  //     const netProfit = grossProfit - commission;
  //     const percentageProfit = ((netProfit / stockPrice) * 100).toFixed(2);

  //     return {
  //       maxProfit: percentageProfit,
  //       tip: "حداکثر سود زمانی محقق می‌شود که قیمت سهم در سررسید به بالاتر از قیمت اعمال اختیار خرید فروخته‌شده برسد. در این حالت، تفاوت بین قیمت‌های اعمال منهای هزینه خالص پرمیوم‌ها و کارمزدها به عنوان سود شناسایی می‌شود.",
  //     };
  //   },

  //   getMaxLoss: (stockPrice, contracts) => {
  //     const { premium: callLongPremium } = contracts.callLong;
  //     const { premium: callShortPremium } = contracts.callShort;

  //     const netPremium = callLongPremium - callShortPremium;
  //     const commission =
  //       (callLongPremium + callShortPremium + stockPrice) * COMMISSION * 2;

  //     const netLoss = netPremium + commission;
  //     const percentageLoss = ((netLoss / stockPrice) * 100).toFixed(2);

  //     return {
  //       maxLoss: percentageLoss,
  //       tip: "حداکثر زیان زمانی رخ می‌دهد که قیمت سهم در سررسید پایین‌تر از قیمت اعمال اختیار خرید خریداری‌شده باقی بماند و هر دو آپشن بی‌ارزش منقضی شوند. در این حالت، کل هزینه خالص پرمیوم‌ها و کارمزدها به عنوان زیان ثبت می‌شود.",
  //     };
  //   },

  //   inputs: [
  //     { type: "call", position: "long", key: "callLong" },
  //     { type: "call", position: "short", key: "callShort" },
  //   ],
  // },
  {
    name: "bearPutSpread",
    displayName: "پوت اسپرد نزولی",
    tips: [
      "در این استراتژی با خرید یک Put و فروش یک Put دیگر با قیمت اعمال پایین‌تر، روی افت محدود قیمت سهم تحلیل می‌کنید.",
      "حداکثر سود و زیان هر دو محدود و قابل محاسبه هستند.",
    ],
    learnHref:
      "https://optionbaaz.ir/article/123/%D9%BE%D9%88%D8%AA-%D8%A7%D8%B3%D9%BE%D8%B1%D8%AF-%D9%86%D8%B2%D9%88%D9%84%DB%8C-Bear-put-spread",
    validateStrategyInputs: (stockPrice, contracts) => {
      const { putLong, putShort } = contracts;
      let message = null;
      if (!isValidPrice(stockPrice)) message = "قیمت سهم نامعتبر است.";
      else if (putLong.expiry !== putShort.expiry)
        message = "تاریخ سررسید قرارداد ها باید یکسان باشد.";
      else if (putLong.strike <= putShort.strike)
        message = "قیمت اعمال قرارداد فروخته شده باید پایین تر باشد.";

      return { isValid: !!!message, message };
    },

    calculateResults: (stockPrice, contracts) => {
      const { putLong, putShort } = contracts;
      const { strike: longStrike, premium: longPremium, expiry } = putLong;
      const { strike: shortStrike, premium: shortPremium } = putShort;

      // کارمزدها
      const tradeFee =
        (longPremium + shortPremium) * OPTION_FEE_RATE +
        stockPrice * STOCK_FEE_RATE;

      const exerciseFee = (longStrike + shortStrike) * EXERCISE_FEE_RATE;

      const commission = COMMISSION * (stockPrice + longPremium + shortPremium);

      const totalFee = tradeFee + exerciseFee + commission;

      // سرمایه مورد نیاز
      const capital = longPremium - shortPremium + totalFee;

      // بیشترین سود = تفاوت استرایک‌ها - هزینه استراتژی
      const maxProfit = longStrike - shortStrike - capital;

      // بیشترین زیان = سرمایه وارد شده
      const maxLoss = capital;

      const maxProfitPercent = ((maxProfit / capital) * 100).toFixed(2);
      const maxLossPercent = ((-maxLoss / capital) * 100).toFixed(2);
      const rewardRisk = Math.abs(maxProfit / maxLoss).toFixed(2);

      const daysUntilMaturity = getDaysUntilMaturity(expiry.toString());
      const monthlyReturn = MP(parseFloat(maxProfitPercent), daysUntilMaturity);

      return [
        {
          value: maxProfitPercent,
          lbl: "حداکثر سود",
          tip: `اگر قیمت سهم در سررسید پایین‌تر از ${toPersianDigits(
            shortStrike
          )} باشد، بیشترین سود محقق می‌شود.`,
        },
        {
          value: maxLossPercent,
          lbl: "حداکثر زیان",
          tip: `اگر قیمت سهم در سررسید بالاتر از ${toPersianDigits(
            longStrike
          )} باشد، بیشترین زیان متوجه سرمایه‌گذار خواهد شد.`,
        },
        {
          value: rewardRisk,
          lbl: "نسبت سود به زیان",
          tip: "نسبت بین بیشترین سود ممکن به بیشترین زیان ممکن در استراتژی",
          noPercent: true,
        },
        {
          value: monthlyReturn.toFixed(2),
          lbl: "سود ماهیانه",
          tip: "بازدهی ماهیانه با در نظر گرفتن سود نهایی و روزهای باقی‌مانده تا سررسید",
        },
      ];
    },

    inputs: [
      { type: "put", position: "long", key: "putLong" },
      { type: "put", position: "short", key: "putShort" },
    ],
  },
  // {
  //   name: "longStraddle",
  //   displayName: "استرادل",
  //   tips: [
  //     "در استراتژی استرادل همزمان یک اختیار خرید و یک اختیار فروش با قیمت اعمال یکسان خریداری می‌شود.",
  //     "این استراتژی در بازارهای پرنوسان مفید است؛ چه قیمت سهم صعود کند، چه نزول شدید داشته باشد، سود خواهید برد.",
  //   ],
  //   learnHref:
  //     "https://optionbaaz.ir/article/60/%D8%A7%D8%B3%D8%AA%D8%B1%D8%A7%D8%AA%DA%98%DB%8C-%D9%85%D8%B9%D8%A7%D9%85%D9%84%D8%A7%D8%AA%DB%8C-%D8%A7%D8%B3%D8%AA%D8%B1%D8%A7%D8%AF%D9%84-%D8%AE%D8%B1%DB%8C%D8%AF-Long-straddle",
  //   validateStrategyInputs: (stockPrice, contracts) => {
  //     const { callOption, putOption } = contracts;
  //     let message = null;
  //     if (!isValidPrice(stockPrice)) message = "قیمت سهم نامعتبر است.";
  //     else if (callOption.strike !== putOption.strike)
  //       message = "قیمت اعمال قراردادها باید یکسان باشد.";
  //     else if (callOption.expiry !== putOption.expiry)
  //       message = "سررسید قراردادها باید یکسان باشد.";

  //     return { isValid: !!!message, message };
  //   },
  //   getMaxProfit: (stockPrice, contracts) => {
  //     const grossProfit = "نامحدود"; // سود نامحدود در صورت افزایش شدید قیمت

  //     return {
  //       maxProfit: grossProfit,
  //       tip: "حداکثر سود در صورت افزایش شدید قیمت سهم به دست می‌آید (سود نامحدود از اختیار خرید) یا افت شدید قیمت (سود بالا از اختیار فروش).",
  //     };
  //   },

  //   getMaxLoss: (stockPrice, contracts) => {
  //     const { premium: callPremium } = contracts.callOption;
  //     const { premium: putPremium } = contracts.putOption;

  //     const grossLoss = callPremium + putPremium;
  //     const commission =
  //       (callPremium + putPremium + stockPrice) * COMMISSION * 2;

  //     const netLoss = grossLoss + commission;
  //     const percentageLoss = ((netLoss / stockPrice) * 100).toFixed(2);

  //     return {
  //       maxLoss: percentageLoss,
  //       tip: "حداکثر زیان زمانی رخ می‌دهد که قیمت سهم در سررسید تقریباً نزدیک قیمت اعمال باقی بماند و هر دو آپشن بی‌ارزش منقضی شوند.",
  //     };
  //   },

  //   inputs: [
  //     { type: "call", position: "long", key: "callOption" },
  //     { type: "put", position: "long", key: "putOption" },
  //   ],
  // },
];
