const SHEETDB_API = "https://sheetdb.io/api/v1/4xkud7vrc6wtz";

let allTrades = [];
let filteredData = [];
let settings = {};

//////////
const profitPercentEl = document.getElementById("profitPercent");
const lossPercentEl = document.getElementById("lossPercent");
const contractSizeEl = document.getElementById("contractSize");
const feeEl = document.getElementById("fee");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");

const DEFAULT_SETTINGS = {
  profitPercent: 2,
  lossPercent: 1,
  contractSize: 1000,
  fee: 0.00206,
};

function loadSettings() {
  settings =
    JSON.parse(localStorage.getItem("trade_settings")) || DEFAULT_SETTINGS;
  profitPercentEl.value = settings.profitPercent;
  lossPercentEl.value = settings.lossPercent;
  contractSizeEl.value = settings.contractSize;
  feeEl.value = settings.fee;
}
loadSettings();

function saveSettings({ profitPercent, lossPercent, contractSize, fee }) {
  localStorage.setItem(
    "trade_settings",
    JSON.stringify({ profitPercent, lossPercent, contractSize, fee })
  );
}

function validateSettings({ profitPercent, lossPercent, contractSize, fee }) {
  let msg = null;
  if (!isValidNumber(profitPercent)) msg = "حد سود معتبر نیست.";
  else if (!isValidNumber(lossPercent)) msg = "حدضرر معتبر نیست.";
  else if (!isValidNumber(contractSize)) msg = "اندازه قرارداد معتبر نیست.";
  else if (!isValidNumber(fee)) msg = "مقدار کارمزد معتبر نیست.";
  return { isValid: !!!msg, msg };
}

saveSettingsBtn.addEventListener("click", () => {
  const newSettings = {
    profitPercent: +profitPercentEl.value,
    lossPercent: +lossPercentEl.value,
    contractSize: +contractSizeEl.value,
    fee: +feeEl.value,
  };

  const { isValid, msg } = validateSettings(newSettings);

  if (isValid) {
    saveSettings(newSettings);
    showToast("تنظیمات ذخیره شد.", "success");
    loadSettings();
    document.getElementById("profitResult").style.display = "none";
  } else {
    showToast(msg, "error");
  }
});

/////////

const createResultRow = ({ lbl, val }) => {
  return `    
  <div class="result-row">
            <div class="result-label"> ${lbl}:</div>
            <div class="result-value">${val} </div>
  </div>`;
};

//افزودن پله جدید
function addStep() {
  const div = document.createElement("div");
  div.className = "step";
  div.innerHTML = `
    <button class="remove-step" onclick="removeStep(this)"><i class="bi bi-x"></i></button>
    <div><label>قیمت خرید(ریال):</label><input class="buyPrice" type="text" placeholder="قیمت خرید" data-number-input="true" data-float="false"></div>
    <div><label>تعداد قرارداد:</label><input class="buyQty" type="text"  placeholder="تعداد قراردادها" data-number-input="true" data-float="false"></div>
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

function calculateTradeResults({ steps, sellPriceVal }) {
  let totalCost = 0;
  let totalQty = 0;

  const { fee, contractSize, profitPercent, lossPercent } = settings;

  steps.forEach((item) => {
    totalCost += item.price * (1 + fee) * item.qty; // هزینه خرید با کارمزد
    totalQty += item.qty;
  });

  if (totalQty === 0)
    return { breakEven: 0, profit: 0, totalCost: 0, percent: 0 };

  // میانگین خرید با کارمزد
  const avgBuyWithFee = totalCost / totalQty;

  // قیمت سر به سر (باید به این قیمت بفروشیم تا سود صفر بشه)
  const breakEven = avgBuyWithFee / (1 - fee);

  // محاسبه حد سود و ضرر
  const sellTarget = breakEven * (1 + profitPercent / 100);
  const stopLoss = breakEven * (1 - lossPercent / 100);

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
    sellTarget,
    stopLoss,
  };
}

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
  const sellPriceVal = +document.getElementById("sellPrice").value;
  const stepEls = document.querySelectorAll(".step");
  const steps = [];

  stepEls.forEach((el) => {
    const price = +el.querySelector(".buyPrice").value;
    const qty = +el.querySelector(".buyQty").value;
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

const saveBtn = document.getElementById("saveTradeBtn");
saveBtn.addEventListener("click", (e) => {
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
          instrument: toPersianDigits(instrument),
        };

        saveBtn.disabled = true;
        const prevHtml = saveBtn.innerHTML;
        saveBtn.innerHTML = `<span class="loader"></span>`;
        const { isSucsess } = await saveTradeToSheet(trade);
        if (isSucsess) emptyForm();
        saveBtn.disabled = false;
        saveBtn.innerHTML = prevHtml;
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
    const { profit, percent, totalCost, breakEven, sellTarget, stopLoss } =
      calculateTradeResults({
        sellPriceVal,
        steps,
      });
    rBox.innerHTML = `
    ${createResultRow({
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
        ${createResultRow({
          lbl: ` حد سود (٪${toPersianDigits(settings.profitPercent)})`,
          val: `${formatWithSeparatorsFa(+sellTarget)} ریال`,
        })}
        ${createResultRow({
          lbl: ` حد ضرر (٪${toPersianDigits(settings.lossPercent)})`,
          val: `${formatWithSeparatorsFa(+stopLoss)} ریال`,
        })}
  `;
    rBox.style.display = "block";
    rBox.scrollIntoView({ behavior: "smooth" });
  } else {
    showToast(msg, "error");
  }
});

function attachAccordionEvents() {
  document.querySelectorAll(".accordion-header").forEach((header) => {
    header.addEventListener("click", () => {
      const body = header.nextElementSibling;
      const isOpen = body.classList.toggle("open");
      body.style.maxHeight = isOpen ? body.scrollHeight + "px" : null;
    });
  });
}

const getStatusClass = (val) => {
  return +val > 0 ? "val-pos" : +val != 0 ? "val-neg" : "";
};

const renderTradesData = (data) => {
  return data
    .reverse()
    .map((row) => {
      const stepsArr = JSON.parse(row.steps || "[]")
        .map(
          (s) =>
            `<div class="trade-item-step">
      <span class="trade-item-label">قیمت: ${formatWithSeparatorsFa(
        s.price
      )}</span>
      <span class="trade-item-value">تعداد: ${formatWithSeparatorsFa(
        s.qty
      )}</span>
            </div>
            `
        )
        .join("");

      const statusCalss = getStatusClass(row.profit);

      return `
      <li class="accordion">
      <div class="accordion-header">
      <span> ${formatToJalali(row.datetime)} </span> 
      <span> ${row.instrument} </span> 
      <div>
      <span class="trade-item-profit ${statusCalss}">  ${formatToToman(
        row.profit
      )}</span>
      <span class="trade-item-show-btn" > <i class="bi bi-three-dots-vertical"></i> </span>
      </div>
      </div>
      
      <div class="accordion-body">

      <div class="trade-item-row">
        <div class="trade-item-label">نماد:</div>
        <div class="trade-item-value">${row.instrument}</div>
      </div>
      
      <div class="trade-item-row">
        <div class="trade-item-label">تاریخ:</div>
        <div class="trade-item-value">${formatToJalali(row.datetime)}</div>
      </div>
        
      <div class="trade-item-row">
        <div class="trade-item-label">سود خالص:</div>
        <div class="trade-item-value">
        <span class="trade-item-profit ${statusCalss}">${formatToToman(
        row.profit
      )} </span>
        <span class="trade-item-percent ${statusCalss}">( ${formatWithSeparatorsFa(
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

  return `
  <span>مجموع سود :</span>
  <span class="${getStatusClass(totalProfit)}">
  ${formatToToman(totalProfit)}
  </span>
  `;
};

const renderTradesList = (data) => {
  const container = document.getElementById("tradesList");
  const totalProfitEl = document.getElementById("totalProfit");
  totalProfitEl.innerHTML = renderTotalProfit(data);

  if (data.length > 0) {
    container.innerHTML = renderTradesData(data);
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
  // allTrades = [...RAW_DATA];

  renderTradesList(allTrades);
});

const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");
const clearFilter = document.getElementById("clearFilter");

function getCurrentJalaliDate() {
  const now = new Date();
  const jDate = jalaali.toJalaali(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  );
  return {
    currentYear: jDate.jy,
    currentMonth: jDate.jm,
    currentDay: jDate.jd,
  };
}

function getMonthMaxDay(month, year) {
  let maxDay = 31;
  if (month > 6 && month < 12) {
    maxDay = 30;
  } else if (month === 12) {
    const isKabise = [1, 5, 9, 13, 17, 22, 26, 30].includes(year % 33);
    maxDay = isKabise ? 30 : 29;
  }
  return maxDay;
}

function populate(id) {
  const c = document.getElementById(id);
  const ys = c.querySelector(".year"),
    ms = c.querySelector(".month"),
    ds = c.querySelector(".day");
  const { currentDay, currentMonth, currentYear } = getCurrentJalaliDate();

  for (let y = currentYear - 20; y <= currentYear; y++) {
    const selected = y === currentYear ? "selected" : "";
    ys.innerHTML += `<option value="${y}" ${selected}>${toPersianDigits(
      y
    )}</option>`;
  }

  SHAMSI_MONTHS.forEach((m, i) => {
    const selected = i + 1 === currentMonth ? "selected" : "";
    ms.innerHTML += `<option value="${i + 1}"  ${selected}>${m}</option>`;
  });

  for (let d = 1; d <= getMonthMaxDay(+ms.value, +ys.value); d++) {
    const selected = d === currentDay ? "selected" : "";
    ds.innerHTML += `<option value="${d}" ${selected}>${toPersianDigits(
      d
    )}</option>`;
  }

  ms.addEventListener("change", () => {
    const m = +ms.value;
    const y = +ys.value;
    let selectedDay = +ds.value;

    const maxDay = getMonthMaxDay(m, y);
    // اگر روز انتخاب‌شده از حداکثر مجاز ماه بیشتر بود، اصلاحش کن
    if (selectedDay > maxDay) {
      ds.value = maxDay.toString();
      selectedDay = maxDay;
    }

    ds.disabled = true;
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

let isDateFilterActive = false;

function applyFilters() {
  const from = getInput("fromDate");
  const to = getInput("toDate");
  const query = document.getElementById("searchInput").value.trim();

  if (isDateFilterActive) {
    if (!from || !to) {
      showToast("لطفاً تمام فیلدهای تاریخ را انتخاب کنید.", "error");
      return;
    }

    if (from > to) {
      showToast("تاریخ شروع نمی‌تواند بزرگ‌تر از تاریخ پایان باشد.", "error");
      return;
    }
    clearFilter.style.display = "inline-block";
  }

  filteredData = allTrades.filter((item) => {
    const d = new Date(item.datetime);
    const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const dateMatch = (!from || dOnly >= from) && (!to || dOnly <= to);
    const nameMatch =
      !query || item.instrument.includes(toPersianDigits(query));

    if (isDateFilterActive) return dateMatch && nameMatch;
    else return nameMatch;
  });

  renderTradesList(filteredData);
}

document.getElementById("filterButton").addEventListener("click", () => {
  isDateFilterActive = true;
  applyFilters();
});

document.getElementById("searchInput").addEventListener("input", applyFilters);

clearFilter.addEventListener("click", () => {
  clearFilter.style.display = "none";
  populate("fromDate");
  populate("toDate");
  isDateFilterActive = false;
  applyFilters();
});
