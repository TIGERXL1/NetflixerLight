import { addFavorite, fetchFavorites, removeFavorite } from "./favorites-api.js";
import { getItemKey, normalizeItem } from "./utils.js";

export const state = {
    featured: null,
    activeDetail: null,
    watchlist: [],
    discover: [],
    rows: { recommendations: [], trending: [], movies: [], top: [], series: [], action: [], comedy: [], horror: [] },
    searchResults: [],
    searchRequestId: 0,
    detailsCache: new Map(),
    genreLookup: { movie: new Map(), tv: new Map() },
};

export async function loadWatchlist() {
    try {
        state.watchlist = await fetchFavorites();
    } catch (error) {
        console.error(error);
        state.watchlist = [];
    }
    return state.watchlist;
}

export function isInWatchlist(id, mediaType) {
    return state.watchlist.some((item) => item.id === id && item.mediaType === mediaType);
}

export async function toggleWatchlist(item) {
    const itemKey = getItemKey(item.id, item.mediaType);
    const exists = state.watchlist.some((entry) => getItemKey(entry.id, entry.mediaType) === itemKey);

    if (exists) {
        await removeFavorite(item.id, item.mediaType);
        state.watchlist = state.watchlist.filter((entry) => getItemKey(entry.id, entry.mediaType) !== itemKey);
    } else {
        await addFavorite(item.id, item.mediaType);
        state.watchlist = [normalizeItem({
            id: item.id,
            media_type: item.mediaType,
            title: item.mediaType === "movie" ? item.title : undefined,
            name: item.mediaType === "tv" ? item.title : undefined,
            overview: item.overview,
            poster_path: item.posterPath,
            backdrop_path: item.backdropPath,
            vote_average: item.voteAverage,
            popularity: item.popularity,
            release_date: item.mediaType === "movie" ? item.date : undefined,
            first_air_date: item.mediaType === "tv" ? item.date : undefined,
            genre_ids: item.genreIds,
            genres: item.genres,
            original_language: item.originalLanguage,
            runtime: item.runtime,
            episode_run_time: item.episodeRuntime,
            number_of_seasons: item.seasons,
        }), ...state.watchlist];
    }
}

export function hydrateGenreLookup(result, mediaType) {
    if (result.status !== "fulfilled" || !result.value?.genres) {
        return;
    }
    state.genreLookup[mediaType] = new Map(result.value.genres.map((genre) => [genre.id, genre.name]));
}

export function getGenreNames(item) {
    if (Array.isArray(item.genres) && item.genres.length > 0) {
        return item.genres.map((genre) => genre.name).filter(Boolean);
    }
    const lookup = state.genreLookup[item.mediaType] || new Map();
    return (item.genreIds || []).map((genreId) => lookup.get(genreId)).filter(Boolean);
}

export function findItemByKey(id, mediaType) {
    const collections = [
        state.featured ? [state.featured] : [],
        state.watchlist,
        state.discover,
        state.searchResults,
        state.rows.recommendations,
        state.rows.trending,
        state.rows.movies,
        state.rows.top,
        state.rows.series,
        state.rows.action,
        state.rows.comedy,
        state.rows.horror,
        state.activeDetail ? [state.activeDetail] : [],
    ];

    for (const collection of collections) {
        const found = collection.find((item) => item.id === id && item.mediaType === mediaType);
        if (found) {
            return found;
        }
    }

    return null;
}
