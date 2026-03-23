import { WATCHLIST_STORAGE_KEY } from "./config.js";
import { getItemKey, normalizeItem, toStoredItem } from "./utils.js";

export const state = {
    featured: null,
    activeDetail: null,
    watchlist: loadWatchlist(),
    rows: { trending: [], movies: [], top: [], series: [] },
    searchResults: [],
    searchRequestId: 0,
    detailsCache: new Map(),
    genreLookup: { movie: new Map(), tv: new Map() },
};

export function loadWatchlist() {
    try {
        const rawValue = localStorage.getItem(WATCHLIST_STORAGE_KEY);
        if (!rawValue) {
            return [];
        }
        const parsed = JSON.parse(rawValue);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed
            .map((item) => normalizeItem({ ...item, media_type: item.mediaType || item.media_type }))
            .filter(Boolean);
    } catch (error) {
        console.error(error);
        return [];
    }
}

export function saveWatchlist() {
    try {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(state.watchlist.map(toStoredItem)));
    } catch (error) {
        console.error(error);
    }
}

export function isInWatchlist(id, mediaType) {
    return state.watchlist.some((item) => item.id === id && item.mediaType === mediaType);
}

export function toggleWatchlist(item) {
    const itemKey = getItemKey(item.id, item.mediaType);
    const exists = state.watchlist.some((entry) => getItemKey(entry.id, entry.mediaType) === itemKey);

    if (exists) {
        state.watchlist = state.watchlist.filter((entry) => getItemKey(entry.id, entry.mediaType) !== itemKey);
    } else {
        state.watchlist = [normalizeItem({ ...toStoredItem(item), media_type: item.mediaType }), ...state.watchlist];
    }

    saveWatchlist();
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
        state.searchResults,
        state.rows.trending,
        state.rows.movies,
        state.rows.top,
        state.rows.series,
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
