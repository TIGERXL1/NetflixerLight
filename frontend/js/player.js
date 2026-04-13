import { buildBackdropUrl, getTrailerVideo } from "./utils.js";

let currentElements = null;
let initialized = false;
let errorHandler = null;
let currentTrailerKey = "";
let currentSearchUrl = "";
let youtubePlayer = null;
let youtubeApiPromise = null;
let hideControlsTimeout = 0;
let progressInterval = 0;

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
    elements.playerProgress.addEventListener("input", handleProgressInput);

    ["mousemove", "pointerdown", "touchstart"].forEach((eventName) => {
        elements.playerShell.addEventListener(eventName, revealControls, { passive: true });
    });

    document.addEventListener("fullscreenchange", syncPlayerUi);
}

export async function loadPlayer(detail, elements) {
    if (!initialized) {
        initPlayer(elements);
    }

    const trailer = getTrailerVideo(detail.videos, detail);
    currentTrailerKey = trailer?.key || "";
    currentSearchUrl = buildYouTubeSearchUrl(detail);

    elements.playerShell.classList.remove("is-hidden");
    elements.playerShell.classList.remove("is-controls-hidden");
    elements.playerShell.style.backgroundImage = `linear-gradient(180deg, rgba(4, 8, 15, 0.14), rgba(4, 8, 15, 0.4)), url("${buildBackdropUrl(detail.backdropPath)}")`;
    elements.playerFrame.style.backgroundImage = currentTrailerKey
        ? `url("https://i.ytimg.com/vi/${currentTrailerKey}/hqdefault.jpg")`
        : `url("${buildBackdropUrl(detail.backdropPath)}")`;
    elements.playerFrame.style.backgroundPosition = "center";
    elements.playerFrame.style.backgroundSize = "cover";
    elements.playerFrame.style.backgroundRepeat = "no-repeat";
    elements.playerProgress.value = 0;
    elements.playerVolume.value = 1;
    elements.playerTime.textContent = "00:00 / 00:00";

    if (!currentTrailerKey) {
        destroyPlayer();
        setStatus("Aucune bande-annonce directe. Recherche YouTube disponible.", false);
        syncPlayerUi();
        return;
    }

    setStatus("Chargement de la bande-annonce...", false);

    try {
        await ensureYouTubeApi();
        await mountPlayer(currentTrailerKey);
        youtubePlayer.mute();
        youtubePlayer.playVideo();
        currentElements.playerVolume.value = 1;
        startProgressSync();
        scheduleControlsHide();
    } catch (error) {
        console.error(error);
        emitPlayerError("Impossible de preparer la bande-annonce.");
    }
}

export async function startPlayer() {
    if (!currentTrailerKey && currentSearchUrl) {
        window.open(currentSearchUrl, "_blank", "noopener,noreferrer");
        return;
    }

    if (!youtubePlayer) {
        return;
    }

    try {
        youtubePlayer.playVideo();
        startProgressSync();
        scheduleControlsHide();
    } catch (error) {
        console.error(error);
        emitPlayerError("Impossible de lancer la lecture.");
    }
}

export function stopPlayer() {
    if (!currentElements) {
        return;
    }

    window.clearTimeout(hideControlsTimeout);
    window.clearInterval(progressInterval);
    progressInterval = 0;

    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }

    if (youtubePlayer?.stopVideo) {
        try {
            youtubePlayer.stopVideo();
        } catch (error) {
            console.error(error);
        }
    }

    destroyPlayer();
    currentTrailerKey = "";
    currentSearchUrl = "";
    currentElements.playerShell.classList.add("is-hidden");
    currentElements.playerShell.classList.remove("is-playing");
    currentElements.playerShell.classList.remove("is-controls-hidden");
    currentElements.playerProgress.value = 0;
    currentElements.playerVolume.value = 1;
    currentElements.playerTime.textContent = "00:00 / 00:00";
    setStatus("", false);
}

async function ensureYouTubeApi() {
    if (window.YT?.Player) {
        return;
    }

    if (!youtubeApiPromise) {
        youtubeApiPromise = new Promise((resolve) => {
            const previous = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (typeof previous === "function") {
                    previous();
                }
                resolve();
            };

            const script = document.createElement("script");
            script.src = "https://www.youtube.com/iframe_api";
            script.async = true;
            document.head.appendChild(script);
        });
    }

    await youtubeApiPromise;
}

async function mountPlayer(videoKey) {
    destroyPlayer();
    currentElements.playerMount.innerHTML = '<div id="yt-player-slot"></div>';

    return new Promise((resolve, reject) => {
        youtubePlayer = new window.YT.Player("yt-player-slot", {
            width: "100%",
            height: "100%",
            videoId: videoKey,
            playerVars: {
                autoplay: 1,
                controls: 0,
                rel: 0,
                playsinline: 1,
                modestbranding: 1,
                enablejsapi: 1,
                origin: window.location.origin,
            },
            events: {
                onReady: () => {
                    setStatus("", false);
                    syncPlayerUi();
                    resolve();
                },
                onStateChange: handlePlayerStateChange,
                onError: (event) => {
                    reject(new Error(`YouTube player error ${event.data}`));
                },
            },
        });
    });
}

function destroyPlayer() {
    if (youtubePlayer?.destroy) {
        try {
            youtubePlayer.destroy();
        } catch (error) {
            console.error(error);
        }
    }

    youtubePlayer = null;
    if (currentElements) {
        currentElements.playerMount.innerHTML = "";
    }
}

function handlePlayerStateChange(event) {
    const stateCode = event.data;

    if (stateCode === window.YT.PlayerState.PLAYING) {
        currentElements.playerShell.classList.add("is-playing");
        setStatus("", false);
        startProgressSync();
        scheduleControlsHide();
    } else if (stateCode === window.YT.PlayerState.PAUSED) {
        currentElements.playerShell.classList.remove("is-playing");
        currentElements.playerShell.classList.remove("is-controls-hidden");
    } else if (stateCode === window.YT.PlayerState.ENDED) {
        currentElements.playerShell.classList.remove("is-playing");
        currentElements.playerShell.classList.remove("is-controls-hidden");
    } else if (stateCode === window.YT.PlayerState.BUFFERING) {
        setStatus("Mise en memoire tampon...", false);
    }

    syncPlayerUi();
}

function togglePlayback() {
    if (!currentTrailerKey && currentSearchUrl) {
        startPlayer();
        return;
    }

    if (!youtubePlayer) {
        return;
    }

    const stateCode = youtubePlayer.getPlayerState?.();
    if (stateCode === window.YT.PlayerState.PLAYING) {
        youtubePlayer.pauseVideo();
        revealControls();
    } else {
        startPlayer();
    }
}

function toggleMute() {
    if (!currentTrailerKey && currentSearchUrl) {
        startPlayer();
        return;
    }

    if (!youtubePlayer) {
        return;
    }

    if (youtubePlayer.isMuted()) {
        youtubePlayer.unMute();
        if (Number(currentElements.playerVolume.value) === 0) {
            currentElements.playerVolume.value = 1;
            youtubePlayer.setVolume(100);
        }
    } else {
        youtubePlayer.mute();
    }

    syncPlayerUi();
    revealControls();
}

function handleVolumeChange() {
    if (!youtubePlayer) {
        return;
    }

    const volume = Math.round(Number(currentElements.playerVolume.value) * 100);
    youtubePlayer.setVolume(volume);

    if (volume === 0) {
        youtubePlayer.mute();
    } else if (youtubePlayer.isMuted()) {
        youtubePlayer.unMute();
    }

    syncPlayerUi();
    revealControls();
}

function handleProgressInput() {
    if (!youtubePlayer) {
        return;
    }

    const duration = youtubePlayer.getDuration?.() || 0;
    if (duration <= 0) {
        return;
    }

    const percentage = Number(currentElements.playerProgress.value);
    youtubePlayer.seekTo((percentage / 100) * duration, true);
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

    const duration = youtubePlayer?.getDuration?.() || 0;
    const currentTime = youtubePlayer?.getCurrentTime?.() || 0;
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const stateCode = youtubePlayer?.getPlayerState?.();
    const isPlaying = stateCode === window.YT?.PlayerState?.PLAYING;
    const isMuted = youtubePlayer ? youtubePlayer.isMuted() || youtubePlayer.getVolume() === 0 : false;

    currentElements.playerPlayToggle.textContent = isPlaying ? "Pause" : "Lecture";
    currentElements.playerCenterToggle.textContent = isPlaying ? "Pause" : "Lecture";
    currentElements.playerMuteToggle.textContent = isMuted ? "Activer le son" : "Couper le son";
    currentElements.playerFullscreenToggle.textContent = document.fullscreenElement ? "Quitter plein ecran" : "Plein ecran";
    currentElements.playerProgress.value = progress;
    currentElements.playerVolume.value = youtubePlayer ? youtubePlayer.getVolume() / 100 : 1;
    currentElements.playerTime.textContent = currentTrailerKey
        ? `${formatClock(currentTime)} / ${formatClock(duration)}`
        : (currentSearchUrl ? "Recherche YouTube" : "00:00 / 00:00");
    currentElements.playerShell.classList.toggle("is-playing", Boolean(isPlaying));
}

function startProgressSync() {
    window.clearInterval(progressInterval);
    progressInterval = window.setInterval(syncPlayerUi, 250);
}

function revealControls() {
    if (!currentElements) {
        return;
    }

    currentElements.playerShell.classList.remove("is-controls-hidden");
    scheduleControlsHide();
}

function scheduleControlsHide() {
    if (!currentElements || !youtubePlayer) {
        return;
    }

    window.clearTimeout(hideControlsTimeout);
    const stateCode = youtubePlayer.getPlayerState?.();
    if (stateCode !== window.YT.PlayerState.PLAYING) {
        return;
    }

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

function buildYouTubeSearchUrl(detail) {
    const query = [
        detail.title,
        detail.date ? detail.date.slice(0, 4) : "",
        detail.mediaType === "tv" ? "serie" : "film",
        "official trailer",
    ]
        .filter(Boolean)
        .join(" ");

    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function formatClock(totalSeconds) {
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
        return "00:00";
    }

    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor((totalSeconds / 60) % 60);
    const hours = Math.floor(totalSeconds / 3600);

    if (hours > 0) {
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
