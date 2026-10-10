import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Eye,
  LogOut,
  Package,
  ShieldCheck,
  ShoppingBag,
  Truck,
  User as UserIcon,
  MessageCircle,
  Save,
  Loader2,
  MapPin,
  Phone,
  CreditCard,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useAdminStore, Order } from "@/lib/admin-store";
import { formatUSD, formatVES } from "@/lib/products";
import { labelMetodoPago } from "@/lib/checkout";

export const Route = createFileRoute("/cuenta")({
  head: () => ({
    meta: [
      { title: "Mi Cuenta y Mis Compras — ValCheck" },
      { name: "description", content: "Revisa el estado de tus compras, pagos, envíos y datos personales en ValCheck con Supabase." },
    ],
  }),
  component: CuentaPage,
});

function CuentaPage() {
  const { user, logout, updateProfile, isLoggedIn, isAdmin, isSupabaseConnected } = useAuth();
  const { obtenerPedidosUsuario } = useAdminStore();
  const navigate = useNavigate();

  const [seccionActiva, setSeccionActiva] = useState<"pedidos" | "perfil">("pedidos");
  const [pedidoDetalleModal, setPedidoDetalleModal] = useState<Order | null>(null);

  // Estados para formulario de edición de perfil
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");
  const [cedula, setCedula] = useState(user?.cedula || "");
  const [direccion, setDireccion] = useState(user?.direccionSugerida || "");
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  useEffect(() => {
    if (user) {
      setNombre(user.nombre || "");
      setTelefono(user.telefono || "");
      setCedula(user.cedula || "");
      setDireccion(user.direccionSugerida || "");
    }
  }, [user]);

  // Redirigir a panel administrativo si el usuario es administrador
  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      navigate({ to: "/admin" });
    }
  }, [isLoggedIn, isAdmin, navigate]);

  if (!isLoggedIn || !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <span className="stamp flex size-20 items-center justify-center mx-auto">
          <UserIcon className="size-9 text-brand-brown" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-bold">Panel de Cliente</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Inicia sesión o regístrate en Supabase para consultar el estado de tus pagos y compras.
        </p>
        <Link
          to="/auth"
          className="mt-6 inline-flex rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-sm hover:scale-105 transition-all"
        >
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  // Vista exclusiva para Administradores
  if (isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-brand-yellow text-brand-brown shadow-sm">
          <ShieldCheck className="size-10" />
        </span>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-yellow/60 px-4 py-1 text-xs font-bold text-brand-brown">
          Perfil de Administrador
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold">Panel de Administración</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Has iniciado sesión como <strong>{user.nombre}</strong> ({user.email}). Tu cuenta tiene permisos de administración general para gestionar productos, métodos de pago, pedidos y encomiendas.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/admin"
            className="w-full sm:w-auto rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-md hover:scale-105 transition-all"
          >
            Ir al Panel Administrativo →
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              toast.info("Has cerrado sesión");
              navigate({ to: "/" });
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3.5 text-sm font-semibold text-muted-foreground hover:text-destructive hover:border-destructive transition-colors cursor-pointer"
          >
            <LogOut className="size-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  const pedidosUsuario = obtenerPedidosUsuario(user.email || user.id);

  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoPerfil(true);
    try {
      await updateProfile({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        cedula: cedula.trim(),
        direccionSugerida: direccion.trim(),
      });
      toast.success("¡Datos actualizados con éxito en Supabase!");
    } catch {
      toast.error("Error al actualizar datos del perfil");
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const badgeEstado = (estado: Order["estado"]) => {
    switch (estado) {
      case "pendiente":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-semibold">
            <Clock className="size-3.5" />
            En verificación (24-48h)
          </span>
        );
      case "aprobado":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold">
            <ShieldCheck className="size-3.5" />
            Pago Aprobado ✓
          </span>
        );
      case "rechazado":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-800 px-3 py-1 text-xs font-semibold">
            <AlertCircle className="size-3.5" />
            Pago Rechazado
          </span>
        );
      case "enviado":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-semibold">
            <Truck className="size-3.5" />
            Enviado en camino
          </span>
        );
      case "completado":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-200 text-neutral-800 px-3 py-1 text-xs font-semibold">
            Entregado
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Panel de Cliente
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold mt-1">¡Hola, {user.nombre}!</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {user.email} {user.telefono ? `· ${user.telefono}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              to="/admin"
              className="rounded-full bg-brand-yellow px-5 py-2.5 text-xs font-bold text-brand-brown hover:scale-105 transition-transform"
            >
              Ir al Panel Admin →
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              logout();
              toast.info("Has cerrado sesión");
              navigate({ to: "/" });
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive transition-colors cursor-pointer"
          >
            <LogOut className="size-3.5" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Tabs Selector: Pedidos vs Perfil */}
      <div className="mt-6 flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setSeccionActiva("pedidos")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            seccionActiva === "pedidos"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Package className="size-3.5" />
          Mis Pedidos ({pedidosUsuario.length})
        </button>

        <button
          type="button"
          onClick={() => setSeccionActiva("perfil")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            seccionActiva === "perfil"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <UserIcon className="size-3.5" />
          Mi Perfil y Datos
        </button>
      </div>

      {/* SECCIÓN 1: HISTORIAL DE PEDIDOS */}
      {seccionActiva === "pedidos" && (
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold">Mis Pedidos y Compras</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Consulta en tiempo real el estatus de tus pagos y encomiendas
              </p>
            </div>
            <Link
              to="/tienda"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline self-start sm:self-auto"
            >
              <span>Seguir comprando</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {pedidosUsuario.length === 0 ? (
            <div className="mt-6 rounded-3xl border-2 border-dashed border-border bg-card p-10 text-center">
              <ShoppingBag className="size-10 text-muted-foreground mx-auto" />
              <h3 className="font-display text-xl font-bold mt-3">Aún no tienes compras registradas</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Descubre nuestras piezas verificadas y haz tu primer pedido con Pago Móvil, Binance o transferencia.
              </p>
              <Link
                to="/tienda"
                className="mt-5 inline-flex rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:scale-105 transition-transform"
              >
                Explorar Tienda
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {pedidosUsuario.map((ped) => (
                <div
                  key={ped.id}
                  className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-card p-5 shadow-xs transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-display font-bold text-base text-foreground">
                        Pedido #{ped.id}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · {new Date(ped.fecha).toLocaleDateString("es-VE")}
                      </span>
                    </div>
                    <div>{badgeEstado(ped.estado)}</div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Método de Pago</span>
                      <strong className="text-foreground text-sm font-semibold">
                        {labelMetodoPago(ped.pago.metodo)}
                      </strong>
                      {ped.pago.referencia && (
                        <p className="text-muted-foreground text-[11px] font-mono mt-0.5">
                          Ref: {ped.pago.referencia}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        {ped.envio.empresa === "Coordinar con la tienda" ? "Modalidad de Entrega" : "Envío Nacional"}
                      </span>
                      <strong className="text-foreground text-sm font-semibold">
                        {ped.envio.empresa === "Coordinar con la tienda"
                          ? "🤝 Coordinar con la tienda"
                          : `${ped.envio.empresa} · ${ped.envio.ciudad}`}
                      </strong>
                      <p className="text-muted-foreground text-[11px] truncate mt-0.5">
                        {ped.envio.agencia}
                      </p>
                      {ped.envio.numeroGuia && (
                        <p className="text-blue-700 font-bold text-[11px] mt-0.5">
                          {ped.envio.empresa === "Coordinar con la tienda" ? "Constancia:" : "Guía:"} {ped.envio.numeroGuia}
                        </p>
                      )}
                    </div>

                    <div className="sm:text-right">
                      <span className="text-muted-foreground block text-[11px]">Total Pagado</span>
                      <strong className="text-foreground text-base font-bold">
                        {formatUSD(ped.totalUSD)}
                      </strong>
                      <p className="text-muted-foreground text-[11px] font-medium">
                        {ped.totalVES}
                      </p>
                    </div>
                  </div>

                  {/* Motivo de rechazo si aplica */}
                  {ped.estado === "rechazado" && ped.motivoRechazo && (
                    <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
                      <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
                      <div>
                        <strong>Motivo de rechazo:</strong> {ped.motivoRechazo}
                        <p className="mt-1">
                          Comunícate a nuestro WhatsApp para corregir el comprobante o resolver el inconveniente.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Botón ver detalles */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Package className="size-4" />
                      <span>
                        {ped.items.reduce((s, i) => s + i.cantidad, 0)} piezas en esta orden
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPedidoDetalleModal(ped)}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Eye className="size-3.5" />
                      Ver Detalle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 2: MI PERFIL Y DATOS */}
      {seccionActiva === "perfil" && (
        <div className="mt-6 max-w-2xl">
          <div className="rounded-3xl border-2 border-primary/30 bg-card p-6 md:p-8 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="font-display text-2xl font-bold">Mis Datos Personales</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Esta información se usará automáticamente en el checkout para tus compras.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-yellow/60 px-3 py-1 text-xs font-bold text-brand-brown">
                {user.rol === "admin" ? "Admin" : "Cliente"}
              </span>
            </div>

            <form onSubmit={handleGuardarPerfil} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-foreground">Nombre Completo</label>
                <div className="relative mt-1.5">
                  <UserIcon className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-foreground">Correo Electrónico</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full rounded-xl border border-input bg-muted/60 pl-10 pr-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Tu correo electrónico es administrado por Supabase Auth.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-foreground">Cédula de Identidad</label>
                  <div className="relative mt-1.5">
                    <CreditCard className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="V-28000000"
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-foreground">Teléfono de Contacto</label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <input
                      type="tel"
                      placeholder="0414-1234567"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-foreground">
                  Dirección o Agencia Sugerida
                </label>
                <div className="relative mt-1.5">
                  <MapPin className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Ej. Valencia, Carabobo - MRW Los Sauces"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={guardandoPerfil}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-sm hover:scale-[1.01] transition-transform cursor-pointer disabled:opacity-60"
                >
                  {guardandoPerfil ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Guardando en Supabase...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLES DEL PEDIDO */}
      {pedidoDetalleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-background border-2 border-primary p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-display text-xl font-bold">
                  Detalle del Pedido #{pedidoDetalleModal.id}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {new Date(pedidoDetalleModal.fecha).toLocaleString("es-VE")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPedidoDetalleModal(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>{badgeEstado(pedidoDetalleModal.estado)}</div>

              {/* Lista de productos */}
              <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                <p className="font-bold uppercase text-[11px] text-muted-foreground">Piezas adquiridas</p>
                {pedidoDetalleModal.items.map((it) => (
                  <div key={it.id} className="flex items-center gap-3 py-1 border-b border-border/40 last:border-0">
                    <img src={it.imagen} alt={it.nombre} className="size-10 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{it.nombre}</p>
                      <p className="text-muted-foreground text-[10px]">{it.cantidad} × {formatUSD(it.precioUSD)}</p>
                    </div>
                    <span className="font-bold">{formatUSD(it.precioUSD * it.cantidad)}</span>
                  </div>
                ))}
              </div>

              {/* Datos de envío */}
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="font-bold uppercase text-[11px] text-muted-foreground">Destinatario y Encomienda</p>
                <p className="mt-1 font-semibold">{pedidoDetalleModal.cliente.nombre} ({pedidoDetalleModal.cliente.cedula})</p>
                <p className="text-muted-foreground">Empresa: {pedidoDetalleModal.envio.empresa} (Cobro en Destino)</p>
                <p className="text-muted-foreground">Agencia: {pedidoDetalleModal.envio.agencia}, {pedidoDetalleModal.envio.ciudad}</p>
                {pedidoDetalleModal.envio.numeroGuia && (
                  <p className="text-blue-700 font-bold mt-1">Nro. de Guía: {pedidoDetalleModal.envio.numeroGuia}</p>
                )}
              </div>

              {/* Datos de pago */}
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="font-bold uppercase text-[11px] text-muted-foreground">Información del Pago</p>
                <p className="mt-1 font-semibold">{labelMetodoPago(pedidoDetalleModal.pago.metodo)}</p>
                {pedidoDetalleModal.pago.referencia && (
                  <p className="text-muted-foreground font-mono">Referencia: {pedidoDetalleModal.pago.referencia}</p>
                )}
                {pedidoDetalleModal.pago.comprobanteNombre && (
                  <p className="text-brand-brown font-medium mt-1">Comprobante: {pedidoDetalleModal.pago.comprobanteNombre}</p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setPedidoDetalleModal(null)}
                className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
