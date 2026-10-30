import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  CreditCard,
  MessageCircle,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  UploadCloud,
  Building2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useAdminStore } from "@/lib/admin-store";
import { formatUSD, formatVES, TASA_BCV } from "@/lib/products";
import {
  BINANCE_DATOS,
  construirMensajeWhatsApp,
  CUENTA_BANCARIA_DATOS,
  DatosEnvio,
  DatosPago,
  EmpresaEnvio,
  generarNumeroPedido,
  labelMetodoPago,
  MetodoPago,
  PAGO_MOVIL_DATOS,
  WHATSAPP_CONFIG,
} from "@/lib/checkout";

const BANCOS_VENEZUELA = [
  "Banesco",
  "Banco de Venezuela",
  "Mercantil",
  "BBVA Provincial",
  "Bancaribe",
  "Banco Nacional de Crédito (BNC)",
  "Bancamiga",
  "Banplus",
  "Otro banco",
];

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Finalizar Pedido — ValCheck" },
      {
        name: "description",
        content: "Completa tu pedido de forma rápida. La tienda se comunicará directamente contigo por WhatsApp.",
      },
      { property: "og:title", content: "Finalizar Pedido — ValCheck" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, totalUSD, vaciar } = useCart();
  const { user, isAdmin, isLoggedIn } = useAuth();
  const { crearPedido, ajustesPago, tasaBCV } = useAdminStore();
  const navigate = useNavigate();

  // Bloqueo para Administradores
  if (isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:py-20 text-center">
        <span className="mx-auto flex size-16 sm:size-20 items-center justify-center rounded-full bg-brand-yellow text-brand-brown shadow-sm">
          <ShieldCheck className="size-8 sm:size-10" />
        </span>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-yellow/60 px-4 py-1 text-xs font-bold text-brand-brown">
          Rol Administrador
        </span>
        <h1 className="mt-3 font-display text-2xl font-bold">Modo Administrativo</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Las cuentas administrativas gestionan pedidos desde el panel.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/admin"
            className="w-full sm:w-auto rounded-full bg-primary px-6 py-3 text-xs font-bold text-primary-foreground hover:scale-105 transition-transform"
          >
            Ir al Panel Administrativo
          </Link>
          <Link
            to="/tienda"
            className="w-full sm:w-auto rounded-full border border-border px-6 py-3 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Ver Tienda Pública
          </Link>
        </div>
      </div>
    );
  }

  const datosPagoMovil = ajustesPago?.pagoMovil || PAGO_MOVIL_DATOS;
  const datosBinance = ajustesPago?.binance || BINANCE_DATOS;
  const datosCuentaBancaria = ajustesPago?.cuentaBancaria || CUENTA_BANCARIA_DATOS;
  const datosWhatsapp = ajustesPago?.whatsapp || WHATSAPP_CONFIG;

  // 1. Datos del Cliente (¡Mínimos y sencillos!)
  const [nombreCompleto, setNombreCompleto] = useState(user?.nombre || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");
  const [ciudad, setCiudad] = useState("");
  const [preferenciaEnvio, setPreferenciaEnvio] = useState<EmpresaEnvio>("Coordinar con la tienda");
  const [notas, setNotas] = useState("");

  // 2. Método de Pago (Por defecto WhatsApp para máxima rapidez)
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("whatsapp");
  const [bancoOrigen, setBancoOrigen] = useState("Banesco");
  const [referencia, setReferencia] = useState("");
  const [idBinance, setIdBinance] = useState("");
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [comprobanteDataUrl, setComprobanteDataUrl] = useState<string | null>(null);

  // Estado de éxito
  const [pedidoConfirmado, setPedidoConfirmado] = useState<{
    numero: string;
    whatsappUrl: string;
    totalUSD: number;
    envio: DatosEnvio;
    pago: DatosPago;
  } | null>(null);

  // Portapapeles
  const [copiadoDato, setCopiadoDato] = useState<string | null>(null);
  const copiarAlPortapapeles = (texto: string, label: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoDato(label);
    toast.success(`${label} copiado`);
    setTimeout(() => setCopiadoDato(null), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        toast.error("El archivo no debe superar los 8MB");
        return;
      }
      setComprobanteFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setComprobanteDataUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
      toast.success("Comprobante adjuntado");
    }
  };

  const removerComprobante = () => {
    setComprobanteFile(null);
    setComprobanteDataUrl(null);
  };

  // Enviar / Confirmar Pedido
  const handleConfirmarPedido = () => {
    if (items.length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }

    if (!nombreCompleto.trim()) {
      toast.error("Por favor ingresa tu Nombre y Apellido.");
      return;
    }

    if (!telefono.trim()) {
      toast.error("Por favor ingresa tu número de WhatsApp para contactarte.");
      return;
    }

    if (!ciudad.trim()) {
      toast.error("Por favor indica tu Ciudad o Ubicación para coordinar la entrega.");
      return;
    }

    const numeroPedido = generarNumeroPedido();

    const envioData: DatosEnvio = {
      nombreCompleto: nombreCompleto.trim(),
      telefono: telefono.trim(),
      ciudad: ciudad.trim(),
      empresa: preferenciaEnvio,
      agenciaDestino: preferenciaEnvio === "Coordinar con la tienda" ? "Coordinar por WhatsApp" : preferenciaEnvio,
      notas: notas.trim() || undefined,
    };

    const pagoData: DatosPago = {
      metodo: metodoPago,
      bancoOrigen: metodoPago === "binance" || metodoPago === "whatsapp" ? undefined : bancoOrigen,
      referencia: metodoPago === "binance" ? idBinance.trim() : referencia.trim() || undefined,
      comprobanteNombre: comprobanteFile ? comprobanteFile.name : undefined,
      comprobanteUrl: comprobanteDataUrl || undefined,
      idTransaccionBinance: metodoPago === "binance" ? idBinance.trim() || undefined : undefined,
    };

    // Registrar pedido en la base de datos y panel administrativo
    crearPedido({
      numeroPedido,
      userId: user?.id,
      cliente: {
        nombre: nombreCompleto.trim(),
        cedula: "Por coordinar",
        telefono: telefono.trim(),
        email: user?.email,
      },
      envio: {
        empresa: preferenciaEnvio,
        estado: ciudad.trim(),
        ciudad: ciudad.trim(),
        agencia: envioData.agenciaDestino || "Coordinar por WhatsApp",
        notas: notas.trim() || undefined,
      },
      pago: pagoData,
      items: items.map((i) => ({
        id: i.producto.id,
        nombre: i.producto.nombre,
        categoria: i.producto.categoria,
        precioUSD: i.producto.precioUSD,
        cantidad: i.cantidad,
        imagen: i.producto.imagen,
      })),
      totalUSD,
      totalVES: formatVES(totalUSD, tasaBCV),
    });

    const mensajeEncoded = construirMensajeWhatsApp({
      numeroPedido,
      items,
      totalUSD,
      envio: envioData,
      pago: pagoData,
    });

    const whatsappUrl = `https://wa.me/${datosWhatsapp.numero}?text=${mensajeEncoded}`;

    setPedidoConfirmado({
      numero: numeroPedido,
      whatsappUrl,
      totalUSD,
      envio: envioData,
      pago: pagoData,
    });

    vaciar();

    // Si el método es WhatsApp, abrir la app de WhatsApp de inmediato
    if (metodoPago === "whatsapp") {
      try {
        window.open(whatsappUrl, "_blank");
      } catch {
        window.location.href = whatsappUrl;
      }
      toast.success("¡Pedido generado! Abriendo WhatsApp con la tienda...");
    } else {
      toast.success("¡Tu pedido ha sido recibido con éxito!", {
        description: "Nuestro equipo se pondrá en contacto contigo por WhatsApp.",
      });
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Carrito vacío
  if (items.length === 0 && !pedidoConfirmado) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 sm:py-20 text-center">
        <span className="stamp flex size-16 sm:size-20 items-center justify-center">
          <ShoppingBag className="size-8 sm:size-9 text-brand-brown" />
        </span>
        <h1 className="mt-5 sm:mt-6 font-display text-2xl sm:text-3xl font-semibold">Tu carrito está vacío</h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
          Agrega piezas de nuestra colección para iniciar el pedido.
        </p>
        <Link
          to="/tienda"
          className="mt-6 rounded-full bg-primary px-7 py-3 text-xs sm:text-sm font-semibold text-primary-foreground shadow-md transition-all hover:scale-105"
        >
          Explorar tienda
        </Link>
      </div>
    );
  }

  // Pantalla de Éxito / Confirmación
  if (pedidoConfirmado) {
    return (
      <div className="mx-auto max-w-2xl px-3 sm:px-6 py-8 sm:py-12">
        <div className="rounded-3xl border-2 border-primary bg-card p-5 sm:p-8 md:p-10 text-center shadow-lg">
          <span className="mx-auto flex size-16 sm:size-20 items-center justify-center rounded-full bg-brand-yellow text-brand-brown shadow-sm ring-4 ring-brand-yellow/30">
            <Check className="size-8 sm:size-10 stroke-[3]" />
          </span>

          <span className="mt-4 sm:mt-5 inline-block rounded-full bg-brand-yellow/80 px-4 py-1 text-xs font-bold uppercase tracking-wider text-brand-brown">
            Pedido Generado con Éxito
          </span>

          <h1 className="mt-2.5 sm:mt-3 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            ¡Tu pedido ha sido registrado!
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            Número de orden:{" "}
            <strong className="text-foreground font-mono text-sm sm:text-base">#{pedidoConfirmado.numero}</strong>
          </p>

          {/* Banner de contacto de la tienda */}
          <div className="mt-5 sm:mt-6 rounded-2xl bg-brand-yellow/40 p-4 sm:p-6 text-left border border-border shadow-xs">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-brown text-brand-yellow mt-0.5">
                <MessageCircle className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-brand-brown text-sm sm:text-base">
                  Nos comunicaremos contigo directamente
                </p>
                <p className="text-xs sm:text-sm text-foreground/80 mt-1 leading-relaxed">
                  No te preocupes por más trámites. La tienda se pondrá en contacto contigo a tu WhatsApp{" "}
                  <strong>{pedidoConfirmado.envio.telefono}</strong> para coordinar la entrega en{" "}
                  <strong>{pedidoConfirmado.envio.ciudad}</strong> y concretar el pago ({labelMetodoPago(pedidoConfirmado.pago.metodo)}).
                </p>
              </div>
            </div>
          </div>

          {/* Botón directo a WhatsApp si no se abrió */}
          <div className="mt-6">
            <a
              href={pedidoConfirmado.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-3.5 text-sm font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-center"
            >
              <MessageCircle className="size-5" />
              <span>
                {pedidoConfirmado.pago.metodo === "whatsapp"
                  ? "Enviar pedido a WhatsApp ahora"
                  : "Escribir a la tienda por WhatsApp"}
              </span>
            </a>
            <p className="text-[11px] text-muted-foreground mt-2">
              (Pulsa este botón si la ventana de WhatsApp no se abrió automáticamente)
            </p>
          </div>

          {/* Resumen conciso */}
          <div className="mt-6 rounded-2xl bg-background/60 p-4 border border-border text-xs text-left grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <span className="text-muted-foreground block text-[11px] font-medium uppercase tracking-wider">Cliente</span>
              <p className="font-semibold text-foreground mt-0.5">{pedidoConfirmado.envio.nombreCompleto}</p>
              <p className="text-muted-foreground">WhatsApp: {pedidoConfirmado.envio.telefono}</p>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px] font-medium uppercase tracking-wider">Destino & Entrega</span>
              <p className="font-semibold text-foreground mt-0.5">{pedidoConfirmado.envio.ciudad}</p>
              <p className="text-muted-foreground">{pedidoConfirmado.envio.empresa || "Coordinar por WhatsApp"}</p>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px] font-medium uppercase tracking-wider">Total</span>
              <p className="font-semibold text-foreground mt-0.5">{formatUSD(pedidoConfirmado.totalUSD)}</p>
              <p className="text-muted-foreground" suppressHydrationWarning>{formatVES(pedidoConfirmado.totalUSD, tasaBCV)}</p>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px] font-medium uppercase tracking-wider">Método de Pago</span>
              <p className="font-semibold text-foreground mt-0.5">{labelMetodoPago(pedidoConfirmado.pago.metodo)}</p>
              {pedidoConfirmado.pago.referencia && (
                <p className="text-muted-foreground font-mono">Ref: {pedidoConfirmado.pago.referencia}</p>
              )}
            </div>
          </div>

          {/* Acciones de navegación */}
          <div className="mt-6 pt-5 border-t border-border flex flex-wrap justify-center gap-2.5">
            <Link
              to="/tienda"
              className="rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:scale-105"
            >
              Volver a la tienda
            </Link>
            <Link
              to="/"
              className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-6 py-5 sm:py-8 md:py-12 w-full min-w-0 overflow-x-hidden">
      {/* Botón Volver */}
      <div className="mb-4 sm:mb-6">
        <Link
          to="/tienda"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5 sm:size-4" /> Seguir explorando la tienda
        </Link>
      </div>

      {/* Cabecera del Checkout */}
      <div className="mb-6 sm:mb-8 border-b border-border pb-4 sm:pb-6">
        <div className="flex items-center gap-2">
          <span className="stamp inline-flex items-center gap-1 px-3 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <Sparkles className="size-3 text-brand-brown" /> Proceso Rápido
          </span>
        </div>
        <h1 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold">Finalizar Pedido</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Solo indícanos tus datos básicos. <strong>La tienda se comunicará directamente contigo por WhatsApp</strong> para coordinar la entrega y confirmar tu pedido.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Formulario Principal (7 u 8 columnas) */}
        <div className="lg:col-span-8 space-y-6">
          {/* ========================================================= */}
          {/* PASO 1: DATOS BÁSICOS DE CONTACTO */}
          {/* ========================================================= */}
          <div className="rounded-3xl border-2 border-primary bg-card p-4 sm:p-6 md:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 sm:gap-3 border-b border-border pb-4">
              <span className="flex size-8 sm:size-9 items-center justify-center rounded-full bg-brand-yellow text-brand-brown font-bold text-xs sm:text-sm shrink-0">
                1
              </span>
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold">Tus Datos de Contacto</h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Para que la tienda se comunique contigo de inmediato
                </p>
              </div>
            </div>

            {/* Aviso de tranquilidad */}
            <div className="rounded-2xl bg-brand-yellow/30 p-3.5 sm:p-4 border border-brand-yellow/60 text-xs text-brand-brown flex items-start gap-2.5">
              <MessageCircle className="size-4 shrink-0 text-brand-brown mt-0.5" />
              <p className="leading-relaxed">
                <strong>Sin trámites ni registros largos:</strong> Solo necesitamos tu nombre, WhatsApp y ciudad. Una asesora te escribirá para coordinar la entrega (Zoom, MRW o retiro personal) y concretar el pago.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-foreground block">
                  Nombre y Apellido *
                </label>
                <input
                  type="text"
                  required
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Ej. María Elena Pérez"
                  className="mt-1.5 w-full rounded-2xl border border-input bg-background px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase text-foreground block">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej. 0414 123 4567"
                    className="mt-1.5 w-full rounded-2xl border border-input bg-background px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    Número al que te escribiremos para confirmar
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-foreground block">
                    Ciudad / Ubicación *
                  </label>
                  <input
                    type="text"
                    required
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    placeholder="Ej. Valencia, Caracas, Maracaibo..."
                    className="mt-1.5 w-full rounded-2xl border border-input bg-background px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    Para saber a dónde enviar o entregar
                  </span>
                </div>
              </div>

              {/* Preferencia de entrega simple (Opcional) */}
              <div>
                <label className="text-xs font-bold uppercase text-foreground block">
                  Preferencia de Entrega (Opcional)
                </label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreferenciaEnvio("Coordinar con la tienda")}
                    className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition-all cursor-pointer ${
                      preferenciaEnvio === "Coordinar con la tienda"
                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    🤝 Por WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreferenciaEnvio("MRW")}
                    className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition-all cursor-pointer ${
                      preferenciaEnvio === "MRW"
                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    📦 MRW (Nacional)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreferenciaEnvio("ZOOM")}
                    className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition-all cursor-pointer col-span-2 sm:col-span-1 ${
                      preferenciaEnvio === "ZOOM"
                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    🚚 ZOOM (Nacional)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block">
                  Nota o indicación especial (Opcional)
                </label>
                <input
                  type="text"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej. Delivery en la tarde, para regalo..."
                  className="mt-1.5 w-full rounded-2xl border border-input bg-background px-3.5 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* PASO 2: MÉTODO DE PAGO */}
          {/* ========================================================= */}
          <div className="rounded-3xl border-2 border-primary bg-card p-4 sm:p-6 md:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 sm:gap-3 border-b border-border pb-4">
              <span className="flex size-8 sm:size-9 items-center justify-center rounded-full bg-brand-yellow text-brand-brown font-bold text-xs sm:text-sm shrink-0">
                2
              </span>
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold">Elige cómo deseas Pagar</h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Selecciona tu método preferido
                </p>
              </div>
            </div>

            {/* Opciones de método de pago */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. DIRECTO VÍA WHATSAPP (RECOMENDADO) */}
              <button
                type="button"
                onClick={() => setMetodoPago("whatsapp")}
                className={`relative flex items-start gap-3 rounded-2xl border-2 p-3.5 sm:p-4 text-left transition-all cursor-pointer ${
                  metodoPago === "whatsapp"
                    ? "border-emerald-600 bg-emerald-500/10 shadow-sm ring-2 ring-emerald-500/30"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0 mt-0.5 shadow-xs">
                  <MessageCircle className="size-4.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-xs sm:text-sm text-foreground">Directo por WhatsApp</p>
                    <span className="rounded-full bg-emerald-600 px-1.5 py-0.2 text-[8px] sm:text-[9px] font-black text-white uppercase">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                    Envía el pedido al chat de la tienda y acuerda el pago en 1 minuto.
                  </p>
                </div>
                {metodoPago === "whatsapp" && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                )}
              </button>

              {/* 2. PAGO MÓVIL */}
              <button
                type="button"
                onClick={() => setMetodoPago("pago_movil")}
                className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 sm:p-4 text-left transition-all cursor-pointer ${
                  metodoPago === "pago_movil"
                    ? "border-primary bg-brand-yellow/30 shadow-xs"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-brand-yellow text-brand-brown shrink-0 mt-0.5">
                  <CreditCard className="size-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs sm:text-sm text-foreground">Pago Móvil (Bs)</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Tasa oficial BCV</p>
                  <span className="inline-block mt-1 text-[11px] font-semibold text-brand-brown" suppressHydrationWarning>
                    {formatVES(totalUSD, tasaBCV)}
                  </span>
                </div>
                {metodoPago === "pago_movil" && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                )}
              </button>

              {/* 3. BINANCE */}
              <button
                type="button"
                onClick={() => setMetodoPago("binance")}
                className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 sm:p-4 text-left transition-all cursor-pointer ${
                  metodoPago === "binance"
                    ? "border-primary bg-brand-yellow/30 shadow-xs"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-yellow-400 text-yellow-950 shrink-0 mt-0.5">
                  <QrCode className="size-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs sm:text-sm text-foreground">Binance (USDT)</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Binance Pay</p>
                  <span className="inline-block mt-1 text-[11px] font-semibold text-brand-brown">
                    {totalUSD.toFixed(2)} USDT
                  </span>
                </div>
                {metodoPago === "binance" && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                )}
              </button>

              {/* 4. CUENTA BANCARIA */}
              <button
                type="button"
                onClick={() => setMetodoPago("transferencia")}
                className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 sm:p-4 text-left transition-all cursor-pointer ${
                  metodoPago === "transferencia"
                    ? "border-primary bg-brand-yellow/30 shadow-xs"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-brand-yellow text-brand-brown shrink-0 mt-0.5">
                  <Building2 className="size-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs sm:text-sm text-foreground">Transferencia Bancaria</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Cuenta Corriente (Bs)</p>
                  <span className="inline-block mt-1 text-[11px] font-semibold text-brand-brown" suppressHydrationWarning>
                    {formatVES(totalUSD, tasaBCV)}
                  </span>
                </div>
                {metodoPago === "transferencia" && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                )}
              </button>
            </div>

            {/* DETALLES DE CADA MÉTODO */}
            {metodoPago === "whatsapp" && (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-sm">
                  <MessageCircle className="size-4 shrink-0 text-emerald-600" />
                  <span>Pedido Directo a WhatsApp</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Al pulsar el botón inferior, <strong>el pedido se enviará directamente al WhatsApp de la tienda</strong> con el detalle exacto de tus piezas. Podrás acordar el pago por transferencia, Pago Móvil, Zelle o efectivo directamente con nuestro equipo.
                </p>
              </div>
            )}

            {metodoPago === "pago_movil" && (
              <div className="rounded-2xl border-2 border-primary/30 bg-brand-yellow/30 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-primary/20 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-brown">
                    Datos para Pago Móvil
                  </span>
                  <span className="font-bold text-sm text-brand-brown" suppressHydrationWarning>
                    {formatVES(totalUSD, tasaBCV)}
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-background/90 p-2 border border-border">
                    <div>
                      <span className="text-muted-foreground text-[10px]">Banco</span>
                      <p className="font-bold">{datosPagoMovil.banco} ({datosPagoMovil.codigoBanco})</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copiarAlPortapapeles(datosPagoMovil.codigoBanco, "Código")}
                      className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {copiadoDato === "Código" ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-background/90 p-2 border border-border">
                    <div>
                      <span className="text-muted-foreground text-[10px]">Teléfono</span>
                      <p className="font-bold">{datosPagoMovil.telefono}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copiarAlPortapapeles(datosPagoMovil.telefono, "Teléfono")}
                      className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {copiadoDato === "Teléfono" ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-background/90 p-2 border border-border">
                    <div>
                      <span className="text-muted-foreground text-[10px]">Cédula / RIF</span>
                      <p className="font-bold">{datosPagoMovil.cedula}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copiarAlPortapapeles(datosPagoMovil.cedula, "Cédula")}
                      className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {copiadoDato === "Cédula" ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-background/90 p-2 border border-border">
                    <div>
                      <span className="text-muted-foreground text-[10px]">Beneficiario</span>
                      <p className="font-bold truncate">{datosPagoMovil.titular}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[11px] font-bold uppercase text-foreground block">
                    Número de Referencia (Opcional si ya pagaste)
                  </label>
                  <input
                    type="text"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    placeholder="Ej. Últimos 6 dígitos de la referencia"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    Si aún no has pagado, no te preocupes: puedes coordinarlo directamente con nosotros.
                  </span>
                </div>
              </div>
            )}

            {metodoPago === "binance" && (
              <div className="rounded-2xl border-2 border-primary/30 bg-brand-yellow/30 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-primary/20 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-brown">
                    Binance Pay (USDT)
                  </span>
                  <span className="font-bold text-sm text-brand-brown">
                    {totalUSD.toFixed(2)} USDT
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-background/90 p-2 border border-border">
                    <div>
                      <span className="text-muted-foreground text-[10px]">Binance Pay ID</span>
                      <p className="font-bold font-mono">{datosBinance.payId}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copiarAlPortapapeles(datosBinance.payId, "Pay ID")}
                      className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {copiadoDato === "Pay ID" ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-background/90 p-2 border border-border">
                    <div>
                      <span className="text-muted-foreground text-[10px]">Correo Binance</span>
                      <p className="font-bold truncate">{datosBinance.correo}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copiarAlPortapapeles(datosBinance.correo, "Correo")}
                      className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {copiadoDato === "Correo" ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[11px] font-bold uppercase text-foreground block">
                    ID de transacción o Correo emisor (Opcional)
                  </label>
                  <input
                    type="text"
                    value={idBinance}
                    onChange={(e) => setIdBinance(e.target.value)}
                    placeholder="Ej. ID de orden o correo de tu cuenta Binance"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring font-mono"
                  />
                </div>
              </div>
            )}

            {metodoPago === "transferencia" && (
              <div className="rounded-2xl border-2 border-primary/30 bg-brand-yellow/30 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-primary/20 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-brown">
                    Cuenta Corriente Nacional
                  </span>
                  <span className="font-bold text-sm text-brand-brown" suppressHydrationWarning>
                    {formatVES(totalUSD, tasaBCV)}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-background/90 p-2 border border-border">
                    <div>
                      <span className="text-muted-foreground text-[10px]">Número de Cuenta (20 dígitos)</span>
                      <p className="font-bold font-mono">{datosCuentaBancaria.numeroCuenta}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copiarAlPortapapeles(datosCuentaBancaria.numeroCuenta, "Nro. Cuenta")}
                      className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {copiadoDato === "Nro. Cuenta" ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-background/90 p-2 border border-border">
                    <div>
                      <span className="text-muted-foreground text-[10px]">Banco y Titular</span>
                      <p className="font-bold">{datosCuentaBancaria.banco} · {datosCuentaBancaria.titular} ({datosCuentaBancaria.rif})</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[11px] font-bold uppercase text-foreground block">
                    Número de Referencia (Opcional)
                  </label>
                  <input
                    type="text"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    placeholder="Ej. Referencia de la transferencia"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Columna Lateral: Resumen del Pedido y Botón Final */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 rounded-3xl border-2 border-primary bg-card p-4 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-display text-lg sm:text-xl font-bold flex items-center justify-between">
              Resumen del Pedido
              <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-brand-yellow text-brand-brown">
                {items.reduce((s, i) => s + i.cantidad, 0)} {items.length === 1 ? "pieza" : "piezas"}
              </span>
            </h3>

            {/* Lista de productos */}
            <div className="max-h-56 overflow-y-auto divide-y divide-border/60 pr-1 text-xs">
              {items.map(({ producto, cantidad }) => (
                <div key={producto.id} className="py-2.5 flex items-center gap-2.5">
                  <img
                    src={producto.imagen}
                    alt={producto.nombre}
                    className="size-11 rounded-xl object-cover border border-border shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{producto.nombre}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {cantidad} × {formatUSD(producto.precioUSD)}
                    </p>
                  </div>
                  <span className="font-bold shrink-0">
                    {formatUSD(producto.precioUSD * cantidad)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="border-t border-border pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-semibold text-foreground">{formatUSD(totalUSD)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Entrega / Envío</span>
                <span className="font-semibold text-foreground">Coordinar con tienda</span>
              </div>
              <div className="border-t border-border pt-2.5 flex items-baseline justify-between">
                <div>
                  <span className="font-bold text-sm">Total a Pagar</span>
                  <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1 mt-0.5">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Tasa Oficial BCV: Bs. {Number(tasaBCV || TASA_BCV).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-foreground">{formatUSD(totalUSD)}</p>
                  <p className="text-xs font-bold text-brand-brown/80" suppressHydrationWarning>{formatVES(totalUSD, tasaBCV)}</p>
                </div>
              </div>
            </div>

            {/* BOTÓN PRINCIPAL DE ACCIÓN */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleConfirmarPedido}
                className={`w-full flex items-center justify-center gap-2.5 rounded-full py-3.5 sm:py-4 px-6 text-sm font-bold shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-center ${
                  metodoPago === "whatsapp"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                    : "bg-primary text-primary-foreground hover:opacity-95"
                }`}
              >
                {metodoPago === "whatsapp" ? (
                  <>
                    <MessageCircle className="size-5 shrink-0" />
                    <span>Pedir por WhatsApp Ahora</span>
                  </>
                ) : (
                  <>
                    <Check className="size-5 shrink-0" />
                    <span>Confirmar Pedido</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-[10px] sm:text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="size-3.5 text-brand-brown shrink-0" />
              <span>ValCheck · Belleza Verificada</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
