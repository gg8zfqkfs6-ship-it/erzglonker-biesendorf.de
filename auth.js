const ErzglonkerAuth = (() => {
    const usersKey = "erzglonkerUsers";
    const groupsKey = "erzglonkerGroups";
    const sessionKey = "erzglonkerSession";
    const apiBase = "api";

    const defaultGroups = ["Narren", "Vorstandschaft"];
    const defaultUsers = [
        {
            username: "admin",
            password: "1234",
            displayName: "Admin",
            isAdmin: true,
            mustChangePassword: true,
            groups: ["Vorstandschaft"]
        }
    ];

    const state = {
        adapter: null,
        initPromise: null,
        mode: "pending",
        sessionUser: null
    };

    const normalizeString = (value) => String(value || "").trim();
    const normalizeKey = (value) => normalizeString(value).toLowerCase();
    const normalizeGroups = (groups) =>
        Array.from(
            new Set(
                (Array.isArray(groups) ? groups : [])
                    .map((group) => normalizeString(group))
                    .filter(Boolean)
            )
        );

    const normalizeStoredUser = (user) => ({
        username: normalizeString(user.username),
        password: String(user.password || ""),
        displayName: normalizeString(user.displayName || user.username),
        isAdmin: Boolean(user.isAdmin),
        mustChangePassword: Boolean(user.mustChangePassword),
        groups: normalizeGroups(user.groups)
    });

    const toClientUser = (user) => {
        const normalized = normalizeStoredUser(user);
        return {
            username: normalized.username,
            displayName: normalized.displayName,
            isAdmin: normalized.isAdmin,
            mustChangePassword: normalized.mustChangePassword,
            groups: [...normalized.groups]
        };
    };

    const readLocal = (key, fallback) => {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch {
            return fallback;
        }
    };

    const writeLocal = (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    };

    const createLocalAdapter = () => {
        const ensureData = () => {
            const groups = readLocal(groupsKey, null);
            const users = readLocal(usersKey, null);

            if (!Array.isArray(groups) || groups.length === 0) {
                writeLocal(groupsKey, defaultGroups);
            }

            if (!Array.isArray(users) || users.length === 0) {
                writeLocal(usersKey, defaultUsers);
            }
        };

        const getStoredGroups = () => {
            ensureData();
            return normalizeGroups(readLocal(groupsKey, defaultGroups));
        };

        const saveGroups = (groups) => {
            const uniqueGroups = normalizeGroups(groups);
            writeLocal(groupsKey, uniqueGroups);
            return uniqueGroups;
        };

        const getStoredUsers = () => {
            ensureData();
            return readLocal(usersKey, defaultUsers).map(normalizeStoredUser);
        };

        const saveUsers = (users) => {
            writeLocal(usersKey, users.map(normalizeStoredUser));
        };

        const findStoredUser = (username) =>
            getStoredUsers().find((user) => normalizeKey(user.username) === normalizeKey(username)) || null;

        const getSessionUser = async () => {
            const username = localStorage.getItem(sessionKey);
            const user = username ? findStoredUser(username) : null;
            return user ? toClientUser(user) : null;
        };

        const login = async (username, password) => {
            const user = findStoredUser(username);

            if (!user || user.password !== String(password || "")) {
                throw new Error("Benutzername oder Passwort ist nicht korrekt.");
            }

            localStorage.setItem(sessionKey, user.username);
            return toClientUser(user);
        };

        const logout = async () => {
            localStorage.removeItem(sessionKey);
        };

        const changePassword = async (currentPassword, newPassword) => {
            const username = localStorage.getItem(sessionKey);
            const users = getStoredUsers();
            const userIndex = users.findIndex((user) => user.username === username);

            if (userIndex === -1) {
                throw new Error("Keine aktive Sitzung gefunden.");
            }

            if (users[userIndex].password !== String(currentPassword || "")) {
                throw new Error("Das aktuelle Passwort stimmt nicht.");
            }

            if (String(newPassword || "").trim().length < 6) {
                throw new Error("Das neue Passwort muss mindestens 6 Zeichen haben.");
            }

            users[userIndex].password = String(newPassword);
            users[userIndex].mustChangePassword = false;
            saveUsers(users);
            return toClientUser(users[userIndex]);
        };

        const getAdminData = async () => ({
            groups: getStoredGroups(),
            users: getStoredUsers().map(toClientUser)
        });

        const createGroup = async (groupName) => {
            const groups = getStoredGroups();
            const cleanName = normalizeString(groupName);

            if (!cleanName) {
                throw new Error("Bitte einen Gruppennamen eingeben.");
            }

            if (groups.some((group) => normalizeKey(group) === normalizeKey(cleanName))) {
                throw new Error("Diese Gruppe existiert bereits.");
            }

            saveGroups([...groups, cleanName]);
            return cleanName;
        };

        const createUser = async (userData) => {
            const users = getStoredUsers();
            const nextUser = normalizeStoredUser({
                ...userData,
                mustChangePassword: true
            });

            if (!nextUser.username || !nextUser.password || !nextUser.displayName) {
                throw new Error("Bitte Benutzername, Anzeigename und Passwort ausfüllen.");
            }

            if (users.some((user) => normalizeKey(user.username) === normalizeKey(nextUser.username))) {
                throw new Error("Dieser Benutzername ist bereits vergeben.");
            }

            users.push(nextUser);
            saveUsers(users);
            return toClientUser(nextUser);
        };

        const updateUserGroups = async (username, groups) => {
            const users = getStoredUsers();
            const userIndex = users.findIndex((user) => normalizeKey(user.username) === normalizeKey(username));

            if (userIndex === -1) {
                throw new Error("Benutzer wurde nicht gefunden.");
            }

            users[userIndex].groups = normalizeGroups(groups);
            saveUsers(users);
            return toClientUser(users[userIndex]);
        };

        return {
            mode: "local",
            init: async () => {
                ensureData();
            },
            getSessionUser,
            login,
            logout,
            changePassword,
            getAdminData,
            createGroup,
            createUser,
            updateUserGroups
        };
    };

    const createApiAdapter = () => {
        const isAvailable = async () => {
            try {
                const response = await fetch(`${apiBase}/session.php`, {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        Accept: "application/json"
                    }
                });

                const contentType = response.headers.get("content-type") || "";
                return response.ok && contentType.includes("application/json");
            } catch {
                return false;
            }
        };

        const request = async (endpoint, options = {}) => {
            const hasBody = options.body !== undefined;
            const response = await fetch(`${apiBase}/${endpoint}`, {
                method: options.method || "GET",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                    ...(hasBody ? { "Content-Type": "application/json" } : {}),
                    ...(options.headers || {})
                },
                ...(hasBody ? { body: options.body } : {})
            });

            const text = await response.text();
            let data = null;

            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                data = null;
            }

            if (!data || typeof data !== "object") {
                throw new Error("Die Serverantwort ist ungültig.");
            }

            if (!response.ok) {
                throw new Error(data?.message || "Die Serveranfrage ist fehlgeschlagen.");
            }

            return data;
        };

        const normalizeApiUser = (user) => ({
            username: normalizeString(user.username),
            displayName: normalizeString(user.displayName),
            isAdmin: Boolean(user.isAdmin),
            mustChangePassword: Boolean(user.mustChangePassword),
            groups: normalizeGroups(user.groups)
        });

        return {
            mode: "api",
            init: async () => {},
            isAvailable,
            getSessionUser: async () => {
                const data = await request("session.php");
                return data.user ? normalizeApiUser(data.user) : null;
            },
            login: async (username, password) => {
                const data = await request("login.php", {
                    method: "POST",
                    body: JSON.stringify({
                        username,
                        password
                    })
                });
                return normalizeApiUser(data.user);
            },
            logout: async () => {
                await request("logout.php", {
                    method: "POST",
                    body: JSON.stringify({})
                });
            },
            changePassword: async (currentPassword, newPassword) => {
                const data = await request("change-password.php", {
                    method: "POST",
                    body: JSON.stringify({
                        currentPassword,
                        newPassword
                    })
                });
                return normalizeApiUser(data.user);
            },
            getAdminData: async () => {
                const data = await request("admin-data.php");
                return {
                    groups: normalizeGroups(data.groups),
                    users: (Array.isArray(data.users) ? data.users : []).map(normalizeApiUser)
                };
            },
            createGroup: async (groupName) => {
                const data = await request("groups.php", {
                    method: "POST",
                    body: JSON.stringify({
                        name: groupName
                    })
                });
                return normalizeString(data.group?.name);
            },
            createUser: async (userData) => {
                const data = await request("users.php", {
                    method: "POST",
                    body: JSON.stringify(userData)
                });
                return normalizeApiUser(data.user);
            },
            updateUserGroups: async (username, groups) => {
                const data = await request("user-groups.php", {
                    method: "POST",
                    body: JSON.stringify({
                        username,
                        groups
                    })
                });
                return normalizeApiUser(data.user);
            }
        };
    };

    const init = async () => {
        if (!state.initPromise) {
            state.initPromise = (async () => {
                const apiAdapter = createApiAdapter();
                const adapter = (await apiAdapter.isAvailable()) ? apiAdapter : createLocalAdapter();
                await adapter.init();
                state.adapter = adapter;
                state.mode = adapter.mode;
                state.sessionUser = await adapter.getSessionUser();
                return adapter;
            })();
        }

        return state.initPromise;
    };

    const login = async (username, password) => {
        const adapter = await init();
        state.sessionUser = await adapter.login(username, password);
        return state.sessionUser;
    };

    const logout = async () => {
        const adapter = await init();
        await adapter.logout();
        state.sessionUser = null;
    };

    const changePassword = async (currentPassword, newPassword) => {
        const adapter = await init();
        state.sessionUser = await adapter.changePassword(currentPassword, newPassword);
        return state.sessionUser;
    };

    const getAdminData = async () => {
        const adapter = await init();
        return adapter.getAdminData();
    };

    const createGroup = async (groupName) => {
        const adapter = await init();
        return adapter.createGroup(groupName);
    };

    const createUser = async (userData) => {
        const adapter = await init();
        return adapter.createUser(userData);
    };

    const updateUserGroups = async (username, groups) => {
        const adapter = await init();
        return adapter.updateUserGroups(username, groups);
    };

    const isAuthenticated = () => Boolean(state.sessionUser);
    const isReadyAuthenticated = () => Boolean(state.sessionUser && !state.sessionUser.mustChangePassword);
    const isAdmin = () => Boolean(isReadyAuthenticated() && state.sessionUser?.isAdmin);

    const canAccessGroup = (groupName) => {
        const normalized = normalizeKey(groupName);

        if (normalized === "public") {
            return true;
        }

        if (!isReadyAuthenticated()) {
            return false;
        }

        if (state.sessionUser?.isAdmin) {
            return true;
        }

        return (state.sessionUser?.groups || []).some((group) => normalizeKey(group) === normalized);
    };

    return {
        init,
        getMode: () => state.mode,
        getSessionUser: () => state.sessionUser,
        isAuthenticated,
        isReadyAuthenticated,
        isAdmin,
        canAccessGroup,
        login,
        logout,
        changePassword,
        getAdminData,
        createGroup,
        createUser,
        updateUserGroups
    };
})();

window.ErzglonkerAuth = ErzglonkerAuth;
