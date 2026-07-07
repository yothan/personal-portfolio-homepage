const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const projectImages = Array.from(document.querySelectorAll(".project-image"));
const detailCards = Array.from(document.querySelectorAll('.project-card-link[href$=".html"]'));
const pageParams = new URLSearchParams(window.location.search);
const isDetailReturn = pageParams.get("from") === "dolphin";
const revealInsets = ["0 0 100% 0", "100% 0 0 0", "0 100% 0 0", "0 0 0 100%"];
let detailOverlay = null;
let detailFrame = null;

projectImages.forEach((image) => {
  const frame = document.createElement("span");
  frame.className = "project-image-frame";
  image.parentNode.insertBefore(frame, image);
  frame.appendChild(image);
});

function shuffle(items) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

function revealCard(image) {
  const copy = image.closest(".project-card")?.querySelector(".project-copy");
  const startReveal = () => {
    window.requestAnimationFrame(() => {
      image.classList.add("is-cover-revealing");
      copy?.classList.add("is-copy-revealing");
    });
  };

  if (image.complete && image.naturalWidth > 0) {
    startReveal();
  } else {
    image.addEventListener("load", startReveal, { once: true });
    image.addEventListener("error", startReveal, { once: true });
  }

  image.addEventListener(
    "animationend",
    () => {
      image.classList.remove("is-cover-revealing");
      image.classList.add("is-cover-loaded");
    },
    { once: true },
  );

  copy?.addEventListener(
    "animationend",
    () => {
      copy.classList.remove("is-copy-revealing");
      copy.classList.add("is-copy-loaded");
    },
    { once: true },
  );
}

function playNavigationReturn() {
  document.body.classList.remove("is-detail-return");
  void document.querySelector(".site-header").offsetWidth;
  document.body.classList.add("is-detail-return");
}

function closeDetailOverlay() {
  if (!detailOverlay || detailOverlay.classList.contains("is-closing")) return;

  const overlayToRemove = detailOverlay;
  document.body.classList.add("is-preparing-detail-return");
  overlayToRemove.classList.add("is-closing");
  overlayToRemove.classList.remove("is-visible");

  window.setTimeout(() => {
    overlayToRemove.remove();
    if (detailOverlay === overlayToRemove) {
      detailOverlay = null;
      detailFrame = null;
    }
    document.body.classList.remove("has-detail-overlay");
    document.body.classList.remove("is-preparing-detail-return");
    playNavigationReturn();
  }, reducedMotion.matches ? 0 : 620);
}

function openDetailOverlay(event) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (detailOverlay) return;

  const detailLink = event.currentTarget;
  const detailUrl = detailLink.getAttribute("href");
  const projectName = detailLink.querySelector("h2")?.textContent?.trim() || "作品";
  document.body.classList.remove("is-detail-return");
  detailOverlay = document.createElement("div");
  detailOverlay.className = "detail-overlay-shell";
  detailFrame = document.createElement("iframe");
  detailFrame.className = "detail-overlay-frame";
  detailFrame.src = `${detailUrl}${detailUrl.includes("?") ? "&" : "?"}overlay=1`;
  detailFrame.title = `${projectName}项目详情`;
  detailOverlay.appendChild(detailFrame);
  document.body.style.setProperty(
    "--page-scrollbar-width",
    `${window.innerWidth - document.documentElement.clientWidth}px`,
  );
  document.body.classList.add("has-detail-overlay");
  document.body.appendChild(detailOverlay);

  const overlayToOpen = detailOverlay;
  detailFrame.addEventListener(
    "load",
    () => window.requestAnimationFrame(() => overlayToOpen.classList.add("is-visible")),
    { once: true },
  );
}

detailCards.forEach((card) => card.addEventListener("click", openDetailOverlay));

window.addEventListener("message", (event) => {
  if (!detailOverlay || !detailFrame || event.source !== detailFrame.contentWindow) return;
  if (event.data?.type === "portfolio-detail-ready") {
    window.requestAnimationFrame(() => detailOverlay?.classList.add("is-visible"));
    return;
  }
  if (event.data?.type === "close-portfolio-detail") closeDetailOverlay();
});

if (!reducedMotion.matches && !isDetailReturn) {
  document.body.classList.add("has-cover-motion");

  shuffle(projectImages).forEach((image, order) => {
    const randomOffset = Math.floor(Math.random() * 90);
    const coverDelay = 80 + order * 65 + randomOffset;
    const copy = image.closest(".project-card")?.querySelector(".project-copy");

    image.style.setProperty("--cover-delay", `${coverDelay}ms`);
    image.style.setProperty("--reveal-inset", revealInsets[Math.floor(Math.random() * revealInsets.length)]);
    copy?.style.setProperty("--copy-delay", `${coverDelay + 100}ms`);
    revealCard(image);
  });
}

if (isDetailReturn) {
  if (!reducedMotion.matches) playNavigationReturn();

  try {
    window.history.replaceState(null, "", window.location.pathname);
  } catch {
    // Local file previews may prevent history rewriting; the animation still works.
  }
}
