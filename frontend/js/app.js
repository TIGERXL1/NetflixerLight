import { fetchDetails, fetchHomeFeed as fetchHomeFeedData, fetchRecommendationsByGenres, fetchSearchResults } from "./api.js";
import { logoutUser, requireAuth } from "./auth-store.js";
import { elements } from "./dom.js";
import {
    closeModal,
    hideNotice,
    openModal,
    renderAllRows,
    renderHero,
    renderLoadingTracks,
    renderModal,
    renderModalError,
    renderModalLoading,
    renderSearchState,
    renderTrack,
    renderWatchlist,
    showNotice,
} from "./render.js";
import {
    findItemByKey,
    hydrateGenreLookup,
    loadWatchlist,
    state,
    toggleWatchlist,
} from "./state.js";
import { bindThemeToggle, initTheme } from "./theme.js";
import { createSkeletonCards, normalizeResults, pickFeatured } from "./utils.js";

initTheme();
bootstrap();

async function bootstrap() {
    const currentUser = await requireAuth("login.html");
    if (!currentUser) {
        return;
    }

    await initApp(currentUser);
}

async function initApp(currentUserData) {
    elements.sessionUser.textContent = currentUserData.name || currentUserData.email || "Compte";
    bindEvents();
    renderLoadingTracks();
    await loadWatchlist();
    renderWatchlist();

    try {
        await loadHomeFeed();
        await refreshRecommendations();
    } catch (error) {
        console.error(error);
        showNotice("Impossible de charger le backend ou TMDB pour le moment.");
    }
}

function bindEvents() {
    let searchDebounce = 0;

    bindThemeToggle();

    elements.searchInput.addEventListener("input", (event) => {
        window.clearTimeout(searchDebounce);
        searchDebounce = window.setTimeout(() => handleSearch(event.target.value), 320);
    });

    document.addEventListener("click", async (event) => {
        const prevTrackButton = event.target.closest("[data-track-prev]");
        if (prevTrackButton) {
            scrollTrack(prevTrackButton.dataset.trackPrev, -1);
            return;
        }

        const nextTrackButton = event.target.closest("[data-track-next]");
        if (nextTrackButton) {
            scrollTrack(nextTrackButton.dataset.trackNext, 1);
            return;
        }

        const toggleButton = event.target.closest("[data-toggle-watchlist]");
        if (toggleButton) {
            const item = findItemByKey(Number(toggleButton.dataset.id), toggleButton.dataset.mediaType);
            if (item) {
                await handleWatchlistToggle(item);
            }
            return;
        }

        const openButton = event.target.closest("[data-open-details]");
        if (openButton) {
            await openDetails(Number(openButton.dataset.id), openButton.dataset.mediaType);
            return;
        }

        if (event.target.closest("[data-close-modal]")) {
            closeModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeModal();
        }
    });

    elements.heroPlay.addEventListener("click", async () => {
        if (state.featured) {
            await openDetails(state.featured.id, state.featured.mediaType);
        }
    });

    elements.heroList.addEventListener("click", async () => {
        if (state.featured) {
            await handleWatchlistToggle(state.featured);
        }
    });

    elements.modalWatchlist.addEventListener("click", async () => {
        if (state.activeDetail) {
            await handleWatchlistToggle(state.activeDetail);
        }
    });

    elements.logoutButton.addEventListener("click", async () => {
        try {
            await logoutUser();
        } finally {
            window.location.replace("login.html");
        }
    });
}

async function loadHomeFeed() {
    showNotice("Chargement des contenus...");

    const {
        movieGenresResult,
        tvGenresResult,
        trendingResult,
        popularMoviesResult,
        topMoviesResult,
        seriesResult,
        actionResult,
        comedyResult,
        horrorResult,
    } = await fetchHomeFeedData();

    hydrateGenreLookup(movieGenresResult, "movie");
    hydrateGenreLookup(tvGenresResult, "tv");

    state.rows.trending = pickMediaItems(trendingResult, 12);
    state.rows.movies = pickMediaItems(popularMoviesResult, 12);
    state.rows.top = pickMediaItems(topMoviesResult, 12);
    state.rows.series = pickMediaItems(seriesResult, 12);
    state.rows.action = pickMediaItems(actionResult, 12);
    state.rows.comedy = pickMediaItems(comedyResult, 12);
    state.rows.horror = pickMediaItems(horrorResult, 12);
    state.featured = pickFeatured([...state.rows.trending, ...state.rows.movies, ...state.rows.series]);

    renderHero(state.featured);
    renderAllRows();
    renderWatchlist();

    if (Object.values(state.rows).some((items) => items.length > 0)) {
        hideNotice();
    } else {
        showNotice("Le backend répond, mais aucun contenu exploitable n'a été récupéré.");
    }
}

async function handleSearch(query) {
    const trimmedQuery = query.trim();
    const requestId = ++state.searchRequestId;

    if (trimmedQuery.length < 2) {
        state.searchResults = [];
        elements.searchSection.classList.add("is-hidden");
        elements.searchTrack.innerHTML = "";
        elements.searchSummary.textContent = "";
        return;
    }

    elements.searchSection.classList.remove("is-hidden");
    elements.searchSummary.textContent = `Recherche de "${trimmedQuery}"...`;
    elements.searchTrack.innerHTML = createSkeletonCards(4);

    try {
        const results = await fetchSearchResults(trimmedQuery);
        if (requestId !== state.searchRequestId) {
            return;
        }
        state.searchResults = results;
        elements.searchSummary.textContent = `${state.searchResults.length} résultat(s) pour "${trimmedQuery}"`;
        renderTrack(elements.searchTrack, state.searchResults, "Aucun résultat pour cette recherche.");
    } catch (error) {
        console.error(error);
        if (requestId !== state.searchRequestId) {
            return;
        }
        state.searchResults = [];
        elements.searchSummary.textContent = `Recherche impossible pour "${trimmedQuery}"`;
        renderTrack(elements.searchTrack, [], "Impossible de charger la recherche.");
    }
}

async function openDetails(id, mediaType) {
    if (!id || !mediaType) {
        return;
    }

    openModal();
    renderModalLoading();

    try {
        const detail = await fetchDetails(id, mediaType);
        state.activeDetail = detail;
        renderModal(detail);
    } catch (error) {
        console.error(error);
        state.activeDetail = null;
        renderModalError();
    }
}

function pickMediaItems(result, limit) {
    if (result.status !== "fulfilled" || !Array.isArray(result.value?.results)) {
        return [];
    }
    return normalizeResults(result.value.results, limit);
}

async function handleWatchlistToggle(item) {
    try {
        await toggleWatchlist(item);
        await refreshRecommendations();
        renderHero(state.featured);
        renderWatchlist();
        renderAllRows();
        renderSearchState();
        hideNotice();
    } catch (error) {
        console.error(error);
        showNotice(error.message || "Impossible de mettre à jour les favoris.");
    }
}

async function refreshRecommendations() {
    const favoriteGenres = getPreferredGenreIds();

    if (!favoriteGenres.length) {
        state.rows.recommendations = [];
        renderAllRows();
        return;
    }

    try {
        const recommendations = await fetchRecommendationsByGenres(favoriteGenres, 12);
        const watchlistKeys = new Set(state.watchlist.map((item) => `${item.mediaType}:${item.id}`));
        state.rows.recommendations = recommendations.filter((item) => !watchlistKeys.has(`${item.mediaType}:${item.id}`)).slice(0, 12);
    } catch (error) {
        console.error(error);
        state.rows.recommendations = [];
    }
}

function getPreferredGenreIds() {
    const scores = new Map();

    state.watchlist.forEach((item) => {
        (item.genreIds || []).forEach((genreId) => {
            scores.set(genreId, (scores.get(genreId) || 0) + 1);
        });
    });

    return [...scores.entries()]
        .sort((left, right) => right[1] - left[1])
        .map(([genreId]) => genreId);
}

function scrollTrack(trackId, direction) {
    const track = document.getElementById(trackId);
    if (!track) {
        return;
    }

    track.scrollBy({
        left: direction * Math.max(track.clientWidth * 0.8, 320),
        behavior: "smooth",
    });
}
