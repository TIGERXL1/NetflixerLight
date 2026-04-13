import { BACKDROP_FALLBACK } from "./config.js";
import { elements } from "./dom.js";
import { getGenreNames, isInWatchlist, state } from "./state.js";
import {
    buildBackdropUrl,
    buildPosterUrl,
    createPill,
    createSkeletonCards,
    escapeHtml,
    formatDuration,
    formatScore,
    getTrailerVideo,
} from "./utils.js";
import { loadPlayer, setPlayerErrorHandler, startPlayer, stopPlayer } from "./player.js";

setPlayerErrorHandler((message) => {
    showNotice(message);
});

export function showNotice(message) {
    elements.appNotice.textContent = message;
    elements.appNotice.classList.remove("is-hidden");
}

export function hideNotice() {
    elements.appNotice.textContent = "";
    elements.appNotice.classList.add("is-hidden");
}

export function openModal() {
    elements.modal.classList.remove("is-hidden");
    elements.modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

export function closeModal() {
    stopPlayer();
    elements.modal.classList.add("is-hidden");
    elements.modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}

export function renderLoadingTracks() {
    const skeleton = createSkeletonCards(5);
    elements.trendingTrack.innerHTML = skeleton;
    elements.moviesTrack.innerHTML = skeleton;
    elements.topTrack.innerHTML = skeleton;
    elements.seriesTrack.innerHTML = skeleton;
}

export function renderHero(item) {
    if (!item) {
        elements.heroBackdrop.style.backgroundImage = `url("${BACKDROP_FALLBACK}")`;
        elements.heroTitle.textContent = "NetflixerLight";
        elements.heroMeta.innerHTML = "";
        elements.heroOverview.textContent = "Explore les nouveautes, les tendances et les titres ajoutes a ta liste.";
        elements.heroList.textContent = "Ajouter a ma liste";
        return;
    }

    const meta = [
        createPill(item.mediaType === "movie" ? "Film" : "Serie"),
        createPill(item.date ? item.date.slice(0, 4) : "N/A"),
        createPill(formatScore(item.voteAverage)),
    ];
    const genres = getGenreNames(item).slice(0, 2);
    if (genres.length) {
        meta.push(createPill(genres.join(" / ")));
    }

    elements.heroBackdrop.style.backgroundImage = `linear-gradient(90deg, rgba(4, 8, 15, 0.28), rgba(4, 8, 15, 0.1)), url("${buildBackdropUrl(item.backdropPath)}")`;
    elements.heroTitle.textContent = item.title;
    elements.heroMeta.innerHTML = meta.join("");
    elements.heroOverview.textContent = item.overview;
    elements.heroList.textContent = isInWatchlist(item.id, item.mediaType) ? "Retirer de ma liste" : "Ajouter a ma liste";
}

export function renderTrack(container, items, emptyMessage) {
    if (!items.length) {
        container.innerHTML = `<article class="empty-state">${escapeHtml(emptyMessage)}</article>`;
        return;
    }
    container.innerHTML = items.map(createCardMarkup).join("");
}

export function renderCatalog(container, items, emptyMessage) {
    renderTrack(container, items, emptyMessage);
}

export function renderWatchlist() {
    renderTrack(elements.watchlistTrack, state.watchlist, "Ta liste est vide. Ajoute des contenus depuis les cartes ou la fiche.");
    if (state.activeDetail) {
        elements.modalWatchlist.textContent = isInWatchlist(state.activeDetail.id, state.activeDetail.mediaType) ? "Retirer de ma liste" : "Ajouter a ma liste";
    }
    if (state.featured) {
        elements.heroList.textContent = isInWatchlist(state.featured.id, state.featured.mediaType) ? "Retirer de ma liste" : "Ajouter a ma liste";
    }
}

export function renderAllRows() {
    renderTrack(elements.trendingTrack, state.rows.trending, "Aucune tendance disponible.");
    renderTrack(elements.moviesTrack, state.rows.movies, "Aucun film populaire disponible.");
    renderTrack(elements.topTrack, state.rows.top, "Aucun top film disponible.");
    renderTrack(elements.seriesTrack, state.rows.series, "Aucune serie populaire disponible.");
}

export function renderSearchState() {
    if (elements.searchSection.classList.contains("is-hidden")) {
        return;
    }
    renderTrack(elements.searchTrack, state.searchResults, "Aucun resultat pour cette recherche.");
}

export function renderModal(detail) {
    const meta = [
        createPill(detail.mediaType === "movie" ? "Film" : "Serie"),
        createPill(detail.date ? detail.date.slice(0, 4) : "N/A"),
        createPill(formatScore(detail.voteAverage)),
    ];
    const duration = formatDuration(detail);
    if (duration) {
        meta.push(createPill(duration));
    }
    const trailer = getTrailerVideo(detail.videos);

    elements.modalHero.style.backgroundImage = `linear-gradient(90deg, rgba(4, 8, 15, 0.32), rgba(4, 8, 15, 0.08)), url("${buildBackdropUrl(detail.backdropPath)}")`;
    loadPlayer(detail, elements);
    elements.modalKicker.textContent = detail.mediaType === "movie" ? "Fiche film" : "Fiche serie";
    elements.modalTitle.textContent = detail.title;
    elements.modalMeta.innerHTML = meta.join("");
    elements.modalOverview.textContent = detail.overview;
    elements.modalGenres.textContent = getGenreNames(detail).join(", ") || "-";
    elements.modalLanguage.textContent = detail.originalLanguage ? detail.originalLanguage.toUpperCase() : "-";
    elements.modalPopularity.textContent = detail.popularity ? detail.popularity.toFixed(1) : "-";
    elements.modalWatchlist.textContent = isInWatchlist(detail.id, detail.mediaType) ? "Retirer de ma liste" : "Ajouter a ma liste";

    if (trailer) {
        elements.modalTrailer.textContent = "Voir la bande-annonce";
        elements.modalTrailer.classList.remove("is-hidden");
        elements.modalTrailer.onclick = () => {
            startPlayer();
        };
    } else {
        elements.modalTrailer.classList.add("is-hidden");
        elements.modalTrailer.onclick = null;
    }
}

export function renderModalLoading() {
    stopPlayer();
    elements.modalHero.style.backgroundImage = `url("${BACKDROP_FALLBACK}")`;
    elements.modalKicker.textContent = "Veuillez patienter";
    elements.modalTitle.textContent = "Chargement des informations";
    elements.modalMeta.innerHTML = "";
    elements.modalOverview.textContent = "Les informations du programme sont en cours de chargement.";
    elements.modalGenres.textContent = "-";
    elements.modalLanguage.textContent = "-";
    elements.modalPopularity.textContent = "-";
    elements.modalTrailer.classList.remove("is-hidden");
    elements.modalTrailer.textContent = "Lecture";
    elements.modalTrailer.onclick = null;
    elements.modalWatchlist.textContent = "Ajouter a ma liste";
}

export function renderModalError() {
    stopPlayer();
    elements.modalHero.style.backgroundImage = `url("${BACKDROP_FALLBACK}")`;
    elements.modalKicker.textContent = "Erreur";
    elements.modalTitle.textContent = "Impossible de charger la fiche";
    elements.modalMeta.innerHTML = "";
    elements.modalOverview.textContent = "Une erreur est survenue pendant le chargement. Reessaie dans quelques secondes.";
    elements.modalGenres.textContent = "-";
    elements.modalLanguage.textContent = "-";
    elements.modalPopularity.textContent = "-";
    elements.modalTrailer.classList.add("is-hidden");
    elements.modalTrailer.onclick = null;
    elements.modalWatchlist.textContent = "Ajouter a ma liste";
}

function createCardMarkup(item) {
    const genreNames = getGenreNames(item).slice(0, 2).join(" / ");
    const metaParts = [item.date ? item.date.slice(0, 4) : "N/A"];
    if (genreNames) {
        metaParts.push(genreNames);
    }
    const toggleLabel = isInWatchlist(item.id, item.mediaType) ? "Retirer" : "Ma liste";

    return `
        <article class="media-card">
            <button class="card-hitbox" type="button" data-open-details data-id="${item.id}" data-media-type="${item.mediaType}">
                <div class="card-visual">
                    <img class="card-image" src="${buildPosterUrl(item.posterPath)}" alt="${escapeHtml(`Affiche ${item.title}`)}" loading="lazy">
                    <div class="card-overlay">
                        <span class="card-badge">${item.mediaType === "movie" ? "Film" : "Serie"}</span>
                        <span class="card-badge">${formatScore(item.voteAverage)}</span>
                    </div>
                </div>
            </button>
            <div class="card-body">
                <h3 class="card-title">${escapeHtml(item.title)}</h3>
                <p class="card-copy">${escapeHtml(metaParts.join(" . "))}</p>
                <div class="card-actions">
                    <button class="ghost-button" type="button" data-open-details data-id="${item.id}" data-media-type="${item.mediaType}">Details</button>
                    <button class="ghost-button" type="button" data-toggle-watchlist data-id="${item.id}" data-media-type="${item.mediaType}">${toggleLabel}</button>
                </div>
            </div>
        </article>
    `;
}
