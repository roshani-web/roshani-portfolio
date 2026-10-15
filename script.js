
document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  // MOBILE NAVIGATION
  const menuToggle = $("#menuToggle");
  const navMenu = $("#navMenu");

  function closeMenu() {
    navMenu.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
    menuToggle.textContent = "☰";
  }

  menuToggle.addEventListener("click", () => {
    const open = navMenu.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute(
      "aria-label",
      open ? "Close menu" : "Open menu"
    );
    menuToggle.textContent = open ? "×" : "☰";
  });

  $$(".nav-link").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (
      navMenu.classList.contains("open") &&
      !navMenu.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMenu();
    }
  });

  // FOOTER YEAR
  $("#currentYear").textContent = new Date().getFullYear();

  // SCROLL REVEAL ANIMATIONS
  const revealItems = $$(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("visible"));
  }

  // ACTIVE NAVIGATION LINK
  const sections = $$("main section[id]");
  const navLinks = $$(".nav-link");

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navLinks.forEach((link) => {
              const active =
                link.getAttribute("href") === `#${entry.target.id}`;

              link.classList.toggle("active", active);
            });
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  // LIGHT / DARK THEME
  const themeToggle = $("#themeToggle");

  function updateThemeButton() {
    const dark = document.body.classList.contains("dark-theme");

    themeToggle.textContent = dark ? "☀" : "☾";
    themeToggle.setAttribute(
      "aria-label",
      dark ? "Switch to light theme" : "Switch to dark theme"
    );
    themeToggle.title = dark ? "Light theme" : "Dark theme";
  }

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");

    const dark = document.body.classList.contains("dark-theme");
    try {
      localStorage.setItem("roshani-portfolio-theme", dark ? "dark" : "light");
    } catch (_) {
      // The theme still works if browser storage is unavailable.
    }

    updateThemeButton();
  });

  try {
    if (localStorage.getItem("roshani-portfolio-theme") === "dark") {
      document.body.classList.add("dark-theme");
    }
  } catch (_) {
    // Use the default light theme.
  }

  updateThemeButton();

  // SCROLL PROGRESS
  const progressBar = $("#scrollProgress");
  const backToTop = $("#backToTop");

  function updateScrollControls() {
    const total =
      document.documentElement.scrollHeight - window.innerHeight;

    const percent = total > 0 ? (window.scrollY / total) * 100 : 0;
    progressBar.style.width = `${percent}%`;

    backToTop.classList.toggle("visible", window.scrollY > 400);
  }

  window.addEventListener("scroll", updateScrollControls, {
    passive: true
  });

  backToTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth"
    });
  });

  updateScrollControls();

  // GALLERY FILTERING
  const galleryItems = $$(".gallery-item");
  const filterButtons = $$(".filter-btn");
  let activeFilter = "all";

  function setFilter(category) {
    const valid = filterButtons.some(
      (button) => button.dataset.filter === category
    );

    activeFilter = valid ? category : "all";

    filterButtons.forEach((button) => {
      const selected = button.dataset.filter === activeFilter;

      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    galleryItems.forEach((item) => {
      const visible =
        activeFilter === "all" ||
        item.dataset.category === activeFilter;

      item.classList.toggle("is-hidden", !visible);
      item.setAttribute("aria-hidden", String(!visible));
      item.tabIndex = visible ? 0 : -1;
    });
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setFilter(button.dataset.filter);
    });
  });

  // Links in leadership cards can open a selected gallery category.
  $$("[data-gallery-filter]").forEach((link) => {
    link.addEventListener("click", () => {
      setFilter(link.dataset.galleryFilter);
    });
  });

  // PHOTO VIEWER
  const lightbox = $("#galleryLightbox");
  const lightboxImage = $("#lightboxImage");
  const lightboxCaption = $("#lightboxCaption");
  const lightboxCounter = $("#lightboxCounter");
  const closeButton = $("#lightboxClose");
  const previousButton = $("#lightboxPrev");
  const nextButton = $("#lightboxNext");

  let visiblePhotos = [];
  let currentIndex = 0;
  let lastFocusedPhoto = null;

  function refreshVisiblePhotos() {
    visiblePhotos = galleryItems.filter(
      (item) => !item.classList.contains("is-hidden")
    );
  }

  function displayPhoto(index) {
    if (!visiblePhotos.length) return;

    currentIndex =
      (index + visiblePhotos.length) % visiblePhotos.length;

    const card = visiblePhotos[currentIndex];
    const image = $("img", card);

    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt;
    lightboxCaption.textContent =
      card.dataset.caption || image.alt || "Gallery photo";

    lightboxCounter.textContent =
      `${currentIndex + 1} of ${visiblePhotos.length}`;

    const multiple = visiblePhotos.length > 1;
    previousButton.hidden = !multiple;
    nextButton.hidden = !multiple;
  }

  function openLightbox(card) {
    refreshVisiblePhotos();

    currentIndex = visiblePhotos.indexOf(card);
    if (currentIndex < 0) return;

    lastFocusedPhoto = card;
    displayPhoto(currentIndex);

    lightbox.inert = false;
    lightbox.setAttribute("aria-hidden", "false");
    lightbox.classList.add("open");
    document.body.classList.add("no-scroll");

    closeButton.focus();
  }

  function closeLightbox() {
    if (!lightbox.classList.contains("open")) return;

    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.inert = true;
    document.body.classList.remove("no-scroll");

    lightboxImage.removeAttribute("src");
    lightboxImage.alt = "";
    lightboxCaption.textContent = "";
    lightboxCounter.textContent = "";

    if (
      lastFocusedPhoto &&
      document.contains(lastFocusedPhoto) &&
      !lastFocusedPhoto.classList.contains("is-hidden")
    ) {
      lastFocusedPhoto.focus();
    }
  }

  galleryItems.forEach((card) => {
    card.addEventListener("click", () => openLightbox(card));
  });

  closeButton.addEventListener("click", closeLightbox);

  previousButton.addEventListener("click", () => {
    displayPhoto(currentIndex - 1);
  });

  nextButton.addEventListener("click", () => {
    displayPhoto(currentIndex + 1);
  });

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("open")) return;

    if (event.key === "Escape") {
      closeLightbox();
    } else if (event.key === "ArrowRight") {
      displayPhoto(currentIndex + 1);
    } else if (event.key === "ArrowLeft") {
      displayPhoto(currentIndex - 1);
    }
  });

  // SUBTLE CARD TILT ON DESKTOP
  const finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  );

  if (finePointer.matches) {
    $$(".leadership-card, .interest-card, .project-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        const rotateY = (x - 0.5) * 4;
        const rotateX = (0.5 - y) * 4;

        card.style.transform =
          `perspective(800px) rotateX(${rotateX}deg) ` +
          `rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  // INITIAL STATE
  setFilter("all");
});

