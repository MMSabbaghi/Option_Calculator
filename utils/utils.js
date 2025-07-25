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
