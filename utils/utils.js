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
