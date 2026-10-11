(() => {
    const ACCOUNTS = {
        admin: {
            username: "admin",
            password: "admin1234",
            role: "admin",
            label: "Admin"
        }
    };

    const STORAGE_KEY = "erzglonker-site-access";
    const pathname = window.location.pathname;
    const currentPage = pathname.split("/").pop() || "index.html";
    const isLoginPage = currentPage === "mitglieder.html";

    const loginForm = document.getElementById("login-form");
    const loginMessage = document.getElementById("loginMessage");
    const logoutButtons = Array.from(document.querySelectorAll("[data-logout-button]"));
    const adminElements = Array.from(document.querySelectorAll("[data-admin-only]"));
    const roleBadge = document.getElementById("roleBadge");

    const normalizeKey = (value) => String(value || "").trim().toLowerCase();
    const getRootPrefix = () => {
        if (/\/(intern|vorstand)(?:\/|$)/.test(pathname)) {
            return "../";
        }

        return "";
    };

    const getStoredSession = () => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    };

    const setStoredSession = (account) => {
        sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                username: account.username,
                role: account.role,
                label: account.label
            })
        );
    };

    const clearStoredSession = () => {
        sessionStorage.removeItem(STORAGE_KEY);
    };

    // Revoke logins saved by earlier versions of the website.
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Storage can be unavailable in private browsing modes.
    }

    const getSession = () => {
        const session = getStoredSession();

        const account = ACCOUNTS[normalizeKey(session?.username)];

        if (!account || session.role !== account.role) {
            return null;
        }

        return session;
    };

    const isAdmin = (session) => Boolean(session) && session.role === "admin";

    const getDefaultTarget = () => `${getRootPrefix()}intern/`;

    const canAccessPath = (session, path) => {
        const isProtected = /\/(intern|vorstand)(?:\/|$)/.test(path) ||
            path.endsWith("/bildergalerie.html") ||
            path.endsWith("/intern.html") ||
            path.endsWith("/admin.html");

        return !isProtected || isAdmin(session);
    };

    const redirectToLogin = () => {
        const next = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
        window.location.href = `${getRootPrefix()}mitglieder.html?next=${next}`;
    };

    const redirectToBestPage = (session) => {
        const params = new URLSearchParams(window.location.search);
        const next = params.get("next");

        if (next && canAccessPath(session, next)) {
            window.location.href = next;
            return;
        }

        window.location.href = getDefaultTarget();
    };

    const setMessage = (text, isError = false) => {
        if (!loginMessage) {
            return;
        }

        loginMessage.textContent = text;
        loginMessage.classList.toggle("is-error", isError);
        loginMessage.classList.toggle("is-success", Boolean(text) && !isError);
    };

    const session = getSession();

    if (!isLoginPage && !canAccessPath(session, pathname)) {
        redirectToLogin();
        return;
    }

    if (isLoginPage && session) {
        redirectToBestPage(session);
        return;
    }

    const redirectTarget = document.body.dataset.redirectTo;
    if (redirectTarget) {
        window.location.replace(redirectTarget);
        return;
    }

    adminElements.forEach((element) => {
        element.classList.toggle("is-hidden", !isAdmin(session));
    });

    if (roleBadge && session) {
        roleBadge.textContent = session.label;
    }

    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const username = normalizeKey(document.getElementById("username")?.value);
            const password = document.getElementById("password")?.value || "";
            const account = ACCOUNTS[username];

            if (!account || password !== account.password) {
                setMessage("Benutzername oder Passwort ist nicht korrekt.", true);
                return;
            }

            setStoredSession(account);
            setMessage(`Zugang als ${account.label} freigeschaltet.`);
            window.setTimeout(() => {
                redirectToBestPage(account);
            }, 250);
        });
    }

    logoutButtons.forEach((button) => {
        button.addEventListener("click", () => {
            clearStoredSession();
            redirectToLogin();
        });
    });

    document.body.classList.remove("auth-pending");
})();
