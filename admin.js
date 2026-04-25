const auth = window.ErzglonkerAuth;
const currentUser = auth.getSessionUser();

if (!currentUser) {
    window.location.href = "mitglieder.html";
}

if (!currentUser?.isAdmin) {
    window.location.href = "index.html";
}

const userForm = document.getElementById("user-form");
const userMessage = document.getElementById("userMessage");
const groupForm = document.getElementById("group-form");
const groupMessage = document.getElementById("groupMessage");
const usersList = document.getElementById("usersList");
const groupsFieldset = document.getElementById("groupOptions");
const memberName = document.getElementById("memberName");
const logoutButton = document.getElementById("logoutButton");

const showMessage = (element, text, isError = false) => {
    if (!element) {
        return;
    }
    element.textContent = text;
    element.classList.toggle("is-error", isError);
};

const renderGroupsSelector = () => {
    if (!groupsFieldset) {
        return;
    }

    const groups = auth.getGroups();
    groupsFieldset.innerHTML = "";

    groups.forEach((group) => {
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

    const users = auth.getUsers();
    usersList.innerHTML = "";

    users.forEach((user) => {
        const item = document.createElement("article");
        item.className = "admin-card";

        const heading = document.createElement("div");
        heading.className = "admin-card-header";
        heading.innerHTML = `
            <div>
                <h3>${user.displayName}</h3>
                <p class="admin-subline">@${user.username}${user.isAdmin ? " · Admin" : ""}</p>
            </div>
        `;

        const groupsWrap = document.createElement("div");
        groupsWrap.className = "admin-group-wrap";

        auth.getGroups().forEach((group) => {
            const label = document.createElement("label");
            label.className = "checkbox-row";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = user.groups.includes(group);
            checkbox.disabled = user.isAdmin && group === "Vorstandschaft";
            checkbox.addEventListener("change", () => {
                const selected = Array.from(groupsWrap.querySelectorAll("input:checked")).map(
                    (input) => input.value
                );
                auth.updateUserGroups(user.username, selected);
                renderUsers();
            });
            checkbox.value = group;

            const span = document.createElement("span");
            span.textContent = group;
            label.append(checkbox, span);
            groupsWrap.append(label);
        });

        item.append(heading, groupsWrap);
        usersList.append(item);
    });
};

if (memberName) {
    memberName.textContent = currentUser.displayName;
}

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        auth.logout();
        window.location.href = "mitglieder.html";
    });
}

if (groupForm) {
    groupForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = document.getElementById("newGroupName");
        const value = input?.value || "";

        try {
            auth.createGroup(value);
            if (input) {
                input.value = "";
            }
            renderGroupsSelector();
            renderUsers();
            showMessage(groupMessage, "Gruppe wurde angelegt.");
        } catch (error) {
            showMessage(groupMessage, error.message, true);
        }
    });
}

if (userForm) {
    userForm.addEventListener("submit", (event) => {
        event.preventDefault();

        try {
            auth.createUser({
                username: document.getElementById("newUsername")?.value || "",
                displayName: document.getElementById("newDisplayName")?.value || "",
                password: document.getElementById("newPassword")?.value || "",
                groups: getSelectedGroups(),
                isAdmin: document.getElementById("isAdmin")?.checked || false
            });

            userForm.reset();
            renderGroupsSelector();
            renderUsers();
            showMessage(userMessage, "Benutzer wurde angelegt.");
        } catch (error) {
            showMessage(userMessage, error.message, true);
        }
    });
}

renderGroupsSelector();
renderUsers();
