// تبدیل اعداد فارسی به انگلیسی
function fromPersianDigits(str) {
  return (str + "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/٬|,/g, "");
}

// تبدیل اعداد انگلیسی به فارسی
function toPersianDigits(str) {
  return (str + "").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

// جداکننده هزارگان فارسی
function formatWithSeparatorsFa(num) {
  return toPersianDigits(num.toLocaleString("fa-IR"));
}

// فارسی کردن اینپوت‌ها
function toPersianInput(input) {
  let raw = fromPersianDigits(input.value);
  raw = raw.replace(/[^\d]/g, "");
  raw = raw.replace(/^0+/, "");
  input.value = toPersianDigits(raw);
}

function fromPersianFloatDigits(str) {
  return str
    .replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
    .replace(/[\/٫]/g, "."); // تبدیل ممیز فارسی یا اسلش به نقطه;
}
// فارسی کردن اینپوت‌ها
function toPersianFloatInput(input) {
  input.value = toPersianDigits(fromPersianFloatDigits(input.value));
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

function parseInputValue(id) {
  return +fromPersianDigits(document.getElementById(id).value || "0");
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
