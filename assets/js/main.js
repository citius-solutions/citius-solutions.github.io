(function () {
  document.querySelectorAll(".social__link--soon").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
    });
  });

  const menuBtn = document.querySelector(".menu-btn");
  const drawer = document.getElementById("nav-drawer");
  if (menuBtn && drawer) {
    menuBtn.addEventListener("click", () => {
      const open = drawer.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) drawer.removeAttribute("hidden");
      else drawer.setAttribute("hidden", "");
    });
    drawer.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        drawer.classList.remove("is-open");
        menuBtn.setAttribute("aria-expanded", "false");
        drawer.setAttribute("hidden", "");
      });
    });
  }

  const form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = (form.name.value || "").trim();
      const reach = (form.reach.value || "").trim();
      const message = (form.message.value || "").trim();
      const lines = [
        "Здравствуйте! Пишу с сайта Ситиус Недвижимость.",
        name ? "Имя: " + name : "",
        reach ? "Связь: " + reach : "",
        message ? "Задача: " + message : "",
      ].filter(Boolean);
      const text = encodeURIComponent(lines.join("\n"));
      window.open("https://t.me/citiusrealty?text=" + text, "_blank", "noopener,noreferrer");
    });
  }

  // Company film in a lightbox: loads only on click; desktop = horizontal, phones (<=768px) = vertical
  const modal = document.getElementById("film-modal");
  const film = modal && modal.querySelector(".film-modal__video");
  const watch = document.getElementById("watch-film");
  const mq = window.matchMedia("(max-width: 768px)");
  let lastFocus = null;
  const openFilm = () => {
    if (!modal || !film) return;
    const mobile = mq.matches;
    const src = film.dataset[mobile ? "srcMobile" : "srcDesktop"];
    film.poster = film.dataset[mobile ? "posterMobile" : "posterDesktop"] || "";
    if (film.getAttribute("src") !== src) film.setAttribute("src", src);
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("film-open");
    requestAnimationFrame(() => modal.classList.add("is-open"));
    film.muted = false;
    film.play().catch(() => {});
    modal.querySelector(".film-modal__close").focus({ preventScroll: true });
  };
  const closeFilm = () => {
    if (!modal || modal.hidden) return;
    film.pause();
    try { film.currentTime = 0; } catch (e) {}
    modal.classList.remove("is-open");
    document.body.classList.remove("film-open");
    setTimeout(() => { modal.hidden = true; }, 300);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };
  if (watch && modal) {
    watch.addEventListener("click", (e) => { e.preventDefault(); openFilm(); });
    modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeFilm));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeFilm(); });
    if (location.hash === "#film") openFilm(); // deep link (may start muted/paused per browser policy)
  }
})();
