////////////
const stockSelect = document.getElementById("stockSelect");
const strategySelect = document.getElementById("strategySelect");
const formContainer = document.getElementById("formContainer");
const formFields = document.getElementById("formFields");
const calculateBtn = document.getElementById("calculateBtn");
const resultBox = document.getElementById("result");
const stockPriceInput = document.getElementById("stockPrice");
const strategyTips = document.getElementById("strategyTips");
const strategyLearnBtn = document.getElementById("strategyLearnBtn");
//////////////
let stocks = [
  { id: "17914401175772326", name: "اهرم", price: 0, contracts: [] },
  { id: "65883838195688438", name: "خودرو", price: 0, contracts: [] },
  { id: "44891482026867833", name: "خساپا", price: 0, contracts: [] },
  { id: "2400322364771558", name: "شستا", price: 0, contracts: [] },
  { id: "778253364357513", name: "وبملت", price: 0, contracts: [] },
  { id: "71483646978964608", name: "ذوب", price: 0, contracts: [] },
];

function getCurrentStock() {
  return stocks.find((s) => s.id === stockSelect.value);
}

function getCurrentStrategy() {
  return strategies.find((s) => s.name === strategySelect.value);
}

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
  stockPriceInput.value = stock.price || "---";

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

    // قیمت سهم اصلی از info API
    const infoURL = `https://tradersarena.ir/data/${stock.id}/info`;
    const resInfo = await fetch(infoURL);
    const dataInfo = await resInfo.json();
    if (dataInfo && dataInfo.cl) {
      stock.price = parseFloat(dataInfo.cl);
      stockPriceInput.value = stock.price;
    }

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
    /// update prices after 1 min
    intervalId = setInterval(() => updatePrices(), 60000);
  } else {
    clearInterval(intervalId);
    intervalId = null;
  }
});

function saveData() {
  localStorage.setItem("stocksData", JSON.stringify(stocks));
}

//////////////

// Load strategies
strategies.forEach((st) => {
  const opt = document.createElement("option");
  opt.value = st.name;
  opt.textContent = st.displayName;
  strategySelect.appendChild(opt);
});

// Set default strategy
strategySelect.value = strategies[0].name; // Set default strategy here

function renderTips(tips, learnHref) {
  strategyTips.innerHTML = tips
    .map(
      (tip) => `
        <div class="tip show">
        <i class="bi bi-check-circle-fill"></i>
        <span> ${tip} </span>
        </div>
    `
    )
    .join("");
  strategyLearnBtn.action = learnHref;
}

strategySelect.addEventListener("change", renderForm);

function renderForm() {
  const stock = getCurrentStock();
  const strategy = getCurrentStrategy();
  renderTips(strategy.tips, strategy.learnHref);

  formFields.innerHTML = "";

  if (stock.contracts.length === 0) {
    formFields.innerHTML = `<p class="form-error">هیچ قراردادی برای این سهم یافت نشد.</p>`;
    formContainer.style.display = "block";
    resultBox.innerHTML = "";
    return;
  }

  strategy.inputs.forEach((input) => {
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
          <div class="strategy-form-row ">
        <div>
          <label>${input.position === "long" ? "خرید" : "فروش"}
          قرارداد ${
            input.type === "call" ? "اختیار خرید" : "اختیار فروش"
          }:</label>
          <select class="contractSelect" data-key="${
            input.key
          }">${options}</select>
        </div>
        <div>
          <label>پرمیوم ${
            input.position === "long" ? "پرداختی" : "دریافتی"
          } : </label>
          <input class="premiumInput" data-number-input="true" data-float="false" type="text" data-key="${
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
      document.querySelector(`.premiumInput[data-key="${key}"]`).value =
        selected.premium;
    };
  });
}

function validatePremiums(inputs) {
  for (const contract in inputs) {
    const { premium } = inputs[contract];
    if (!isValidNumber(premium)) {
      return { isValid: false, msg: "پرمیوم قراردادها را به درستی وارد کنید." };
    }
  }
  return { isValid: true, msg: null };
}

function toggleTip(tipId, iconId) {
  const tip = document.getElementById(tipId);
  const icon = document.getElementById(iconId);
  tip.classList.toggle("show");
  icon.classList.toggle("active");
}

function renderCalcResult(results) {
  const resultElemnts = results
    .map(
      (res, index) => `
    <div class="result-line">
      <span class="result-label" > ${res.lbl}: </span>
      <div class="result-right">
        <span class="number">${toPersianDigits(res.value)} ${
        res.noPercent ? "" : "٪"
      } </span>
        <span class="info-icon" id="icon-${index}" onclick="toggleTip('tip-${index}', 'icon-${index}')"><i class="bi bi-info-circle"></i></span>
      </div>
    </div>
    <div class="tip" id="tip-${index}">${res.tip}</div>
  `
    )
    .join("");
  resultBox.innerHTML = `
  <div class="strategy-card">
     ${resultElemnts}
  </div>
        `;
  resultBox.scrollIntoView({ behavior: "smooth" });
}

calculateBtn.addEventListener("click", () => {
  const stock = getCurrentStock();
  const strategy = getCurrentStrategy();
  if (!stock || !strategy) return;

  const stockPrice = +stockPriceInput.value;

  const inputs = {};
  document.querySelectorAll(".premiumInput").forEach((input) => {
    inputs[input.dataset.key] = { premium: +input.value };
  });

  document.querySelectorAll(".contractSelect").forEach((select) => {
    const contarct = stock.contracts.find((c) => c.id === select.value);
    inputs[select.dataset.key].strike = contarct.strike;
    inputs[select.dataset.key].expiry = contarct.expiry;
    inputs[select.dataset.key].iv = contarct.iv;
  });

  const { isValid, msg } = validatePremiums(inputs);

  if (isValid) {
    const { isValid, message } = strategy.validateStrategyInputs(
      stockPrice,
      inputs
    );
    if (isValid) {
      const strategyResults = strategy.calculateResults(stockPrice, inputs);
      renderCalcResult(strategyResults);
    } else {
      showToast(message, "error");
    }
  } else {
    showToast(msg, "error");
  }
});
