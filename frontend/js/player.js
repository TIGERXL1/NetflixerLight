import { buildBackdropUrl, getTrailerVideo } from "./utils.js";

let currentElements = null;
let initialized = false;
let errorHandler = null;
let currentTrailerKey = "";
let currentIframe = null;
let isPlaying = false;
let isMuted = true;
let hideControlsTimeout = 0;

export function setPlayerErrorHandler(handler) {
    errorHandler = handler;
}

export function initPlayer(elements) {
    if (initialized) {
        return;
    }

    currentElements = elements;
    initialized = true;

    elements.playerPlayToggle.addEventListener("click", togglePlayback);
    elements.playerCenterToggle.addEventListener("click", togglePlayback);
    elements.playerMuteToggle.addEventListener("click", toggleMute);
    elements.playerFullscreenToggle.addEventListener("click", toggleFullscreen);
    elements.playerVolume.addEventListener("input", handleVolumeChange);
    elements.playerProgress.addEventListener("input", revealControls);

    ["mousemove", "pointerdown", "touchstart"].forEach((eventName) => {
        elements.playerShell.addEventListener(eventName, revealControls, { passive: true });
    });

    document.addEventListener("fullscreenchange", syncPlayerUi);
}

export async function loadPlayer(detail, elements) {
    if (!initialized) {
        initPlayer(elements);
    }

    const trailer = getTrailerVideo(detail.videos);
    currentTrailerKey = trailer?.key || "";

    elements.playerShell.classList.remove("is-hidden");
    elements.playerShell.classList.remove("is-controls-hidden");
    elements.playerShell.classList.remove("youtube-fallback");
    elements.playerShell.style.backgroundImage = `linear-gradient(180deg, rgba(4, 8, 15, 0.14), rgba(4, 8, 15, 0.4)), url("${buildBackdropUrl(detail.backdropPath)}")`;
    elements.playerFrame.style.backgroundImage = currentTrailerKey
        ? `url("https://i.ytimg.com/vi/${currentTrailerKey}/hqdefault.jpg")`
        : `url("${buildBackdropUrl(detail.backdropPath)}")`;
    elements.playerFrame.style.backgroundPosition = "center";
    elements.playerFrame.style.backgroundSize = "cover";
    elements.playerFrame.style.backgroundRepeat = "no-repeat";
    elements.playerProgress.value = 0;
    elements.playerVolume.value = 1;
    elements.playerTime.textContent = "Bande-annonce";

    if (!currentTrailerKey) {
        destroyIframe();
        isPlaying = false;
        setStatus("Aucune bande-annonce disponible pour ce contenu.", true);
        syncPlayerUi();
        return;
    }

    isMuted = true;
    isPlaying = true;
    mountIframe({ autoplay: true, muted: true });
    setStatus("", false);
    syncPlayerUi();
    scheduleControlsHide();
}

export async function startPlayer() {
    if (!currentTrailerKey) {
        return;
    }

    isPlaying = true;
    mountIframe({ autoplay: true, muted: isMuted });
    syncPlayerUi();
    scheduleControlsHide();
}

export function stopPlayer() {
    if (!currentElements) {
        return;
    }

    window.clearTimeout(hideControlsTimeout);

    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }

    destroyIframe();
    currentTrailerKey = "";
    isPlaying = false;
    isMuted = true;
    currentElements.playerShell.classList.add("is-hidden");
    currentElements.playerShell.classList.remove("is-playing");
    currentElements.playerShell.classList.remove("is-controls-hidden");
    currentElements.playerProgress.value = 0;
    currentElements.playerVolume.value = 1;
    currentElements.playerTime.textContent = "00:00 / 00:00";
    setStatus("", false);
}

function mountIframe({ autoplay, muted }) {
    if (!currentTrailerKey || !currentElements) {
        return;
    }

    currentElements.playerMount.innerHTML = `
        <iframe
            src="${buildEmbedUrl(currentTrailerKey, autoplay, muted)}"
            title="Bande-annonce"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
        ></iframe>
    `;

    currentIframe = currentElements.playerMount.querySelector("iframe");
}

function destroyIframe() {
    currentIframe = null;
    if (currentElements) {
        currentElements.playerMount.innerHTML = "";
    }
}

function buildEmbedUrl(videoKey, autoplay, muted) {
    const params = new URLSearchParams({
        autoplay: autoplay ? "1" : "0",
        mute: muted ? "1" : "0",
        playsinline: "1",
        rel: "0",
        controls: "1",
        modestbranding: "1",
        enablejsapi: "1",
        origin: window.location.origin,
    });

    return `https://www.youtube.com/embed/${videoKey}?${params.toString()}`;
}

function togglePlayback() {
    if (!currentTrailerKey) {
        return;
    }

    if (isPlaying) {
        isPlaying = false;
        destroyIframe();
        syncPlayerUi();
        revealControls();
        return;
    }

    startPlayer();
}

function toggleMute() {
    if (!currentTrailerKey) {
        return;
    }

    isMuted = !isMuted;

    if (isPlaying) {
        mountIframe({ autoplay: true, muted: isMuted });
    }

    syncPlayerUi();
    revealControls();
}

function handleVolumeChange() {
    const volume = Number(currentElements.playerVolume.value);
    isMuted = volume === 0;

    if (isPlaying && currentTrailerKey) {
        mountIframe({ autoplay: true, muted: isMuted });
    }

    syncPlayerUi();
    revealControls();
}

async function toggleFullscreen() {
    if (!currentElements) {
        return;
    }

    if (document.fullscreenElement) {
        await document.exitFullscreen();
    } else {
        await currentElements.playerShell.requestFullscreen();
    }

    revealControls();
}

function syncPlayerUi() {
    if (!currentElements) {
        return;
    }

    currentElements.playerPlayToggle.textContent = isPlaying ? "Pause" : "Lecture";
    currentElements.playerCenterToggle.textContent = isPlaying ? "Pause" : "Lecture";
    currentElements.playerMuteToggle.textContent = isMuted ? "Activer le son" : "Couper le son";
    currentElements.playerFullscreenToggle.textContent = document.fullscreenElement ? "Quitter plein ecran" : "Plein ecran";
    currentElements.playerProgress.value = 0;
    currentElements.playerTime.textContent = currentTrailerKey ? "Bande-annonce" : "00:00 / 00:00";
    currentElements.playerShell.classList.toggle("is-playing", Boolean(isPlaying));
}

function revealControls() {
    if (!currentElements) {
        return;
    }

    currentElements.playerShell.classList.remove("is-controls-hidden");
    scheduleControlsHide();
}

function scheduleControlsHide() {
    if (!currentElements || !isPlaying) {
        return;
    }

    window.clearTimeout(hideControlsTimeout);
    hideControlsTimeout = window.setTimeout(() => {
        currentElements.playerShell.classList.add("is-controls-hidden");
    }, 3000);
}

function setStatus(message, isError) {
    if (!currentElements) {
        return;
    }

    currentElements.playerStatus.textContent = message;
    currentElements.playerStatus.classList.toggle("is-error", Boolean(isError));
}

function emitPlayerError(message) {
    setStatus(message, true);
    if (typeof errorHandler === "function") {
        errorHandler(message);
    }
}
