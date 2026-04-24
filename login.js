const adminUser = {
    username: "admin",
    password: "1234",
    displayName: "Admin"
};

const sessionKey = "erzglonkerSession";
const currentPage = window.location.pathname.split("/").pop() || "index.html";
const loginPages = new Set(["mitglieder.html", "login.html"]);
const protectedPages = new Set([
    "index.html",
    "bildergalerie.html"
]);

const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("loginMessage");
const logoutButton = document.getElementById("logoutButton");
const memberName = document.getElementById("memberName");
const authOnlyElements = Array.from(document.querySelectorAll("[data-auth-only]"));
const guestOnlyElements = Array.from(document.querySelectorAll("[data-guest-only]"));
const scheduleRows = Array.from(document.querySelectorAll("[data-schedule-row]"));
const filterButtons = Array.from(document.querySelectorAll("[data-filter-button]"));

const redirectToHome = () => {
    window.location.href = "index.html";
};

const redirectToLogin = () => {
    window.location.href = "mitglieder.html";
};

const isAuthenticated = sessionStorage.getItem(sessionKey) === adminUser.username;

if (memberName) {
    memberName.textContent = adminUser.displayName;
}

if (isAuthenticated) {
    authOnlyElements.forEach((element) => element.classList.remove("is-hidden"));
    guestOnlyElements.forEach((element) => element.classList.add("is-hidden"));
} else {
    authOnlyElements.forEach((element) => element.classList.add("is-hidden"));
    guestOnlyElements.forEach((element) => element.classList.remove("is-hidden"));
}

if (isAuthenticated && loginPages.has(currentPage)) {
    redirectToHome();
}

if (!isAuthenticated && protectedPages.has(currentPage)) {
    redirectToLogin();
}

if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const username = document.getElementById("username")?.value.trim() || "";
        const password = document.getElementById("password")?.value || "";

        if (username === adminUser.username && password === adminUser.password) {
            sessionStorage.setItem(sessionKey, adminUser.username);
            redirectToHome();
            return;
        }

        if (loginMessage) {
            loginMessage.textContent = "Benutzername oder Passwort ist nicht korrekt.";
        }
    });
}

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        sessionStorage.removeItem(sessionKey);
        redirectToLogin();
    });
}

if (scheduleRows.length && filterButtons.length) {
    const defaultFilter = isAuthenticated ? "all" : "public";

    const applyFilter = (filter) => {
        filterButtons.forEach((button) => {
            const isActive = button.dataset.filter === filter;
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-selected", String(isActive));
        });

        scheduleRows.forEach((row) => {
            const group = row.dataset.filterGroup || "public";
            const needsAuth = row.hasAttribute("data-auth-only");
            const hiddenByAuth = needsAuth && !isAuthenticated;
            const hiddenByFilter = filter !== "all" && group !== filter;
            row.classList.toggle("is-hidden", hiddenByAuth || hiddenByFilter);
        });
    };

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            applyFilter(button.dataset.filter || defaultFilter);
        });
    });

    applyFilter(defaultFilter);
}

document.body.classList.remove("auth-pending");
