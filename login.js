const adminUser = {
    username: ["ad", "min"].join(""),
    password: ["Ezglonker", "2026!"].join(""),
    displayName: "Admin"
};

const sessionKey = "erzglonkerSession";
const currentPage = window.location.pathname.split("/").pop() || "mitglieder.html";
const isLoginPage = currentPage === "mitglieder.html" || currentPage === "login.html";
const isInternalPage = currentPage === "intern.html";

const loginBox = document.getElementById("loginBox");
const memberName = document.getElementById("memberName");
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("loginMessage");
const logoutButton = document.getElementById("logoutButton");

const redirectToInternal = () => {
    window.location.href = "intern.html";
};

const redirectToLogin = () => {
    window.location.href = "mitglieder.html";
};

const isAuthenticated = sessionStorage.getItem(sessionKey) === adminUser.username;

if (memberName) {
    memberName.textContent = adminUser.displayName;
}

if (isAuthenticated && isLoginPage) {
    redirectToInternal();
}

if (!isAuthenticated && isInternalPage) {
    redirectToLogin();
}

if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const username = document.getElementById("username")?.value.trim() || "";
        const password = document.getElementById("password")?.value || "";

        if (username === adminUser.username && password === adminUser.password) {
            sessionStorage.setItem(sessionKey, adminUser.username);
            redirectToInternal();
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
