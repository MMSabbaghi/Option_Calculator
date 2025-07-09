const SHEETDB_API = "https://sheetdb.io/api/v1/4xkud7vrc6wtz";

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
document.querySelectorAll("input[type='text']").forEach((input) => {
  input.addEventListener("input", () => toPersianInput(input));
});

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
    کارمزد: ${formatWithSeparatorsFa(spread)} ریال<br>
    قیمت تارگت: ${formatWithSeparatorsFa(sellTarget)} ریال<br>
    حد ضرر: ${formatWithSeparatorsFa(stopLoss)} ریال
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
    <div><label>قیمت خرید:</label><input class="buyPrice" type="text" placeholder="قیمت خرید" oninput="toPersianInput(this)"></div>
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

const calculateTradeResults = ({ steps, sellPriceVal }) => {
  if (!sellPriceVal || steps.length === 0) return;
  let totalCost = 0,
    totalQty = 0;

  steps.forEach(({ price, qty }) => {
    totalCost += price * qty;
    totalQty += qty;
  });

  const contractSize = 1000;
  const avgBuy = totalCost / totalQty;
  const spread = calculateSpread(avgBuy);
  const profit = (sellPriceVal - avgBuy - spread) * totalQty;
  const percent = ((sellPriceVal - avgBuy - spread) / avgBuy) * 100;

  return {
    spread: spread * contractSize * totalQty,
    profit: profit * contractSize,
    percent,
  };
};

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

document.getElementById("saveTradeBtn").addEventListener("click", async (e) => {
  const { sellPriceVal, steps } = getTradeFormData();
  const { isValid, msg } = isValidTrade({ sellPriceVal, steps });

  if (isValid) {
    const { profit, percent } = calculateTradeResults(getTradeFormData());

    const trade = {
      id: Date.now().toString(),
      datetime: new Date(),
      profit,
      percent,
      steps: JSON.stringify(steps),
    };

    e.target.disabled = true;
    e.target.innerHTML = `<span class="loader"></span>`;
    const { isSucsess } = await saveTradeToSheet(trade);
    if (isSucsess) emptyForm();
    e.target.disabled = false;
    e.target.innerHTML = "ذخیره معامله";
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
    const { spread, profit, percent } = calculateTradeResults(
      getTradeFormData()
    );
    rBox.innerHTML = `
   سود خالص : ${formatWithSeparatorsFa(+profit / 10)} تومان <br>
   درصد سود خالص : ${formatWithSeparatorsFa(+percent.toFixed(2))} % <br>
    کارمزد کل: ${formatWithSeparatorsFa(+spread / 10)} تومان
    `;
    rBox.style.display = "block";
  } else {
    showToast(msg, "error");
  }
});

function openModal() {
  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

const renderTradesData = (data) => {
  return data
    .reverse()
    .map((row) => {
      const stepsArr = JSON.parse(row.steps || "[]")
        .map(
          (s) =>
            `قیمت: ${formatWithSeparatorsFa(
              s.price
            )} | تعداد: ${formatWithSeparatorsFa(s.qty)}`
        )
        .join("<br>");

      return `
      <div class="trade-item" >
        <strong>زمان:</strong> ${new Date(row.datetime).toLocaleDateString(
          "fa-IR"
        )}<br>
        <strong> درصد سود خالص :</strong> ${formatWithSeparatorsFa(
          Number(row.percent).toFixed(2)
        )} % <br>
        <strong> سود خالص </strong> ${formatWithSeparatorsFa(
          +row.profit / 10
        )} تومان<br>
        <strong>پله‌ها:</strong><br>${stepsArr}
        <br>
      </div>
      `;
    })
    .join("");
};

const calculateTotalProfit = (data) => {
  let totalProfit = 0;
  data.forEach((trade) => (totalProfit += +trade.profit));
  return totalProfit;
};

// نمایش معاملات ثبت‌شده
document.getElementById("showTradesBtn").addEventListener("click", async () => {
  openModal();
  const container = document.getElementById("tradesList");
  container.innerHTML = "در حال بارگذاری...";
  container.style.display = "block";

  const res = await fetch(SHEETDB_API);
  const data = await res.json();
  const trades = Array.from(data);

  if ((data.length = 0)) {
    container.innerHTML = "داده ای یافت نشد.";
    return;
  }

  const totalProfit = calculateTotalProfit(trades) / 10;

  container.innerHTML = `
  <li class="totalProfit"> مجموع سود : ${formatWithSeparatorsFa(
    totalProfit
  )} تومان </li>
  ${renderTradesData(trades)}  
  `;
});
