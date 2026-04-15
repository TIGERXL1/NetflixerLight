import { logoutUser, requireAuth, updatePassword } from "./auth-store.js";
import { bindThemeToggle, initTheme } from "./theme.js";
import { getAllRatings } from "./ratings-api.js";
import { createReadOnlyStarsHTML } from "./ratings-ui.js";
import { fetchDetails } from "./api.js";
import { buildPosterUrl } from "./utils.js";

initTheme();

const sessionUser = document.getElementById("session-user");
const logoutButton = document.getElementById("logout-button");
const notice = document.getElementById("app-notice");
const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
const profileRatingsList = document.getElementById("profile-ratings-list");
const form = document.getElementById("profile-password-form");
const currentPasswordInput = document.getElementById("profile-current-password");
const newPasswordInput = document.getElementById("profile-new-password");
const confirmPasswordInput = document.getElementById("profile-confirm-password");
const message = document.getElementById("profile-message");

bootstrap();

async function bootstrap() {
    const currentUser = await requireAuth("login.html");
    if (!currentUser) {
        return;
    }

    bindThemeToggle();
    sessionUser.textContent = currentUser.name || currentUser.email || "Compte";
    profileName.textContent = currentUser.name || "-";
    profileEmail.textContent = currentUser.email || "-";

    await loadAndDisplayRatings();

    logoutButton.addEventListener("click", async () => {
        try {
            await logoutUser();
        } finally {
            window.location.replace("login.html");
        }
    });

    form.addEventListener("submit", handleSubmit);
}

async function loadAndDisplayRatings() {
    try {
        const ratings = await getAllRatings();
        
        if (!ratings.length) {
            profileRatingsList.innerHTML = '<p class="profile-hint">Tu n\'as pas encore noté de contenu.</p>';
            return;
        }

        profileRatingsList.innerHTML = '<p class="profile-hint">Chargement des détails...</p>';

        const ratingsWithDetails = await Promise.all(
            ratings.map(async (rating) => {
                try {
                    const details = await fetchDetails(rating.tmdb_id, rating.media_type);
                    return { ...rating, details };
                } catch (error) {
                    console.error(`Erreur chargement détails pour ${rating.tmdb_id}:`, error);
                    return { ...rating, details: null };
                }
            })
        );

        const ratingsHTML = ratingsWithDetails.map(rating => {
            const mediaType = rating.media_type === "movie" ? "Film" : "Série";
            const starsHTML = createReadOnlyStarsHTML(rating.rating);
            const title = rating.details?.title || `ID: ${rating.tmdb_id}`;
            const posterUrl = rating.details ? buildPosterUrl(rating.details.posterPath) : "";
            
            return `
                <div class="profile-rating-item">
                    ${posterUrl ? `<img src="${posterUrl}" alt="${title}" class="profile-rating-poster">` : ''}
                    <div class="profile-rating-info">
                        <span class="profile-rating-badge">${mediaType}</span>
                        <span class="profile-rating-title">${title}</span>
                    </div>
                    ${starsHTML}
                </div>
            `;
        }).join("");

        profileRatingsList.innerHTML = ratingsHTML;
    } catch (error) {
        console.error("Erreur lors du chargement des notes:", error);
        profileRatingsList.innerHTML = '<p class="profile-hint">Erreur lors du chargement des notes.</p>';
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    message.textContent = "";
    hideNotice();

    if (newPasswordInput.value !== confirmPasswordInput.value) {
        message.textContent = "Les mots de passe ne correspondent pas.";
        return;
    }

    try {
        await updatePassword({
            currentPassword: currentPasswordInput.value,
            newPassword: newPasswordInput.value,
        });
        form.reset();
        message.textContent = "Mot de passe mis à jour.";
        showNotice("Le mot de passe a bien été mis à jour.");
    } catch (error) {
        message.textContent = error.message;
        showNotice(error.message);
    }
}

function showNotice(text) {
    notice.textContent = text;
    notice.classList.remove("is-hidden");
}

function hideNotice() {
    notice.textContent = "";
    notice.classList.add("is-hidden");
}
