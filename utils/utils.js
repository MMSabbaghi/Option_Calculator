const SHAMSI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

// تبدیل اعداد انگلیسی به فارسی
function toPersianDigits(str) {
  return (str + "").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}
// جداکننده هزارگان فارسی
function formatWithSeparatorsFa(num) {
  return toPersianDigits(num.toLocaleString("fa-IR"));
}

function formatToJalali(dt) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dt));
}

function formatToToman(amountInRial) {
  const amountInToman = Math.floor(amountInRial / 10);
  return (
    new Intl.NumberFormat("fa-IR", {
      useGrouping: true,
      maximumFractionDigits: 0,
    }).format(amountInToman) + " تومان"
  );
}

const isValidNumber = (num) => {
  return typeof num === "number" && num > 0;
};

function openModal(id = "modal") {
  document.getElementById(id).classList.add("active");
}

function closeModal(id = "modal") {
  document.getElementById(id).classList.remove("active");
}

// تعداد روز های باقی مانده تا سررسید
// ورودی به صورت : 14040503
function getDaysUntilMaturity(jalaliStr) {
  if (!/^\d{8}$/.test(jalaliStr)) return 0;
  const year = parseInt(jalaliStr.slice(0, 4), 10);
  const month = parseInt(jalaliStr.slice(4, 6), 10);
  const day = parseInt(jalaliStr.slice(6, 8), 10);
  const { gy, gm, gd } = jalaali.toGregorian(year, month, day);
  const targetDate = new Date(gy, gm - 1, gd);
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741;
  const a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911;
  const t = 1 / (1 + p * Math.abs(x));
  const y =
    1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function blackScholesPrice(S, K, T, sigma, r = 0.1, isCall = true) {
  const d1 =
    (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const cdf = (x) => (1 + erf(x / Math.sqrt(2))) / 2;

  if (isCall) {
    return S * cdf(d1) - K * Math.exp(-r * T) * cdf(d2);
  } else {
    return K * Math.exp(-r * T) * cdf(-d2) - S * cdf(-d1);
  }
}

function impliedVolatility(
  optionPrice,
  stockPrice,
  strikePrice,
  daysUntilMaturity,
  r = 0.4,
  isCall = true
) {
  const T = daysUntilMaturity / 365;
  let low = 0.0001,
    high = 5,
    mid;
  const tolerance = 1e-5;

  for (let i = 0; i < 100; i++) {
    mid = (low + high) / 2;
    const price = blackScholesPrice(stockPrice, strikePrice, T, mid, r, isCall);
    const diff = price - optionPrice;

    if (Math.abs(diff) < tolerance) return mid;
    if (diff > 0) high = mid;
    else low = mid;
  }
  return mid; // best estimate
}
