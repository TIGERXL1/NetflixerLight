import { loginUser, redirectAuthenticated } from "./auth-store.js";
import { initAuthShowcase } from "./auth-showcase.js";
import { initTheme } from "./theme.js";

initTheme();
initAuthShowcase();

if (!(await redirectAuthenticated("index.html"))) {
    const form = document.getElementById("login-form");
    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    const message = document.getElementById("login-message");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        message.textContent = "";

        try {
            await loginUser({
                email: emailInput.value,
                password: passwordInput.value,
            });
            window.location.replace("index.html");
        } catch (error) {
            message.textContent = error.message;
        }
    });
}
