import { fetchDetails, fetchDiscoverFeed, fetchGenreLookups } from "./api.js";
import { logoutUser, requireAuth } from "./auth-store.js";
import { elements } from "./dom.js";
import {
    closeModal,
    hideNotice,
    openModal,
    renderCatalog,
    renderModal,
    renderModalError,
    renderModalLoading,
    showNotice,
} from "./render.js";
import {
    findItemByKey,
    hydrateGenreLookup,
    isInWatchlist,
    loadWatchlist,
    state,
    toggleWatchlist,
} from "./state.js";
import { createSkeletonCards } from "./utils.js";

const discoverElements = {
    filters: document.getElementById("discover-filters"),
    type: document.getElementById("discover-type"),
    rating: document.getElementById("discover-rating"),
    dateFrom: document.getElementById("discover-date-from"),
    dateTo: document.getElementById("discover-date-to"),
    reset: document.getElementById("discover-reset"),
    grid: document.getElementById("discover-grid"),
    summary: document.getElementById("discover-summary"),
    prev: document.getElementById("discover-prev"),
    next: document.getElementById("discover-next"),
    pageLabel: document.getElementById("discover-page-label"),
};

const discoverState = {
    page: 1,
    totalPages: 1,
    filters: {
        mediaType: "all",
        voteAverageGte: "",
        releaseDateGte: "",
        releaseDateLte: "",
    },
    items: [],
};

bootstrap();

async function bootstrap() {
    const currentUser = await requireAuth("login.html");
    if (!currentUser) {
        return;
    }

    elements.sessionUser.textContent = currentUser.name || currentUser.email || "Compte";
    bindEvents();
    discoverElements.grid.innerHTML = createSkeletonCards(12);

    await Promise.all([loadWatchlist(), loadGenres()]);
    await loadDiscover();
}

function bindEvents() {
    discoverElements.filters.addEventListener("submit", async (event) => {
        event.preventDefault();
        discoverState.page = 1;
        syncFiltersFromForm();
        await loadDiscover();
    });

    discoverElements.reset.addEventListener("click", async () => {
        discoverElements.type.value = "all";
        discoverElements.rating.value = "";
        discoverElements.dateFrom.value = "";
        discoverElements.dateTo.value = "";
        discoverState.page = 1;
        syncFiltersFromForm();
        await loadDiscover();
    });

    discoverElements.prev.addEventListener("click", async () => {
        if (discoverState.page <= 1) {
            return;
        }
        discoverState.page -= 1;
        await loadDiscover();
    });

    discoverElements.next.addEventListener("click", async () => {
        if (discoverState.page >= discoverState.totalPages) {
            return;
        }
        discoverState.page += 1;
        await loadDiscover();
    });

    document.addEventListener("click", async (event) => {
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

function syncFiltersFromForm() {
    discoverState.filters = {
        mediaType: discoverElements.type.value,
        voteAverageGte: discoverElements.rating.value,
        releaseDateGte: discoverElements.dateFrom.value,
        releaseDateLte: discoverElements.dateTo.value,
    };
}

async function loadGenres() {
    const { movieGenresResult, tvGenresResult } = await fetchGenreLookups();
    hydrateGenreLookup(movieGenresResult, "movie");
    hydrateGenreLookup(tvGenresResult, "tv");
}

async function loadDiscover() {
    showNotice("Chargement du catalogue...");
    discoverElements.grid.innerHTML = createSkeletonCards(12);

    try {
        const payload = await fetchDiscoverFeed({
            ...discoverState.filters,
            page: discoverState.page,
        });

        discoverState.items = payload.items;
        state.discover = payload.items;
        discoverState.page = payload.page;
        discoverState.totalPages = payload.totalPages;

        renderCatalog(discoverElements.grid, discoverState.items, "Aucun contenu ne correspond a ces filtres.");
        updatePagination(payload.totalResults);
        hideNotice();
    } catch (error) {
        console.error(error);
        state.discover = [];
        discoverElements.grid.innerHTML = "";
        renderCatalog(discoverElements.grid, [], "Impossible de charger le catalogue.");
        showNotice("Impossible de charger le catalogue TMDB.");
    }
}

function updatePagination(totalResults) {
    discoverElements.summary.textContent = `${totalResults} resultat(s) . Page ${discoverState.page} sur ${discoverState.totalPages}`;
    discoverElements.pageLabel.textContent = `Page ${discoverState.page} / ${discoverState.totalPages}`;
    discoverElements.prev.disabled = discoverState.page <= 1;
    discoverElements.next.disabled = discoverState.page >= discoverState.totalPages;
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

async function handleWatchlistToggle(item) {
    try {
        await toggleWatchlist(item);
        renderCatalog(discoverElements.grid, discoverState.items, "Aucun contenu ne correspond a ces filtres.");
        if (state.activeDetail) {
            elements.modalWatchlist.textContent = isInWatchlist(state.activeDetail.id, state.activeDetail.mediaType)
                ? "Retirer de ma liste"
                : "Ajouter a ma liste";
        }
        hideNotice();
    } catch (error) {
        console.error(error);
        showNotice(error.message || "Impossible de mettre a jour les favoris.");
    }
}
