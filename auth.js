(() => {
    const PASSWORD = "1234";
    const STORAGE_KEY = "erzglonker-site-access";
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const isLoginPage = currentPage === "mitglieder.html";

    const getRootPrefix = () => {
        const path = window.location.pathname;

        if (path.includes("/intern/") || path.includes("/vorstand/")) {
            return "../";
        }

        return "";
    };

    const redirectToLogin = () => {
        const next = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
        window.location.href = `${getRootPrefix()}mitglieder.html?next=${next}`;
    };

    const redirectAfterLogin = () => {
        const params = new URLSearchParams(window.location.search);
        const next = params.get("next");
        window.location.href = next || "index.html";
    };

    const isUnlocked = () => localStorage.getItem(STORAGE_KEY) === "ok";

    const loginForm = document.getElementById("login-form");
    const loginMessage = document.getElementById("loginMessage");
    const logoutButtons = Array.from(document.querySelectorAll("[data-logout-button]"));

    const setMessage = (text, isError = false) => {
        if (!loginMessage) {
            return;
        }

        loginMessage.textContent = text;
        loginMessage.classList.toggle("is-error", isError);
        loginMessage.classList.toggle("is-success", Boolean(text) && !isError);
    };

    if (!isLoginPage && !isUnlocked()) {
        redirectToLogin();
        return;
    }

    if (isLoginPage && isUnlocked()) {
        redirectAfterLogin();
        return;
    }

    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const password = document.getElementById("password")?.value || "";

            if (password !== PASSWORD) {
                setMessage("Das Passwort ist nicht korrekt.", true);
                return;
            }

            localStorage.setItem(STORAGE_KEY, "ok");
            setMessage("Zugang freigeschaltet.");
            window.setTimeout(() => {
                redirectAfterLogin();
            }, 250);
        });
    }

    logoutButtons.forEach((button) => {
        button.addEventListener("click", () => {
            localStorage.removeItem(STORAGE_KEY);
            redirectToLogin();
        });
    });

    document.body.classList.remove("auth-pending");
})();
