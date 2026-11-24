import { createContext, useState, useContext, useEffect, useCallback, useMemo } from "react";
import { apiFetch, UNAUTHORIZED_EVENT } from "../api/client";

const AuthContext = createContext(null);

const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};

const readStoredUser = () => {
    try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        if (!token || !userData) return null;
        return JSON.parse(userData) || null;
    } catch {
        // Datos corruptos en localStorage: se descarta la sesión.
        clearSession();
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    // Lectura síncrona: evita el parpadeo de "cargando" al abrir la app.
    const [user, setUser] = useState(readStoredUser);

    const logout = useCallback(() => {
        clearSession();
        setUser(null);
    }, []);

    // Token expirado o inválido en cualquier petición: cerrar sesión.
    useEffect(() => {
        window.addEventListener(UNAUTHORIZED_EVENT, logout);
        return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
    }, [logout]);

    const authenticate = useCallback(async (path, payload, fallbackError) => {
        try {
            const data = await apiFetch(path, { method: "POST", auth: false, body: payload });

            if (data?.token && data?.user) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                setUser(data.user);
            }

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || fallbackError };
        }
    }, []);

    const register = useCallback(
        (nombre, email, usuario, password) =>
            authenticate("/auth/register", { nombre, email, usuario, password }, "Error en el registro"),
        [authenticate],
    );

    const login = useCallback(
        (usuario, password) => authenticate("/auth/login", { usuario, password }, "Error en el login"),
        [authenticate],
    );

    const getToken = useCallback(() => localStorage.getItem("token"), []);

    const value = useMemo(
        () => ({ user, loading: false, register, login, logout, getToken }),
        [user, register, login, logout, getToken],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth debe ser usado dentro de AuthProvider");
    }
    return context;
};
