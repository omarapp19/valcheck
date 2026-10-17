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
  EyeOff,
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
  Palette,
  Gem,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useAdminStore, Order, EstadoPedido, AJUSTES_PAGO_DEFAULT } from "@/lib/admin-store";
import {
  formatUSD,
  formatVES,
  categoriasAccesorios,
  categoriasMaquillaje,
  getDepartamentoProducto,
  type Categoria,
  type Producto,
  type Departamento,
} from "@/lib/products";
import { labelMetodoPago } from "@/lib/checkout";



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
    toggleActivoProducto,
    aprobarPago,
    rechazarPago,
    marcarEnviado,
    eliminarPedido,
    vaciarPedidos,
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
  const [modalEliminarPedido, setModalEliminarPedido] = useState<string | null>(null);
  const [modalVaciarPedidos, setModalVaciarPedidos] = useState(false);
  const [modalComprobante, setModalComprobante] = useState<{ url: string; nombre: string; pedidoId: string } | null>(null);

  // Modales de productos
  const [modalNuevoProducto, setModalNuevoProducto] = useState(false);
  const [modalEditarProducto, setModalEditarProducto] = useState<Producto | null>(null);

  // Formulario de producto
  const [prodNombre, setProdNombre] = useState("");
  const [prodDepartamento, setProdDepartamento] = useState<Departamento>("accesorios");
  const [prodCategoria, setProdCategoria] = useState<Categoria>("Pulseras");
  const [prodPrecioUSD, setProdPrecioUSD] = useState(15);
  const [prodStock, setProdStock] = useState<number>(10);
  const [prodActivo, setProdActivo] = useState<boolean>(true);
  const [prodDescripcion, setProdDescripcion] = useState("");
  const [prodImagen, setProdImagen] = useState("");
  const [prodDestacado, setProdDestacado] = useState(false);
  const [adminFiltroDept, setAdminFiltroDept] = useState<"todos" | "accesorios" | "maquillaje">("todos");
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
            <p><strong>Correos autorizados:</strong> omarapp1921@gmail.com, perezpandreav@gmail.com</p>
            <p><strong>Contraseña de prueba:</strong> admin123</p>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={async () => {
                const res = await login("omarapp1921@gmail.com", "admin123");
                if (res.ok) {
                  toast.success("Has ingresado como Administrador (Omar)");
                }
              }}
              className="rounded-full bg-primary py-2.5 px-3 text-xs font-bold text-primary-foreground hover:scale-105 transition-transform text-center"
            >
              Entrar como Omar
            </button>
            <button
              type="button"
              onClick={async () => {
                const res = await login("perezpandreav@gmail.com", "admin123");
                if (res.ok) {
                  toast.success("Has ingresado como Administradora (Andrea)");
                }
              }}
              className="rounded-full border border-primary text-primary py-2.5 px-3 text-xs font-bold hover:bg-primary/10 transition-colors text-center"
            >
              Entrar como Andrea
            </button>
          </div>
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
    const pedido = pedidos.find((p) => p.id === modalRechazar.id);
    if (pedido?.estado === "enviado" || pedido?.estado === "completado") {
      toast.error("No se puede rechazar el pago: este pedido ya fue enviado y la compra está cerrada.");
      setModalRechazar(null);
      return;
    }
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
      departamento: prodDepartamento,
      precioUSD: Number(prodPrecioUSD) || 10,
      stock: Number(prodStock) >= 0 ? Number(prodStock) : 0,
      activo: prodActivo,
      descripcion: prodDescripcion.trim() || "Pieza exclusiva verificada por ValCheck.",
      imagen: prodImagen.trim() || fallbackImg,
      destacado: prodDestacado,
    });
    toast.success(`Producto "${prodNombre}" agregado con éxito`);
    setModalNuevoProducto(false);
    setProdNombre("");
    setProdDescripcion("");
    setProdImagen("");
    setProdStock(10);
    setProdActivo(true);
  };

  // Guardar Edición Producto
  const handleGuardarEdicionProducto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditarProducto) return;
    editarProducto(modalEditarProducto.id, {
      nombre: prodNombre.trim(),
      categoria: prodCategoria,
      departamento: prodDepartamento,
      precioUSD: Number(prodPrecioUSD),
      stock: Number(prodStock) >= 0 ? Number(prodStock) : 0,
      activo: prodActivo,
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
    setProdDepartamento(getDepartamentoProducto(p));
    setProdCategoria(p.categoria);
    setProdPrecioUSD(p.precioUSD);
    setProdStock(p.stock !== undefined ? p.stock : 10);
    setProdActivo(p.activo !== false);
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

      {/* Pestañas de Navegación del Panel (Deslizables horizontalmente en móvil) */}
      <div className="mt-8 flex border-b border-border overflow-x-auto whitespace-nowrap scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          type="button"
          onClick={() => {
            setTabActiva("pedidos");
            setSeccionPedidos("pendientes");
          }}
          className={`flex items-center gap-2 border-b-2 py-2.5 sm:py-3 px-4 sm:px-6 text-xs sm:text-sm font-bold transition-colors cursor-pointer shrink-0 ${
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
          className={`flex items-center gap-2 border-b-2 py-2.5 sm:py-3 px-4 sm:px-6 text-xs sm:text-sm font-bold transition-colors cursor-pointer shrink-0 ${
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
          className={`flex items-center gap-2 border-b-2 py-2.5 sm:py-3 px-4 sm:px-6 text-xs sm:text-sm font-bold transition-colors cursor-pointer shrink-0 ${
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

            <div className="flex items-center gap-2 ml-auto">
              {pedidos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setModalVaciarPedidos(true)}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all cursor-pointer"
                  title="Eliminar todos los pedidos registrados"
                >
                  <Trash2 className="size-3.5" />
                  Vaciar Pedidos
                </button>
              )}
              <button
                type="button"
                onClick={() => setSeccionPedidos("todos")}
                className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  seccionPedidos === "todos"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                Historial General ({pedidos.length})
              </button>
            </div>
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
                      {(ped.pago.comprobanteUrl || ped.pago.comprobanteNombre) && (
                        <div className="mt-1.5">
                          {ped.pago.comprobanteUrl || ped.pago.comprobanteNombre?.startsWith("data:") || ped.pago.comprobanteNombre?.startsWith("http") ? (
                            <button
                              type="button"
                              onClick={() =>
                                setModalComprobante({
                                  url: ped.pago.comprobanteUrl || ped.pago.comprobanteNombre!,
                                  nombre: ped.pago.comprobanteNombre || `Pedido #${ped.id}`,
                                  pedidoId: ped.id,
                                })
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-yellow/80 bg-brand-yellow/30 px-2.5 py-1 text-[11px] font-bold text-brand-brown hover:bg-brand-yellow/50 transition-colors cursor-pointer"
                              title="Ver captura o foto del comprobante"
                            >
                              <ImageIcon className="size-3 text-brand-brown" />
                              <span>Ver captura adjunta</span>
                            </button>
                          ) : (
                            <p className="text-brand-brown font-medium truncate text-[11px]" title={ped.pago.comprobanteNombre}>
                              📎 {ped.pago.comprobanteNombre} <span className="text-muted-foreground text-[10px]">(nombre registrado)</span>
                            </p>
                          )}
                        </div>
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
                      {/* Si el pedido ya fue enviado, la compra está cerrada y ya no se puede rechazar el pago */}
                      {ped.estado === "enviado" ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700">
                          <CheckCircle2 className="size-3.5" />
                          <span>Compra cerrada (Enviado)</span>
                        </div>
                      ) : (
                        <>
                          {/* Botón Aprobar Pago */}
                          {ped.estado !== "aprobado" && (
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

                          {/* Botón Rechazar Pago: Solo se puede rechazar ANTES de ser enviado */}
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
                        </>
                      )}

                      {/* Botón Eliminar Pedido Individual */}
                      <button
                        type="button"
                        onClick={() => setModalEliminarPedido(ped.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-border text-muted-foreground hover:text-destructive hover:border-destructive hover:bg-destructive/10 px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                        title={`Eliminar pedido #${ped.id}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
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
                  const deptDefault = adminFiltroDept === "maquillaje" ? "maquillaje" : "accesorios";
                  setProdDepartamento(deptDefault);
                  setProdCategoria(deptDefault === "maquillaje" ? (categoriasMaquillaje[0] || "Labiales") : (categoriasAccesorios[0] || "Pulseras"));
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

          {/* Filtros de departamento en el catálogo de administración */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setAdminFiltroDept("todos")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                adminFiltroDept === "todos"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos ({productos.length})
            </button>
            <button
              type="button"
              onClick={() => setAdminFiltroDept("accesorios")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                adminFiltroDept === "accesorios"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Gem className="size-3.5" /> Accesorios ({productos.filter((p) => getDepartamentoProducto(p) === "accesorios").length})
            </button>
            <button
              type="button"
              onClick={() => setAdminFiltroDept("maquillaje")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                adminFiltroDept === "maquillaje"
                  ? "bg-brand-yellow text-brand-brown font-bold shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Palette className="size-3.5" /> Maquillaje ({productos.filter((p) => getDepartamentoProducto(p) === "maquillaje").length})
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {productos
              .filter((p) => adminFiltroDept === "todos" || getDepartamentoProducto(p) === adminFiltroDept)
              .map((prod) => (
              <div
                key={prod.id}
                className={`overflow-hidden rounded-2xl border-2 bg-card p-3 shadow-xs flex flex-col justify-between transition-all ${
                  prod.activo === false || (prod.stock ?? 10) <= 0
                    ? "border-muted-foreground/30 bg-muted/20"
                    : "border-primary/20"
                }`}
              >
                <div>
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-brand-beige">
                    <img
                      src={prod.imagen}
                      alt={prod.nombre}
                      className={`size-full object-cover transition-opacity ${
                        prod.activo === false ? "opacity-60 grayscale-[40%]" : ""
                      }`}
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                      {prod.destacado && (
                        <span className="rounded-full bg-brand-yellow px-2 py-0.5 text-[10px] font-bold text-brand-brown shadow-xs">
                          Destacado
                        </span>
                      )}
                      <span className="rounded-full bg-card/90 backdrop-blur px-2 py-0.5 text-[9px] font-bold text-foreground shadow-xs flex items-center gap-1">
                        {getDepartamentoProducto(prod) === "maquillaje" ? (
                          <>
                            <Palette className="size-2.5 text-amber-600" /> Maquillaje
                          </>
                        ) : (
                          <>
                            <Gem className="size-2.5 text-primary" /> Accesorios
                          </>
                        )}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                      {prod.activo === false ? (
                        <span className="rounded-full bg-zinc-900/90 text-zinc-100 backdrop-blur px-2 py-0.5 text-[9px] font-bold shadow-xs flex items-center gap-1 border border-zinc-700">
                          <EyeOff className="size-2.5" /> Desactivado
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-700/90 text-white backdrop-blur px-2 py-0.5 text-[9px] font-bold shadow-xs flex items-center gap-1">
                          <Eye className="size-2.5" /> En Tienda
                        </span>
                      )}

                      {(prod.stock ?? 10) <= 0 ? (
                        <span className="rounded-full bg-red-600 text-white px-2 py-0.5 text-[9px] font-bold shadow-xs">
                          Sin Stock (0)
                        </span>
                      ) : (
                        <span className="rounded-full bg-background/90 text-foreground backdrop-blur px-2 py-0.5 text-[9px] font-bold shadow-xs border border-border">
                          Stock: {prod.stock ?? 10}
                        </span>
                      )}
                    </div>
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

                    <div className="mt-2 flex items-center justify-between text-[11px] rounded-lg bg-muted/60 px-2 py-1">
                      <span className="text-muted-foreground">
                        Stock disponible:
                      </span>
                      <span className={`font-bold ${(prod.stock ?? 10) <= 0 ? "text-destructive" : "text-foreground"}`}>
                        {prod.stock ?? 10} unidades
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      toggleActivoProducto(prod.id);
                      toast.success(
                        prod.activo === false
                          ? `"${prod.nombre}" activado y visible en la tienda`
                          : `"${prod.nombre}" desactivado y retirado de la tienda`
                      );
                    }}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border transition-all ${
                      prod.activo === false
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25"
                        : "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-400 hover:bg-amber-500/25"
                    }`}
                    title={prod.activo === false ? "Activar en la tienda" : "Desactivar de la tienda"}
                  >
                    {prod.activo === false ? (
                      <>
                        <Eye className="size-3" /> Activar
                      </>
                    ) : (
                      <>
                        <EyeOff className="size-3" /> Desactivar
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
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

      {/* MODAL ELIMINAR PEDIDO INDIVIDUAL */}
      {modalEliminarPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-background border-2 border-destructive p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-destructive">¿Eliminar Pedido #{modalEliminarPedido}?</h3>
            <p className="text-xs text-muted-foreground mt-2">
              Esta acción eliminará permanentemente este pedido del historial.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setModalEliminarPedido(null)}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  eliminarPedido(modalEliminarPedido);
                  toast.success(`Pedido #${modalEliminarPedido} eliminado`);
                  setModalEliminarPedido(null);
                }}
                className="rounded-full bg-destructive px-5 py-2 text-xs font-bold text-destructive-foreground hover:opacity-90"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VACIAR TODOS LOS PEDIDOS */}
      {modalVaciarPedidos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-background border-2 border-destructive p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-destructive">¿Eliminar todos los pedidos?</h3>
            <p className="text-xs text-muted-foreground mt-2">
              Se eliminarán todos los pedidos ({pedidos.length}) registrados para empezar desde cero.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setModalVaciarPedidos(false)}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  vaciarPedidos();
                  toast.success("Todos los pedidos han sido eliminados correctamente");
                  setModalVaciarPedidos(false);
                }}
                className="rounded-full bg-destructive px-5 py-2 text-xs font-bold text-destructive-foreground hover:opacity-90"
              >
                Confirmar y Vaciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIGHTBOX: VER COMPROBANTE DE PAGO */}
      {modalComprobante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl bg-background border-2 border-primary p-5 shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-display text-lg font-bold">
                  Comprobante de Pago — Pedido #{modalComprobante.pedidoId}
                </h3>
                <p className="text-xs text-muted-foreground truncate max-w-md">{modalComprobante.nombre}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalComprobante(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-2 my-2 flex items-center justify-center bg-muted/40 rounded-2xl min-h-[300px]">
              <img
                src={modalComprobante.url}
                alt={`Comprobante pedido #${modalComprobante.pedidoId}`}
                className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain shadow-md"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <a
                href={modalComprobante.url}
                target="_blank"
                rel="noreferrer"
                download={`comprobante-${modalComprobante.pedidoId}.jpg`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold hover:bg-muted transition-colors"
              >
                <UploadCloud className="size-3.5 rotate-180" />
                Abrir imagen completa
              </a>
              <button
                type="button"
                onClick={() => setModalComprobante(null)}
                className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:scale-105 transition-transform cursor-pointer"
              >
                Cerrar
              </button>
            </div>
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
                {(modalDetallePedido.pago.comprobanteUrl || modalDetallePedido.pago.comprobanteNombre) && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-muted-foreground text-[11px] font-bold">Comprobante Adjunto:</p>
                    {modalDetallePedido.pago.comprobanteUrl ||
                    modalDetallePedido.pago.comprobanteNombre?.startsWith("data:") ||
                    modalDetallePedido.pago.comprobanteNombre?.startsWith("http") ? (
                      <div className="mt-1 space-y-2">
                        <div
                          onClick={() =>
                            setModalComprobante({
                              url: modalDetallePedido.pago.comprobanteUrl || modalDetallePedido.pago.comprobanteNombre!,
                              nombre: modalDetallePedido.pago.comprobanteNombre || `Pedido #${modalDetallePedido.id}`,
                              pedidoId: modalDetallePedido.id,
                            })
                          }
                          className="relative group cursor-pointer overflow-hidden rounded-xl border border-primary/40 bg-muted/30 p-1 hover:border-primary transition-all max-w-xs"
                        >
                          <img
                            src={modalDetallePedido.pago.comprobanteUrl || modalDetallePedido.pago.comprobanteNombre}
                            alt="Comprobante"
                            className="max-h-40 w-auto rounded-lg object-contain mx-auto"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 rounded-lg">
                            <Eye className="size-4" /> Clic para ampliar
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setModalComprobante({
                              url: modalDetallePedido.pago.comprobanteUrl || modalDetallePedido.pago.comprobanteNombre!,
                              nombre: modalDetallePedido.pago.comprobanteNombre || `Pedido #${modalDetallePedido.id}`,
                              pedidoId: modalDetallePedido.id,
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[11px] font-bold text-foreground hover:bg-muted cursor-pointer"
                        >
                          <ImageIcon className="size-3.5 text-primary" />
                          Ampliar comprobante
                        </button>
                      </div>
                    ) : (
                      <p className="text-brand-brown font-medium mt-0.5">
                        📎 {modalDetallePedido.pago.comprobanteNombre}
                      </p>
                    )}
                  </div>
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
                <label className="font-bold uppercase text-foreground">Departamento *</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProdDepartamento("accesorios");
                      if (!categoriasAccesorios.includes(prodCategoria as any)) {
                        setProdCategoria(categoriasAccesorios[0] || "Pulseras");
                      }
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 px-3 font-bold transition-all cursor-pointer ${
                      prodDepartamento === "accesorios"
                        ? "border-primary bg-primary text-primary-foreground shadow-xs font-bold"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Gem className={`size-4 ${prodDepartamento === "accesorios" ? "text-primary-foreground" : "text-primary"}`} />
                    Accesorios
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProdDepartamento("maquillaje");
                      if (!categoriasMaquillaje.includes(prodCategoria as any)) {
                        setProdCategoria(categoriasMaquillaje[0] || "Labiales");
                      }
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 px-3 font-bold transition-all cursor-pointer ${
                      prodDepartamento === "maquillaje"
                        ? "border-amber-600 bg-amber-400 text-amber-950 shadow-xs font-bold"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Palette className={`size-4 ${prodDepartamento === "maquillaje" ? "text-amber-950" : "text-amber-600"}`} />
                    Maquillaje
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold uppercase text-foreground">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={prodNombre}
                  onChange={(e) => setProdNombre(e.target.value)}
                  placeholder={
                    prodDepartamento === "maquillaje"
                      ? "Ej. Labial Mate Larga Duración"
                      : "Ej. Gargantilla de Perlas"
                  }
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold uppercase text-foreground">Categoría *</label>
                  <select
                    value={prodCategoria}
                    onChange={(e) => setProdCategoria(e.target.value as Categoria)}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring font-medium"
                  >
                    {(prodDepartamento === "maquillaje" ? categoriasMaquillaje : categoriasAccesorios).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold uppercase text-foreground">Precio USD *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    step={0.5}
                    value={prodPrecioUSD}
                    onChange={(e) => setProdPrecioUSD(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase text-foreground">Stock *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={prodStock}
                    onChange={(e) => setProdStock(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="Ej. 10"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring font-bold"
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

              <div className="rounded-2xl border border-border bg-card p-3 space-y-1.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-foreground block">
                      Producto Activo en Tienda
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      {prodActivo
                        ? "Visible en la tienda pública (se oculta automáticamente si el stock llega a 0)"
                        : "Desactivado: no aparecerá en el catálogo de clientes"}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prodActivo}
                    onChange={(e) => setProdActivo(e.target.checked)}
                    className="size-4.5 rounded accent-primary cursor-pointer"
                  />
                </label>
                {prodStock === 0 && prodActivo && (
                  <p className="text-[11px] text-destructive font-medium bg-destructive/10 p-2 rounded-lg">
                    ⚠️ Atención: El stock es 0 unidades, por lo que el producto quedará oculto en la tienda hasta que agregues existencias.
                  </p>
                )}
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
                <label className="font-bold uppercase text-foreground">Departamento *</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProdDepartamento("accesorios");
                      if (!categoriasAccesorios.includes(prodCategoria as any)) {
                        setProdCategoria(categoriasAccesorios[0] || "Pulseras");
                      }
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 px-3 font-bold transition-all cursor-pointer ${
                      prodDepartamento === "accesorios"
                        ? "border-primary bg-primary text-primary-foreground shadow-xs font-bold"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Gem className={`size-4 ${prodDepartamento === "accesorios" ? "text-primary-foreground" : "text-primary"}`} />
                    Accesorios
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProdDepartamento("maquillaje");
                      if (!categoriasMaquillaje.includes(prodCategoria as any)) {
                        setProdCategoria(categoriasMaquillaje[0] || "Labiales");
                      }
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 px-3 font-bold transition-all cursor-pointer ${
                      prodDepartamento === "maquillaje"
                        ? "border-amber-600 bg-amber-400 text-amber-950 shadow-xs font-bold"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Palette className={`size-4 ${prodDepartamento === "maquillaje" ? "text-amber-950" : "text-amber-600"}`} />
                    Maquillaje
                  </button>
                </div>
              </div>

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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold uppercase text-foreground">Categoría</label>
                  <select
                    value={prodCategoria}
                    onChange={(e) => setProdCategoria(e.target.value as Categoria)}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring font-medium"
                  >
                    {(prodDepartamento === "maquillaje" ? categoriasMaquillaje : categoriasAccesorios).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold uppercase text-foreground">Precio en USD</label>
                  <input
                    type="number"
                    required
                    min={1}
                    step={0.5}
                    value={prodPrecioUSD}
                    onChange={(e) => setProdPrecioUSD(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase text-foreground">Stock *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={prodStock}
                    onChange={(e) => setProdStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring font-bold"
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

              <div className="rounded-2xl border border-border bg-card p-3 space-y-1.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-foreground block">
                      Producto Activo en Tienda
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      {prodActivo
                        ? "Visible para clientes (se oculta automáticamente si el stock llega a 0)"
                        : "Desactivado: retirado de la tienda pública"}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prodActivo}
                    onChange={(e) => setProdActivo(e.target.checked)}
                    className="size-4.5 rounded accent-primary cursor-pointer"
                  />
                </label>
                {prodStock === 0 && prodActivo && (
                  <p className="text-[11px] text-destructive font-medium bg-destructive/10 p-2 rounded-lg">
                    ⚠️ Advertencia: El stock es 0, por lo que este producto está oculto de la tienda hasta que agregues existencias.
                  </p>
                )}
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
