import { TMDB_API_BASE_URL, TMDB_API_KEY, TMDB_BEARER_TOKEN } from "./config.js";
import { state } from "./state.js";
import { normalizeItem, normalizeResults } from "./utils.js";

export async function fetchTmdbJson(path, params = {}) {
    const searchParams = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: "fr-FR",
        ...params,
    });

    const response = await fetch(`${TMDB_API_BASE_URL}${path}?${searchParams.toString()}`, {
        headers: {
            accept: "application/json",
            Authorization: `Bearer ${TMDB_BEARER_TOKEN}`,
        },
    });
    const payload = await response.json();

    if (!response.ok) {
        throw new Error(payload.status_message || `TMDB request failed: ${response.status} ${response.statusText}`);
    }

    return payload;
}

export async function fetchHomeFeed() {
    const [movieGenresResult, tvGenresResult, trendingResult, popularMoviesResult, topMoviesResult, seriesResult, actionResult, comedyResult, horrorResult] = await Promise.allSettled([
        fetchTmdbJson("/genre/movie/list"),
        fetchTmdbJson("/genre/tv/list"),
        fetchTmdbJson("/trending/all/week"),
        fetchTmdbJson("/movie/popular"),
        fetchTmdbJson("/movie/top_rated"),
        fetchTmdbJson("/tv/popular"),
        fetchTmdbJson("/discover/movie", { sort_by: "popularity.desc", include_adult: "false", with_genres: "28" }),
        fetchTmdbJson("/discover/movie", { sort_by: "popularity.desc", include_adult: "false", with_genres: "35" }),
        fetchTmdbJson("/discover/movie", { sort_by: "popularity.desc", include_adult: "false", with_genres: "27" }),
    ]);

    return { movieGenresResult, tvGenresResult, trendingResult, popularMoviesResult, topMoviesResult, seriesResult, actionResult, comedyResult, horrorResult };
}

export async function fetchGenreLookups() {
    const [movieGenresResult, tvGenresResult] = await Promise.allSettled([
        fetchTmdbJson("/genre/movie/list"),
        fetchTmdbJson("/genre/tv/list"),
    ]);

    return { movieGenresResult, tvGenresResult };
}

export async function fetchSearchResults(query) {
    const result = await fetchTmdbJson("/search/multi", { query, include_adult: "false" });
    return normalizeResults(result.results, 18);
}

export async function fetchDiscoverSearchFeed(query, filters = {}) {
    const mediaType = filters.mediaType || "all";
    const page = String(filters.page || 1);
    const endpoint = mediaType === "movie" || mediaType === "tv" ? `/search/${mediaType}` : "/search/multi";
    const result = await fetchTmdbJson(endpoint, {
        query,
        page,
        include_adult: "false",
    });

    const filteredItems = normalizeResults(result.results || [], 40).filter((item) => {
        const matchesRating = !filters.voteAverageGte || item.voteAverage >= Number(filters.voteAverageGte);
        const itemDate = item.date || "";
        const matchesDateFrom = !filters.releaseDateGte || !itemDate || itemDate >= filters.releaseDateGte;
        const matchesDateTo = !filters.releaseDateLte || !itemDate || itemDate <= filters.releaseDateLte;
        return matchesRating && matchesDateFrom && matchesDateTo;
    });

    return {
        items: filteredItems,
        page: result.page || Number(page),
        totalPages: result.total_pages || 1,
        totalResults: result.total_results || filteredItems.length,
    };
}

export async function fetchDetails(id, mediaType) {
    const cacheKey = `${mediaType}:${id}`;
    if (state.detailsCache.has(cacheKey)) {
        return state.detailsCache.get(cacheKey);
    }

    const result = await fetchTmdbJson(`/${mediaType}/${id}`, {
        append_to_response: "videos,credits,similar",
    });
    const detail = normalizeItem({ ...result, media_type: mediaType });
    state.detailsCache.set(cacheKey, detail);
    return detail;
}

export async function fetchDiscoverFeed(filters = {}) {
    const mediaType = filters.mediaType || "all";
    const page = String(filters.page || 1);
    const voteAverageGte = filters.voteAverageGte || "";
    const releaseDateGte = filters.releaseDateGte || "";
    const releaseDateLte = filters.releaseDateLte || "";

    const buildParams = (type) => ({
        page,
        sort_by: "popularity.desc",
        include_adult: "false",
        "vote_average.gte": voteAverageGte || undefined,
        ...(type === "movie"
            ? {
                "primary_release_date.gte": releaseDateGte || undefined,
                "primary_release_date.lte": releaseDateLte || undefined,
            }
            : {
                "first_air_date.gte": releaseDateGte || undefined,
                "first_air_date.lte": releaseDateLte || undefined,
            }),
    });

    if (mediaType === "movie" || mediaType === "tv") {
        const result = await fetchTmdbJson(`/discover/${mediaType}`, buildParams(mediaType));
        return {
            items: normalizeResults(result.results || [], 40),
            page: result.page || Number(page),
            totalPages: result.total_pages || 1,
            totalResults: result.total_results || 0,
        };
    }

    const [moviesResult, tvResult] = await Promise.all([
        fetchTmdbJson("/discover/movie", buildParams("movie")),
        fetchTmdbJson("/discover/tv", buildParams("tv")),
    ]);

    const merged = normalizeResults([...(moviesResult.results || []), ...(tvResult.results || [])], 80)
        .sort((left, right) => right.popularity - left.popularity);

    return {
        items: merged,
        page: Math.max(moviesResult.page || 1, tvResult.page || 1),
        totalPages: Math.max(moviesResult.total_pages || 1, tvResult.total_pages || 1),
        totalResults: (moviesResult.total_results || 0) + (tvResult.total_results || 0),
    };
}
