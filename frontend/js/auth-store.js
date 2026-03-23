const USERS_STORAGE_KEY = "netflixerlight_users";
const SESSION_STORAGE_KEY = "netflixerlight_session";

export function getCurrentUser() {
    try {
        const rawValue = localStorage.getItem(SESSION_STORAGE_KEY);
        return rawValue ? JSON.parse(rawValue) : null;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export function requireAuth(redirectPath = "login.html") {
    const user = getCurrentUser();
    if (!user) {
        window.location.replace(redirectPath);
        return null;
    }
    return user;
}

export function redirectAuthenticated(targetPath = "index.html") {
    const user = getCurrentUser();
    if (user) {
        window.location.replace(targetPath);
        return true;
    }
    return false;
}

export function logoutUser() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function registerUser({ name, email, password }) {
    const users = getUsers();
    const normalizedEmail = email.trim().toLowerCase();

    if (users.some((user) => user.email === normalizedEmail)) {
        throw new Error("Un compte existe deja avec cet email.");
    }

    const newUser = {
        id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
        name: name.trim(),
        email: normalizedEmail,
        password,
    };

    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);
    return sanitizeUser(newUser);
}

export function loginUser({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = getUsers().find((entry) => entry.email === normalizedEmail && entry.password === password);

    if (!user) {
        throw new Error("Email ou mot de passe invalide.");
    }

    setCurrentUser(user);
    return sanitizeUser(user);
}

function getUsers() {
    try {
        const rawValue = localStorage.getItem(USERS_STORAGE_KEY);
        const parsed = rawValue ? JSON.parse(rawValue) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error(error);
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function setCurrentUser(user) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sanitizeUser(user)));
}

function sanitizeUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
    };
}
