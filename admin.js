const auth = window.ErzglonkerAuth;
const userForm = document.getElementById("user-form");
const userMessage = document.getElementById("userMessage");
const groupForm = document.getElementById("group-form");
const groupMessage = document.getElementById("groupMessage");
const usersList = document.getElementById("usersList");
const groupsFieldset = document.getElementById("groupOptions");
const memberName = document.getElementById("memberName");
const logoutButton = document.getElementById("logoutButton");

const state = {
    groups: [],
    users: []
};

const showMessage = (element, text, isError = false) => {
    if (!element) {
        return;
    }

    element.textContent = text;
    element.classList.toggle("is-error", isError);
    element.classList.toggle("is-success", Boolean(text) && !isError);
};

const loadAdminData = async () => {
    const data = await auth.getAdminData();
    state.groups = data.groups;
    state.users = data.users;
};

const renderGroupsSelector = () => {
    if (!groupsFieldset) {
        return;
    }

    groupsFieldset.innerHTML = "";

    state.groups.forEach((group) => {
        const label = document.createElement("label");
        label.className = "checkbox-row";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = "userGroups";
        input.value = group;

        const span = document.createElement("span");
        span.textContent = group;

        label.append(input, span);
        groupsFieldset.append(label);
    });
};

const getSelectedGroups = () =>
    Array.from(document.querySelectorAll('input[name="userGroups"]:checked')).map((input) => input.value);

const renderUsers = () => {
    if (!usersList) {
        return;
    }

    usersList.innerHTML = "";

    state.users.forEach((user) => {
        const item = document.createElement("article");
        item.className = "admin-card";

        const heading = document.createElement("div");
        heading.className = "admin-card-header";

        const titleWrap = document.createElement("div");
        titleWrap.innerHTML = `
            <h3>${user.displayName}</h3>
            <p class="admin-subline">@${user.username}${user.isAdmin ? " · Admin" : ""}</p>
        `;

        const status = document.createElement("div");
        status.className = "status-row";
        status.innerHTML = user.mustChangePassword
            ? '<span class="status-chip status-chip--warn">Passwortwechsel offen</span>'
            : '<span class="status-chip">Aktiv</span>';

        heading.append(titleWrap, status);

        const groupsWrap = document.createElement("div");
        groupsWrap.className = "admin-group-wrap";

        state.groups.forEach((group) => {
            const label = document.createElement("label");
            label.className = "checkbox-row";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = user.groups.includes(group);
            checkbox.value = group;
            checkbox.addEventListener("change", async () => {
                const selected = Array.from(groupsWrap.querySelectorAll("input:checked")).map(
                    (input) => input.value
                );

                try {
                    await auth.updateUserGroups(user.username, selected);
                    await refreshAdminView();
                } catch (error) {
                    showMessage(userMessage, error.message, true);
                }
            });

            const span = document.createElement("span");
            span.textContent = group;
            label.append(checkbox, span);
            groupsWrap.append(label);
        });

        item.append(heading, groupsWrap);
        usersList.append(item);
    });
};

const refreshAdminView = async () => {
    await loadAdminData();
    renderGroupsSelector();
    renderUsers();
};

const boot = async () => {
    await auth.init();
    const currentUser = auth.getSessionUser();

    if (!auth.isReadyAuthenticated()) {
        window.location.href = "mitglieder.html";
        return;
    }

    if (!currentUser?.isAdmin) {
        window.location.href = "index.html";
        return;
    }

    if (memberName) {
        memberName.textContent = currentUser.displayName;
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            await auth.logout();
            window.location.href = "mitglieder.html";
        });
    }

    if (groupForm) {
        groupForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const input = document.getElementById("newGroupName");

            try {
                await auth.createGroup(input?.value || "");
                if (input) {
                    input.value = "";
                }
                await refreshAdminView();
                showMessage(groupMessage, "Gruppe wurde angelegt.");
            } catch (error) {
                showMessage(groupMessage, error.message, true);
            }
        });
    }

    if (userForm) {
        userForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            try {
                await auth.createUser({
                    username: document.getElementById("newUsername")?.value || "",
                    displayName: document.getElementById("newDisplayName")?.value || "",
                    password: document.getElementById("newPassword")?.value || "",
                    groups: getSelectedGroups(),
                    isAdmin: document.getElementById("isAdmin")?.checked || false
                });

                userForm.reset();
                await refreshAdminView();
                showMessage(userMessage, "Benutzer wurde angelegt. Beim ersten Login wird ein neues Passwort verlangt.");
            } catch (error) {
                showMessage(userMessage, error.message, true);
            }
        });
    }

    await refreshAdminView();
};

boot().catch((error) => {
    showMessage(userMessage, error.message, true);
});
