// درج استایل به صورت داینامیک در head
(function () {
  const style = document.createElement("style");
  style.textContent = `
          :root {
            --primary: #4a90e2;
            --primary-dark: #357abd;
            --danger: #e74c3c;
            --light: #f9f9f9;
            --border: #ddd;
          }
          /* Container توست در وسط بالا */
          .toast-alert-container {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            z-index: 999;
            pointer-events: none;
            max-width: 300px;
          }
          /* سبک باکس پیام */
          .toast-alert {
            background-color: var(--light);
            padding: 14px 20px;
            border-radius: var(--radius);
            font-size: 16px;
            width:100%;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
            color: var(--light);
            background-color: var(--primary);
            text-align: center;
            animation: slideDown 0.4s ease, fadeOut 0.5s ease forwards;
            animation-delay: 0s, 4s;
            pointer-events: auto;
          }
          
        .toast-alert.success {
            background: linear-gradient(to right, #00c6ff, #0072ff);
        }

        .toast-alert.error {
            background: linear-gradient(to right, #f85032, #e73827);
        }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeOut {
            to {
              opacity: 0;
              transform: translateY(-10px);
            }
          }
          @media (max-width: 600px) {
            .toast-alert-container {
              max-width: initial;
              width: 90%;
            }
          }
          `;
  document.head.appendChild(style);
})();

// تابعی که container توست رو داینامیک ایجاد می‌کنه (اگر وجود نداشته باشه)
function getToastContainer() {
  let container = document.querySelector(".toast-alert-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-alert-container";
    document.body.appendChild(container);
  }
  return container;
}

// تابع نمایش توست
// پارامتر type: 'success' یا 'error'
function showToast(message, type = "success") {
  const container = getToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast-alert ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // حذف توست بعد از 5 ثانیه
  setTimeout(() => {
    toast.remove();
    // در صورت خالی بودن container می‌شه حذف بشه (اختیاری)
    if (!container.hasChildNodes()) container.remove();
  }, 5000);
}
