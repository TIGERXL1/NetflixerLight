import { fetchDetails, fetchHomeFeed as fetchHomeFeedData, fetchSearchResults } from "./api.js";
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
    state,
    toggleWatchlist,
} from "./state.js";
import { createSkeletonCards, normalizeResults, pickFeatured } from "./utils.js";

initApp();

async function initApp() {
    bindEvents();
    renderLoadingTracks();
    renderWatchlist();

    try {
        await loadHomeFeed();
    } catch (error) {
        console.error(error);
        showNotice("Impossible de charger TMDB pour le moment. Verifie la connexion ou la cle API.");
    }
}

function bindEvents() {
    let searchDebounce = 0;

    elements.searchInput.addEventListener("input", (event) => {
        window.clearTimeout(searchDebounce);
        searchDebounce = window.setTimeout(() => handleSearch(event.target.value), 320);
    });

    document.addEventListener("click", async (event) => {
        const toggleButton = event.target.closest("[data-toggle-watchlist]");
        if (toggleButton) {
            const item = findItemByKey(Number(toggleButton.dataset.id), toggleButton.dataset.mediaType);
            if (item) {
                toggleWatchlist(item);
                renderHero(state.featured);
                renderWatchlist();
                renderAllRows();
                renderSearchState();
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

    elements.heroList.addEventListener("click", () => {
        if (state.featured) {
            toggleWatchlist(state.featured);
            renderHero(state.featured);
            renderWatchlist();
            renderAllRows();
            renderSearchState();
        }
    });

    elements.modalWatchlist.addEventListener("click", () => {
        if (state.activeDetail) {
            toggleWatchlist(state.activeDetail);
            renderHero(state.featured);
            renderWatchlist();
            renderAllRows();
            renderSearchState();
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
    } = await fetchHomeFeedData();

    hydrateGenreLookup(movieGenresResult, "movie");
    hydrateGenreLookup(tvGenresResult, "tv");

    state.rows.trending = pickMediaItems(trendingResult, 12);
    state.rows.movies = pickMediaItems(popularMoviesResult, 12);
    state.rows.top = pickMediaItems(topMoviesResult, 12);
    state.rows.series = pickMediaItems(seriesResult, 12);
    state.featured = pickFeatured([...state.rows.trending, ...state.rows.movies, ...state.rows.series]);

    renderHero(state.featured);
    renderAllRows();
    renderWatchlist();

    if (Object.values(state.rows).some((items) => items.length > 0)) {
        hideNotice();
    } else {
        showNotice("TMDB repond, mais aucun contenu exploitable n'a ete recupere.");
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
        elements.searchSummary.textContent = `${state.searchResults.length} resultat(s) pour "${trimmedQuery}"`;
        renderTrack(elements.searchTrack, state.searchResults, "Aucun resultat pour cette recherche.");
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
