import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Copy,
  CreditCard,
  FileCheck2,
  Image as ImageIcon,
  MessageCircle,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  UploadCloud,
  Wallet,
  Building2,
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

const ESTADOS_VENEZUELA = [
  "Distrito Capital",
  "Miranda",
  "Aragua",
  "Carabobo",
  "Lara",
  "Zulia",
  "Anzoátegui",
  "Bolívar",
  "Nueva Esparta (Margarita)",
  "Táchira",
  "Mérida",
  "Falcón",
  "Monagas",
  "Sucre",
  "Barinas",
  "Portuguesa",
  "Trujillo",
  "Yaracuy",
  "Guárico",
  "La Guaira",
  "Cojedes",
  "Apure",
  "Amazonas",
  "Delta Amacuro",
];

const BANCOS_VENEZUELA = [
  "Banesco",
  "Banco de Venezuela",
  "Mercantil",
  "BBVA Provincial",
  "Bancaribe",
  "Banco Nacional de Crédito (BNC)",
  "Banco Exterior",
  "BFC Banco Fondo Común",
  "Banco Plaza",
  "Banplus",
  "Bancamiga",
  "Otro banco",
];

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Finalizar Pedido — ValCheck" },
      {
        name: "description",
        content: "Completa tu pedido paso a paso con Pago Móvil, Binance, Transferencia o directo vía WhatsApp.",
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

  if (isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-brand-yellow text-brand-brown shadow-sm">
          <ShieldCheck className="size-10" />
        </span>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-yellow/60 px-4 py-1 text-xs font-bold text-brand-brown">
          Rol Administrador
        </span>
        <h1 className="mt-3 font-display text-2xl font-bold">Modo Administrativo</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Las cuentas administrativas no realizan compras ni registran pagos de clientes. Puedes gestionar los productos, verificar pagos y coordinar envíos desde el panel.
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

  // Paso actual del carrusel/proceso: 1 = Pago, 2 = Envío, 3 = Confirmar
  const [pasoActual, setPasoActual] = useState<1 | 2 | 3>(1);

  // Paso 1: Método de Pago
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("pago_movil");
  const [bancoOrigen, setBancoOrigen] = useState("Banesco");
  const [referencia, setReferencia] = useState("");
  const [telefonoOrigen, setTelefonoOrigen] = useState("");
  const [idBinance, setIdBinance] = useState("");
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);

  // Paso 2: Datos de Envío (con auto-fill del usuario si está logueado)
  const [empresaEnvio, setEmpresaEnvio] = useState<EmpresaEnvio>("MRW");
  const [nombreCompleto, setNombreCompleto] = useState(user?.nombre || "");
  const [cedula, setCedula] = useState(user?.cedula || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");
  const [estado, setEstado] = useState("Distrito Capital");
  const [ciudad, setCiudad] = useState("");
  const [agenciaDestino, setAgenciaDestino] = useState("");
  const [notasEnvio, setNotasEnvio] = useState("");

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
        const url = URL.createObjectURL(file);
        setComprobantePreview(url);
      } else {
        setComprobantePreview(null);
      }
      toast.success("Comprobante adjuntado");
    }
  };

  const removerComprobante = () => {
    if (comprobantePreview) {
      URL.revokeObjectURL(comprobantePreview);
    }
    setComprobanteFile(null);
    setComprobantePreview(null);
  };

  // Validaciones antes de avanzar
  const avanzarAlPaso2 = () => {
    if (metodoPago !== "whatsapp" && !referencia.trim() && !idBinance.trim()) {
      toast.info("Ingresa el número de referencia o ID de la transacción para continuar.");
      return;
    }
    setPasoActual(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const avanzarAlPaso3 = () => {
    if (!nombreCompleto.trim() || !cedula.trim() || !telefono.trim()) {
      toast.error("Por favor completa tus datos personales de contacto.");
      return;
    }
    if (empresaEnvio !== "Coordinar con la tienda" && (!ciudad.trim() || !agenciaDestino.trim())) {
      toast.error(`Por favor ingresa la ciudad y la agencia de ${empresaEnvio} de destino.`);
      return;
    }
    if (empresaEnvio === "Coordinar con la tienda" && !ciudad.trim()) {
      toast.error("Por favor ingresa la ciudad donde te encuentras para coordinar la entrega.");
      return;
    }
    setPasoActual(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConfirmarPedido = () => {
    if (items.length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }

    const numeroPedido = generarNumeroPedido();

    const agenciaFinal =
      empresaEnvio === "Coordinar con la tienda" && !agenciaDestino.trim()
        ? "Coordinar con la tienda (Retiro personal / Delivery)"
        : agenciaDestino;

    const envioData: DatosEnvio = {
      nombreCompleto,
      cedula,
      telefono,
      estado,
      ciudad,
      empresa: empresaEnvio,
      agenciaDestino: agenciaFinal,
      notas: notasEnvio,
    };

    const pagoData: DatosPago = {
      metodo: metodoPago,
      bancoOrigen: metodoPago === "binance" ? undefined : bancoOrigen,
      referencia: metodoPago === "binance" ? idBinance : referencia,
      telefonoOrigen,
      comprobanteNombre: comprobanteFile ? comprobanteFile.name : undefined,
      idTransaccionBinance: metodoPago === "binance" ? idBinance : undefined,
    };

    // Registrar pedido en la base de datos local y panel administrativo
    crearPedido({
      numeroPedido,
      userId: user?.id,
      cliente: {
        nombre: nombreCompleto,
        cedula,
        telefono,
        email: user?.email,
      },
      envio: {
        empresa: empresaEnvio,
        estado,
        ciudad,
        agencia: agenciaDestino,
        notas: notasEnvio,
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
    toast.success("¡Tu pedido ha sido enviado con éxito!", {
      description: "En un lapso de 48 horas nos contactaremos contigo.",
    });
  };

  // Estado vacío
  if (items.length === 0 && !pedidoConfirmado) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <span className="stamp flex size-20 items-center justify-center">
          <ShoppingBag className="size-9 text-brand-brown" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-semibold">Tu carrito está vacío</h1>
        <p className="mt-2 text-muted-foreground">
          Agrega piezas de nuestra colección para iniciar el checkout.
        </p>
        <Link
          to="/tienda"
          className="mt-6 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:scale-105"
        >
          Explorar tienda
        </Link>
      </div>
    );
  }

  // Pantalla de Pedido Confirmado
  if (pedidoConfirmado) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-[2.5rem] border-2 border-primary bg-card p-6 shadow-xl md:p-10 text-center">
          <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-brand-yellow text-brand-brown shadow-sm ring-4 ring-brand-yellow/30">
            <Check className="size-10 stroke-[3]" />
          </span>

          <span className="mt-5 inline-block rounded-full bg-brand-yellow/80 px-4 py-1 text-xs font-bold uppercase tracking-wider text-brand-brown">
            Pedido Recibido con Éxito
          </span>

          <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl text-foreground">
            ¡Tu pedido ha sido enviado!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Número de orden asignada:{" "}
            <strong className="text-foreground font-mono">#{pedidoConfirmado.numero}</strong>
          </p>

          {/* Mensaje de 48 horas */}
          <div className="mt-6 rounded-2xl bg-brand-yellow/40 p-6 text-left border border-border shadow-xs">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-brown text-brand-yellow mt-0.5">
                <Clock className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-brand-brown text-base">
                  En un lapso de 48 horas nos contactaremos contigo
                </p>
                <p className="text-xs md:text-sm text-foreground/80 mt-1.5 leading-relaxed">
                  Tu pedido ha sido recibido correctamente. Nuestro equipo verificará tu pago ({labelMetodoPago(pedidoConfirmado.pago.metodo)}) y se pondrá en contacto contigo a tu teléfono <strong>{pedidoConfirmado.envio.telefono}</strong> para confirmar los datos y coordinar el despacho hacia <strong>{pedidoConfirmado.envio.ciudad}</strong> por <strong>{pedidoConfirmado.envio.empresa}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Resumen conciso */}
          <div className="mt-6 rounded-2xl bg-background/60 p-5 border border-border text-xs text-left grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground block text-[11px] font-medium uppercase tracking-wider">Cliente</span>
              <p className="font-semibold text-foreground mt-0.5">{pedidoConfirmado.envio.nombreCompleto}</p>
              <p className="text-muted-foreground">C.I. {pedidoConfirmado.envio.cedula}</p>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px] font-medium uppercase tracking-wider">Destino & Encomienda</span>
              <p className="font-semibold text-foreground mt-0.5">{pedidoConfirmado.envio.ciudad}, {pedidoConfirmado.envio.estado}</p>
              <p className="text-muted-foreground">{pedidoConfirmado.envio.empresa} · {pedidoConfirmado.envio.agenciaDestino}</p>
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
          <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/tienda"
              className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:scale-105"
            >
              Volver a la tienda
            </Link>
            <Link
              to="/"
              className="rounded-full border border-border px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Ir al inicio
            </Link>
            {isLoggedIn && (
              <Link
                to="/cuenta"
                className="rounded-full border border-border bg-brand-yellow/30 px-6 py-3.5 text-sm font-semibold text-brand-brown hover:bg-brand-yellow/50 transition-colors"
              >
                Ver mis pedidos
              </Link>
            )}
          </div>

          {/* Enlace opcional a soporte */}
          <div className="mt-6 pt-4 text-center">
            <p className="text-[11px] text-muted-foreground">
              ¿Tienes alguna duda sobre tu compra?{" "}
              <a
                href={pedidoConfirmado.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-brand-brown underline hover:opacity-80 inline-flex items-center gap-1"
              >
                <MessageCircle className="size-3" />
                Contactar a soporte por WhatsApp
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      {/* Botón Volver */}
      <div className="mb-6">
        <Link
          to="/tienda"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Seguir explorando la tienda
        </Link>
      </div>

      {/* Cabecera del Checkout */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Finalizar Pedido</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sigue los pasos para elegir tu forma de pago y los datos de envío nacional.
        </p>
      </div>

      {/* Indicador de Pasos / Carrusel */}
      <div className="mb-6 sm:mb-8 overflow-hidden rounded-2xl border-2 border-primary/30 bg-card p-2 sm:p-3 shadow-xs">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {/* Paso 1 */}
          <button
            type="button"
            onClick={() => setPasoActual(1)}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl py-2 sm:py-2.5 px-2 sm:px-3 text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              pasoActual === 1
                ? "bg-primary text-primary-foreground shadow-sm"
                : pasoActual > 1
                  ? "bg-brand-yellow/50 text-brand-brown hover:bg-brand-yellow/70"
                  : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <span className="flex size-5 sm:size-6 items-center justify-center rounded-full text-[10px] sm:text-xs font-bold border border-current shrink-0">
              {pasoActual > 1 ? <Check className="size-3 sm:size-3.5" strokeWidth={3} /> : "1"}
            </span>
            <span className="hidden sm:inline truncate">1. Método de Pago</span>
            <span className="sm:hidden text-xs">1. Pago</span>
          </button>

          {/* Paso 2 */}
          <button
            type="button"
            onClick={() => {
              if (pasoActual > 2) setPasoActual(2);
              else if (metodoPago === "whatsapp" || referencia.trim() || idBinance.trim())
                setPasoActual(2);
            }}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl py-2 sm:py-2.5 px-2 sm:px-3 text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              pasoActual === 2
                ? "bg-primary text-primary-foreground shadow-sm"
                : pasoActual > 2
                  ? "bg-brand-yellow/50 text-brand-brown hover:bg-brand-yellow/70"
                  : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <span className="flex size-5 sm:size-6 items-center justify-center rounded-full text-[10px] sm:text-xs font-bold border border-current shrink-0">
              {pasoActual > 2 ? <Check className="size-3 sm:size-3.5" strokeWidth={3} /> : "2"}
            </span>
            <span className="hidden sm:inline truncate">2. Envío o Entrega</span>
            <span className="sm:hidden text-xs">2. Envío</span>
          </button>

          {/* Paso 3 */}
          <button
            type="button"
            onClick={() => {
              if (nombreCompleto.trim() && ciudad.trim()) setPasoActual(3);
            }}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl py-2 sm:py-2.5 px-2 sm:px-3 text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              pasoActual === 3
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <span className="flex size-5 sm:size-6 items-center justify-center rounded-full text-[10px] sm:text-xs font-bold border border-current shrink-0">
              3
            </span>
            <span className="hidden sm:inline truncate">3. Confirmar</span>
            <span className="sm:hidden text-xs">3. Listo</span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-12">
        {/* Contenido Dinámico del Paso (8 columnas) */}
        <div className="lg:col-span-8">
          {/* ========================================================= */}
          {/* PASO 1: SELECCIONAR MÉTODO DE PAGO */}
          {/* ========================================================= */}
          {pasoActual === 1 && (
            <div className="rounded-2xl sm:rounded-[2rem] border-2 border-primary bg-card p-4 sm:p-6 md:p-8 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <span className="flex size-9 sm:size-10 items-center justify-center rounded-full bg-brand-yellow text-brand-brown shrink-0">
                  <CreditCard className="size-4.5 sm:size-5" />
                </span>
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold">Paso 1: Selecciona tu Método de Pago</h2>
                  <p className="text-xs text-muted-foreground">
                    Primero escoge cómo deseas pagar tu pedido en ValCheck
                  </p>
                </div>
              </div>

              {/* Grid con las 4 opciones de método de pago */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Pago Móvil */}
                <button
                  type="button"
                  onClick={() => setMetodoPago("pago_movil")}
                  className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all cursor-pointer ${
                    metodoPago === "pago_movil"
                      ? "border-primary bg-brand-yellow/30 shadow-xs"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-brand-yellow text-brand-brown shrink-0 mt-0.5">
                    <CreditCard className="size-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground">Pago Móvil</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Bolívares (Tasa oficial BCV)</p>
                    <span className="inline-block mt-2 text-[11px] font-semibold text-brand-brown" suppressHydrationWarning>
                      {formatVES(totalUSD, tasaBCV)}
                    </span>
                  </div>
                  {metodoPago === "pago_movil" && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                </button>

                {/* 2. Directo vía WhatsApp */}
                <button
                  type="button"
                  onClick={() => setMetodoPago("whatsapp")}
                  className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all cursor-pointer ${
                    metodoPago === "whatsapp"
                      ? "border-primary bg-brand-yellow/30 shadow-xs"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-brand-brown text-brand-yellow shrink-0 mt-0.5">
                    <MessageCircle className="size-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground">Directo vía WhatsApp</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Acordar el pago por chat con un asesor</p>
                    <span className="inline-block mt-2 text-[11px] font-semibold text-brand-brown">
                      Sin comprobante previo
                    </span>
                  </div>
                  {metodoPago === "whatsapp" && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                </button>

                {/* 3. Binance */}
                <button
                  type="button"
                  onClick={() => setMetodoPago("binance")}
                  className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all cursor-pointer ${
                    metodoPago === "binance"
                      ? "border-primary bg-brand-yellow/30 shadow-xs"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-brand-yellow text-brand-brown shrink-0 mt-0.5">
                    <QrCode className="size-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground">Binance (USDT / Pay)</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Binance Pay o transferencias cripto</p>
                    <span className="inline-block mt-2 text-[11px] font-semibold text-brand-brown">
                      {totalUSD.toFixed(2)} USDT
                    </span>
                  </div>
                  {metodoPago === "binance" && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                </button>

                {/* 4. Cuenta Bancaria */}
                <button
                  type="button"
                  onClick={() => setMetodoPago("transferencia")}
                  className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all cursor-pointer ${
                    metodoPago === "transferencia"
                      ? "border-primary bg-brand-yellow/30 shadow-xs"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-brand-yellow text-brand-brown shrink-0 mt-0.5">
                    <Building2 className="size-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground">Cuenta Bancaria</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Transferencia corriente nacional (Bs)</p>
                    <span className="inline-block mt-2 text-[11px] font-semibold text-brand-brown" suppressHydrationWarning>
                      {formatVES(totalUSD, tasaBCV)}
                    </span>
                  </div>
                  {metodoPago === "transferencia" && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                </button>
              </div>

              {/* DETALLES ESPECÍFICOS SEGÚN EL MÉTODO SELECCIONADO */}
              <div className="mt-8 border-t border-border pt-6">
                {/* Caso 1: PAGO MÓVIL */}
                {metodoPago === "pago_movil" && (
                  <div className="space-y-6">
                    <div className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-brand-yellow/30 p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-primary/20 pb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-brown">
                          Datos oficiales para Pago Móvil
                        </span>
                        <span className="text-lg font-bold text-brand-brown" suppressHydrationWarning>
                          {formatVES(totalUSD, tasaBCV)}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 text-xs">
                        <div className="flex items-center justify-between rounded-xl bg-background/90 p-2.5 border border-border">
                          <div>
                            <span className="text-muted-foreground text-[11px]">Banco</span>
                            <p className="font-bold">{datosPagoMovil.banco} ({datosPagoMovil.codigoBanco})</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copiarAlPortapapeles(datosPagoMovil.codigoBanco, "Código")}
                            className="p-1 text-muted-foreground hover:text-foreground"
                          >
                            {copiadoDato === "Código" ? <Check className="size-4 text-brand-green" /> : <Copy className="size-4" />}
                          </button>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-background/90 p-2.5 border border-border">
                          <div>
                            <span className="text-muted-foreground text-[11px]">Teléfono</span>
                            <p className="font-bold">{datosPagoMovil.telefono}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copiarAlPortapapeles(datosPagoMovil.telefono, "Teléfono")}
                            className="p-1 text-muted-foreground hover:text-foreground"
                          >
                            {copiadoDato === "Teléfono" ? <Check className="size-4 text-brand-green" /> : <Copy className="size-4" />}
                          </button>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-background/90 p-2.5 border border-border">
                          <div>
                            <span className="text-muted-foreground text-[11px]">Cédula / RIF</span>
                            <p className="font-bold">{datosPagoMovil.cedula}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copiarAlPortapapeles(datosPagoMovil.cedula, "Cédula")}
                            className="p-1 text-muted-foreground hover:text-foreground"
                          >
                            {copiadoDato === "Cédula" ? <Check className="size-4 text-brand-green" /> : <Copy className="size-4" />}
                          </button>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-background/90 p-2.5 border border-border">
                          <div>
                            <span className="text-muted-foreground text-[11px]">Beneficiario</span>
                            <p className="font-bold truncate">{datosPagoMovil.titular}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                        <ShieldCheck className="size-4 text-brand-brown shrink-0" />
                        <span>Verificación y gestión en el transcurso de 24 a 48 horas.</span>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-bold uppercase text-foreground">Banco de Origen</label>
                        <select
                          value={bancoOrigen}
                          onChange={(e) => setBancoOrigen(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                        >
                          {BANCOS_VENEZUELA.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase text-foreground">Número de Referencia *</label>
                        <input
                          type="text"
                          value={referencia}
                          onChange={(e) => setReferencia(e.target.value)}
                          placeholder="Ej. 654321"
                          className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
                        />
                      </div>
                    </div>

                    {/* Subir comprobante */}
                    <div>
                      <label className="text-xs font-bold uppercase text-foreground block">
                        Subir Comprobante (Captura o PDF)
                      </label>
                      <div className="mt-1.5">
                        {!comprobanteFile ? (
                          <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background p-5 text-center cursor-pointer hover:border-primary/60 hover:bg-brand-yellow/20 transition-colors">
                            <UploadCloud className="size-7 text-muted-foreground" />
                            <span className="mt-1.5 text-xs font-semibold text-foreground">
                              Adjuntar comprobante de pago móvil
                            </span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                            <span className="font-semibold text-xs truncate flex-1">{comprobanteFile.name}</span>
                            <button
                              type="button"
                              onClick={removerComprobante}
                              className="text-destructive p-1 rounded-md hover:bg-destructive/10"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Caso 2: DIRECTO VÍA WHATSAPP */}
                {metodoPago === "whatsapp" && (
                  <div className="rounded-2xl border border-border bg-brand-yellow/30 p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-brand-brown text-brand-yellow shrink-0">
                        <MessageCircle className="size-5" />
                      </span>
                      <div>
                        <h3 className="font-bold text-base text-brand-brown">
                          Acuerda tu pago directamente por WhatsApp
                        </h3>
                        <p className="mt-1 text-xs text-foreground/80 leading-relaxed">
                          Al continuar, registraremos tus datos de envío y se abrirá una conversación
                          privada en WhatsApp con ValCheck para proporcionarte soporte en vivo, opciones
                          personalizadas (efectivo, zelle, otros bancos) o resolver cualquier duda antes de pagar.
                        </p>
                      </div>
                    </div>
                    <div className="text-[11px] text-brand-brown/70 border-t border-brand-brown/10 pt-2 font-medium">
                      ✓ No necesitas comprobante ni referencia en este momento.
                    </div>
                  </div>
                )}

                {/* Caso 3: BINANCE PAY */}
                {metodoPago === "binance" && (
                  <div className="space-y-6">
                    <div className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-brand-yellow/30 p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-primary/20 pb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-brown">
                          Datos de Binance Pay / USDT
                        </span>
                        <span className="text-lg font-bold text-brand-brown">
                          {totalUSD.toFixed(2)} USDT
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 text-xs">
                        <div className="flex items-center justify-between rounded-xl bg-background/90 p-2.5 border border-border">
                          <div>
                            <span className="text-muted-foreground text-[11px]">Binance Pay ID</span>
                            <p className="font-bold font-mono">{datosBinance.payId}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copiarAlPortapapeles(datosBinance.payId, "Pay ID")}
                            className="p-1 text-muted-foreground hover:text-foreground"
                          >
                            {copiadoDato === "Pay ID" ? <Check className="size-4 text-brand-green" /> : <Copy className="size-4" />}
                          </button>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-background/90 p-2.5 border border-border">
                          <div>
                            <span className="text-muted-foreground text-[11px]">Correo Binance</span>
                            <p className="font-bold truncate">{datosBinance.correo}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copiarAlPortapapeles(datosBinance.correo, "Correo")}
                            className="p-1 text-muted-foreground hover:text-foreground"
                          >
                            {copiadoDato === "Correo" ? <Check className="size-4 text-brand-green" /> : <Copy className="size-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                        <ShieldCheck className="size-4 text-brand-brown shrink-0" />
                        <span>Aceptamos transferencias internas de Binance Pay o redes BEP-20 / TRC-20.</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase text-foreground">
                        ID de Orden / TXID de Binance *
                      </label>
                      <input
                        type="text"
                        value={idBinance}
                        onChange={(e) => setIdBinance(e.target.value)}
                        placeholder="Ej. ID de transacción de Binance o correo de tu cuenta"
                        className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
                      />
                    </div>

                    {/* Subida comprobante */}
                    <div>
                      <label className="text-xs font-bold uppercase text-foreground block">
                        Captura de confirmación de Binance
                      </label>
                      <div className="mt-1.5">
                        {!comprobanteFile ? (
                          <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background p-5 text-center cursor-pointer hover:border-primary/60 hover:bg-brand-yellow/20 transition-colors">
                            <UploadCloud className="size-7 text-muted-foreground" />
                            <span className="mt-1.5 text-xs font-semibold text-foreground">
                              Adjuntar captura de Binance
                            </span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                            <span className="font-semibold text-xs truncate flex-1">{comprobanteFile.name}</span>
                            <button
                              type="button"
                              onClick={removerComprobante}
                              className="text-destructive p-1 rounded-md hover:bg-destructive/10"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Caso 4: TRANSFERENCIA BANCARIA */}
                {metodoPago === "transferencia" && (
                  <div className="space-y-6">
                    <div className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-brand-yellow/30 p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-primary/20 pb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-brown">
                          Cuenta Corriente Nacional
                        </span>
                        <span className="text-lg font-bold text-brand-brown" suppressHydrationWarning>
                          {formatVES(totalUSD, tasaBCV)}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between rounded-xl bg-background/90 p-2.5 border border-border">
                          <div>
                            <span className="text-muted-foreground text-[11px]">Banco</span>
                            <p className="font-bold">{datosCuentaBancaria.banco}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-background/90 p-2.5 border border-border">
                          <div>
                            <span className="text-muted-foreground text-[11px]">Número de Cuenta (20 dígitos)</span>
                            <p className="font-bold font-mono">{datosCuentaBancaria.numeroCuenta}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copiarAlPortapapeles(datosCuentaBancaria.numeroCuenta, "Nro. Cuenta")}
                            className="p-1 text-muted-foreground hover:text-foreground"
                          >
                            {copiadoDato === "Nro. Cuenta" ? <Check className="size-4 text-brand-green" /> : <Copy className="size-4" />}
                          </button>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-background/90 p-2.5 border border-border">
                          <div>
                            <span className="text-muted-foreground text-[11px]">Titular / RIF</span>
                            <p className="font-bold">{datosCuentaBancaria.titular} ({datosCuentaBancaria.rif})</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copiarAlPortapapeles(datosCuentaBancaria.rif, "RIF")}
                            className="p-1 text-muted-foreground hover:text-foreground"
                          >
                            {copiadoDato === "RIF" ? <Check className="size-4 text-brand-green" /> : <Copy className="size-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-bold uppercase text-foreground">Banco Emisor</label>
                        <select
                          value={bancoOrigen}
                          onChange={(e) => setBancoOrigen(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                        >
                          {BANCOS_VENEZUELA.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase text-foreground">Número de Referencia *</label>
                        <input
                          type="text"
                          value={referencia}
                          onChange={(e) => setReferencia(e.target.value)}
                          placeholder="Ej. Referencia bancaria"
                          className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
                        />
                      </div>
                    </div>

                    {/* Subida comprobante */}
                    <div>
                      <label className="text-xs font-bold uppercase text-foreground block">
                        Comprobante de Transferencia
                      </label>
                      <div className="mt-1.5">
                        {!comprobanteFile ? (
                          <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background p-5 text-center cursor-pointer hover:border-primary/60 hover:bg-brand-yellow/20 transition-colors">
                            <UploadCloud className="size-7 text-muted-foreground" />
                            <span className="mt-1.5 text-xs font-semibold text-foreground">
                              Adjuntar recibo de transferencia
                            </span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                            <span className="font-semibold text-xs truncate flex-1">{comprobanteFile.name}</span>
                            <button
                              type="button"
                              onClick={removerComprobante}
                              className="text-destructive p-1 rounded-md hover:bg-destructive/10"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón para avanzar al paso 2 */}
              <div className="mt-6 sm:mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={avanzarAlPaso2}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <span>Continuar a Envíos Nacionales</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PASO 2: DATOS DE ENVÍOS NACIONALES */}
          {/* ========================================================= */}
          {pasoActual === 2 && (
            <div className="rounded-2xl sm:rounded-[2rem] border-2 border-primary bg-card p-4 sm:p-6 md:p-8 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <span className="flex size-9 sm:size-10 items-center justify-center rounded-full bg-brand-yellow text-brand-brown shrink-0">
                  <Truck className="size-4.5 sm:size-5" />
                </span>
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold">Paso 2: Entrega o Envíos Nacionales</h2>
                  <p className="text-xs text-muted-foreground">
                    Selecciona ZOOM, MRW o coordinar la entrega directamente con la tienda
                  </p>
                </div>
              </div>

              {/* Selector ZOOM / MRW / Coordinar con la tienda */}
              <div className="mt-6">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Modalidad de Entrega o Encomienda
                </label>
                <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* 1. ZOOM */}
                  <button
                    type="button"
                    onClick={() => setEmpresaEnvio("ZOOM")}
                    className={`relative flex flex-col items-center justify-center rounded-2xl border-2 p-4 text-center transition-all cursor-pointer ${
                      empresaEnvio === "ZOOM"
                        ? "border-primary bg-brand-yellow/30 shadow-xs"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <span className="font-display text-xl font-bold tracking-tight text-primary">ZOOM</span>
                    <span className="mt-1 text-xs font-semibold text-muted-foreground">Cobro en Destino</span>
                    <span className="text-[11px] text-muted-foreground/80">Encomienda nacional</span>
                    {empresaEnvio === "ZOOM" && (
                      <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    )}
                  </button>

                  {/* 2. MRW */}
                  <button
                    type="button"
                    onClick={() => setEmpresaEnvio("MRW")}
                    className={`relative flex flex-col items-center justify-center rounded-2xl border-2 p-4 text-center transition-all cursor-pointer ${
                      empresaEnvio === "MRW"
                        ? "border-primary bg-brand-yellow/30 shadow-xs"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <span className="font-display text-xl font-bold tracking-tight text-primary">MRW</span>
                    <span className="mt-1 text-xs font-semibold text-muted-foreground">Cobro en Destino</span>
                    <span className="text-[11px] text-muted-foreground/80">Retiro en agencia</span>
                    {empresaEnvio === "MRW" && (
                      <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    )}
                  </button>

                  {/* 3. COORDINAR CON LA TIENDA */}
                  <button
                    type="button"
                    onClick={() => setEmpresaEnvio("Coordinar con la tienda")}
                    className={`relative flex flex-col items-center justify-center rounded-2xl border-2 p-4 text-center transition-all cursor-pointer ${
                      empresaEnvio === "Coordinar con la tienda"
                        ? "border-primary bg-brand-yellow/30 shadow-xs"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <span className="font-display text-lg font-bold tracking-tight text-primary">
                      Coordinar
                    </span>
                    <span className="mt-1 text-xs font-semibold text-brand-brown">
                      Con la Tienda
                    </span>
                    <span className="text-[11px] text-muted-foreground/80">
                      Retiro / Delivery
                    </span>
                    {empresaEnvio === "Coordinar con la tienda" && (
                      <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Formulario de envío */}
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold uppercase text-foreground">Nombre y Apellido *</label>
                    <input
                      type="text"
                      required
                      value={nombreCompleto}
                      onChange={(e) => setNombreCompleto(e.target.value)}
                      placeholder="Ej. María Elena Pérez"
                      className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-foreground">Cédula de Identidad *</label>
                    <input
                      type="text"
                      required
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      placeholder="Ej. V-20.123.456"
                      className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold uppercase text-foreground">Teléfono Móvil (WhatsApp) *</label>
                    <input
                      type="tel"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Ej. 0414 123 4567"
                      className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-foreground">Estado *</label>
                    <select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      {ESTADOS_VENEZUELA.map((est) => (
                        <option key={est} value={est}>{est}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold uppercase text-foreground">Ciudad / Municipio *</label>
                    <input
                      type="text"
                      required
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      placeholder="Ej. Valencia / Caracas"
                      className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-foreground">
                      {empresaEnvio === "Coordinar con la tienda"
                        ? "Punto de Entrega o Referencia de Retiro"
                        : `Agencia ${empresaEnvio} de Destino *`}
                    </label>
                    <input
                      type="text"
                      required={empresaEnvio !== "Coordinar con la tienda"}
                      value={agenciaDestino}
                      onChange={(e) => setAgenciaDestino(e.target.value)}
                      placeholder={
                        empresaEnvio === "Coordinar con la tienda"
                          ? "Ej. Retiro personal, delivery o acordar por WhatsApp"
                          : `Ej. Agencia ${empresaEnvio} Centro o Código`
                      }
                      className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                    {empresaEnvio === "Coordinar con la tienda" && (
                      <span className="text-[11px] text-muted-foreground mt-1 block">
                        ✓ Opcional: Coordinaremos el punto exacto de entrega directamente en WhatsApp.
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-foreground">Notas Adicionales (Opcional)</label>
                  <input
                    type="text"
                    value={notasEnvio}
                    onChange={(e) => setNotasEnvio(e.target.value)}
                    placeholder="Instrucciones o punto de referencia"
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Botones de navegación */}
              <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setPasoActual(1)}
                  className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors text-center cursor-pointer"
                >
                  ← Volver a Método de Pago
                </button>
                <button
                  type="button"
                  onClick={avanzarAlPaso3}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <span>Continuar al Resumen</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PASO 3: CONFIRMACIÓN Y ENVÍO DEL PEDIDO */}
          {/* ========================================================= */}
          {pasoActual === 3 && (
            <div className="rounded-2xl sm:rounded-[2rem] border-2 border-primary bg-card p-4 sm:p-6 md:p-8 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <span className="flex size-9 sm:size-10 items-center justify-center rounded-full bg-brand-yellow text-brand-brown shrink-0">
                  <ShieldCheck className="size-4.5 sm:size-5" />
                </span>
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold">Paso 3: Confirmación de tu Pedido</h2>
                  <p className="text-xs text-muted-foreground">
                    Verifica que todo esté correcto antes de enviar el pedido a WhatsApp
                  </p>
                </div>
              </div>

              {/* Resumen de los datos ingresados */}
              <div className="mt-6 space-y-4">
                {/* Bloque Método de Pago */}
                <div className="rounded-2xl border border-border bg-background p-4 flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-muted-foreground">Método de Pago</span>
                    <p className="font-bold text-base mt-0.5 text-foreground">{labelMetodoPago(metodoPago)}</p>
                    {metodoPago === "pago_movil" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Banco: {bancoOrigen} · Ref: <span className="font-mono">{referencia}</span>
                      </p>
                    )}
                    {metodoPago === "binance" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ID / TXID: <span className="font-mono">{idBinance}</span>
                      </p>
                    )}
                    {metodoPago === "transferencia" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Banco: {bancoOrigen} · Ref: <span className="font-mono">{referencia}</span>
                      </p>
                    )}
                    {metodoPago === "whatsapp" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Pago a coordinar directamente por WhatsApp con el asesor
                      </p>
                    )}
                    {comprobanteFile && (
                      <p className="text-xs text-brand-brown font-medium mt-1">
                        ✓ Comprobante listo: {comprobanteFile.name}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPasoActual(1)}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    Editar
                  </button>
                </div>

                {/* Bloque Envíos */}
                <div className="rounded-2xl border border-border bg-background p-4 flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-muted-foreground">Destinatario y Encomienda</span>
                    <p className="font-bold text-base mt-0.5 text-foreground">
                      {nombreCompleto} ({cedula})
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {empresaEnvio === "Coordinar con la tienda"
                        ? `🤝 Coordinar con la tienda · ${agenciaDestino || "Punto a acordar"}, ${ciudad}, ${estado}`
                        : `${empresaEnvio} · ${agenciaDestino}, ${ciudad}, ${estado}`}
                    </p>
                    <p className="text-xs text-muted-foreground">Teléfono: {telefono}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPasoActual(2)}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    Editar
                  </button>
                </div>

                {/* Aviso sobrio */}
                <div className="rounded-2xl bg-brand-yellow/40 p-4 border border-border text-xs leading-relaxed text-brand-brown flex items-start gap-2.5">
                  <ShieldCheck className="size-4 shrink-0 mt-0.5" />
                  <span>
                    Al presionar el botón inferior se procesará y registrará tu orden de forma segura. En un lapso de 48 horas nos pondremos en contacto contigo para coordinar la entrega y despacho.
                  </span>
                </div>
              </div>

              {/* Botón principal sobrio y refinado */}
              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={handleConfirmarPedido}
                  className="flex w-full items-center justify-center gap-3 rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-95 hover:shadow-lg active:scale-[0.99] cursor-pointer"
                >
                  <Check className="size-5 text-brand-yellow" strokeWidth={3} />
                  <span>Confirmar y Enviar Pedido</span>
                </button>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setPasoActual(2)}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    ← Volver a datos de envío
                  </button>
                  <span className="text-[11px] text-muted-foreground">
                    Atención personalizada ValCheck
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Columna Lateral: Resumen del Pedido (4 columnas) */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 rounded-[2rem] border-2 border-primary bg-card p-6 shadow-sm">
            <h3 className="font-display text-xl font-bold flex items-center justify-between">
              Resumen
              <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-brand-yellow text-brand-brown">
                {items.reduce((s, i) => s + i.cantidad, 0)} {items.length === 1 ? "pieza" : "piezas"}
              </span>
            </h3>

            {/* Lista resumida */}
            <div className="mt-4 max-h-60 overflow-y-auto divide-y divide-border/60 pr-1">
              {items.map(({ producto, cantidad }) => (
                <div key={producto.id} className="py-2.5 flex items-center gap-3">
                  <img
                    src={producto.imagen}
                    alt={producto.nombre}
                    className="size-12 rounded-xl object-cover border border-border shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{producto.nombre}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {cantidad} × {formatUSD(producto.precioUSD)}
                    </p>
                  </div>
                  <span className="text-xs font-bold">
                    {formatUSD(producto.precioUSD * cantidad)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="mt-5 border-t border-border pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-semibold text-foreground">{formatUSD(totalUSD)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Envío ({empresaEnvio})</span>
                <span className="font-semibold text-foreground">Cobro a Destino</span>
              </div>
              <div className="border-t border-border pt-2.5 flex items-baseline justify-between">
                <div>
                  <span className="font-bold text-sm">Total estimado</span>
                  <p className="text-[10px] text-emerald-800 font-medium flex items-center gap-1 mt-0.5">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Tasa Oficial BCV: Bs. {Number(tasaBCV || TASA_BCV).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-foreground">{formatUSD(totalUSD)}</p>
                  <p className="text-xs font-bold text-brand-brown/80">{formatVES(totalUSD, tasaBCV)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border text-center text-[11px] text-muted-foreground">
              Envío nacional asegurado por ValCheck.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
