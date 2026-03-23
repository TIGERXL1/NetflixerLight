import { API_BASE_URL, API_KEY } from "./config.js";
import { state } from "./state.js";
import { normalizeItem, normalizeResults } from "./utils.js";

export async function fetchJson(path, params = {}) {
    const searchParams = new URLSearchParams({ api_key: API_KEY, language: "fr-FR", ...params });
    const response = await fetch(`${API_BASE_URL}${path}?${searchParams.toString()}`);
    if (!response.ok) {
        throw new Error(`TMDB request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

export async function fetchHomeFeed() {
    const [movieGenresResult, tvGenresResult, trendingResult, popularMoviesResult, topMoviesResult, seriesResult] = await Promise.allSettled([
        fetchJson("/genre/movie/list"),
        fetchJson("/genre/tv/list"),
        fetchJson("/trending/all/week"),
        fetchJson("/movie/popular"),
        fetchJson("/movie/top_rated"),
        fetchJson("/tv/popular"),
    ]);

    return { movieGenresResult, tvGenresResult, trendingResult, popularMoviesResult, topMoviesResult, seriesResult };
}

export async function fetchSearchResults(query) {
    const result = await fetchJson("/search/multi", { query, include_adult: "false" });
    return normalizeResults(result.results, 18);
}

export async function fetchDetails(id, mediaType) {
    const cacheKey = `${mediaType}:${id}`;
    if (state.detailsCache.has(cacheKey)) {
        return state.detailsCache.get(cacheKey);
    }

    const result = await fetchJson(`/${mediaType}/${id}`, { append_to_response: "videos" });
    const detail = normalizeItem({ ...result, media_type: mediaType });
    state.detailsCache.set(cacheKey, detail);
    return detail;
}
