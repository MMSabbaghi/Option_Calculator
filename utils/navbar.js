window.addEventListener("load", () => {
  const navbar = document.getElementById("navbar");
  const backdrop = document.getElementById("backdrop");
  const hamburger = document.querySelector(".hamburger");

  hamburger.addEventListener("click", () => {
    navbar.classList.add("open");
    backdrop.classList.add("show");
  });

  backdrop.addEventListener("click", () => {
    navbar.classList.remove("open");
    backdrop.classList.remove("show");
  });
});
