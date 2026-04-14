import { TMDB_API_BASE_URL, TMDB_API_KEY, TMDB_BEARER_TOKEN } from "./config.js";

const fallbackShowcase = {
    title: "Découvre une nouvelle sélection",
    meta: "Film ou série mise en avant",
    backdrop: "https://image.tmdb.org/t/p/original/9yBVqNruk6Ykrwc32qrK2TIE5xw.jpg",
};

export async function initAuthShowcase() {
    const showcase = document.querySelector("[data-auth-showcase]");
    const title = document.getElementById("auth-featured-title");
    const meta = document.getElementById("auth-featured-meta");

    if (!showcase || !title || !meta) {
        return;
    }

    applyShowcase(showcase, title, meta, fallbackShowcase);

    try {
        const payload = await fetchTrendingRecommendation();
        if (payload) {
            applyShowcase(showcase, title, meta, payload);
        }
    } catch (error) {
        console.error(error);
    }
}

async function fetchTrendingRecommendation() {
    const searchParams = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: "fr-FR",
    });

    const response = await fetch(`${TMDB_API_BASE_URL}/trending/all/week?${searchParams.toString()}`, {
        headers: {
            accept: "application/json",
            Authorization: `Bearer ${TMDB_BEARER_TOKEN}`,
        },
    });

    if (!response.ok) {
        return null;
    }

    const payload = await response.json();
    const candidates = (payload.results || []).filter((item) => item.backdrop_path && (item.title || item.name));
    if (!candidates.length) {
        return null;
    }

    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    const mediaType = picked.media_type === "movie" ? "Film" : "Série";
    const releaseDate = picked.release_date || picked.first_air_date || "";
    const year = releaseDate ? releaseDate.slice(0, 4) : "Nouveauté";

    return {
        title: picked.title || picked.name,
        meta: `${mediaType} • ${year}`,
        backdrop: `https://image.tmdb.org/t/p/original${picked.backdrop_path}`,
    };
}

function applyShowcase(showcase, titleNode, metaNode, payload) {
    showcase.style.backgroundImage = `linear-gradient(180deg, rgba(5, 8, 15, 0.16), rgba(5, 8, 15, 0.82)), url("${payload.backdrop}")`;
    titleNode.textContent = payload.title;
    metaNode.textContent = payload.meta;
}
