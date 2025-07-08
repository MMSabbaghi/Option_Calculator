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

// جداکننده هزارگان فارسی (برای تومان)
function formatWithSeparatorsFa(num) {
  return toPersianDigits(num.toLocaleString("fa-IR"));
}

// فارسی کردن اینپوت ها
function toPersianInput (input) {
  let raw = fromPersianDigits(input.value);
  raw = raw.replace(/[^\d]/g, ""); // فقط عدد
  raw = raw.replace(/^0+/, ""); // حذف صفر اول
  input.value = toPersianDigits(raw);
};

// محاسبه اسپرد رفت و برگشت (۰.۲۶٪)
function calculateSpread(price) {
  return price * 0.00206;
}

// جلوگیری از وارد کردن غیر عدد و صفر پیشوندی
document
  .querySelectorAll("input[type='text']")
  .forEach((input) =>
    input.addEventListener("input", () => toPersianInput(input))
  );

// سوییچ بین فرم‌ها
document
  .getElementById("btnCalc")
  .addEventListener("click", () => toggle("formCalc", "btnCalc"));
document
  .getElementById("btnProfit")
  .addEventListener("click", () => toggle("formProfit", "btnProfit"));

function toggle(formId, btnId) {
  ["formCalc", "formProfit"].forEach((id) => {
    document.getElementById(id).style.display = "none";
  });
  ["btnCalc", "btnProfit"].forEach((id) => {
    document.getElementById(id).classList.remove("active");
  });
  document.getElementById(formId).style.display = "block";
  document.getElementById(btnId).classList.add("active");
  document.getElementById("calcResult").style.display = "none";
  document.getElementById("profitResult").style.display = "none";
}

// فرم ۱: محاسبه تارگت و حد ضرر
document
  .getElementById("calcBtn")
  .addEventListener("click", handleTargetCalculation);

// محاسبه و نمایش نتایج فرم اول
function handleTargetCalculation() {
  const p = parseInputValue("premium"); // قیمت اولیه (ریال)
  const r = parseInputValue("profitPercent"); // درصد سود هدف
  const l = parseInputValue("lossPercent"); // درصد حد ضرر

  const spread = calculateSpread(p); // اسپرد به ریال
  const sellTarget = calculateSellTarget(p, r, spread);
  const stopLoss = calculateStopLoss(p, l, spread);

  renderCalcResults(spread, sellTarget, stopLoss);
}

// استخراج مقدار عددی از input با تبدیل از فارسی
function parseInputValue(id) {
  return +fromPersianDigits(document.getElementById(id).value || "0");
}

// قیمت فروش هدف = قیمت خرید × (۱ + درصد سود) + اسپرد
function calculateSellTarget(price, profitPercent, spread) {
  return price * (1 + profitPercent / 100) + spread;
}

// حد ضرر = قیمت خرید × (۱ - درصد ضرر) - اسپرد
function calculateStopLoss(price, lossPercent, spread) {
  return price * (1 - lossPercent / 100) - spread;
}

// نمایش نتایج نهایی
function renderCalcResults(spread, sell, stop) {
  const resultHTML = ` 
    اسپرد: ${formatWithSeparatorsFa(spread)} ریال<br>
    قیمت تارگت: ${formatWithSeparatorsFa(sell)} ریال<br>
    حد ضرر: ${formatWithSeparatorsFa(stop)} ریال
  `;
  const resultBox = document.getElementById("calcResult");
  resultBox.innerHTML = resultHTML;
  resultBox.style.display = "block";
}

// فرم ۲: پله‌ها
function addStep() {
  const div = document.createElement("div");
  div.className = "step";
  div.innerHTML = `
    <button class="remove-step" onclick="removeStep(this)">&times;</button>
    <div><label>قیمت خرید:</label><input class="buyPrice" type="text" oninput="toPersianInput(this)"></div>
    <div><label>تعداد قرارداد:</label><input class="buyQty" type="text" oninput="toPersianInput(this)"></div>
    `;
  stepsList.appendChild(div);
}

function removeStep(btn) {
  btn.parentElement.remove();
}

// فرم ۲: محاسبه سود
document.getElementById("profitBtn").addEventListener("click", () => {
  const sell = +fromPersianDigits(sellPrice.value); // ریال
  const steps = document.querySelectorAll(".step");
  let totalCost = 0;
  let totalQty = 0;

  steps.forEach((s) => {
    const pr = +fromPersianDigits(s.querySelector(".buyPrice").value); // ریال
    const qt = +fromPersianDigits(s.querySelector(".buyQty").value);
    totalCost += pr * qt;
    totalQty += qt;
  });

  if (totalQty <= 0) return alert("تعداد باید بیشتر از صفر باشد");

  const contractSize = 1000;
  const avgBuy = totalCost / totalQty; // ریال
  const spreadEntry = calculateSpread(avgBuy) / 2;
  const spreadExit = calculateSpread(sell) / 2;
  const totalSpread = spreadEntry + spreadExit;

  const profitPerShare = sell - avgBuy - totalSpread;
  const netProfit = profitPerShare * totalQty * contractSize; // ریال
  const invested = totalCost * contractSize; // ریال
  const investedWithSpread = invested + totalSpread * totalQty * contractSize;

  const profitPercent = (netProfit / invested) * 100;

  profitResult.innerHTML = `
    کل سرمایه‌گذاری + اسپرد: ${formatWithSeparatorsFa(
      investedWithSpread / 10
    )} تومان<br>+
    سود خالص: ${formatWithSeparatorsFa(netProfit / 10)} تومان<br>+
    درصد سود خالص: ${toPersianDigits(profitPercent.toFixed(2))}٪
    `;
  profitResult.style.display = "block";
});
