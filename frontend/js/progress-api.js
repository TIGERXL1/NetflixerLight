import { API_BASE_URL } from "./config.js";

export async function getProgress(tmdbId, mediaType) {
    try {
        const payload = await requestJson(`/history/${tmdbId}/${mediaType}/progress`);
        return payload.data?.progress || null;
    } catch (error) {
        console.error("Erreur getProgress:", error);
        return null;
    }
}

export async function updateProgress(tmdbId, mediaType, progressSeconds, durationSeconds) {
    try {
        await requestJson(`/history/${tmdbId}/${mediaType}/progress`, {
            method: "PUT",
            body: {
                progressSeconds: Math.floor(progressSeconds),
                durationSeconds: Math.floor(durationSeconds),
            },
        });
        return true;
    } catch (error) {
        console.error("Erreur updateProgress:", error);
        return false;
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
