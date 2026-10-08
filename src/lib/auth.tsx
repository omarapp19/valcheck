import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "./supabase";

export type UserRole = "admin" | "cliente";

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  telefono?: string | undefined;
  cedula?: string | undefined;
  direccionSugerida?: string | undefined;
  fechaRegistro: string;
}

interface StoredAccount extends User {
  passwordHash: string;
}

export interface RegisterResult {
  ok: boolean;
  error?: string;
  requiereConfirmacion?: boolean;
}

export interface LoginResult {
  ok: boolean;
  error?: string;
  requiereConfirmacion?: boolean;
}

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  isLoggedIn: boolean;
  cargando: boolean;
  isSupabaseConnected: boolean;
  supabaseProjectUrl: string;
  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (val: boolean) => void;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (data: {
    nombre: string;
    email: string;
    password: string;
    telefono?: string;
    cedula?: string;
    direccionSugerida?: string;
    esAdmin?: boolean;
  }) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ ok: boolean; error?: string }>;
  resendConfirmation: (email: string) => Promise<{ ok: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USERS_STORAGE_KEY = "valcheck_users";
const SESSION_STORAGE_KEY = "valcheck_session_user";

export const ADMIN_EMAIL = "omarapp1921@gmail.com";

export function esEmailAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

const CUENTAS_INICIALES: StoredAccount[] = [
  {
    id: "user-admin-1",
    nombre: "Omar (Administrador)",
    email: "omarapp1921@gmail.com",
    rol: "admin",
    telefono: "0414-0000000",
    cedula: "V-28.000.000",
    fechaRegistro: "2026-01-01",
    passwordHash: "admin123",
  },
  {
    id: "user-cliente-1",
    nombre: "Valentina Romero",
    email: "cliente@valcheck.ve",
    rol: "cliente",
    telefono: "0412-9876543",
    cedula: "V-25.432.109",
    fechaRegistro: "2026-02-15",
    passwordHash: "cliente123",
  },
];

export function traducirErrorSupabase(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (m.includes("user already registered") || m.includes("already registered") || m.includes("already exists")) {
    return "Ya existe un usuario registrado con este correo electrónico.";
  }
  if (m.includes("email not confirmed")) {
    return "Tu correo electrónico no ha sido confirmado. Revisa tu bandeja de entrada o confirma la cuenta en Supabase.";
  }
  if (m.includes("password should be at least") || m.includes("weak_password")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (m.includes("invalid email") || m.includes("is invalid")) {
    return "Por favor ingresa un correo electrónico válido.";
  }
  if (m.includes("rate limit") || m.includes("over_email_send_rate_limit")) {
    return "Límite de correos alcanzado en Supabase (máx. 3 por hora en plan gratuito). Desactiva 'Confirm email' en Authentication -> Providers -> Email de Supabase para registro instantáneo.";
  }
  if (m.includes("signup disabled")) {
    return "El registro de usuarios está deshabilitado en la configuración de Supabase.";
  }
  return mensaje;
}

async function fetchUserProfile(sbUser: any): Promise<User> {
  const meta = sbUser.user_metadata || {};
  let profileRow: any = null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sbUser.id)
        .maybeSingle();
      if (data) {
        profileRow = data;
      }
    } catch {
      // Tabla profiles opcional, se continuará con metadata
    }
  }

  // Únicamente omarapp1921@gmail.com es administrador, todos los demás son clientes
  const emailVerificar = sbUser.email || profileRow?.email;
  const rol: UserRole = esEmailAdmin(emailVerificar) ? "admin" : "cliente";

  return {
    id: sbUser.id,
    nombre: profileRow?.nombre || meta.nombre || meta.full_name || sbUser.email?.split("@")[0] || "Usuario",
    email: sbUser.email || profileRow?.email || "",
    rol,
    telefono: profileRow?.telefono || meta.telefono || "",
    cedula: profileRow?.cedula || meta.cedula || "",
    direccionSugerida: profileRow?.direccion || meta.direccionSugerida || "",
    fechaRegistro: sbUser.created_at
      ? (sbUser.created_at.split("T")[0] || "")
      : (new Date().toISOString().split("T")[0] || ""),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cargando, setCargando] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const supabaseProjectUrl = (import.meta.env['VITE_SUPABASE_URL'] as string) || "";

  // Inicializar y escuchar estado de sesión
  useEffect(() => {
    // 1. Asegurar cuentas demo en localStorage
    try {
      const cuentasGuardadas = localStorage.getItem(USERS_STORAGE_KEY);
      if (!cuentasGuardadas) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(CUENTAS_INICIALES));
      }
    } catch {
      /* ignore */
    }

    let unsubscriber: (() => void) | undefined;

    // 2. Si Supabase está disponible, sincronizar sesión oficial
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const u = await fetchUserProfile(session.user);
          setUser(u);
          try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(u));
          } catch {}
        } else {
          // Si no hay sesión en Supabase, verificar sesión local de respaldo
          const sesionActiva = localStorage.getItem(SESSION_STORAGE_KEY);
          if (sesionActiva) {
            try {
              setUser(JSON.parse(sesionActiva));
            } catch {
              /* ignore */
            }
          }
        }
        setCargando(false);
      });

      // Escuchar eventos en vivo de Supabase Auth (SIGN_IN, SIGN_OUT, USER_UPDATED, PASSWORD_RECOVERY)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsPasswordRecovery(true);
        }

        if (session?.user) {
          const u = await fetchUserProfile(session.user);
          setUser(u);
          try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(u));
          } catch {}
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          try {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          } catch {}
        }
      });

      unsubscriber = () => subscription.unsubscribe();
    } else {
      // Si Supabase no está configurado, restaurar sesión de localStorage
      const sesionActiva = localStorage.getItem(SESSION_STORAGE_KEY);
      if (sesionActiva) {
        try {
          setUser(JSON.parse(sesionActiva));
        } catch {
          /* ignore */
        }
      }
      setCargando(false);
    }

    return () => {
      if (unsubscriber) unsubscriber();
    };
  }, []);

  const buscarCuentaLocal = (email: string, password: string): User | null => {
    try {
      const cuentasRaw = localStorage.getItem(USERS_STORAGE_KEY);
      const cuentas: StoredAccount[] = cuentasRaw
        ? JSON.parse(cuentasRaw)
        : CUENTAS_INICIALES;

      const encontrada = cuentas.find(
        (c) =>
          c.email.toLowerCase().trim() === email.toLowerCase().trim() &&
          c.passwordHash === password,
      );

      if (encontrada) {
        const { passwordHash: _, ...sinPass } = encontrada;
        return sinPass;
      }
    } catch {
      /* ignore */
    }
    return null;
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Intento de inicio de sesión con Supabase Auth
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!error && data.user) {
          const usuario = await fetchUserProfile(data.user);
          setUser(usuario);
          try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(usuario));
          } catch {}
          return { ok: true };
        }

        // Si el correo no fue confirmado en Supabase
        if (error && error.message.toLowerCase().includes("email not confirmed")) {
          return {
            ok: false,
            requiereConfirmacion: true,
            error:
              "Tu correo no ha sido confirmado en Supabase. Revisa tu bandeja de entrada o haz clic abajo para reenviar el enlace.",
          };
        }

        // Si coincide con cuenta demo local de prueba rápida
        const local = buscarCuentaLocal(cleanEmail, password);
        if (local) {
          setUser(local);
          try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(local));
          } catch {}
          return { ok: true };
        }

        return {
          ok: false,
          error: traducirErrorSupabase(error?.message || "Error al iniciar sesión"),
        };
      } catch (err: any) {
        console.warn("[Auth] Excepción en Supabase Auth, intentando local:", err);
      }
    }

    // 2. Fallback de cuenta local si Supabase no estuviera configurado o cuenta demo
    const local = buscarCuentaLocal(cleanEmail, password);
    if (local) {
      setUser(local);
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(local));
      } catch {}
      return { ok: true };
    }

    return { ok: false, error: "Correo o contraseña incorrectos." };
  };

  const register = async (data: {
    nombre: string;
    email: string;
    password: string;
    telefono?: string;
    cedula?: string;
    direccionSugerida?: string;
    esAdmin?: boolean;
  }): Promise<RegisterResult> => {
    const cleanEmail = data.email.trim().toLowerCase();
    // Todos los usuarios son cliente; solo omarapp1921@gmail.com es administrador
    const rol: UserRole = esEmailAdmin(cleanEmail) ? "admin" : "cliente";

    // 1. Registro directo en Supabase Auth
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sbData, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: data.password,
          options: {
            data: {
              nombre: data.nombre.trim(),
              telefono: data.telefono?.trim() || "",
              cedula: data.cedula?.trim() || "",
              direccionSugerida: data.direccionSugerida?.trim() || "",
              rol,
            },
          },
        });

        if (error) {
          return { ok: false, error: traducirErrorSupabase(error.message) };
        }

        if (sbData.user) {
          // Detectar caso en que el correo ya existía (Supabase devuelve identities vacías)
          if (Array.isArray(sbData.user.identities) && sbData.user.identities.length === 0) {
            return {
              ok: false,
              error: "Ya existe un usuario registrado con este correo electrónico. Por favor inicia sesión.",
            };
          }

          // Intentar insertar en tabla public.profiles si existe
          try {
            await supabase.from("profiles").upsert({
              id: sbData.user.id,
              nombre: data.nombre.trim(),
              email: cleanEmail,
              telefono: data.telefono?.trim() || "",
              cedula: data.cedula?.trim() || "",
              direccion: data.direccionSugerida?.trim() || "",
              rol,
            });
          } catch {
            // Tabla profiles opcional
          }

          // Guardar también en respaldo local
          const nuevoUsuarioLocal: StoredAccount = {
            id: sbData.user.id,
            nombre: data.nombre.trim(),
            email: cleanEmail,
            rol,
            fechaRegistro: new Date().toISOString().split("T")[0] || "",
            passwordHash: data.password,
            ...(data.telefono?.trim() ? { telefono: data.telefono.trim() } : {}),
            ...(data.cedula?.trim() ? { cedula: data.cedula.trim() } : {}),
            ...(data.direccionSugerida?.trim() ? { direccionSugerida: data.direccionSugerida.trim() } : {}),
          };

          try {
            const cuentasRaw = localStorage.getItem(USERS_STORAGE_KEY);
            const cuentas: StoredAccount[] = cuentasRaw ? JSON.parse(cuentasRaw) : [];
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([...cuentas, nuevoUsuarioLocal]));
          } catch {}

          // Si Supabase otorgó sesión de inmediato
          if (sbData.session) {
            const mapped = await fetchUserProfile(sbData.user);
            setUser(mapped);
            try {
              localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(mapped));
            } catch {}
            return { ok: true, requiereConfirmacion: false };
          } else {
            // Requiere confirmación por correo según configuración de Supabase
            return {
              ok: true,
              requiereConfirmacion: true,
            };
          }
        }
      } catch (err: any) {
        console.warn("[Auth] Error conectando con Supabase signUp:", err);
      }
    }

    // 2. Registro local (si Supabase no estuviera configurado)
    try {
      const cuentasRaw = localStorage.getItem(USERS_STORAGE_KEY);
      const cuentas: StoredAccount[] = cuentasRaw ? JSON.parse(cuentasRaw) : CUENTAS_INICIALES;

      const existe = cuentas.some((c) => c.email.toLowerCase().trim() === cleanEmail);
      if (existe) {
        return { ok: false, error: "Ya existe un usuario con este correo electrónico." };
      }

      const nuevoLocal: StoredAccount = {
        id: `user-${Date.now()}`,
        nombre: data.nombre.trim(),
        email: cleanEmail,
        rol,
        fechaRegistro: new Date().toISOString().split("T")[0] || "",
        passwordHash: data.password,
        ...(data.telefono?.trim() ? { telefono: data.telefono.trim() } : {}),
        ...(data.cedula?.trim() ? { cedula: data.cedula.trim() } : {}),
        ...(data.direccionSugerida?.trim() ? { direccionSugerida: data.direccionSugerida.trim() } : {}),
      };

      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([...cuentas, nuevoLocal]));
      const { passwordHash: _, ...sinPass } = nuevoLocal;
      setUser(sinPass);
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sinPass));
      } catch {}
      return { ok: true };
    } catch {
      return { ok: false, error: "Ocurrió un error al registrar la cuenta." };
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn("[Auth] Error en signOut de Supabase:", err);
    }
    setUser(null);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}
  };

  const updateProfile = async (data: Partial<User>): Promise<{ ok: boolean; error?: string }> => {
    if (!user) return { ok: false, error: "No hay sesión activa." };
    const rolSeguro: UserRole = esEmailAdmin(user.email) ? "admin" : "cliente";
    const actualizado: User = { ...user, ...data, rol: rolSeguro };
    setUser(actualizado);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(actualizado));
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.updateUser({
          data: {
            nombre: actualizado.nombre,
            telefono: actualizado.telefono,
            cedula: actualizado.cedula,
            direccionSugerida: actualizado.direccionSugerida,
            rol: actualizado.rol,
          },
        });

        // Intentar actualizar en tabla public.profiles
        await supabase.from("profiles").upsert({
          id: user.id,
          nombre: actualizado.nombre,
          telefono: actualizado.telefono,
          cedula: actualizado.cedula,
          direccion: actualizado.direccionSugerida,
          rol: actualizado.rol,
        });
      } catch (err: any) {
        console.warn("[Auth] Error al actualizar perfil en Supabase:", err);
      }
    }
    return { ok: true };
  };

  const resendConfirmation = async (email: string): Promise<{ ok: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { ok: false, error: "Supabase no está configurado." };
    }
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
      });
      if (error) {
        return { ok: false, error: traducirErrorSupabase(error.message) };
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || "Error al reenviar correo." };
    }
  };

  const resetPassword = async (email: string): Promise<{ ok: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { ok: false, error: "Supabase no está configurado." };
    }
    try {
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/auth?reset=true` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        redirectUrl ? { redirectTo: redirectUrl } : {}
      );
      if (error) {
        return { ok: false, error: traducirErrorSupabase(error.message) };
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || "Error al solicitar restablecimiento." };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ ok: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { ok: false, error: "Supabase no está configurado." };
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { ok: false, error: traducirErrorSupabase(error.message) };
      }
      setIsPasswordRecovery(false);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || "Error al actualizar la contraseña." };
    }
  };

  const isAdmin = user?.rol === "admin";
  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoggedIn,
        cargando,
        isSupabaseConnected: isSupabaseConfigured,
        supabaseProjectUrl,
        isPasswordRecovery,
        setIsPasswordRecovery,
        login,
        register,
        logout,
        updateProfile,
        resendConfirmation,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
