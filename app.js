const SHEETDB_API = "https://sheetdb.io/api/v1/4xkud7vrc6wtz";
const months = [
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

let allTrades = [];
let filteredData = [];

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

// کارمزد رفت و برگشت
function calculateSpread(price) {
  return price * 0.00206;
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

// سوییچ فرم‌ها
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

// جلوگیری از وارد کردن غیر عدد
document.querySelectorAll(".container input[type='text']").forEach((input) => {
  input.addEventListener("input", () => toPersianInput(input));
});

const createResultRow = ({ lbl, val }) => {
  return `    
  <div class="result-row">
            <div class="result-label"> ${lbl}:</div>
            <div class="result-value">${val} </div>
  </div>`;
};

// فرم اول: محاسبه تارگت و حد ضرر
document.getElementById("calcBtn").addEventListener("click", () => {
  const p = parseInputValue("premium");
  const r = parseInputValue("profitPercent");
  const l = parseInputValue("lossPercent");

  if (!isValidNumber(p) || !isValidNumber(r) || !isValidNumber(l)) {
    showToast("تمام فیلد ها را کامل کنید.", "error");
    return;
  }

  const spread = calculateSpread(p);
  const sellTarget = p * (1 + r / 100) + spread;
  const stopLoss = p * (1 - l / 100) - spread;

  const resultHTML = `
  ${createResultRow({
    lbl: "کارمزد",
    val: `${formatWithSeparatorsFa(spread)} ریال`,
  })}
  ${createResultRow({
    lbl: "تارگت",
    val: `${formatWithSeparatorsFa(sellTarget)} ریال`,
  })}
  ${createResultRow({
    lbl: "حد ضرر",
    val: `${formatWithSeparatorsFa(stopLoss)} ریال`,
  })}
    `;
  const resultBox = document.getElementById("calcResult");
  resultBox.innerHTML = resultHTML;
  resultBox.style.display = "block";
});

function parseInputValue(id) {
  return +fromPersianDigits(document.getElementById(id).value || "0");
}

// فرم دوم: افزودن پله جدید
function addStep() {
  const div = document.createElement("div");
  div.className = "step";
  div.innerHTML = `
    <button class="remove-step" onclick="removeStep(this)">&times;</button>
    <div><label>قیمت خرید(ریال):</label><input class="buyPrice" type="text" placeholder="قیمت خرید" oninput="toPersianInput(this)"></div>
    <div><label>تعداد قرارداد:</label><input class="buyQty" type="text"  placeholder="تعداد قراردادها" oninput="toPersianInput(this)"></div>
  `;
  document.getElementById("stepsList").appendChild(div);
}

function removeStep(btn) {
  btn.parentElement.remove();
}

async function saveTradeToSheet(trade) {
  try {
    await fetch(SHEETDB_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: trade }),
    });
    showToast("معامله با موفقیت ثبت شد.", "success");
    return { isSucsess: true };
  } catch (error) {
    showToast("خطا در ذخیره سازی داده ", "error");
    return { isSucsess: false };
  }
}

function calculateTradeResults({ steps, sellPriceVal, fee = 0.00102 }) {
  let totalCost = 0;
  let totalQty = 0;

  steps.forEach((item) => {
    totalCost += item.price * (1 + fee) * item.qty; // هزینه خرید با کارمزد
    totalQty += item.qty;
  });

  if (totalQty === 0)
    return { breakEven: 0, profit: 0, totalCost: 0, percent: 0 };

  const contractSize = 1000;

  // میانگین خرید با کارمزد
  const avgBuyWithFee = totalCost / totalQty;

  // قیمت سر به سر (باید به این قیمت بفروشیم تا سود صفر بشه)
  const breakEven = avgBuyWithFee / (1 - fee);

  // قیمت فروش واقعی (با احتساب کسر کارمزد فروش)
  const netSellPrice = sellPriceVal * (1 - fee);

  // سود هر واحد
  const unitProfit = netSellPrice - avgBuyWithFee;

  // محاسبه سود و درصد سود
  const profit = unitProfit * totalQty * contractSize;
  const percent = (unitProfit / avgBuyWithFee) * 100;

  // کل هزینه نهایی
  const totalCostFinal = totalCost * contractSize;

  return {
    breakEven,
    profit,
    totalCost: totalCostFinal,
    percent,
  };
}

const isValidNumber = (num) => {
  return typeof num === "number" && num > 0;
};

const isValidTrade = ({ steps, sellPriceVal }) => {
  if (!isValidNumber(sellPriceVal)) {
    return { isValid: false, msg: "قیمت فروش را وارد کنید" };
  }

  if (!Array.isArray(steps) || steps.length === 0) {
    return { isValid: false, msg: "حداقل یک پله وارد کنید" };
  }

  for (let index = 0; index < steps.length; index++) {
    const { qty, price } = steps[index];
    const stepNumer = toPersianDigits(index + 1);
    if (!isValidNumber(price)) {
      return { isValid: false, msg: `قیمت فروش پله ${stepNumer} را وارد کنید` };
    }
    if (!isValidNumber(qty)) {
      return {
        isValid: false,
        msg: `تعداد قرارداد پله ${stepNumer} را وارد کنید`,
      };
    }
  }

  return { isValid: true, msg: "داده معتبر است" };
};

const getTradeFormData = () => {
  const sellPriceVal = +fromPersianDigits(
    document.getElementById("sellPrice").value
  );
  const stepEls = document.querySelectorAll(".step");
  const steps = [];

  stepEls.forEach((el) => {
    const price = +fromPersianDigits(el.querySelector(".buyPrice").value);
    const qty = +fromPersianDigits(el.querySelector(".buyQty").value);
    steps.push({
      id: crypto.randomUUID(),
      price,
      qty,
    });
  });

  return {
    steps,
    sellPriceVal,
  };
};

const emptyForm = () => {
  document.getElementById("sellPrice").value = null;
  const rBox = document.getElementById("profitResult");
  rBox.style.display = "none";
  document.getElementById("stepsList").innerHTML = `
  <div class="step">
            <div>
              <label>قیمت خرید:</label>
              <input class="buyPrice" type="text" placeholder="قیمت خرید">
            </div>
            <div>
              <label>تعداد قرارداد:</label>
              <input class="buyQty" type="text" placeholder="تعداد قراردادها">
            </div>
          </div>
  `;
};

document.getElementById("saveTradeBtn").addEventListener("click", (e) => {
  const { sellPriceVal, steps } = getTradeFormData();
  const { isValid, msg } = isValidTrade({ sellPriceVal, steps });

  if (isValid) {
    showConfirm(async (instrument) => {
      console.log(instrument);

      if (instrument.length >= 2) {
        const { profit, percent, totalCost } = calculateTradeResults({
          sellPriceVal,
          steps,
        });

        const trade = {
          id: Date.now().toString(),
          datetime: new Date(),
          profit,
          percent,
          totalcost: totalCost,
          sellprice: sellPriceVal,
          steps: JSON.stringify(steps),
          instrument,
        };

        alert(trade);

        e.target.disabled = true;
        e.target.innerHTML = `<span class="loader"></span>`;
        const { isSucsess } = await saveTradeToSheet(trade);
        if (isSucsess) emptyForm();
        e.target.disabled = false;
        e.target.innerHTML = "ذخیره معامله";
      } else {
        showToast(" نام وارد شده باید حداقل شامل دو حرف باشد. ", "error");
      }
    });
  } else {
    showToast(msg, "error");
  }
});

// محاسبه و ذخیره سود معامله
document.getElementById("profitBtn").addEventListener("click", () => {
  const { sellPriceVal, steps } = getTradeFormData();
  const { isValid, msg } = isValidTrade({ sellPriceVal, steps });

  if (isValid) {
    const rBox = document.getElementById("profitResult");
    const { profit, percent, totalCost, breakEven } = calculateTradeResults({
      sellPriceVal,
      steps,
    });
    rBox.innerHTML = `${createResultRow({
      lbl: "مبلغ کل",
      val: formatToToman(totalCost),
    })}
  ${createResultRow({
    lbl: "سود خالص",
    val: formatToToman(profit),
  })}
  ${createResultRow({
    lbl: "درصد سود",
    val: `${formatWithSeparatorsFa(+percent.toFixed(2))}٪`,
  })}
    ${createResultRow({
      lbl: "قیمت سر به سر",
      val: `${formatWithSeparatorsFa(+breakEven)} ریال`,
    })}
  `;
    rBox.style.display = "block";
  } else {
    showToast(msg, "error");
  }
});

function openModal() {
  document.getElementById("modal").classList.add("active");
}

function closeModal() {
  document.getElementById("modal").classList.remove("active");
}

function renderAccordion(trade) {
  const steps = JSON.parse(trade.steps || "[]")
    .map(
      (s) =>
        `<div>قیمت: ${formatWithSeparatorsFa(
          s.price
        )} | تعداد: ${formatWithSeparatorsFa(s.qty)}</div>`
    )
    .join("");
  return `
    <li class="accordion">
        <div class="accordion-header">${toJalaaliDateStr(
          trade.datetime
        )} - سود: ${formatToToman(trade.profit)}</div>
        <div class="accordion-body">
            <div>مبلغ کل: ${formatToToman(trade.totalcost)}</div>
            <div>قیمت فروش: ${formatWithSeparatorsFa(trade.sellprice)}</div>
            <div>${steps}</div>
        </div>
    </li>`;
}

function attachAccordionEvents() {
  document.querySelectorAll(".accordion-header").forEach((header) => {
    header.addEventListener("click", () => {
      const body = header.nextElementSibling;
      const isOpen = body.classList.toggle("open");
      body.style.maxHeight = isOpen ? body.scrollHeight + "px" : null;
    });
  });
}

const renderTradesData = (data) => {
  return data
    .reverse()
    .map((row) => {
      const stepsArr = JSON.parse(row.steps || "[]")
        .map(
          (s) =>
            `<div class="trade-item-step">
                <span>قیمت: ${formatWithSeparatorsFa(s.price)}</span>
                <span>تعداد: ${formatWithSeparatorsFa(s.qty)}</span>
            </div>
        `
        )
        .join("");

      return `
      <li class="accordion">
      <div class="accordion-header">
      <span> ${formatToJalali(row.datetime)} </span> 
      <span> ${row.instrument} </span> 
      <div>
      <span class="trade-item-profit">  ${formatToToman(row.profit)}</span>
      <span class="trade-item-show-btn" > <i class="bi bi-three-dots-vertical"></i> </span>
      </div>
      </div>

        <div class="accordion-body">
      <div class="trade-item-row">
        <div class="trade-item-label">تاریخ:</div>
        <div class="trade-item-value">
        ${formatToJalali(row.datetime)}
        </div>
      </div>

      <div class="trade-item-row">
        <div class="trade-item-label">سود خالص:</div>
        <div class="trade-item-value">
          <span class="trade-item-profit">${formatToToman(row.profit)} </span>
          <span class="trade-item-percent">( ${formatWithSeparatorsFa(
            Number(row.percent).toFixed(2)
          )}٪)</span>
        </div>
      </div>

      <div class="trade-item-row">
        <div class="trade-item-label">مبلغ کل:</div>
        <div class="trade-item-value">${formatToToman(row.totalcost)} 
        </div>
      </div>
      
      <div class="trade-item-row">
        <div class="trade-item-label">قیمت فروش : </div>
        <div class="trade-item-value">${formatWithSeparatorsFa(+row.sellprice)}
        </div>
      </div>

      <div class="trade-item-steplist">${stepsArr}</div>
      </div>
    </li>
      `;
    })
    .join("");
};

const renderTotalProfit = (data) => {
  let totalProfit = 0;
  data.forEach((trade) => (totalProfit += +trade.profit));
  const totalProfitEl = document.getElementById("totalProfit");

  const statusClass =
    totalProfit > 0 ? "total-pos" : totalProfit != 0 ? "total-neg" : "";

  totalProfitEl.innerHTML = `
      <span>مجموع سود :</span>
      <span class="${statusClass}">
      ${formatToToman(totalProfit)}
      </span>
  `;
};

const renderTradesList = (data) => {
  const container = document.getElementById("tradesList");
  if (data.length > 0) {
    container.innerHTML = renderTradesData(data);

    renderTotalProfit(data);
    attachAccordionEvents();
  } else {
    container.innerHTML = `
    <div class="no-data"> 
    <span>
    داده ای یافت نشد. 
    </span>
    </div>
    `;
  }
};

// نمایش معاملات ثبت‌شده
document.getElementById("showTradesBtn").addEventListener("click", async () => {
  openModal();
  const container = document.getElementById("tradesList");
  container.innerHTML = `
            <div class="skeleton skeleton-item"></div>
            <div class="skeleton skeleton-item"></div>
            <div class="skeleton skeleton-item"></div>
            <div class="skeleton skeleton-item"></div>
            <div class="skeleton skeleton-item"></div>
  `;
  container.style.display = "block";

  const res = await fetch(SHEETDB_API);
  allTrades = await res.json();

  renderTradesList(allTrades);
});

const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");
const clearFilter = document.getElementById("clearFilter");

function getCurrentJalaliYear() {
  const now = new Date();
  return jalaali.toJalaali(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  );
}

function populate(id) {
  const c = document.getElementById(id);
  const ys = c.querySelector(".year"),
    ms = c.querySelector(".month"),
    ds = c.querySelector(".day");

  const currentYear = getCurrentJalaliYear().jy;

  for (let y = currentYear - 20; y <= currentYear; y++) {
    const selected = y === currentYear ? "selected" : "";
    ys.innerHTML += `<option value="${y}" ${selected}>${toPersianDigits(
      y
    )}</option>`;
  }

  months.forEach(
    (m, i) => (ms.innerHTML += `<option value="${i + 1}">${m}</option>`)
  );

  ds.innerHTML = `<option value="">روز</option>`;

  ds.disabled = true;
  ms.addEventListener("change", () => {
    const m = +ms.value;
    const y = +ys.value;
    const selectedDay = +ds.value;

    let maxDay = 31;

    if (m > 6 && m < 12) {
      maxDay = 30;
    } else if (m === 12) {
      const isKabise = [1, 5, 9, 13, 17, 22, 26, 30].includes(y % 33);
      maxDay = isKabise ? 30 : 29;
    }

    // اگر روز انتخاب‌شده از حداکثر مجاز ماه بیشتر بود، اصلاحش کن
    if (selectedDay > maxDay) {
      ds.value = maxDay.toString();
      selectedDay = maxDay;
    }

    ds.innerHTML = `<option value="">روز</option>`;
    if (m > 0) {
      ds.disabled = false;
      for (let d = 1; d <= maxDay; d++) {
        ds.innerHTML += `<option value="${d}" ${
          d === selectedDay ? "selected" : ""
        }>${toPersianDigits(d)}</option>`;
      }
    } else {
      ds.disabled = true;
    }
  });
}

populate("fromDate");
populate("toDate");

function jalaliToGregorianDate(jy, jm, jd) {
  const g = jalaali.toGregorian(jy, jm, jd);
  return new Date(g.gy, g.gm - 1, g.gd);
}

function getInput(id) {
  const c = document.getElementById(id);
  const y = +c.querySelector(".year").value;
  const m = +c.querySelector(".month").value;
  const d = +c.querySelector(".day").value;
  return y && m && d ? jalaliToGregorianDate(y, m, d) : null;
}

function applyOrReset() {
  const from = getInput("fromDate"),
    to = getInput("toDate");

  if (!from || !to) {
    showToast("لطفاً تمام فیلدهای تاریخ را انتخاب کنید.", "error");
    filteredData = [...allTrades];
    clearFilter.style.display = "none";
    renderTradesList(filteredData);
    return;
  }

  if (from > to) {
    showToast("تاریخ شروع نمی‌تواند بزرگ‌تر از تاریخ پایان باشد.", "error");
    return;
  }

  filteredData = allTrades.filter((i) => {
    const d = new Date(i.datetime);
    const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate()); // حذف ساعت
    return dOnly >= from && dOnly <= to;
  });

  clearFilter.style.display = "inline-block";
  renderTradesList(filteredData);
}

document.getElementById("filterButton").addEventListener("click", applyOrReset);
clearFilter.addEventListener("click", () => {
  populate("fromDate");
  populate("toDate");
  filteredData = [...allTrades];
  clearFilter.style.display = "none";
  renderTradesList(filteredData);
});
