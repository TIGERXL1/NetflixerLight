import { BACKDROP_FALLBACK, IMAGE_BASE_URL, POSTER_FALLBACK } from "./config.js";

export function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

export function getItemKey(id, mediaType) {
    return `${mediaType}:${id}`;
}

export function formatScore(score) {
    return score ? `${score.toFixed(1)}/10` : "N/A";
}

export function formatDuration(item) {
    const runtime = item.mediaType === "movie" ? item.runtime : Number(item.episodeRuntime?.[0]) || 0;
    if (runtime) {
        const hours = Math.floor(runtime / 60);
        const minutes = runtime % 60;
        return hours > 0 ? `${hours}h ${String(minutes).padStart(2, "0")}` : `${minutes} min`;
    }
    if (item.seasons) {
        return `${item.seasons} saison(s)`;
    }
    return "";
}

export function getTrailerVideo(videos) {
    return (videos || []).find((video) => video.site === "YouTube" && (video.type === "Trailer" || video.type === "Teaser")) || null;
}

export function createPill(label) {
    return `<span class="pill">${escapeHtml(label)}</span>`;
}

export function buildPosterUrl(path) {
    return path ? `${IMAGE_BASE_URL}/w500${path}` : POSTER_FALLBACK;
}

export function buildBackdropUrl(path) {
    return path ? `${IMAGE_BASE_URL}/original${path}` : BACKDROP_FALLBACK;
}

export function createSkeletonCards(count) {
    return Array.from({ length: count }, () => '<article class="card-skeleton"></article>').join("");
}

export function normalizeItem(item) {
    if (!item || item.media_type === "person") {
        return null;
    }

    const mediaType = item.media_type || (item.first_air_date || item.name ? "tv" : "movie");
    return {
        id: item.id,
        mediaType,
        title: item.title || item.name || "Titre indisponible",
        overview: item.overview || "Aucun resume disponible pour le moment.",
        posterPath: item.poster_path || "",
        backdropPath: item.backdrop_path || "",
        voteAverage: Number(item.vote_average) || 0,
        popularity: Number(item.popularity) || 0,
        date: item.release_date || item.first_air_date || "",
        genreIds: Array.isArray(item.genre_ids) ? item.genre_ids : [],
        genres: Array.isArray(item.genres) ? item.genres : [],
        originalLanguage: item.original_language || "",
        runtime: Number(item.runtime) || 0,
        episodeRuntime: Array.isArray(item.episode_run_time) ? item.episode_run_time : [],
        seasons: Number(item.number_of_seasons) || 0,
        videos: Array.isArray(item.videos?.results) ? item.videos.results : [],
    };
}

export function normalizeResults(results, limit) {
    const seen = new Set();

    return results
        .map((item) => normalizeItem(item))
        .filter(Boolean)
        .filter((item) => {
            const key = getItemKey(item.id, item.mediaType);
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        })
        .filter((item) => item.posterPath || item.backdropPath)
        .slice(0, limit);
}

export function pickFeatured(items) {
    const candidates = items.filter((item) => item.backdropPath);
    return candidates[Math.floor(Math.random() * candidates.length)] || items[0] || null;
}
