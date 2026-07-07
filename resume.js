const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const profile = document.querySelector(".profile");
const portrait = document.querySelector(".portrait");
const profileMeta = document.querySelector(".profile-meta");
const timelineItems = Array.from(document.querySelectorAll(".timeline-item"));
let timelineStarted = false;

function startTimeline() {
  if (timelineStarted || reducedMotion.matches) return;
  timelineStarted = true;

  timelineItems.forEach((item, index) => {
    item.style.setProperty("--article-delay", `${index * 120}ms`);
    item.classList.add("is-resume-article-entering");
    item.addEventListener(
      "animationend",
      () => {
        item.classList.remove("is-resume-article-entering");
        item.classList.add("is-resume-article-loaded");
      },
      { once: true },
    );
  });
}

function startProfileReveal() {
  const reveal = () => {
    portrait.style.setProperty("--profile-delay", "80ms");
    portrait.style.setProperty("--reveal-inset", "0 100% 0 0");
    profileMeta.style.setProperty("--profile-copy-delay", "180ms");
    portrait.classList.add("is-profile-image-revealing");
    profileMeta.classList.add("is-profile-copy-revealing");
    window.setTimeout(startTimeline, 900);
  };

  if (portrait.complete && portrait.naturalWidth > 0) {
    window.requestAnimationFrame(reveal);
  } else {
    portrait.addEventListener("load", () => window.requestAnimationFrame(reveal), { once: true });
    portrait.addEventListener("error", () => window.requestAnimationFrame(reveal), { once: true });
  }

  portrait.addEventListener(
    "animationend",
    () => {
      portrait.classList.remove("is-profile-image-revealing");
      portrait.classList.add("is-profile-image-loaded");
    },
    { once: true },
  );

  profileMeta.addEventListener(
    "animationend",
    () => {
      profileMeta.classList.remove("is-profile-copy-revealing");
      profileMeta.classList.add("is-profile-copy-loaded");
      startTimeline();
    },
    { once: true },
  );
}

if (!reducedMotion.matches) {
  document.body.classList.add("has-resume-motion");

  if (window.getComputedStyle(profile).display === "none") {
    startTimeline();
  } else {
    startProfileReveal();
  }
}
