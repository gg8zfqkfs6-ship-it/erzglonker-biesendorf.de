const auth = window.ErzglonkerAuth;
const currentPage = window.location.pathname.split("/").pop() || "index.html";
const loginPages = new Set(["mitglieder.html", "login.html"]);
const protectedPages = new Set(["index.html", "bildergalerie.html", "admin.html"]);

const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("loginMessage");
const changePasswordForm = document.getElementById("change-password-form");
const changePasswordMessage = document.getElementById("changePasswordMessage");
const changePasswordBox = document.getElementById("changePasswordBox");
const loginIntro = document.getElementById("loginIntro");
const logoutButton = document.getElementById("logoutButton");
const changePasswordLogout = document.getElementById("changePasswordLogout");
const memberName = document.getElementById("memberName");
const authOnlyElements = Array.from(document.querySelectorAll("[data-auth-only]"));
const guestOnlyElements = Array.from(document.querySelectorAll("[data-guest-only]"));
const adminOnlyElements = Array.from(document.querySelectorAll("[data-admin-only]"));
const scheduleRows = Array.from(document.querySelectorAll("[data-schedule-row]"));
const filterButtons = Array.from(document.querySelectorAll("[data-filter-button]"));

const redirectToHome = () => {
    window.location.href = "index.html";
};

const redirectToLogin = () => {
    window.location.href = "mitglieder.html";
};

const normalizeKey = (value) => String(value || "").trim().toLowerCase();

const setMessage = (element, text, isError = false) => {
    if (!element) {
        return;
    }

    element.textContent = text;
    element.classList.toggle("is-error", isError);
    element.classList.toggle("is-success", Boolean(text) && !isError);
};

const applyAuthVisibility = (sessionUser) => {
    const hasAccess = auth.isReadyAuthenticated();
    const isAdmin = auth.isAdmin();

    if (memberName && hasAccess && sessionUser) {
        memberName.textContent = sessionUser.displayName;
    }

    authOnlyElements.forEach((element) => {
        element.classList.toggle("is-hidden", !hasAccess);
    });

    guestOnlyElements.forEach((element) => {
        element.classList.toggle("is-hidden", hasAccess);
    });

    adminOnlyElements.forEach((element) => {
        element.classList.toggle("is-hidden", !isAdmin);
    });
};

const applyScheduleFilter = (filter) => {
    filterButtons.forEach((button) => {
        const buttonFilter = button.dataset.filter || "";
        const needsGroup = !["all", "public"].includes(buttonFilter);
        const allowed = !needsGroup || auth.canAccessGroup(buttonFilter);
        const isActive = buttonFilter === filter;

        button.classList.toggle("is-hidden", !allowed);
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-selected", String(isActive));
    });

    scheduleRows.forEach((row) => {
        const group = row.dataset.filterGroup || "public";
        const allowed = group === "public" || auth.canAccessGroup(group);
        const hiddenByFilter = filter !== "all" && normalizeKey(group) !== normalizeKey(filter);
        row.classList.toggle("is-hidden", !allowed || hiddenByFilter);
    });
};

const setupSchedule = () => {
    if (!scheduleRows.length || !filterButtons.length) {
        return;
    }

    const defaultFilter = auth.isReadyAuthenticated() ? "all" : "public";

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            applyScheduleFilter(button.dataset.filter || defaultFilter);
        });
    });

    applyScheduleFilter(defaultFilter);
};

const applyLoginPageState = (sessionUser) => {
    if (!changePasswordBox || !loginForm) {
        return;
    }

    const mustChangePassword = Boolean(sessionUser?.mustChangePassword);
    loginForm.classList.toggle("is-hidden", mustChangePassword);
    changePasswordBox.classList.toggle("is-hidden", !mustChangePassword);

    if (loginIntro) {
        loginIntro.classList.toggle("is-hidden", mustChangePassword);
    }
};

const setupLoginForm = () => {
    if (!loginForm) {
        return;
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.getElementById("username")?.value.trim() || "";
        const password = document.getElementById("password")?.value || "";

        try {
            const authenticatedUser = await auth.login(username, password);
            setMessage(loginMessage, "");

            if (authenticatedUser.mustChangePassword) {
                const currentPasswordInput = document.getElementById("currentPassword");

                if (currentPasswordInput) {
                    currentPasswordInput.value = password;
                }

                applyLoginPageState(authenticatedUser);
                setMessage(changePasswordMessage, "Bitte jetzt ein neues Passwort festlegen.");
                document.getElementById("newPassword")?.focus();
                return;
            }

            redirectToHome();
        } catch (error) {
            setMessage(loginMessage, error.message, true);
        }
    });
};

const setupChangePasswordForm = () => {
    if (!changePasswordForm) {
        return;
    }

    changePasswordForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const currentPassword = document.getElementById("currentPassword")?.value || "";
        const newPassword = document.getElementById("newPassword")?.value || "";
        const confirmPassword = document.getElementById("confirmPassword")?.value || "";

        if (newPassword !== confirmPassword) {
            setMessage(changePasswordMessage, "Die neuen Passwörter stimmen nicht überein.", true);
            return;
        }

        try {
            await auth.changePassword(currentPassword, newPassword);
            setMessage(changePasswordMessage, "Passwort gespeichert. Du wirst jetzt weitergeleitet.");
            window.setTimeout(() => {
                redirectToHome();
            }, 500);
        } catch (error) {
            setMessage(changePasswordMessage, error.message, true);
        }
    });

    if (changePasswordLogout) {
        changePasswordLogout.addEventListener("click", async () => {
            await auth.logout();
            window.location.reload();
        });
    }
};

const setupLogout = () => {
    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener("click", async () => {
        await auth.logout();
        redirectToLogin();
    });
};

const boot = async () => {
    try {
        await auth.init();
        const sessionUser = auth.getSessionUser();

        applyAuthVisibility(sessionUser);
        applyLoginPageState(sessionUser);

        if (auth.isReadyAuthenticated() && loginPages.has(currentPage)) {
            redirectToHome();
            return;
        }

        if (!auth.isReadyAuthenticated() && protectedPages.has(currentPage)) {
            redirectToLogin();
            return;
        }

        if (currentPage === "admin.html" && !auth.isAdmin()) {
            redirectToHome();
            return;
        }

        setupLoginForm();
        setupChangePasswordForm();
        setupLogout();
        setupSchedule();
    } catch (error) {
        if (loginMessage) {
            setMessage(loginMessage, error.message, true);
        }
    } finally {
        document.body.classList.remove("auth-pending");
    }
};

boot();
