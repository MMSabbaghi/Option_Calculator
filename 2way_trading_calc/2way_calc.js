////////////
const stockSelect = document.getElementById("stockSelect");
const formContainer = document.getElementById("formContainer");
const formFields = document.getElementById("formFields");
const calculateBtn = document.getElementById("calculateBtn");
const resultBox = document.getElementById("result");
//////////////
let stocks = [
  { id: "17914401175772326", name: "اهرم", price: 0, contracts: [] },
  { id: "65883838195688438", name: "خودرو", price: 0, contracts: [] },
  { id: "44891482026867833", name: "خساپا", price: 0, contracts: [] },
  { id: "2400322364771558", name: "شستا", price: 0, contracts: [] },
  { id: "778253364357513", name: "وبملت", price: 0, contracts: [] },
  { id: "71483646978964608", name: "ذوب", price: 0, contracts: [] },
];

const INPUTS = [
  { type: "call", key: "callOption" },
  { type: "put", key: "putOption" },
];

function getCurrentStock() {
  return stocks.find((s) => s.id === stockSelect.value);
}

function getCurrentStrategy() {}

function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}
///////////////////////

window.onload = () => {
  const savedData = localStorage.getItem("stocksData");
  if (savedData) stocks = JSON.parse(savedData);
  populateSelect();
  loadStock();
};

function populateSelect() {
  stockSelect.innerHTML = "";
  stocks.forEach((stock) => {
    const option = document.createElement("option");
    option.value = stock.id;
    option.textContent = stock.name;
    stockSelect.appendChild(option);
  });
}

function loadStock() {
  const stock = getCurrentStock();

  if (stock.contracts.length > 0) {
    updatePrices();
    renderForm();
  } else {
    fetchStockData(stock);
  }
}

function extractExpiryDate(text) {
  const match = text.match(/\d{4}\/\d{1,2}\/\d{1,2}/);
  if (!match) return null;
  return match[0]
    .split("/")
    .map((s) => s.toString().padStart(2, "0"))
    .join("");
}

async function fetchStockData(stock) {
  showLoader();
  try {
    const pageURL = `https://tradersarena.ir/options/${
      stock.id
    }/${encodeURIComponent(stock.name)}`;

    const res = await fetch(pageURL);
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    const tables = doc.querySelectorAll("div.btn-group-2 table");
    const expiryDates = [
      ...doc.querySelectorAll("div.btn-group-2 .spn:first-child"),
    ]
      .map((e) => +extractExpiryDate(e.innerHTML))
      .filter((d) => d !== null);

    if (tables.length < 2) {
      showToast("قرارداد کافی برای این سهم یافت نشد!", "error");
      hideLoader();
      return;
    }

    stock.contracts = [];

    [tables[0], tables[1], tables[2], tables[3]].forEach((table, index) => {
      const rows = table.querySelectorAll("tbody tr");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 3) {
          const link = cells[0].querySelector("a.symbol");
          if (!link) return;

          const hrefParts = link.getAttribute("href").split("/");
          const id = hrefParts[hrefParts.length - 1].trim();
          const name = link.textContent.trim();
          const strike = parseFloat(
            cells[2].innerText.trim().replace(/,/g, "")
          );
          const type = name.startsWith("ض")
            ? "call"
            : name.startsWith("ط")
            ? "put"
            : "unknown";

          stock.contracts.push({
            id,
            name,
            strike,
            premium: "---",
            type,
            expiry: expiryDates[index],
          });
        }
      });
    });

    saveData();
    renderForm();
    await updatePrices();
  } catch (e) {
    console.error(e);
    showToast(
      "خطا در دریافت اطلاعات. اتصال اینترنت  خود را بررسی کنید.",
      "error"
    );
  } finally {
    hideLoader();
  }
}

async function updatePrices() {
  const stock = getCurrentStock();
  if (stock.contracts.length === 0) return;

  showLoader();
  try {
    // قیمت قراردادها
    const apiURL = `https://tradersarena.ir/data/options/candles/${stock.id}`;
    const res = await fetch(apiURL);
    const data = await res.json();

    stock.contracts.forEach((contract) => {
      const found = data.find((entry) => entry.id === contract.id);
      contract.premium = found ? found.close : 0;
      contract.iv = found ? found.iv : 0;
    });

    saveData();
    renderForm();
  } catch (e) {
    console.error(e);
  } finally {
    hideLoader();
  }
}

const autoRefreshToggle = document.getElementById("autoRefreshToggle");
let intervalId = null;

autoRefreshToggle.addEventListener("change", () => {
  if (autoRefreshToggle.checked) {
    /// update prices after 5 second
    intervalId = setInterval(() => updatePrices(), 5000);
  } else {
    clearInterval(intervalId);
    intervalId = null;
  }
});

function saveData() {
  localStorage.setItem("stocksData", JSON.stringify(stocks));
}

//////////////
stockSelect.addEventListener("change", renderForm);

function renderForm() {
  const stock = getCurrentStock();
  formFields.innerHTML = "";

  if (stock.contracts.length === 0) {
    formFields.innerHTML = `<p class="form-error">هیچ قراردادی برای این سهم یافت نشد.</p>`;
    formContainer.style.display = "block";
    resultBox.innerHTML = "";
    return;
  }

  INPUTS.forEach((input) => {
    const contracts = stock.contracts.filter((c) => c.type === input.type);

    if (contracts.length === 0) {
      formFields.innerHTML += `<p class="form-error">هیچ قرارداد  ${
        input.type === "call" ? "اختیار خریدی" : "اختیار فروشی"
      } برای این سهم یافت نشد.</p>`;
      return;
    }

    const options = contracts.map(
      (c) =>
        `<option value="${c.id}">${toPersianDigits(
          c.name
        )} (اعمال: ${toPersianDigits(c.strike)})</option>`
    );

    formFields.innerHTML += `
      <div class="_2way-form-row ">
        <div>
          <label>قرارداد ${
            input.type === "call" ? "اختیار خرید" : "اختیار فروش"
          }:</label>
          <select class="contractSelect" data-key="${
            input.key
          }">${options}</select>
        </div>
        <div>
          <label>تعداد قرارداد: </label>
          <input class="contractQty" data-key="${
            input.key
          }"  data-number-input="true" data-float="false" type="text" value="0">
        </div>
        <div>
          <label>نقطه ورود: </label>
          <input class="contractBuyPrice" data-key="${
            input.key
          }"  data-number-input="true" data-float="false" type="text" value="0">
        </div>
        <div>
          <label>نقطه خروج: </label>
          <input class="contractSellPrice" data-number-input="true" data-float="false" type="text" data-key="${
            input.key
          }" value="${contracts[0].premium}">
        </div>
      </div>
    `;

    document.querySelector(".output")?.classList.remove("output");
  });

  formContainer.style.display = "block";
  resultBox.innerHTML = "";

  document.querySelectorAll(".contractSelect").forEach((select) => {
    select.onchange = function () {
      const key = this.dataset.key;
      const contracts = stock.contracts.filter(
        (c) => c.type === (key.includes("call") ? "call" : "put")
      );
      const selected = contracts.find((c) => c.id === this.value);
      document.querySelector(`.contractSellPrice[data-key="${key}"]`).value =
        selected.premium;
    };
  });
}

function calculateContractResults({ buyPrice, qty, sellPrice }) {
  const { fee, contractSize } = getStorageSettings();

  // قیمت خرید واقعی (با احتساب کسر کارمزد )
  const netBuyPrice = buyPrice * (1 + fee);

  // قیمت فروش واقعی (با احتساب کسر کارمزد )
  const netSellPrice = sellPrice * (1 - fee);

  // سود هر واحد
  const unitProfit = netSellPrice - netBuyPrice;

  // محاسبه سود
  const profit = unitProfit * qty * contractSize;

  // کل هزینه نهایی
  const totalCost = netBuyPrice * qty * contractSize;

  return { profit, totalCost };
}

function calcTradeResault(inputs) {
  const putRes = calculateContractResults(inputs.putOption);
  const callRes = calculateContractResults(inputs.callOption);

  const totalTradeCost = putRes.totalCost + callRes.totalCost;
  const profit = putRes.profit + callRes.profit;
  const percent = (profit / totalTradeCost) * 100;

  return { profit, percent, totalTradeCost };
}

const createResultRow = ({ lbl, val }) => {
  return `    
  <div class="result-row">
            <div class="result-label"> ${lbl}:</div>
            <div class="result-value">${val} </div>
  </div>`;
};

function renderCalcResult(inputs) {
  const { profit, percent, totalTradeCost } = calcTradeResault(inputs);

  resultBox.innerHTML = `
    ${createResultRow({
      lbl: "مبلغ کل",
      val: formatToToman(totalTradeCost),
    })}
  ${createResultRow({
    lbl: "سود خالص",
    val: formatToToman(profit),
  })}
  ${createResultRow({
    lbl: "درصد سود",
    val: `${formatWithSeparatorsFa(+percent.toFixed(2))}٪`,
  })}
  `;
  resultBox.style.display = "block";
  resultBox.scrollIntoView({ behavior: "smooth" });
}

const validateContarctData = ({ buyPrice, sellPrice, qty, key }) => {
  const type = key === "callOption" ? "اختیار خرید" : "اختیار فروش";
  if (!isValidNumber(qty)) {
    return {
      isValid: false,
      msg: `تعداد قرارداد ${type} را به درستی وارد کنید.`,
    };
  } else if (!isValidNumber(buyPrice)) {
    return {
      isValid: false,
      msg: `نقطه ورود قرارداد ${type} را به درستی وارد کنید.`,
    };
  } else if (!isValidNumber(sellPrice)) {
    return {
      isValid: false,
      msg: `نقطه خروج قرارداد ${type} را به درستی وارد کنید.`,
    };
  }
  return { isValid: true, msg: "داده معتبر است" };
};

function getformData() {
  const data = {};
  INPUTS.forEach((input) => {
    const key = input.key;
    const sellPrice = +document.querySelector(
      `.contractSellPrice[data-key="${key}"]`
    ).value;
    const buyPrice = +document.querySelector(
      `.contractBuyPrice[data-key="${key}"]`
    ).value;
    const qty = +document.querySelector(`.contractQty[data-key="${key}"]`)
      .value;
    data[key] = { sellPrice, buyPrice, qty, key };
  });

  return data;
}

calculateBtn.addEventListener("click", () => {
  const formData = getformData();
  for (const contarct in formData) {
    const { isValid, msg } = validateContarctData(formData[contarct]);
    if (!isValid) {
      showToast(msg, "error");
      resultBox.style.display = "none";
      return;
    }
  }
  renderCalcResult(formData);
});
