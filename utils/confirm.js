(function () {
  const css = `
    :root {
      --primary: #4a90e2;
      --primary-dark: #357abd;
      --danger: #e74c3c;
      --light: #f9f9f9;
      --border: #ddd;
    }

    .confirm-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.4);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 900;
      animation: fadeIn 0.3s ease-out;
    }

    .confirm-box {
      background: var(--light);
      padding: 24px;
      border-radius: var(--radius);
      width: 320px;
      max-width: 90%;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      text-align: center;
      transform: scale(0.8);
      opacity: 0;
      animation: popupIn 0.2s ease-out forwards;
      font-family: sans-serif;
    }

    .confirm-box h3 {
      margin: 0 0 12px;
      color: var(--primary-dark);
    }

    .confirm-input {
      font-size: 14px;
    }

    .confirm-buttons {
      display: flex;
      gap: 8px;
      margin: 0;
    }

    .confirm-btn {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: var(--radius) ;
      font-size: 14px;
      cursor: pointer;
    }

    .confirm-btn-confirm {
      background: var(--primary);
      color: white;
    }

    .confirm-btn-cancel {
      background: var(--border);
      color: #333;
    }

    .confirm-btn-cancel {
      color: #fff;
    }

    .confirm-close {
      position: absolute;
      top: 10px;
      left: 15px;
      font-size: 18px;
      cursor: pointer;
      color: #888;
    }

    @keyframes fadeIn {
      from { background: rgba(0, 0, 0, 0); }
      to { background: rgba(0, 0, 0, 0.4); }
    }

    @keyframes popupIn {
      from {
        transform: scale(0.8);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
  `;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // Create DOM elements
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  overlay.innerHTML = `
    <div class="confirm-box">
      <h3>نام نماد مورد معامله را وارد کنید</h3>
      <input class="confirm-input" type="text" placeholder="مثلاً: خساپا" />
      <div class="confirm-buttons">
        <button class="confirm-btn confirm-btn-cancel">لغو</button>
        <button class="confirm-btn confirm-btn-confirm">تأیید</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector(".confirm-input");
  const cancel = overlay.querySelector(".confirm-btn-cancel");
  const confirm = overlay.querySelector(".confirm-btn-confirm");

  let onConfirm = null;

  function showConfirm(callback) {
    onConfirm = callback;
    input.value = "";
    overlay.style.display = "flex";
    input.focus();
  }

  function hideConfirm() {
    overlay.style.display = "none";
  }

  cancel.onclick = hideConfirm;

  confirm.onclick = function () {
    if (typeof onConfirm === "function") onConfirm(input.value);
  };

  // Optional: click outside to close
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideConfirm();
  });

  // Expose globally
  window.showConfirm = showConfirm;
})();
