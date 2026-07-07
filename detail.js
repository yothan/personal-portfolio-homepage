const closeButton = document.querySelector(".detail-close");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const isOverlayMode = new URLSearchParams(window.location.search).get("overlay") === "1";
const detailGalleryImages = Array.from(document.querySelectorAll(".detail-gallery img"));
const detailGalleryVideos = Array.from(document.querySelectorAll(".detail-gallery video"));
const detailGalleryMedia = Array.from(document.querySelectorAll(".detail-gallery img, .detail-gallery video"));

detailGalleryImages.forEach((image, index) => {
  image.decoding = "async";
  image.loading = "eager";
  if (index === 0) image.fetchPriority = "high";
});

detailGalleryVideos.forEach((video) => {
  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute("muted", "");
  video.loop = true;
  video.playsInline = true;
  video.controls = false;

  if (!document.body.classList.contains("hide-hover-video-controls")) {
    video.addEventListener("mouseenter", () => {
      video.controls = true;
    });
    video.addEventListener("mouseleave", () => {
      video.controls = false;
    });
    video.addEventListener("focus", () => {
      video.controls = true;
    });
    video.addEventListener("blur", () => {
      video.controls = false;
    });
  }
});

const detailRevealTargets = [
  ...document.querySelectorAll(".detail-intro h1, .detail-summary > *"),
  ...detailGalleryMedia.slice(0, 3),
];
const revealInsets = ["0 0 100% 0", "100% 0 0 0", "0 100% 0 0", "0 0 0 100%"];
let detailRevealStarted = false;

function playDetailVideo(video) {
  const play = async () => {
    video.muted = false;

    try {
      await video.play();
    } catch {
      // Safari blocks audible playback initiated by scrolling. Falling back to
      // muted playback keeps the motion running without requiring another tap.
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("muted", "");

      try {
        await video.play();
      } catch {}
    }
  };

  // Calling play() also advances metadata-only videos into media loading.
  // Waiting for loadeddata first can deadlock in Safari with preload="metadata".
  play();
}

if ("IntersectionObserver" in window) {
  const videoVisibilityObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;

        if (entry.isIntersecting) {
          if (!detailRevealTargets.includes(video) || video.classList.contains("is-detail-revealed")) {
            playDetailVideo(video);
          }
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.12 },
  );

  detailGalleryVideos.forEach((video) => videoVisibilityObserver.observe(video));
}

function revealDetailElement(element, delay = 0) {
  if (element.classList.contains("is-detail-revealing") || element.classList.contains("is-detail-revealed")) return;

  const play = () => {
    element.style.setProperty("--detail-reveal-delay", `${delay}ms`);
    if (element instanceof HTMLImageElement || element instanceof HTMLVideoElement) {
      element.style.setProperty("--reveal-inset", revealInsets[Math.floor(Math.random() * revealInsets.length)]);
    }
    element.classList.add("is-detail-revealing");
  };

  if (element instanceof HTMLImageElement && !(element.complete && element.naturalWidth > 0)) {
    element.addEventListener("load", play, { once: true });
    element.addEventListener("error", play, { once: true });
  } else if (element instanceof HTMLVideoElement && element.readyState < 2) {
    element.addEventListener("loadeddata", play, { once: true });
  } else {
    play();
  }

  element.addEventListener(
    "animationend",
    () => {
      element.classList.remove("is-detail-revealing");
      element.classList.add("is-detail-revealed");
      if (element instanceof HTMLVideoElement) playDetailVideo(element);
    },
    { once: true },
  );
}

function beginDetailReveals() {
  if (detailRevealStarted || reducedMotion.matches) return;
  detailRevealStarted = true;

  const viewportTargets = detailRevealTargets.filter((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.top < window.innerHeight && bounds.bottom > 0;
  });

  detailRevealTargets
    .filter((element) => !viewportTargets.includes(element))
    .forEach((element) => {
      element.classList.add("is-detail-revealed");
      if (element instanceof HTMLVideoElement) playDetailVideo(element);
    });

  viewportTargets.forEach((element, index) => revealDetailElement(element, index * 55));
}

if (!reducedMotion.matches) {
  document.body.classList.add("has-detail-reveal-motion");
  detailRevealTargets.forEach((element) => element.classList.add("detail-reveal-target"));
}

if (reducedMotion.matches) detailGalleryVideos.forEach(playDetailVideo);

if (isOverlayMode) document.body.classList.remove("is-entering");
if (isOverlayMode) window.parent.postMessage({ type: "portfolio-detail-ready" }, "*");

document.body.addEventListener("animationend", (event) => {
  if (event.animationName === "detail-page-enter") {
    document.body.classList.remove("is-entering");
    beginDetailReveals();
  }
});

window.setTimeout(beginDetailReveals, isOverlayMode ? 650 : 700);

function returnToPortfolio() {
  if (isOverlayMode) {
    window.parent.postMessage({ type: "close-portfolio-detail" }, "*");
    return;
  }

  if (document.body.classList.contains("is-leaving")) return;

  if (reducedMotion.matches) {
    window.location.href = "./index.html?from=dolphin";
    return;
  }

  document.body.classList.add("is-leaving");
  window.setTimeout(() => {
    window.location.href = "./index.html?from=dolphin";
  }, 620);
}

closeButton.addEventListener("click", returnToPortfolio);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") returnToPortfolio();
});

window.addEventListener("pageshow", () => {
  document.body.classList.remove("is-leaving");
  if (!isOverlayMode && !document.body.classList.contains("is-entering")) beginDetailReveals();
});
