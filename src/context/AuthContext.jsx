import { createContext, useState, useContext, useEffect, useCallback, useMemo } from "react";
import { apiFetch, UNAUTHORIZED_EVENT } from "../api/client";

const AuthContext = createContext(null);

// Roles que pueden entrar al panel administrativo. TECNICO usa la app móvil.
// eslint-disable-next-line react-refresh/only-export-components
export const ROLES_PANEL = ["ADMIN", "SUPERVISOR"];

const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};

const readStoredUser = () => {
    try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        if (!token || !userData) return null;
        const user = JSON.parse(userData) || null;
        // Sesiones guardadas antes de existir roles: se cierran para obtener el rol al volver a entrar.
        if (!user?.rol || !ROLES_PANEL.includes(user.rol)) {
            clearSession();
            return null;
        }
        return user;
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

    const guardarSesion = useCallback((data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
    }, []);

    const login = useCallback(
        async (usuario, password) => {
            try {
                const data = await apiFetch("/auth/login", { method: "POST", auth: false, body: { usuario, password } });
                if (!data?.token || !data?.user) throw new Error("Respuesta inválida del servidor");
                if (!ROLES_PANEL.includes(data.user.rol)) {
                    return { success: false, error: "Tu usuario es de técnico. Usa la aplicación móvil para ver tus órdenes." };
                }
                guardarSesion(data);
                return { success: true, data };
            } catch (error) {
                return { success: false, error: error.message || "Error en el login" };
            }
        },
        [guardarSesion],
    );

    // Solo sirve para crear el primer administrador (el backend cierra el registro después).
    const register = useCallback(
        async (nombre, email, usuario, password) => {
            try {
                const data = await apiFetch("/auth/register", { method: "POST", auth: false, body: { nombre, email, usuario, password } });
                return { success: true, data };
            } catch (error) {
                return { success: false, error: error.message || "Error en el registro" };
            }
        },
        [],
    );

    /** Actualiza los datos del usuario en sesión (p. ej. tras editar el perfil). */
    const actualizarUsuario = useCallback((cambios) => {
        setUser((prev) => {
            const nuevo = { ...prev, ...cambios };
            localStorage.setItem("user", JSON.stringify(nuevo));
            return nuevo;
        });
    }, []);

    const value = useMemo(
        () => ({
            user,
            rol: user?.rol ?? null,
            esAdmin: user?.rol === "ADMIN",
            login,
            register,
            logout,
            actualizarUsuario,
        }),
        [user, login, register, logout, actualizarUsuario],
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
