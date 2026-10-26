import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  Mail,
  MapPin,
  Phone,
  Send,
  User as UserIcon,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Autenticación — ValCheck (Supabase Auth)" },
      {
        name: "description",
        content: "Inicia sesión, crea tu cuenta o recupera tu contraseña con Supabase Auth en ValCheck.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const {
    user,
    login,
    register,
    resendConfirmation,
    resetPassword,
    updatePassword,
    isLoggedIn,
    isAdmin,
    isPasswordRecovery,
    setIsPasswordRecovery,
  } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"login" | "register" | "recuperar">("login");
  const [enviando, setEnviando] = useState(false);
  const [reenviandoEmail, setReenviandoEmail] = useState(false);

  // Mostrar / ocultar contraseñas
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Form login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [emailPendienteConfirmar, setEmailPendienteConfirmar] = useState<string | null>(null);

  // Form register
  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regTelefono, setRegTelefono] = useState("");
  const [regCedula, setRegCedula] = useState("");
  const [regDireccion, setRegDireccion] = useState("");

  // Form reset password
  const [resetEmail, setResetEmail] = useState("");
  const [resetEnviado, setResetEnviado] = useState(false);

  // Form update password (recovery)
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  // Redirigir si ya está logueado y no está en recuperación de contraseña
  useEffect(() => {
    if (isLoggedIn && !isPasswordRecovery) {
      if (isAdmin) {
        navigate({ to: "/admin" });
      } else {
        navigate({ to: "/cuenta" });
      }
    }
  }, [isLoggedIn, isAdmin, isPasswordRecovery, navigate]);

  // Manejar Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailPendienteConfirmar(null);
    setEnviando(true);
    try {
      const res = await login(loginEmail, loginPassword);
      if (!res.ok) {
        if (res.requiereConfirmacion) {
          setEmailPendienteConfirmar(loginEmail);
        }
        toast.error(res.error || "Error al iniciar sesión");
      } else {
        toast.success("¡Bienvenido/a de vuelta a ValCheck!");
      }
    } finally {
      setEnviando(false);
    }
  };

  // Manejar Registro
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setEnviando(true);
    try {
      const res = await register({
        nombre: regNombre,
        email: regEmail,
        password: regPassword,
        telefono: regTelefono,
        cedula: regCedula,
        direccionSugerida: regDireccion,
      });

      if (!res.ok) {
        toast.error(res.error || "Error al registrar la cuenta");
      } else if (res.requiereConfirmacion) {
        setEmailPendienteConfirmar(regEmail);
        toast.info("¡Cuenta creada en Supabase! Revisa tu correo o confírmala en tu panel.");
        setTab("login");
        setLoginEmail(regEmail);
      } else {
        toast.success("¡Cuenta creada e iniciada exitosamente en Supabase!");
      }
    } finally {
      setEnviando(false);
    }
  };

  // Manejar Reenvío de confirmación
  const handleReenviarConfirmacion = async (email: string) => {
    if (!email) return;
    setReenviandoEmail(true);
    try {
      const res = await resendConfirmation(email);
      if (res.ok) {
        toast.success(`Enlace de confirmación reenviado a ${email}`);
      } else {
        toast.error(res.error || "No se pudo reenviar el correo");
      }
    } finally {
      setReenviandoEmail(false);
    }
  };

  // Manejar Solicitud de Recuperar Contraseña
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error("Ingresa tu correo electrónico");
      return;
    }
    setEnviando(true);
    try {
      const res = await resetPassword(resetEmail);
      if (res.ok) {
        setResetEnviado(true);
        toast.success("Correo de restablecimiento enviado. Revisa tu bandeja de entrada.");
      } else {
        toast.error(res.error || "Error al solicitar restablecimiento");
      }
    } finally {
      setEnviando(false);
    }
  };

  // Manejar Guardado de Nueva Contraseña
  const handleGuardarNuevaPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevaPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    setEnviando(true);
    try {
      const res = await updatePassword(nuevaPassword);
      if (res.ok) {
        toast.success("¡Tu contraseña ha sido actualizada con éxito!");
        setIsPasswordRecovery(false);
        setTab("login");
      } else {
        toast.error(res.error || "Error al actualizar contraseña");
      }
    } finally {
      setEnviando(false);
    }
  };


  return (
    <div className="mx-auto max-w-lg px-4 py-10 md:py-14">
      {/* Cabecera */}
      <div className="text-center">
        <Link to="/" className="inline-flex items-center gap-1.5 justify-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-brand-yellow shadow-xs">
            <Check className="size-5 text-brand-brown" strokeWidth={3.5} />
          </span>
          <span className="font-display text-2xl font-bold tracking-tight">ValCheck</span>
        </Link>

        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground">
          {isPasswordRecovery
            ? "Nueva Contraseña"
            : tab === "login"
              ? "Acceso a tu Cuenta"
              : tab === "register"
                ? "Crea tu Cuenta"
                : "Recuperar Contraseña"}
        </h1>

        <p className="mt-1.5 text-xs text-muted-foreground max-w-sm mx-auto">
          {isPasswordRecovery
            ? "Ingresa tu nueva contraseña para actualizar el acceso a tu cuenta."
            : tab === "login"
              ? "Inicia sesión para revisar tus pedidos y compras."
              : tab === "register"
                ? "Regístrate para comprar en línea, pagar con Pago Móvil / Binance y hacer seguimiento."
                : "Te enviaremos un enlace oficial para restablecer tu contraseña."}
        </p>
      </div>

      {/* MODO RECUPERACIÓN DE CONTRASEÑA ACTIVO */}
      {isPasswordRecovery ? (
        <form
          onSubmit={handleGuardarNuevaPassword}
          className="mt-6 rounded-3xl border-2 border-primary bg-card p-6 shadow-md md:p-8 space-y-4"
        >
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900">
            <p className="font-semibold">Restablecimiento de contraseña verificado</p>
            <p className="mt-0.5 text-[11px]">Define tu nueva contraseña para completar el cambio.</p>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-foreground">Nueva Contraseña</label>
            <div className="relative mt-1.5">
              <KeyRound className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
              <input
                type={showNewPass ? "text" : "password"}
                required
                minLength={6}
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-input bg-background pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showNewPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-foreground">Confirmar Nueva Contraseña</label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
              <input
                type={showNewPass ? "text" : "password"}
                required
                minLength={6}
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Repite tu nueva contraseña"
                className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:scale-[1.01] active:scale-95 cursor-pointer mt-2 disabled:opacity-60"
          >
            {enviando ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Actualizando contraseña...
              </>
            ) : (
              "Guardar Nueva Contraseña"
            )}
          </button>
        </form>
      ) : (
        <>
          {/* Tabs Selector */}
          {tab !== "recuperar" && (
            <div className="mt-6 grid grid-cols-2 rounded-2xl border border-border bg-card p-1 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  setEmailPendienteConfirmar(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  tab === "login"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LogIn className="size-3.5" />
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("register");
                  setEmailPendienteConfirmar(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  tab === "register"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserPlus className="size-3.5" />
                Registrarse
              </button>
            </div>
          )}

          {/* Formulario LOGIN */}
          {tab === "login" && (
            <form
              onSubmit={handleLoginSubmit}
              className="mt-6 rounded-3xl border-2 border-primary bg-card p-6 shadow-md md:p-8 space-y-4"
            >
              {/* Alerta si el email necesita confirmación */}
              {emailPendienteConfirmar && (
                <div className="rounded-2xl bg-amber-500/15 border border-amber-500/40 p-3.5 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="size-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Tu cuenta aún no ha sido confirmada</p>
                      <p className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                        Supabase requiere confirmar tu correo antes del primer inicio de sesión.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={reenviandoEmail}
                    onClick={() => handleReenviarConfirmacion(emailPendienteConfirmar)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-200/80 hover:bg-amber-300 py-2 text-xs font-bold text-amber-950 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {reenviandoEmail ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Reenviando correo...
                      </>
                    ) : (
                      <>
                        <Send className="size-3.5" />
                        Reenviar enlace de confirmación a {emailPendienteConfirmar}
                      </>
                    )}
                  </button>
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase text-foreground">Correo Electrónico</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase text-foreground">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => {
                      setTab("recuperar");
                      setResetEmail(loginEmail);
                    }}
                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  <input
                    type={showLoginPass ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-input bg-background pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label="Ver u ocultar contraseña"
                  >
                    {showLoginPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:scale-[1.01] active:scale-95 cursor-pointer mt-2 disabled:opacity-60"
              >
                {enviando ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Iniciando sesión con Supabase...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </form>
          )}

          {/* Formulario REGISTRO */}
          {tab === "register" && (
            <form
              onSubmit={handleRegisterSubmit}
              className="mt-6 rounded-3xl border-2 border-primary bg-card p-6 shadow-md md:p-8 space-y-4"
            >
              <div>
                <label className="text-xs font-bold uppercase text-foreground">Nombre Completo *</label>
                <div className="relative mt-1.5">
                  <UserIcon className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={regNombre}
                    onChange={(e) => setRegNombre(e.target.value)}
                    placeholder="María Pérez"
                    className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-foreground">Correo Electrónico *</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="maria@correo.com"
                    className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-foreground">Cédula</label>
                  <input
                    type="text"
                    value={regCedula}
                    onChange={(e) => setRegCedula(e.target.value)}
                    placeholder="V-20123456"
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-foreground">Teléfono</label>
                  <input
                    type="tel"
                    value={regTelefono}
                    onChange={(e) => setRegTelefono(e.target.value)}
                    placeholder="04141234567"
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-foreground">Dirección o Ciudad (Opcional)</label>
                <div className="relative mt-1.5">
                  <MapPin className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={regDireccion}
                    onChange={(e) => setRegDireccion(e.target.value)}
                    placeholder="Ej. Valencia, Carabobo - MRW Los Sauces"
                    className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-foreground">Contraseña *</label>
                <div className="relative mt-1.5">
                  <KeyRound className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  <input
                    type={showRegPass ? "text" : "password"}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-xl border border-input bg-background pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass(!showRegPass)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label="Ver u ocultar contraseña"
                  >
                    {showRegPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>


              <button
                type="submit"
                disabled={enviando}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:scale-[1.01] active:scale-95 cursor-pointer mt-2 disabled:opacity-60"
              >
                {enviando ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Registrando en Supabase...
                  </>
                ) : (
                  "Crear mi Cuenta"
                )}
              </button>
            </form>
          )}

          {/* Formulario RECUPERAR CONTRASEÑA */}
          {tab === "recuperar" && (
            <form
              onSubmit={handleResetSubmit}
              className="mt-6 rounded-3xl border-2 border-primary bg-card p-6 shadow-md md:p-8 space-y-4"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab("login");
                    setResetEnviado(false);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <ArrowLeft className="size-3.5" />
                  Volver al inicio de sesión
                </button>
              </div>

              {resetEnviado ? (
                <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/40 p-4 text-center space-y-2">
                  <CheckCircle2 className="size-8 text-emerald-600 mx-auto" />
                  <p className="font-display font-bold text-base text-emerald-900 dark:text-emerald-300">
                    ¡Correo de recuperación enviado!
                  </p>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                    Hemos enviado un enlace a <strong>{resetEmail}</strong>. Al abrir el enlace podrás establecer una nueva contraseña.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab("login")}
                    className="mt-2 inline-flex rounded-full bg-emerald-700 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-colors cursor-pointer"
                  >
                    Ir a Iniciar Sesión
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold uppercase text-foreground">
                      Tu Correo Electrónico
                    </label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="tucorreo@ejemplo.com"
                        className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Supabase te enviará un correo con un enlace seguro para crear una nueva clave de acceso.
                  </p>

                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:scale-[1.01] active:scale-95 cursor-pointer mt-2 disabled:opacity-60"
                  >
                    {enviando ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Enviando solicitud a Supabase...
                      </>
                    ) : (
                      "Enviar Enlace de Recuperación"
                    )}
                  </button>
                </>
              )}
            </form>
          )}
        </>
      )}
    </div>
  );
}
