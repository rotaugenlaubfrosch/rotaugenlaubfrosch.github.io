"use strict";

(() => {
  const cities = { zurich: "Zürich", madrid: "Madrid", budapest: "Budapest" };
  const background = document.querySelector("#city-background");
  const video = document.querySelector("#city-video");
  const desktop = document.querySelector("#desktop");
  const slider = document.querySelector("#camera-path");
  const position = document.querySelector("#camera-position");
  const status = document.querySelector("#city-status");
  const play = document.querySelector("#motion-toggle");
  const reset = document.querySelector("#reset-camera");
  const retry = document.querySelector("#retry-city");
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let city = "zurich";
  let ready = false;
  let targetTime = 0;
  let seekFrame = null;
  let playing = false;
  let revision = 0;
  let touchY = null;
  let wantsPlayback = false;
  let autoplayBlocked = false;
  let playPending = false;
  let playAttempt = 0;

  // Stop one frame before duration to avoid a blank end frame on some decoders.
  const endTime = () => Math.max(0, (Number.isFinite(video.duration) ? video.duration : 0) - 1 / 60);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function showPosition() {
    const progress = endTime() ? targetTime / endTime() : 0;
    slider.value = Math.round(progress * 1000);
    position.textContent = `${Math.round(progress * 100)}%`;
    slider.setAttribute("aria-valuetext", `${Math.round(progress * 100)}% of ${cities[city]} camera path`);
  }

  function updatePlayback() {
    play.textContent = playing ? "Ⅱ Pause" : "▷ Play";
    play.setAttribute("aria-label", playing ? "Pause camera tour" : "Play camera tour");
    play.setAttribute("aria-pressed", String(playing));
  }

  function pause() {
    wantsPlayback = false;
    autoplayBlocked = false;
    playPending = false;
    playAttempt++;
    video.autoplay = false;
    playing = false;
    video.pause();
    updatePlayback();
    if (ready) status.textContent = `${cities[city]} · Ready`;
  }

  // At most one seek is in flight. New scroll events update the target, rather
  // than repeatedly interrupting decoding; seeked schedules the latest target.
  function queueSeek() {
    if (seekFrame !== null || !ready || playing || video.seeking) return;
    seekFrame = requestAnimationFrame(() => {
      seekFrame = null;
      if (!ready || playing || video.seeking) return;
      if (Math.abs(video.currentTime - targetTime) > 1 / 60) video.currentTime = targetTime;
    });
  }

  function scrub(progress) {
    if (!ready) return;
    pause();
    targetTime = clamp(progress, 0, 1) * endTime();
    showPosition();
    queueSeek();
  }

  function chooseCity(nextCity) {
    if (!Object.hasOwn(cities, nextCity)) return;
    revision++;
    pause();
    if (seekFrame !== null) cancelAnimationFrame(seekFrame);
    seekFrame = null;
    city = nextCity;
    ready = false;
    targetTime = 0;
    background.classList.remove("ready");
    background.style.backgroundImage = `url("assets/cities/${city}.jpg")`;
    video.poster = `assets/cities/${city}.jpg`;
    video.src = `assets/cities/${city}.mp4?v=60fps`;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    wantsPlayback = !motionPreference.matches && !document.hidden;
    video.autoplay = wantsPlayback;
    video.defaultPlaybackRate = 0.5;
    video.playbackRate = 0.5;
    slider.disabled = play.disabled = reset.disabled = true;
    retry.hidden = true;
    status.textContent = `Loading ${cities[city]}…`;
    document.querySelectorAll("[data-city]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.city === city));
    });
    showPosition();
    video.load();
    // Request playback immediately: some mobile browsers defer loadeddata until play().
    if (wantsPlayback) startTour();
  }

  function mediaReady() {
    if (!Number.isFinite(video.duration) || !video.duration) return;
    ready = true;
    if (video.readyState >= 2) background.classList.add("ready");
    slider.disabled = play.disabled = reset.disabled = false;
    if (!autoplayBlocked) status.textContent = `${cities[city]} · ${playing ? "Playing" : "Ready"}`;
    showPosition();
    queueSeek();
    if (wantsPlayback && !autoplayBlocked && !playPending && video.paused && !document.hidden) startTour();
  }
  ["loadedmetadata", "loadeddata", "canplay"].forEach(event => video.addEventListener(event, mediaReady));
  video.addEventListener("seeked", () => {
    if (!ready) return;
    status.textContent = `${cities[city]} · Ready`;
    queueSeek();
  });
  video.addEventListener("timeupdate", () => {
    if (!playing) return;
    targetTime = Math.min(video.currentTime, endTime());
    showPosition();
  });
  video.addEventListener("ended", () => {
    pause();
    targetTime = endTime();
    showPosition();
  });
  video.addEventListener("waiting", () => {
    if (ready) status.textContent = "Buffering…";
  });
  video.addEventListener("playing", () => {
    if (!wantsPlayback || document.hidden) { pause(); return; }
    playing = true;
    autoplayBlocked = false;
    video.playbackRate = 0.5;
    background.classList.add("ready");
    updatePlayback();
    status.textContent = `${cities[city]} · Playing`;
  });
  video.addEventListener("pause", () => {
    if (!video.paused) return;
    playing = false;
    updatePlayback();
  });
  video.addEventListener("error", () => {
    if (!video.error) return;
    pause();
    ready = false;
    background.classList.remove("ready");
    slider.disabled = play.disabled = reset.disabled = true;
    status.textContent = "Video unavailable";
    retry.hidden = false;
  });

  document.querySelectorAll("[data-city]").forEach(button => {
    button.addEventListener("click", () => {
      if (city !== button.dataset.city) chooseCity(button.dataset.city);
    });
  });
  retry.addEventListener("click", () => chooseCity(city));
  slider.addEventListener("input", () => scrub(Number(slider.value) / 1000));
  reset.addEventListener("click", () => scrub(0));
  async function startTour() {
    if (playPending || video.error || document.hidden) return;
    if (ready && targetTime >= endTime() - .1) {
      targetTime = 0;
      video.currentTime = 0;
      showPosition();
    }
    const currentRevision = revision;
    const currentAttempt = ++playAttempt;
    wantsPlayback = true;
    autoplayBlocked = false;
    playPending = true;
    video.muted = true;
    video.playbackRate = 0.5;
    playing = true;
    updatePlayback();
    try {
      await video.play();
    } catch (error) {
      // Ignore promises superseded by a city switch, pause, reset, or manual scrub.
      if (currentRevision !== revision || currentAttempt !== playAttempt) return;
      pause();
      if (error.name === "NotAllowedError") {
        wantsPlayback = true;
        autoplayBlocked = true;
        status.textContent = "Tap to start the city tour";
      } else status.textContent = "Use Play to start the tour";
    } finally {
      if (currentAttempt === playAttempt) playPending = false;
    }
  }
  play.addEventListener("click", () => {
    if (playing) pause();
    else startTour();
  });
  // A real tap/click provides user activation. Explicit playback controls handle
  // their own actions; an intentional pause or scrub clears this retry flag.
  document.addEventListener("click", event => {
    if (!event.isTrusted || event.target.closest(".city-controls")) return;
    if (autoplayBlocked && wantsPlayback && !motionPreference.matches) startTour();
  });

  function isWallpaper(target) {
    return !target.closest(".window, .city-controls, .desktop-icons, button, a, input, textarea");
  }
  desktop.addEventListener("wheel", event => {
    if (!ready || event.ctrlKey || !isWallpaper(event.target)) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    scrub(targetTime / endTime() + event.deltaY * unit / 8000);
  }, { passive: false });
  desktop.addEventListener("touchstart", event => {
    touchY = event.touches.length === 1 && isWallpaper(event.target) ? event.touches[0].clientY : null;
  }, { passive: true });
  desktop.addEventListener("touchmove", event => {
    if (touchY === null || !ready || event.touches.length !== 1) return;
    event.preventDefault();
    const nextY = event.touches[0].clientY;
    scrub(targetTime / endTime() + (touchY - nextY) / 2000);
    touchY = nextY;
  }, { passive: false });
  desktop.addEventListener("touchend", () => { touchY = null; });
  desktop.addEventListener("touchcancel", () => { touchY = null; });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
  motionPreference.addEventListener("change", event => {
    if (event.matches) pause();
  });

  // Reserve exactly enough space for the description and controls on mobile.
  const explorer = document.querySelector(".city-explorer");
  const updateExplorerHeight = () => {
    desktop.style.setProperty("--city-explorer-height", `${explorer.offsetHeight}px`);
  };
  new ResizeObserver(updateExplorerHeight).observe(explorer);
  updateExplorerHeight();

  // Every first view is Zürich; each city autoplays at half speed unless reduced motion is requested.
  chooseCity("zurich");
})();
