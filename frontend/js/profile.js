import { logoutUser, requireAuth, updatePassword } from "./auth-store.js";
import { bindThemeToggle, initTheme } from "./theme.js";

initTheme();

const sessionUser = document.getElementById("session-user");
const logoutButton = document.getElementById("logout-button");
const notice = document.getElementById("app-notice");
const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
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

    logoutButton.addEventListener("click", async () => {
        try {
            await logoutUser();
        } finally {
            window.location.replace("login.html");
        }
    });

    form.addEventListener("submit", handleSubmit);
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
