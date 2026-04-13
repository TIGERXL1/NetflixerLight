import { API_BASE_URL } from "./config.js";
import { fetchTmdbJson } from "./api.js";
import { normalizeItem } from "./utils.js";

export async function fetchFavorites() {
    const payload = await requestJson("/favorites");
    const favorites = payload.data?.favorites || [];

    const items = await Promise.all(
        favorites.map(async (favorite) => {
            try {
                const detailPayload = await fetchTmdbJson(`/${favorite.media_type}/${favorite.tmdb_id}`, {
                    append_to_response: "videos,credits,similar",
                });
                return normalizeItem({
                    ...detailPayload,
                    media_type: favorite.media_type,
                });
            } catch (error) {
                console.error(error);
                return null;
            }
        })
    );

    return items.filter(Boolean);
}

export async function addFavorite(tmdbId, mediaType) {
    await requestJson("/favorites", {
        method: "POST",
        body: {
            tmdbId,
            mediaType,
        },
    });
}

export async function removeFavorite(tmdbId, mediaType) {
    await requestJson(`/favorites/${tmdbId}/${mediaType}`, {
        method: "DELETE",
    });
}

async function requestJson(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        credentials: "include",
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const payload = await response.json();

    if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Erreur API.");
    }

    return payload;
}
