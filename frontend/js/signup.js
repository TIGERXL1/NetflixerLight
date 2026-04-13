import { redirectAuthenticated, registerUser } from "./auth-store.js";

if (!(await redirectAuthenticated("index.html"))) {
    const form = document.getElementById("signup-form");
    const nameInput = document.getElementById("signup-name");
    const emailInput = document.getElementById("signup-email");
    const passwordInput = document.getElementById("signup-password");
    const confirmInput = document.getElementById("signup-confirm");
    const message = document.getElementById("signup-message");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        message.textContent = "";

        if (passwordInput.value.length < 6) {
            message.textContent = "Le mot de passe doit faire au moins 6 caracteres.";
            return;
        }

        if (passwordInput.value !== confirmInput.value) {
            message.textContent = "Les mots de passe ne correspondent pas.";
            return;
        }

        try {
            await registerUser({
                name: nameInput.value,
                email: emailInput.value,
                password: passwordInput.value,
            });
            window.location.replace("index.html");
        } catch (error) {
            message.textContent = error.message;
        }
    });
}
