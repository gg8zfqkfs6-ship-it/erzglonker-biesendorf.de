const ErzglonkerAuth = (() => {
    const usersKey = "erzglonkerUsers";
    const groupsKey = "erzglonkerGroups";
    const sessionKey = "erzglonkerSession";

    const defaultGroups = ["Narren", "Vorstandschaft"];
    const defaultUsers = [
        {
            username: "admin",
            password: "1234",
            displayName: "Admin",
            isAdmin: true,
            groups: ["Vorstandschaft"]
        }
    ];

    const read = (key, fallback) => {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch {
            return fallback;
        }
    };

    const write = (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    };

    const normalizeUser = (user) => ({
        username: String(user.username || "").trim(),
        password: String(user.password || ""),
        displayName: String(user.displayName || user.username || "").trim(),
        isAdmin: Boolean(user.isAdmin),
        groups: Array.isArray(user.groups) ? user.groups : []
    });

    const ensureData = () => {
        const groups = read(groupsKey, null);
        const users = read(usersKey, null);

        if (!groups || !Array.isArray(groups) || groups.length === 0) {
            write(groupsKey, defaultGroups);
        }

        if (!users || !Array.isArray(users) || users.length === 0) {
            write(usersKey, defaultUsers);
        }
    };

    const getGroups = () => {
        ensureData();
        return read(groupsKey, defaultGroups).map((group) => String(group));
    };

    const saveGroups = (groups) => {
        const uniqueGroups = Array.from(
            new Set(groups.map((group) => String(group).trim()).filter(Boolean))
        );
        write(groupsKey, uniqueGroups);
        return uniqueGroups;
    };

    const getUsers = () => {
        ensureData();
        return read(usersKey, defaultUsers).map(normalizeUser);
    };

    const saveUsers = (users) => {
        write(usersKey, users.map(normalizeUser));
    };

    const findUser = (username) => {
        const normalized = String(username || "").trim().toLowerCase();
        return getUsers().find((user) => user.username.toLowerCase() === normalized) || null;
    };

    const authenticate = (username, password) => {
        const user = findUser(username);
        if (!user || user.password !== password) {
            return null;
        }
        return user;
    };

    const login = (username) => {
        localStorage.setItem(sessionKey, String(username));
    };

    const logout = () => {
        localStorage.removeItem(sessionKey);
    };

    const getSessionUser = () => {
        const username = localStorage.getItem(sessionKey);
        return username ? findUser(username) : null;
    };

    const isAuthenticated = () => Boolean(getSessionUser());

    const createGroup = (groupName) => {
        const groups = getGroups();
        const cleanName = String(groupName || "").trim();
        if (!cleanName) {
            throw new Error("Bitte einen Gruppennamen eingeben.");
        }
        if (groups.some((group) => group.toLowerCase() === cleanName.toLowerCase())) {
            throw new Error("Diese Gruppe existiert bereits.");
        }
        const nextGroups = [...groups, cleanName];
        saveGroups(nextGroups);
        return cleanName;
    };

    const createUser = (userData) => {
        const users = getUsers();
        const nextUser = normalizeUser(userData);

        if (!nextUser.username || !nextUser.password || !nextUser.displayName) {
            throw new Error("Bitte Benutzername, Anzeigename und Passwort ausfüllen.");
        }

        if (users.some((user) => user.username.toLowerCase() === nextUser.username.toLowerCase())) {
            throw new Error("Dieser Benutzername ist bereits vergeben.");
        }

        users.push(nextUser);
        saveUsers(users);
        return nextUser;
    };

    const updateUserGroups = (username, groups) => {
        const users = getUsers();
        const targetIndex = users.findIndex(
            (user) => user.username.toLowerCase() === String(username || "").trim().toLowerCase()
        );

        if (targetIndex === -1) {
            throw new Error("Benutzer wurde nicht gefunden.");
        }

        users[targetIndex].groups = Array.from(
            new Set(groups.map((group) => String(group).trim()).filter(Boolean))
        );
        saveUsers(users);
        return users[targetIndex];
    };

    ensureData();

    return {
        ensureData,
        getUsers,
        getGroups,
        saveUsers,
        saveGroups,
        findUser,
        authenticate,
        login,
        logout,
        getSessionUser,
        isAuthenticated,
        createGroup,
        createUser,
        updateUserGroups
    };
})();

window.ErzglonkerAuth = ErzglonkerAuth;
