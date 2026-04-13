const STORAGE_KEY = "netflixerlight-theme";
const DEFAULT_THEME = "dark";

export function getStoredTheme() {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : DEFAULT_THEME;
}

export function applyTheme(theme) {
    const nextTheme = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    syncThemeToggles(nextTheme);
    return nextTheme;
}

export function toggleTheme() {
    return applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
}

export function initTheme() {
    return applyTheme(getStoredTheme());
}

export function bindThemeToggle(selector = "[data-theme-toggle]") {
    document.querySelectorAll(selector).forEach((button) => {
        button.addEventListener("click", () => {
            toggleTheme();
        });
    });

    syncThemeToggles(document.documentElement.dataset.theme || getStoredTheme());
}

function syncThemeToggles(theme) {
    const label = theme === "light" ? "Theme sombre" : "Theme clair";
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
        button.textContent = label;
        button.setAttribute("aria-label", label);
    });
}
