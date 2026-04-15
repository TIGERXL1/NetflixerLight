import { API_BASE_URL } from "./config.js";

/**
 * Recupere la note d'un contenu specifique
 */
export async function getRating(tmdbId, mediaType) {
    try {
        const payload = await requestJson(`/ratings/${tmdbId}/${mediaType}`);
        return payload.data?.rating || null;
    } catch (error) {
        console.error("Erreur getRating:", error);
        return null;
    }
}

/**
 * Note un contenu (1-5 etoiles)
 */
export async function setRating(tmdbId, mediaType, rating) {
    try {
        await requestJson("/ratings", {
            method: "POST",
            body: {
                tmdbId,
                mediaType,
                rating,
            },
        });
        return true;
    } catch (error) {
        console.error("Erreur setRating:", error);
        return false;
    }
}

/**
 * Supprime la note d'un contenu
 */
export async function deleteRating(tmdbId, mediaType) {
    try {
        await requestJson(`/ratings/${tmdbId}/${mediaType}`, {
            method: "DELETE",
        });
        return true;
    } catch (error) {
        console.error("Erreur deleteRating:", error);
        return false;
    }
}

/**
 * Recupere toutes les notes de l'utilisateur
 */
export async function getAllRatings(limit = 100) {
    try {
        const payload = await requestJson(`/ratings?limit=${limit}`);
        return payload.data?.ratings || [];
    } catch (error) {
        console.error("Erreur getAllRatings:", error);
        return [];
    }
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
