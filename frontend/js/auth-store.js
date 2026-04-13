import { API_BASE_URL } from "./config.js";

export async function getCurrentUser() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            credentials: "include",
        });
        const payload = await safeJson(response);

        if (!response.ok || !payload?.success) {
            return null;
        }

        const user = payload.data?.user;
        if (!user) {
            return null;
        }

        return {
            id: user.id,
            name: user.username,
            email: user.email,
        };
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function requireAuth(redirectPath = "login.html") {
    const user = await getCurrentUser();
    if (!user) {
        window.location.replace(redirectPath);
        return null;
    }
    return user;
}

export async function redirectAuthenticated(targetPath = "index.html") {
    const user = await getCurrentUser();
    if (user) {
        window.location.replace(targetPath);
        return true;
    }
    return false;
}

export async function logoutUser() {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
    });
    const payload = await safeJson(response);

    if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Impossible de se deconnecter.");
    }
}

export async function registerUser({ name, email, password }) {
    const payload = await requestAuth("/auth/register", {
        email: email.trim().toLowerCase(),
        username: name.trim(),
        password,
    });

    return {
        id: payload.data.user.id,
        name: payload.data.user.username,
        email: payload.data.user.email,
    };
}

export async function loginUser({ email, password }) {
    const payload = await requestAuth("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
    });

    return {
        id: payload.data.user.id,
        name: payload.data.user.username,
        email: payload.data.user.email,
    };
}

async function requestAuth(path, body) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
    });
    const payload = await safeJson(response);

    if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Erreur d'authentification.");
    }

    return payload;
}

async function safeJson(response) {
    try {
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}
