import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  Eye,
  Filter,
  Image as ImageIcon,
  LogIn,
  Package,
  PackagePlus,
  Plus,
  QrCode,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  UploadCloud,
  Users,
  Wallet,
  X,
  XCircle,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useAdminStore, Order, EstadoPedido, AJUSTES_PAGO_DEFAULT } from "@/lib/admin-store";
import { formatUSD, formatVES, type Categoria, type Producto } from "@/lib/products";
import { labelMetodoPago } from "@/lib/checkout";

const PRESET_IMAGENES = [
  { nombre: "Bolso Tote Caramelo", url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800" },
  { nombre: "Crossbody Urbana Black", url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800" },
  { nombre: "Billetera Minimalista", url: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=800" },
  { nombre: "Cinturón Reversible Doble", url: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&q=80&w=800" },
  { nombre: "Collar Cadena Dorada", url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800" },
  { nombre: "Aretes Perlas Elegantes", url: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=80&w=800" },
  { nombre: "Reloj Correa Cuero", url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=800" },
  { nombre: "Brazalete Bañado en Oro", url: "https://images.unsplash.com/photo-1611591475841-865660851897?auto=format&fit=crop&q=80&w=800" },
];

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel Administrativo — ValCheck" },
      { name: "description", content: "Administración de catálogo, pagos, pedidos y envíos de ValCheck." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, login, logout } = useAuth();
  const {
    productos,
    pedidos,
    ajustesPago,
    actualizarAjustesPago,
    agregarProducto,
    editarProducto,
    eliminarProducto,
    aprobarPago,
    rechazarPago,
    marcarEnviado,
    restablecerCatalogo,
    tasaBCV,
    tasaBCVFecha,
    tasaBCVFuente,
    tasaBCVCargando,
    actualizarTasaBCV,
  } = useAdminStore();
  const navigate = useNavigate();

  // Pestaña principal: "pedidos" | "productos" | "ajustes"
  const [tabActiva, setTabActiva] = useState<"pedidos" | "productos" | "ajustes">("pedidos");

  // Sección de pedidos: por defecto "pendientes" (solo los nuevos por verificar)
  const [seccionPedidos, setSeccionPedidos] = useState<"pendientes" | "aprobados" | "enviados" | "rechazados" | "todos">("pendientes");
  const [filtroMetodoPago, setFiltroMetodoPago] = useState<string>("todos");
  const [filtroFecha, setFiltroFecha] = useState<string>("todos");
  const [busquedaPedido, setBusquedaPedido] = useState("");

  // Modales de pedidos
  const [modalRechazar, setModalRechazar] = useState<{ id: string } | null>(null);
  const [motivoRechazoTexto, setMotivoRechazoTexto] = useState("");

  const [modalGuia, setModalGuia] = useState<{ id: string; empresa: string } | null>(null);
  const [numeroGuiaTexto, setNumeroGuiaTexto] = useState("");

  const [modalDetallePedido, setModalDetallePedido] = useState<Order | null>(null);

  // Modales de productos
  const [modalNuevoProducto, setModalNuevoProducto] = useState(false);
  const [modalEditarProducto, setModalEditarProducto] = useState<Producto | null>(null);

  // Formulario de producto
  const [prodNombre, setProdNombre] = useState("");
  const [prodCategoria, setProdCategoria] = useState<Categoria>("Pulseras");
  const [prodPrecioUSD, setProdPrecioUSD] = useState(15);
  const [prodDescripcion, setProdDescripcion] = useState("");
  const [prodImagen, setProdImagen] = useState("");
  const [prodDestacado, setProdDestacado] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formulario de Ajustes de Métodos de Pago
  const [pmBanco, setPmBanco] = useState(ajustesPago?.pagoMovil?.banco || "Banesco");
  const [pmCodigo, setPmCodigo] = useState(ajustesPago?.pagoMovil?.codigoBanco || "0134");
  const [pmTelefono, setPmTelefono] = useState(ajustesPago?.pagoMovil?.telefono || "0414-0000000");
  const [pmCedula, setPmCedula] = useState(ajustesPago?.pagoMovil?.cedula || "V-28.000.000");
  const [pmTitular, setPmTitular] = useState(ajustesPago?.pagoMovil?.titular || "ValCheck Belleza Verificada");

  const [binPayId, setBinPayId] = useState(ajustesPago?.binance?.payId || "847291034");
  const [binCorreo, setBinCorreo] = useState(ajustesPago?.binance?.correo || "valcheck.pagos@gmail.com");
  const [binRed, setBinRed] = useState(ajustesPago?.binance?.red || "USDT (BEP-20 / TRC-20)");
  const [binTitular, setBinTitular] = useState(ajustesPago?.binance?.titular || "ValCheck Official");

  const [cbBanco, setCbBanco] = useState(ajustesPago?.cuentaBancaria?.banco || "Banesco Banco Universal");
  const [cbCodigo, setCbCodigo] = useState(ajustesPago?.cuentaBancaria?.codigoBanco || "0134");
  const [cbTipo, setCbTipo] = useState(ajustesPago?.cuentaBancaria?.tipo || "Cuenta Corriente");
  const [cbNumero, setCbNumero] = useState(ajustesPago?.cuentaBancaria?.numeroCuenta || "0134-0987-12-0001234567");
  const [cbTitular, setCbTitular] = useState(ajustesPago?.cuentaBancaria?.titular || "ValCheck Belleza Verificada, C.A.");
  const [cbRif, setCbRif] = useState(ajustesPago?.cuentaBancaria?.rif || "J-50123456-7");

  const [wsNumero, setWsNumero] = useState(ajustesPago?.whatsapp?.numero || "584120000000");
  const [wsFormato, setWsFormato] = useState(ajustesPago?.whatsapp?.numeroFormateado || "+58 412 000 0000");
  const [tasaUSD, setTasaUSD] = useState(ajustesPago?.tasaCambioUSD || 250);

  useEffect(() => {
    if (ajustesPago) {
      setPmBanco(ajustesPago.pagoMovil.banco);
      setPmCodigo(ajustesPago.pagoMovil.codigoBanco);
      setPmTelefono(ajustesPago.pagoMovil.telefono);
      setPmCedula(ajustesPago.pagoMovil.cedula);
      setPmTitular(ajustesPago.pagoMovil.titular);

      setBinPayId(ajustesPago.binance.payId);
      setBinCorreo(ajustesPago.binance.correo);
      setBinRed(ajustesPago.binance.red);
      setBinTitular(ajustesPago.binance.titular);

      setCbBanco(ajustesPago.cuentaBancaria.banco);
      setCbCodigo(ajustesPago.cuentaBancaria.codigoBanco);
      setCbTipo(ajustesPago.cuentaBancaria.tipo);
      setCbNumero(ajustesPago.cuentaBancaria.numeroCuenta);
      setCbTitular(ajustesPago.cuentaBancaria.titular);
      setCbRif(ajustesPago.cuentaBancaria.rif);

      setWsNumero(ajustesPago.whatsapp.numero);
      setWsFormato(ajustesPago.whatsapp.numeroFormateado);
      setTasaUSD(ajustesPago.tasaCambioUSD);
    }
  }, [ajustesPago]);

  const handleSubirImagenLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setProdImagen(reader.result);
        toast.success("Foto seleccionada exitosamente");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGuardarAjustesPago = (e: React.FormEvent) => {
    e.preventDefault();
    actualizarAjustesPago({
      pagoMovil: {
        banco: pmBanco,
        codigoBanco: pmCodigo,
        telefono: pmTelefono,
        cedula: pmCedula,
        titular: pmTitular,
      },
      binance: {
        payId: binPayId,
        correo: binCorreo,
        red: binRed,
        titular: binTitular,
      },
      cuentaBancaria: {
        banco: cbBanco,
        codigoBanco: cbCodigo,
        tipo: cbTipo,
        numeroCuenta: cbNumero,
        titular: cbTitular,
        rif: cbRif,
      },
      whatsapp: {
        numero: wsNumero,
        numeroFormateado: wsFormato,
      },
      tasaCambioUSD: Number(tasaUSD) || 250,
    });
    toast.success("¡Métodos de pago actualizados exitosamente! Ahora se muestran en el checkout.");
  };

  const handleRestablecerAjustesPago = () => {
    actualizarAjustesPago(AJUSTES_PAGO_DEFAULT);
    toast.info("Métodos de pago restablecidos a los valores por defecto.");
  };

  // Acceso de emergencia si no es admin
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-brand-yellow text-brand-brown">
          <ShieldCheck className="size-10" />
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold">Panel Administrativo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta sección está reservada para administradores de ValCheck.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-left">
          <p className="text-xs font-bold uppercase text-muted-foreground">Acceso de Administrador:</p>
          <div className="mt-2 text-xs space-y-1">
            <p><strong>Correo autorizado:</strong> omarapp1921@gmail.com</p>
            <p><strong>Contraseña de prueba:</strong> admin123</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              const res = await login("omarapp1921@gmail.com", "admin123");
              if (res.ok) {
                toast.success("Has ingresado como Administrador");
              }
            }}
            className="mt-4 w-full rounded-full bg-primary py-3 text-xs font-bold text-primary-foreground hover:scale-105 transition-transform"
          >
            Entrar como Administrador
          </button>
        </div>
      </div>
    );
  }

  // Métricas superiores (KPIs)
  const totalVentasUSD = pedidos
    .filter((p) => p.estado === "aprobado" || p.estado === "enviado" || p.estado === "completado")
    .reduce((s, p) => s + p.totalUSD, 0);

  const totalPendientes = pedidos.filter((p) => p.estado === "pendiente").length;
  const totalAprobados = pedidos.filter((p) => p.estado === "aprobado").length;
  const totalEnviados = pedidos.filter((p) => p.estado === "enviado").length;
  const totalRechazados = pedidos.filter((p) => p.estado === "rechazado").length;
  const totalProductosCount = productos.length;

  // Filtrado de pedidos y pagos
  const pedidosFiltrados = pedidos.filter((p) => {
    // 1. Filtro estricto por sección activa (por defecto solo "pendientes")
    let coincideSeccion = true;
    if (seccionPedidos === "pendientes") {
      coincideSeccion = p.estado === "pendiente";
    } else if (seccionPedidos === "aprobados") {
      coincideSeccion = p.estado === "aprobado";
    } else if (seccionPedidos === "enviados") {
      coincideSeccion = p.estado === "enviado";
    } else if (seccionPedidos === "rechazados") {
      coincideSeccion = p.estado === "rechazado";
    }

    // 2. Filtro por Método de Pago
    const coincideMetodo = filtroMetodoPago === "todos" ? true : p.pago.metodo === filtroMetodoPago;

    // 3. Filtro por Fecha
    let coincideFecha = true;
    if (filtroFecha !== "todos") {
      const fechaPedido = new Date(p.fecha);
      const hoy = new Date();
      if (filtroFecha === "hoy") {
        coincideFecha = fechaPedido.toDateString() === hoy.toDateString();
      } else if (filtroFecha === "semana") {
        const hace7Dias = new Date();
        hace7Dias.setDate(hoy.getDate() - 7);
        coincideFecha = fechaPedido >= hace7Dias;
      } else if (filtroFecha === "mes") {
        coincideFecha =
          fechaPedido.getMonth() === hoy.getMonth() &&
          fechaPedido.getFullYear() === hoy.getFullYear();
      }
    }

    // 4. Búsqueda por texto (referencia, cliente, banco, teléfono, ID)
    const q = busquedaPedido.toLowerCase().trim();
    const coincideBusqueda =
      !q ||
      p.id.toLowerCase().includes(q) ||
      p.cliente.nombre.toLowerCase().includes(q) ||
      p.cliente.cedula.toLowerCase().includes(q) ||
      (p.cliente.telefono && p.cliente.telefono.toLowerCase().includes(q)) ||
      (p.pago.referencia && p.pago.referencia.toLowerCase().includes(q)) ||
      (p.pago.bancoOrigen && p.pago.bancoOrigen.toLowerCase().includes(q)) ||
      (p.pago.telefonoOrigen && p.pago.telefonoOrigen.toLowerCase().includes(q)) ||
      (p.pago.idBinance && p.pago.idBinance.toLowerCase().includes(q));

    return coincideSeccion && coincideMetodo && coincideFecha && coincideBusqueda;
  });

  // Manejo de Aprobación
  const handleAprobar = (id: string) => {
    aprobarPago(id);
    toast.success(`Pago del pedido #${id} APROBADO exitosamente`);
  };

  // Manejo de Rechazo
  const handleConfirmarRechazo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalRechazar) return;
    if (!motivoRechazoTexto.trim()) {
      toast.error("Indica un motivo de rechazo");
      return;
    }
    rechazarPago(modalRechazar.id, motivoRechazoTexto.trim());
    toast.info(`Pago del pedido #${modalRechazar.id} marcado como RECHAZADO`);
    setModalRechazar(null);
    setMotivoRechazoTexto("");
  };

  // Manejo de Guía / Envío
  const handleConfirmarEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalGuia) return;
    if (!numeroGuiaTexto.trim()) {
      toast.error("Ingresa el número de guía de la encomienda");
      return;
    }
    marcarEnviado(modalGuia.id, numeroGuiaTexto.trim());
    toast.success(`Pedido #${modalGuia.id} marcado como ENVIADO con guía ${numeroGuiaTexto}`);
    setModalGuia(null);
    setNumeroGuiaTexto("");
  };

  // Guardar Producto
  const handleGuardarNuevoProducto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodNombre.trim()) {
      toast.error("Ingresa el nombre del producto");
      return;
    }
    const fallbackImg = productos[0]?.imagen || "";
    agregarProducto({
      nombre: prodNombre.trim(),
      categoria: prodCategoria,
      precioUSD: Number(prodPrecioUSD) || 10,
      descripcion: prodDescripcion.trim() || "Pieza exclusiva verificada por ValCheck.",
      imagen: prodImagen.trim() || fallbackImg,
      destacado: prodDestacado,
    });
    toast.success(`Producto "${prodNombre}" agregado con éxito`);
    setModalNuevoProducto(false);
    setProdNombre("");
    setProdDescripcion("");
    setProdImagen("");
  };

  // Guardar Edición Producto
  const handleGuardarEdicionProducto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditarProducto) return;
    editarProducto(modalEditarProducto.id, {
      nombre: prodNombre.trim(),
      categoria: prodCategoria,
      precioUSD: Number(prodPrecioUSD),
      descripcion: prodDescripcion.trim(),
      imagen: prodImagen.trim() || modalEditarProducto.imagen,
      destacado: prodDestacado,
    });
    toast.success("Producto actualizado correctamente");
    setModalEditarProducto(null);
  };

  const abrirEdicion = (p: Producto) => {
    setModalEditarProducto(p);
    setProdNombre(p.nombre);
    setProdCategoria(p.categoria);
    setProdPrecioUSD(p.precioUSD);
    setProdDescripcion(p.descripcion);
    setProdImagen(p.imagen);
    setProdDestacado(!!p.destacado);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-brand-yellow text-brand-brown font-bold text-xs">
              ✓
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Panel de Administración
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold mt-1">Gestión General ValCheck</h1>
          <p className="text-xs text-muted-foreground">
            Control de compras, aprobación de pagos móviles, guías de encomiendas y catálogo.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/tienda"
            className="rounded-full border border-border px-3.5 py-2 text-xs font-semibold hover:bg-muted transition-colors"
          >
            Ver Tienda Pública
          </Link>
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-brand-yellow/50 border border-brand-yellow/80 px-3 py-1.5 text-xs font-bold text-brand-brown">
            <ShieldCheck className="size-3.5" />
            <span>{user?.email || "Admin"}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              toast.info("Has cerrado sesión");
              navigate({ to: "/" });
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive transition-colors cursor-pointer"
          >
            <LogOut className="size-3.5" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas (KPIs) */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* KPI 1 */}
        <div className="rounded-2xl border-2 border-primary/20 bg-card p-4 shadow-xs">
          <span className="text-muted-foreground text-[11px] font-bold uppercase block">
            Ventas Aprobadas
          </span>
          <p className="mt-1 text-2xl font-bold font-display text-foreground">
            {formatUSD(totalVentasUSD)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{formatVES(totalVentasUSD)}</p>
        </div>

        {/* KPI 2 */}
        <button
          type="button"
          onClick={() => {
            setTabActiva("pedidos");
            setSeccionPedidos("pendientes");
          }}
          className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-4 shadow-xs text-left cursor-pointer hover:border-amber-400 transition-colors"
        >
          <span className="text-amber-800 text-[11px] font-bold uppercase block flex items-center justify-between">
            Por Verificar
            <Clock className="size-4 text-amber-600" />
          </span>
          <p className="mt-1 text-2xl font-bold font-display text-amber-900">
            {totalPendientes}
          </p>
          <p className="text-[11px] text-amber-700/80 mt-0.5">Nuevos por comprobar</p>
        </button>

        {/* KPI 3 */}
        <button
          type="button"
          onClick={() => {
            setTabActiva("pedidos");
            setSeccionPedidos("aprobados");
          }}
          className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 p-4 shadow-xs text-left cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <span className="text-emerald-800 text-[11px] font-bold uppercase block flex items-center justify-between">
            Aprobados
            <CheckCircle2 className="size-4 text-emerald-600" />
          </span>
          <p className="mt-1 text-2xl font-bold font-display text-emerald-900">
            {totalAprobados}
          </p>
          <p className="text-[11px] text-emerald-700/80 mt-0.5">Listos para envío</p>
        </button>

        {/* KPI 4 */}
        <div className="rounded-2xl border-2 border-primary/20 bg-card p-4 shadow-xs">
          <span className="text-muted-foreground text-[11px] font-bold uppercase block flex items-center justify-between">
            Productos Activos
            <ShoppingBag className="size-4 text-muted-foreground" />
          </span>
          <p className="mt-1 text-2xl font-bold font-display text-foreground">
            {totalProductosCount}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">En catálogo web</p>
        </div>
      </div>

      {/* Pestañas de Navegación del Panel */}
      <div className="mt-8 flex border-b border-border">
        <button
          type="button"
          onClick={() => {
            setTabActiva("pedidos");
            setSeccionPedidos("pendientes");
          }}
          className={`flex items-center gap-2 border-b-2 py-3 px-6 text-sm font-bold transition-colors cursor-pointer ${
            tabActiva === "pedidos"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShoppingBag className="size-4" />
          Gestión de Pagos y Pedidos
          {totalPendientes > 0 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white animate-pulse">
              {totalPendientes} por verificar
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTabActiva("productos")}
          className={`flex items-center gap-2 border-b-2 py-3 px-6 text-sm font-bold transition-colors cursor-pointer ${
            tabActiva === "productos"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="size-4" />
          Catálogo de Productos ({totalProductosCount})
        </button>

        <button
          type="button"
          onClick={() => setTabActiva("ajustes")}
          className={`flex items-center gap-2 border-b-2 py-3 px-6 text-sm font-bold transition-colors cursor-pointer ${
            tabActiva === "ajustes"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="size-4" />
          Datos y Configuración
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 1: COMPRAS Y PAGOS */}
      {/* ========================================================================= */}
      {tabActiva === "pedidos" && (
        <div className="mt-6 space-y-6">
          {/* Pestañas de Secciones de Pedidos */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
            <button
              type="button"
              onClick={() => setSeccionPedidos("pendientes")}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                seccionPedidos === "pendientes"
                  ? "bg-amber-500 text-white shadow-sm scale-[1.02]"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Clock className="size-4" />
              Por Verificar (Nuevos)
              {totalPendientes > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    seccionPedidos === "pendientes" ? "bg-white text-amber-700" : "bg-amber-500 text-white"
                  }`}
                >
                  {totalPendientes}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSeccionPedidos("aprobados")}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                seccionPedidos === "aprobados"
                  ? "bg-emerald-600 text-white shadow-sm scale-[1.02]"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <CheckCircle2 className="size-4" />
              Aprobados / Listos para Envío
              {totalAprobados > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    seccionPedidos === "aprobados" ? "bg-white text-emerald-700" : "bg-emerald-600 text-white"
                  }`}
                >
                  {totalAprobados}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSeccionPedidos("enviados")}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                seccionPedidos === "enviados"
                  ? "bg-blue-600 text-white shadow-sm scale-[1.02]"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Truck className="size-4" />
              Enviados
              {totalEnviados > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    seccionPedidos === "enviados" ? "bg-white text-blue-700" : "bg-blue-600 text-white"
                  }`}
                >
                  {totalEnviados}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSeccionPedidos("rechazados")}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                seccionPedidos === "rechazados"
                  ? "bg-rose-600 text-white shadow-sm scale-[1.02]"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <XCircle className="size-4" />
              Rechazados
              {totalRechazados > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    seccionPedidos === "rechazados" ? "bg-white text-rose-700" : "bg-rose-600 text-white"
                  }`}
                >
                  {totalRechazados}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSeccionPedidos("todos")}
              className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ml-auto ${
                seccionPedidos === "todos"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Historial General ({pedidos.length})
            </button>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Contexto de la sección actual */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {seccionPedidos === "pendientes" && "Mostrando exclusivamente pagos nuevos pendientes por comprobación."}
                  {seccionPedidos === "aprobados" && "Mostrando pedidos con pago aprobado listos para preparar y despachar."}
                  {seccionPedidos === "enviados" && "Mostrando encomiendas despachadas con guía asignada."}
                  {seccionPedidos === "rechazados" && "Mostrando pagos no validados con su motivo de rechazo."}
                  {seccionPedidos === "todos" && "Mostrando historial consolidado de todos los pedidos."}
                </p>
              </div>

              {/* Búsqueda */}
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={busquedaPedido}
                  onChange={(e) => setBusquedaPedido(e.target.value)}
                  placeholder="Buscar por cliente, cédula, ref o banco..."
                  className="w-full rounded-full border border-input bg-background pl-9 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Filtros específicos de Pago y Fecha */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 p-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                {/* Selector de Método de Pago */}
                <div className="flex items-center gap-1.5">
                  <Wallet className="size-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-bold text-muted-foreground">Método:</span>
                  <select
                    value={filtroMetodoPago}
                    onChange={(e) => setFiltroMetodoPago(e.target.value)}
                    className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-medium outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                  >
                    <option value="todos">Todos los métodos</option>
                    <option value="pago_movil">Pago Móvil (Bs)</option>
                    <option value="binance">Binance (USDT)</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="whatsapp">Directo WhatsApp</option>
                  </select>
                </div>

                {/* Selector de Fecha */}
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-bold text-muted-foreground">Período:</span>
                  <select
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                    className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-medium outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                  >
                    <option value="todos">Cualquier fecha</option>
                    <option value="hoy">Hoy</option>
                    <option value="semana">Últimos 7 días</option>
                    <option value="mes">Este mes</option>
                  </select>
                </div>
              </div>

              {/* Contador y Limpiar filtros */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? "pedido en sección" : "pedidos en sección"}
                </span>
                {(filtroMetodoPago !== "todos" || filtroFecha !== "todos" || busquedaPedido) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFiltroMetodoPago("todos");
                      setFiltroFecha("todos");
                      setBusquedaPedido("");
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <RotateCcw className="size-3" />
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Listado de Pedidos */}
          {pedidosFiltrados.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-12 text-center">
              <ShoppingBag className="size-10 text-muted-foreground mx-auto" />
              <p className="mt-3 font-semibold text-sm">
                {seccionPedidos === "pendientes"
                  ? "✨ ¡Todo al día! No hay nuevos pagos pendientes por verificar."
                  : seccionPedidos === "aprobados"
                  ? "No hay pedidos pendientes por generar guía o despachar."
                  : seccionPedidos === "enviados"
                  ? "No hay envíos registrados en tránsito."
                  : seccionPedidos === "rechazados"
                  ? "No hay pagos rechazados."
                  : "No se encontraron compras con los filtros seleccionados."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pedidosFiltrados.map((ped) => (
                <div
                  key={ped.id}
                  className="rounded-2xl border-2 border-primary/20 bg-card p-5 shadow-xs hover:border-primary/40 transition-all"
                >
                  {/* Encabezado del pedido */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-lg text-foreground">
                        #{ped.id}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(ped.fecha).toLocaleString("es-VE")}
                      </span>
                      {/* Badge de método de pago */}
                      <span className="rounded-full bg-brand-yellow/60 px-2.5 py-0.5 text-[11px] font-bold text-brand-brown">
                        {labelMetodoPago(ped.pago.metodo)}
                      </span>
                    </div>

                    {/* Estado con selector o badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                          ped.estado === "pendiente"
                            ? "bg-amber-100 text-amber-800"
                            : ped.estado === "aprobado"
                              ? "bg-emerald-100 text-emerald-800"
                              : ped.estado === "enviado"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {ped.estado}
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo de la orden */}
                  <div className="mt-4 grid gap-4 md:grid-cols-4 text-xs">
                    {/* Cliente */}
                    <div>
                      <span className="text-muted-foreground text-[11px] font-bold block">CLIENTE</span>
                      <p className="font-semibold text-sm mt-0.5 text-foreground">{ped.cliente.nombre}</p>
                      <p className="text-muted-foreground">C.I: {ped.cliente.cedula}</p>
                      <a
                        href={`https://wa.me/${ped.cliente.telefono.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-brown underline font-semibold mt-0.5 inline-block"
                      >
                        WhatsApp: {ped.cliente.telefono}
                      </a>
                    </div>

                    {/* Encomienda */}
                    <div>
                      <span className="text-muted-foreground text-[11px] font-bold block">
                        {ped.envio.empresa === "Coordinar con la tienda" ? "ENTREGA / ENVÍO" : "ENVÍO NACIONAL"}
                      </span>
                      <p className="font-semibold mt-0.5 text-foreground">
                        {ped.envio.empresa === "Coordinar con la tienda"
                          ? "🤝 Coordinar con la tienda"
                          : `${ped.envio.empresa} (Cobro a Destino)`}
                      </p>
                      <p className="text-muted-foreground">
                        {ped.envio.ciudad}{ped.envio.estado ? `, ${ped.envio.estado}` : ""}
                      </p>
                      <p className="text-muted-foreground truncate" title={ped.envio.agencia}>
                        {ped.envio.empresa === "Coordinar con la tienda" ? "Punto:" : "Agencia:"} {ped.envio.agencia}
                      </p>
                      {ped.envio.numeroGuia && (
                        <p className="text-blue-700 font-bold mt-1">Guía: {ped.envio.numeroGuia}</p>
                      )}
                    </div>

                    {/* Pago y Referencia */}
                    <div>
                      <span className="text-muted-foreground text-[11px] font-bold block">DATOS DE PAGO</span>
                      {ped.pago.referencia && (
                        <p className="font-mono text-sm font-bold text-foreground mt-0.5">
                          Ref: {ped.pago.referencia}
                        </p>
                      )}
                      {ped.pago.idBinance && (
                        <p className="font-mono text-xs font-bold text-foreground mt-0.5">
                          TXID: {ped.pago.idBinance}
                        </p>
                      )}
                      {ped.pago.bancoOrigen && (
                        <p className="text-muted-foreground">Banco: {ped.pago.bancoOrigen}</p>
                      )}
                      {ped.pago.comprobanteNombre && (
                        <p className="text-brand-brown font-medium truncate mt-0.5" title={ped.pago.comprobanteNombre}>
                          📎 {ped.pago.comprobanteNombre}
                        </p>
                      )}
                    </div>

                    {/* Total y Piezas */}
                    <div className="md:text-right">
                      <span className="text-muted-foreground text-[11px] font-bold block">TOTAL PEDIDO</span>
                      <p className="text-lg font-bold text-foreground mt-0.5">{formatUSD(ped.totalUSD)}</p>
                      <p className="text-xs text-muted-foreground font-semibold">{ped.totalVES}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {ped.items.reduce((s, i) => s + i.cantidad, 0)} piezas
                      </p>
                    </div>
                  </div>

                  {/* Motivo de rechazo */}
                  {ped.estado === "rechazado" && ped.motivoRechazo && (
                    <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800">
                      <strong>Motivo de rechazo registrado:</strong> {ped.motivoRechazo}
                    </div>
                  )}

                  {/* Barra de Acciones del Pedido */}
                  <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setModalDetallePedido(ped)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Eye className="size-3.5" />
                      Ver Piezas y Detalles
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Botón Aprobar Pago */}
                      {ped.estado !== "aprobado" && ped.estado !== "enviado" && (
                        <button
                          type="button"
                          onClick={() => handleAprobar(ped.id)}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          <Check className="size-3.5" />
                          Aprobar Pago
                        </button>
                      )}

                      {/* Botón Marcar Enviado */}
                      {ped.estado !== "enviado" && (
                        <button
                          type="button"
                          onClick={() => {
                            setModalGuia({ id: ped.id, empresa: ped.envio.empresa });
                            setNumeroGuiaTexto(ped.envio.numeroGuia || "");
                          }}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                          <Truck className="size-3.5" />
                          Marcar Enviado
                        </button>
                      )}

                      {/* Botón Rechazar Pago */}
                      {ped.estado !== "rechazado" && (
                        <button
                          type="button"
                          onClick={() => {
                            setModalRechazar({ id: ped.id });
                            setMotivoRechazoTexto("");
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-300 text-rose-700 hover:bg-rose-50 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <X className="size-3.5" />
                          Rechazar Pago
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 2: GESTIÓN DEL CATÁLOGO DE PRODUCTOS */}
      {/* ========================================================================= */}
      {tabActiva === "productos" && (
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold">Catálogo de Productos</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Carga nuevas piezas, edita precios o retira accesorios del catálogo
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={restablecerCatalogo}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                title="Restablecer productos originales"
              >
                <RotateCcw className="size-3.5" />
                Restablecer
              </button>
              <button
                type="button"
                onClick={() => {
                  setProdNombre("");
                  setProdCategoria("Pulseras");
                  setProdPrecioUSD(18);
                  setProdDescripcion("");
                  setProdImagen("");
                  setProdDestacado(false);
                  setModalNuevoProducto(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:scale-105 transition-transform cursor-pointer"
              >
                <Plus className="size-4" />
                Cargar Nuevo Producto
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {productos.map((prod) => (
              <div
                key={prod.id}
                className="overflow-hidden rounded-2xl border-2 border-primary/20 bg-card p-3 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-brand-beige">
                    <img
                      src={prod.imagen}
                      alt={prod.nombre}
                      className="size-full object-cover"
                    />
                    {prod.destacado && (
                      <span className="absolute top-2 left-2 rounded-full bg-brand-yellow px-2 py-0.5 text-[10px] font-bold text-brand-brown">
                        Destacado
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {prod.categoria}
                    </span>
                    <h3 className="font-display font-semibold text-sm leading-snug line-clamp-1 mt-0.5">
                      {prod.nombre}
                    </h3>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="font-bold text-sm text-foreground">
                        {formatUSD(prod.precioUSD)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatVES(prod.precioUSD)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => abrirEdicion(prod)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <Edit className="size-3.5" />
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Eliminar "${prod.nombre}" del catálogo?`)) {
                        eliminarProducto(prod.id);
                        toast.info("Producto eliminado");
                      }
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:opacity-80"
                  >
                    <Trash2 className="size-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 3: DATOS Y CONFIGURACIÓN */}
      {/* ========================================================================= */}
      {tabActiva === "ajustes" && (
        <form onSubmit={handleGuardarAjustesPago} className="mt-6 max-w-4xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="font-display text-2xl font-bold">Gestión de Métodos de Pago y Cobro</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Edita los datos bancarios, cuentas de cobro y tasa de cambio que se muestran en el checkout.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestablecerAjustesPago}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                Valores por Defecto
              </button>
              <button
                type="submit"
                className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:scale-105 transition-all shadow-md"
              >
                Guardar Métodos de Pago
              </button>
            </div>
          </div>

          {/* TASA DE CAMBIO OFICIAL BCV (SINCRONIZACIÓN AUTOMÁTICA) */}
          <div className="rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/70 via-background to-brand-yellow/20 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Tasa Oficial BCV — Sincronización Automática
                  </span>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                    En Vivo
                  </span>
                </div>
                <p className="text-xs text-muted-foreground max-w-xl">
                  Se conecta automáticamente con la cotización oficial del <strong>Banco Central de Venezuela (BCV)</strong>.
                  Se actualiza sola en segundo plano para mantener los precios y totales en Bolívares (VES) siempre al día.
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
                  <span>
                    📅 <strong>Fecha oficial BCV:</strong> {tasaBCVFecha || "Actualizada hoy"}
                  </span>
                  <span>·</span>
                  <span>
                    🏦 <strong>Fuente:</strong> {tasaBCVFuente || "Banco Central de Venezuela"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2 rounded-2xl border-2 border-emerald-400 bg-background px-4 py-2.5 shadow-xs">
                  <span className="text-xs font-bold text-muted-foreground">1 USD =</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-xl font-bold text-emerald-900">
                      Bs. {Number(tasaUSD || tasaBCV).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await actualizarTasaBCV();
                    toast.success("Tasa BCV sincronizada y actualizada exitosamente");
                  }}
                  disabled={tasaBCVCargando}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 text-xs font-bold shadow-xs hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  title="Consultar la tasa del BCV ahora mismo"
                >
                  <RefreshCw className={`size-3.5 ${tasaBCVCargando ? "animate-spin" : ""}`} />
                  {tasaBCVCargando ? "Actualizando..." : "Sincronizar BCV Ahora"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* 1. PAGO MÓVIL */}
            <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 border-b border-border pb-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-yellow text-brand-brown font-bold text-xs">
                  PM
                </span>
                <div>
                  <h3 className="font-bold text-sm">Pago Móvil</h3>
                  <p className="text-[11px] text-muted-foreground">Datos bancarios para transferencias móviles</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px]">Banco</label>
                  <input
                    type="text"
                    required
                    value={pmBanco}
                    onChange={(e) => setPmBanco(e.target.value)}
                    placeholder="Ej. Banesco, Mercantil, BDV"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-muted-foreground block text-[11px]">Código Banco</label>
                    <input
                      type="text"
                      required
                      value={pmCodigo}
                      onChange={(e) => setPmCodigo(e.target.value)}
                      placeholder="Ej. 0134"
                      className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-muted-foreground block text-[11px]">Teléfono</label>
                    <input
                      type="text"
                      required
                      value={pmTelefono}
                      onChange={(e) => setPmTelefono(e.target.value)}
                      placeholder="0414-0000000"
                      className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px]">Cédula o RIF</label>
                  <input
                    type="text"
                    required
                    value={pmCedula}
                    onChange={(e) => setPmCedula(e.target.value)}
                    placeholder="V-28.000.000 o J-50123456-7"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px]">Nombre del Titular</label>
                  <input
                    type="text"
                    required
                    value={pmTitular}
                    onChange={(e) => setPmTitular(e.target.value)}
                    placeholder="Nombre completo o razón social"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            {/* 2. BINANCE PAY */}
            <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 border-b border-border pb-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-yellow-400 text-yellow-950 font-bold text-xs">
                  BN
                </span>
                <div>
                  <h3 className="font-bold text-sm">Binance Pay (Cripto)</h3>
                  <p className="text-[11px] text-muted-foreground">ID de pago y transferencias en USDT</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px]">Binance Pay ID</label>
                  <input
                    type="text"
                    required
                    value={binPayId}
                    onChange={(e) => setBinPayId(e.target.value)}
                    placeholder="Ej. 847291034"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px]">Correo Binance</label>
                  <input
                    type="email"
                    required
                    value={binCorreo}
                    onChange={(e) => setBinCorreo(e.target.value)}
                    placeholder="valcheck.pagos@gmail.com"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px]">Red Sugerida</label>
                  <input
                    type="text"
                    required
                    value={binRed}
                    onChange={(e) => setBinRed(e.target.value)}
                    placeholder="USDT (BEP-20 / TRC-20)"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px]">Nombre de Cuenta</label>
                  <input
                    type="text"
                    required
                    value={binTitular}
                    onChange={(e) => setBinTitular(e.target.value)}
                    placeholder="ValCheck Official"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            {/* 3. CUENTA BANCARIA NACIONAL */}
            <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 border-b border-border pb-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-blue-900 font-bold text-xs">
                  CB
                </span>
                <div>
                  <h3 className="font-bold text-sm">Cuenta Bancaria Nacional</h3>
                  <p className="text-[11px] text-muted-foreground">Transferencias corrientes en Bolívares</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-muted-foreground block text-[11px]">Banco</label>
                    <input
                      type="text"
                      required
                      value={cbBanco}
                      onChange={(e) => setCbBanco(e.target.value)}
                      placeholder="Banesco"
                      className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-muted-foreground block text-[11px]">Tipo de Cuenta</label>
                    <input
                      type="text"
                      required
                      value={cbTipo}
                      onChange={(e) => setCbTipo(e.target.value)}
                      placeholder="Cuenta Corriente"
                      className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px]">Número de Cuenta (20 dígitos)</label>
                  <input
                    type="text"
                    required
                    value={cbNumero}
                    onChange={(e) => setCbNumero(e.target.value)}
                    placeholder="0134-0987-12-0001234567"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-muted-foreground block text-[11px]">Titular</label>
                    <input
                      type="text"
                      required
                      value={cbTitular}
                      onChange={(e) => setCbTitular(e.target.value)}
                      placeholder="Nombre o Empresa"
                      className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-muted-foreground block text-[11px]">RIF / Cédula</label>
                    <input
                      type="text"
                      required
                      value={cbRif}
                      onChange={(e) => setCbRif(e.target.value)}
                      placeholder="J-50123456-7"
                      className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. WHATSAPP DE PEDIDOS */}
            <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 border-b border-border pb-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                  WA
                </span>
                <div>
                  <h3 className="font-bold text-sm">WhatsApp de Pedidos y Atención</h3>
                  <p className="text-[11px] text-muted-foreground">Número al que llegan los pedidos y comprobantes</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px]">Número Internacional (sin signos)</label>
                  <input
                    type="text"
                    required
                    value={wsNumero}
                    onChange={(e) => setWsNumero(e.target.value)}
                    placeholder="584120000000"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    Ejemplo para Venezuela: 584120000000 (código país 58 seguido de los 10 dígitos)
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px]">Formato Visible en Pantalla</label>
                  <input
                    type="text"
                    required
                    value={wsFormato}
                    onChange={(e) => setWsFormato(e.target.value)}
                    placeholder="+58 412 000 0000"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="rounded-full bg-primary px-7 py-3 text-sm font-bold text-primary-foreground hover:scale-105 transition-all shadow-lg"
            >
              Guardar Todos los Métodos de Pago
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* MODALES INTERACTIVOS */}
      {/* ========================================================================= */}

      {/* MODAL 1: RECHAZAR PAGO */}
      {modalRechazar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-background border-2 border-primary p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold text-destructive">
              Rechazar Pago del Pedido #{modalRechazar.id}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Especifica el motivo del rechazo para que el cliente pueda verlo en su panel y corregirlo.
            </p>

            <form onSubmit={handleConfirmarRechazo} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-foreground">Motivo del Rechazo *</label>
                <textarea
                  required
                  rows={3}
                  value={motivoRechazoTexto}
                  onChange={(e) => setMotivoRechazoTexto(e.target.value)}
                  placeholder="Ej. Número de referencia no encontrado en cuenta bancaria, monto incompleto o comprobante ilegible."
                  className="mt-1.5 w-full rounded-xl border border-input bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalRechazar(null)}
                  className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-destructive px-5 py-2 text-xs font-bold text-destructive-foreground hover:opacity-90"
                >
                  Confirmar Rechazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MARCAR ENVIADO CON GUÍA */}
      {modalGuia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-background border-2 border-primary p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold text-foreground">
              {modalGuia.empresa === "Coordinar con la tienda"
                ? `Confirmar Despacho / Entrega #${modalGuia.id}`
                : `Despachar Pedido #${modalGuia.id} por ${modalGuia.empresa}`}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {modalGuia.empresa === "Coordinar con la tienda"
                ? "Registra una constancia, cupón o nota de entrega personal/delivery para este cliente."
                : `Ingresa el número de guía asignado por la agencia ${modalGuia.empresa}.`}
            </p>

            <form onSubmit={handleConfirmarEnvio} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-foreground">
                  {modalGuia.empresa === "Coordinar con la tienda"
                    ? "Constancia o Nota de Entrega *"
                    : "Número de Guía / Cupón *"}
                </label>
                <input
                  type="text"
                  required
                  value={numeroGuiaTexto}
                  onChange={(e) => setNumeroGuiaTexto(e.target.value)}
                  placeholder={
                    modalGuia.empresa === "Coordinar con la tienda"
                      ? "Ej. Entregado en tienda física / Delivery #0412"
                      : `Ej. ${modalGuia.empresa}-98712345`
                  }
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalGuia(null)}
                  className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Confirmar Guía y Envío
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DETALLE DEL PEDIDO */}
      {modalDetallePedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-background border-2 border-primary p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-display text-xl font-bold">
                  Orden #{modalDetallePedido.id}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {new Date(modalDetallePedido.fecha).toLocaleString("es-VE")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalDetallePedido(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                <p className="font-bold uppercase text-[11px] text-muted-foreground">Piezas adquiridas</p>
                {modalDetallePedido.items.map((it) => (
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

              <div className="rounded-xl border border-border bg-card p-3">
                <p className="font-bold uppercase text-[11px] text-muted-foreground">Destinatario y Encomienda</p>
                <p className="mt-1 font-semibold">{modalDetallePedido.cliente.nombre} ({modalDetallePedido.cliente.cedula})</p>
                <p className="text-muted-foreground">Teléfono: {modalDetallePedido.cliente.telefono}</p>
                <p className="text-muted-foreground">Empresa: {modalDetallePedido.envio.empresa} (Cobro en Destino)</p>
                <p className="text-muted-foreground">Agencia: {modalDetallePedido.envio.agencia}, {modalDetallePedido.envio.ciudad}</p>
                {modalDetallePedido.envio.notas && (
                  <p className="text-muted-foreground mt-1">Notas: {modalDetallePedido.envio.notas}</p>
                )}
                {modalDetallePedido.envio.numeroGuia && (
                  <p className="text-blue-700 font-bold mt-1">Guía: {modalDetallePedido.envio.numeroGuia}</p>
                )}
              </div>

              <div className="rounded-xl border border-border bg-card p-3">
                <p className="font-bold uppercase text-[11px] text-muted-foreground">Información del Pago</p>
                <p className="mt-1 font-semibold">{labelMetodoPago(modalDetallePedido.pago.metodo)}</p>
                {modalDetallePedido.pago.referencia && (
                  <p className="font-mono text-xs">Ref: {modalDetallePedido.pago.referencia}</p>
                )}
                {modalDetallePedido.pago.comprobanteNombre && (
                  <p className="text-brand-brown font-medium mt-1">
                    Comprobante adjunto: {modalDetallePedido.pago.comprobanteNombre}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setModalDetallePedido(null)}
                className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CARGAR NUEVO PRODUCTO */}
      {modalNuevoProducto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-background border-2 border-primary p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-xl font-bold">Cargar Nuevo Producto</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Completa los datos para publicar una nueva pieza en el catálogo.
            </p>

            <form onSubmit={handleGuardarNuevoProducto} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold uppercase text-foreground">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={prodNombre}
                  onChange={(e) => setProdNombre(e.target.value)}
                  placeholder="Ej. Gargantilla de Perlas"
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-foreground">Categoría *</label>
                  <select
                    value={prodCategoria}
                    onChange={(e) => setProdCategoria(e.target.value as Categoria)}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Pulseras">Pulseras</option>
                    <option value="Collares">Collares</option>
                    <option value="Aretes">Aretes</option>
                    <option value="Anillos">Anillos</option>
                    <option value="Sets">Sets</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold uppercase text-foreground">Precio en USD *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={prodPrecioUSD}
                    onChange={(e) => setProdPrecioUSD(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* GESTIÓN DE IMAGEN */}
              <div className="rounded-2xl border border-border bg-card p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase text-[11px] text-foreground flex items-center gap-1.5">
                    <ImageIcon className="size-3.5 text-primary" />
                    Imagen del Producto
                  </label>
                  {prodImagen && (
                    <button
                      type="button"
                      onClick={() => setProdImagen("")}
                      className="text-[10px] text-destructive hover:underline font-semibold"
                    >
                      Quitar foto
                    </button>
                  )}
                </div>

                {/* Previsualización en Vivo */}
                <div className="flex items-center gap-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border-2 border-primary/20 bg-muted">
                    {prodImagen ? (
                      <img
                        src={prodImagen}
                        alt="Vista previa"
                        className="size-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=300";
                        }}
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="size-6 opacity-40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={prodImagen}
                      onChange={(e) => setProdImagen(e.target.value)}
                      placeholder="Pega la URL de la imagen aquí..."
                      className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted"
                      >
                        <UploadCloud className="size-3 text-primary" />
                        Subir desde mi equipo
                      </button>
                    </div>
                  </div>
                </div>

                {/* Galería Rápida de Presets de Accesorios */}
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-1">
                    O selecciona una foto de muestra en 1 clic:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PRESET_IMAGENES.slice(0, 4).map((preset) => (
                      <button
                        key={preset.nombre}
                        type="button"
                        onClick={() => setProdImagen(preset.url)}
                        className={`group relative h-10 overflow-hidden rounded-lg border text-left transition-all ${
                          prodImagen === preset.url
                            ? "border-primary ring-2 ring-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                        title={preset.nombre}
                      >
                        <img
                          src={preset.url}
                          alt={preset.nombre}
                          className="size-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold uppercase text-foreground">Descripción</label>
                <textarea
                  rows={2}
                  value={prodDescripcion}
                  onChange={(e) => setProdDescripcion(e.target.value)}
                  placeholder="Detalles sobre el material, baño de oro o perlas..."
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                <input
                  type="checkbox"
                  checked={prodDestacado}
                  onChange={(e) => setProdDestacado(e.target.checked)}
                />
                <span>Marcar como producto destacado en el inicio</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNuevoProducto(false)}
                  className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:scale-105 transition-transform"
                >
                  Publicar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: EDITAR PRODUCTO */}
      {modalEditarProducto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-background border-2 border-primary p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-xl font-bold">Editar Producto</h3>

            <form onSubmit={handleGuardarEdicionProducto} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold uppercase text-foreground">Nombre</label>
                <input
                  type="text"
                  required
                  value={prodNombre}
                  onChange={(e) => setProdNombre(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-foreground">Categoría</label>
                  <select
                    value={prodCategoria}
                    onChange={(e) => setProdCategoria(e.target.value as Categoria)}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Pulseras">Pulseras</option>
                    <option value="Collares">Collares</option>
                    <option value="Aretes">Aretes</option>
                    <option value="Anillos">Anillos</option>
                    <option value="Sets">Sets</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold uppercase text-foreground">Precio en USD</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={prodPrecioUSD}
                    onChange={(e) => setProdPrecioUSD(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* GESTIÓN DE IMAGEN EN EDICIÓN */}
              <div className="rounded-2xl border border-border bg-card p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase text-[11px] text-foreground flex items-center gap-1.5">
                    <ImageIcon className="size-3.5 text-primary" />
                    Imagen del Producto
                  </label>
                  {prodImagen && (
                    <button
                      type="button"
                      onClick={() => setProdImagen("")}
                      className="text-[10px] text-destructive hover:underline font-semibold"
                    >
                      Quitar foto
                    </button>
                  )}
                </div>

                {/* Previsualización en Vivo */}
                <div className="flex items-center gap-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border-2 border-primary/20 bg-muted">
                    {prodImagen ? (
                      <img
                        src={prodImagen}
                        alt="Vista previa"
                        className="size-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=300";
                        }}
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="size-6 opacity-40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={prodImagen}
                      onChange={(e) => setProdImagen(e.target.value)}
                      placeholder="Pega la URL de la imagen..."
                      className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted"
                      >
                        <UploadCloud className="size-3 text-primary" />
                        Subir desde equipo
                      </button>
                    </div>
                  </div>
                </div>

                {/* Galería Rápida de Presets de Accesorios */}
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-1">
                    Cambiar imagen rápidamente:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PRESET_IMAGENES.map((preset) => (
                      <button
                        key={preset.nombre}
                        type="button"
                        onClick={() => setProdImagen(preset.url)}
                        className={`group relative h-10 overflow-hidden rounded-lg border text-left transition-all ${
                          prodImagen === preset.url
                            ? "border-primary ring-2 ring-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                        title={preset.nombre}
                      >
                        <img
                          src={preset.url}
                          alt={preset.nombre}
                          className="size-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold uppercase text-foreground">Descripción</label>
                <textarea
                  rows={2}
                  value={prodDescripcion}
                  onChange={(e) => setProdDescripcion(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalEditarProducto(null)}
                  className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:scale-105 transition-transform"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Input oculto para subir archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleSubirImagenLocal}
        className="hidden"
      />
    </div>
  );
}
