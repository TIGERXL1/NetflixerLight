/**
 * Cree un element d'etoiles interactif pour noter un contenu
 * @param {number|null} currentRating - Note actuelle (1-5) ou null
 * @param {function} onRate - Callback appele lors d'un clic sur une etoile
 * @returns {HTMLElement}
 */
export function createStarsElement(currentRating, onRate) {
    const container = document.createElement("div");
    container.className = "rating-stars";
    container.dataset.rating = currentRating || "0";

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement("button");
        star.type = "button";
        star.className = "rating-star";
        star.dataset.value = i;
        star.innerHTML = getStarSVG(i <= (currentRating || 0));
        star.setAttribute("aria-label", `Noter ${i} etoile${i > 1 ? "s" : ""}`);

        star.addEventListener("click", () => {
            if (onRate) {
                onRate(i);
            }
        });

        star.addEventListener("mouseenter", () => {
            updateStarsDisplay(container, i);
        });

        container.appendChild(star);
    }

    container.addEventListener("mouseleave", () => {
        updateStarsDisplay(container, currentRating || 0);
    });

    return container;
}

/**
 * Met a jour l'affichage des etoiles
 * @param {HTMLElement} container - Conteneur des etoiles
 * @param {number} rating - Note a afficher
 */
export function updateStarsDisplay(container, rating) {
    container.dataset.rating = rating;
    const stars = container.querySelectorAll(".rating-star");
    stars.forEach((star, index) => {
        const value = index + 1;
        const filled = value <= rating;
        star.innerHTML = getStarSVG(filled);
        star.classList.toggle("active", filled);
    });
}

/**
 * Genere le SVG d'une etoile
 * @param {boolean} filled - Etoile pleine ou vide
 * @returns {string}
 */
function getStarSVG(filled) {
    if (filled) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>`;
}

/**
 * Cree un element d'affichage de note en lecture seule
 * @param {number} rating - Note a afficher
 * @returns {HTMLElement}
 */
export function createReadOnlyStars(rating) {
    const container = document.createElement("div");
    container.className = "rating-stars rating-stars-readonly";

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement("span");
        star.className = "rating-star";
        star.innerHTML = getStarSVG(i <= rating);
        container.appendChild(star);
    }

    return container;
}

/**
 * Genere le HTML d'etoiles en lecture seule
 * @param {number} rating - Note a afficher (1-5)
 * @returns {string} HTML des etoiles
 */
export function createReadOnlyStarsHTML(rating) {
    if (!rating) return "";
    
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        const filled = i <= rating;
        const svg = filled
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
        stars.push(`<span class="rating-star">${svg}</span>`);
    }
    
    return `<div class="rating-stars rating-stars-readonly rating-stars-small">${stars.join("")}</div>`;
}
