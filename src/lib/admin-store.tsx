import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import {
  productos as productosIniciales,
  type Producto,
  type Categoria,
  type Departamento,
  categoriasMaquillaje,
  setTasaBCVActual,
} from "./products";
import { EmpresaEnvio, MetodoPago } from "./checkout";
import { supabase, isSupabaseConfigured } from "./supabase";
import { consultarTasaBCVOficial, getCachedBcvRate, TASA_BCV_FALLBACK } from "./bcv";

export type EstadoPedido = "pendiente" | "aprobado" | "rechazado" | "enviado" | "completado";

export interface OrderItem {
  id: string;
  nombre: string;
  categoria: Categoria;
  precioUSD: number;
  cantidad: number;
  imagen: string;
}

export interface Order {
  id: string;
  fecha: string;
  userId?: string | undefined;
  cliente: {
    nombre: string;
    cedula: string;
    telefono: string;
    email?: string | undefined;
  };
  envio: {
    empresa: EmpresaEnvio;
    estado: string;
    ciudad: string;
    agencia: string;
    notas?: string | undefined;
    numeroGuia?: string | undefined;
  };
  pago: {
    metodo: MetodoPago;
    bancoOrigen?: string | undefined;
    referencia?: string | undefined;
    telefonoOrigen?: string | undefined;
    comprobanteNombre?: string | undefined;
    comprobanteUrl?: string | undefined;
    idBinance?: string | undefined;
  };
  items: OrderItem[];
  totalUSD: number;
  totalVES: string;
  estado: EstadoPedido;
  motivoRechazo?: string | undefined;
  actualizadoEn: string;
}

export interface AjustesContacto {
  telefono: string;
  email: string;
  instagram: string;
  instagramUrl: string;
  direccion: string;
  horario: string;
}

export interface AjustesPago {
  pagoMovil: {
    banco: string;
    codigoBanco: string;
    telefono: string;
    cedula: string;
    titular: string;
  };
  binance: {
    payId: string;
    correo: string;
    red: string;
    titular: string;
  };
  cuentaBancaria: {
    banco: string;
    codigoBanco: string;
    tipo: string;
    numeroCuenta: string;
    titular: string;
    rif: string;
  };
  whatsapp: {
    numero: string;
    numeroFormateado: string;
  };
  contacto: AjustesContacto;
  tasaCambioUSD: number;
}

export const AJUSTES_PAGO_DEFAULT: AjustesPago = {
  pagoMovil: {
    banco: "Banesco",
    codigoBanco: "0134",
    telefono: "0414-0000000",
    cedula: "V-28.000.000",
    titular: "ValCheck Belleza Verificada",
  },
  binance: {
    payId: "847291034",
    correo: "valcheck.pagos@gmail.com",
    red: "USDT (BEP-20 / TRC-20)",
    titular: "ValCheck Official",
  },
  cuentaBancaria: {
    banco: "Banesco Banco Universal",
    codigoBanco: "0134",
    tipo: "Cuenta Corriente",
    numeroCuenta: "0134-0987-12-0001234567",
    titular: "ValCheck Belleza Verificada, C.A.",
    rif: "J-50123456-7",
  },
  whatsapp: {
    numero: "584120000000",
    numeroFormateado: "+58 412 000 0000",
  },
  contacto: {
    telefono: "+58 412 000 0000",
    email: "hola@valcheck.ve",
    instagram: "@valcheck.ve",
    instagramUrl: "https://instagram.com/valcheck.ve",
    direccion: "Venezuela · Envíos nacionales",
    horario: "Lunes a Sábado: 8:30 AM - 6:30 PM",
  },
  tasaCambioUSD: TASA_BCV_FALLBACK,
};

interface AdminStoreContextValue {
  productos: Producto[];
  pedidos: Order[];
  ajustesPago: AjustesPago;
  actualizarAjustesPago: (nuevos: Partial<AjustesPago>) => void;
  agregarProducto: (p: Omit<Producto, "id">) => Producto;
  editarProducto: (id: string, p: Partial<Producto>) => void;
  eliminarProducto: (id: string) => void;
  toggleActivoProducto: (id: string) => void;
  crearPedido: (data: {
    numeroPedido?: string | undefined;
    userId?: string | undefined;
    cliente: Order["cliente"];
    envio: Order["envio"];
    pago: Order["pago"];
    items: OrderItem[];
    totalUSD: number;
    totalVES: string;
  }) => string;
  aprobarPago: (pedidoId: string) => void;
  rechazarPago: (pedidoId: string, motivo: string) => void;
  marcarEnviado: (pedidoId: string, numeroGuia: string) => void;
  cambiarEstadoPedido: (pedidoId: string, nuevoEstado: EstadoPedido) => void;
  eliminarPedido: (pedidoId: string) => void;
  vaciarPedidos: () => void;
  obtenerPedidosUsuario: (emailOrPhoneOrId: string) => Order[];
  restablecerCatalogo: () => void;
  tasaBCV: number;
  tasaBCVFecha: string;
  tasaBCVFuente: string;
  tasaBCVCargando: boolean;
  actualizarTasaBCV: () => Promise<void>;
}

const AdminStoreContext = createContext<AdminStoreContextValue | null>(null);

const STORAGE_PRODUCTS_KEY = "valcheck_catalog_products_v4";
const STORAGE_ORDERS_KEY = "valcheck_all_orders_v3";
const STORAGE_PAYMENT_KEY = "valcheck_payment_settings";

const DEMO_IDS = ["VC-784201", "VC-652190", "VC-519823"];
export const esPedidoDemo = (o: any) => {
  if (!o) return false;
  const idMatch = DEMO_IDS.includes(o.id);
  const nombre = (o.cliente?.nombre || o.cliente_nombre || "").toLowerCase().trim();
  const nameMatch = ["valentina romero", "carlos mendoza", "andrea castillo"].includes(nombre);
  return idMatch || nameMatch;
};

const PEDIDOS_DEMO: Order[] = [];

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [productos, setProductos] = useState<Producto[]>(productosIniciales);
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [ajustesPago, setAjustesPago] = useState<AjustesPago>(AJUSTES_PAGO_DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  // Estado reactivo de la Tasa BCV Oficial (inicia con fallback idéntico en SSR y cliente)
  const [tasaBCV, setTasaBCV] = useState<number>(TASA_BCV_FALLBACK);
  const [tasaBCVFecha, setTasaBCVFecha] = useState<string>("Tasa Oficial BCV");
  const [tasaBCVFuente, setTasaBCVFuente] = useState<string>("Banco Central de Venezuela (BCV)");
  const [tasaBCVCargando, setTasaBCVCargando] = useState<boolean>(false);

  // Función para consultar la tasa BCV oficial
  const actualizarTasaBCV = useCallback(async () => {
    setTasaBCVCargando(true);
    try {
      const res = await consultarTasaBCVOficial();
      setTasaBCV(res.tasa);
      setTasaBCVFecha(res.fecha);
      setTasaBCVFuente(res.fuente);
      setTasaBCVActual(res.tasa);
      setAjustesPago((prev) => {
        const updated = { ...prev, tasaCambioUSD: res.tasa };
        try {
          localStorage.setItem(STORAGE_PAYMENT_KEY, JSON.stringify(updated));
        } catch {
          /* ignore */
        }
        return updated;
      });
    } finally {
      setTasaBCVCargando(false);
    }
  }, []);

  // Sincronización automática de Tasa BCV
  useEffect(() => {
    // 1. Cargar caché inmediatamente tras montar en el cliente
    const cache = getCachedBcvRate();
    if (cache.tasa && cache.tasa > 0) {
      setTasaBCV(cache.tasa);
      if (cache.fecha) setTasaBCVFecha(cache.fecha);
      if (cache.fuente) setTasaBCVFuente(cache.fuente);
      setTasaBCVActual(cache.tasa);
    }

    // 2. Consulta en tiempo real de la tasa oficial
    actualizarTasaBCV();

    // Actualización periódica automática cada 15 minutos
    const intervalId = setInterval(() => {
      actualizarTasaBCV();
    }, 15 * 60 * 1000);

    // Actualización automática al volver a enfocar la ventana/pestaña
    const handleFocus = () => {
      actualizarTasaBCV();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [actualizarTasaBCV]);

  useEffect(() => {
    try {
      const storedProds = localStorage.getItem(STORAGE_PRODUCTS_KEY);
      if (storedProds) {
        setProductos(JSON.parse(storedProds));
      } else {
        localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(productosIniciales));
      }

      localStorage.removeItem("valcheck_all_orders");
      localStorage.removeItem("valcheck_all_orders_v2");
      const storedOrders = localStorage.getItem(STORAGE_ORDERS_KEY);
      if (storedOrders) {
        try {
          const parsed = JSON.parse(storedOrders);
          const validOrders = Array.isArray(parsed) ? parsed.filter((o) => !esPedidoDemo(o)) : [];
          setPedidos(validOrders);
          localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(validOrders));
        } catch {
          setPedidos([]);
        }
      } else {
        localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify([]));
        setPedidos([]);
      }

      const storedPayment = localStorage.getItem(STORAGE_PAYMENT_KEY);
      if (storedPayment) {
        try {
          const parsed = JSON.parse(storedPayment);
          setAjustesPago({
            ...AJUSTES_PAGO_DEFAULT,
            ...parsed,
            pagoMovil: { ...AJUSTES_PAGO_DEFAULT.pagoMovil, ...(parsed.pagoMovil || {}) },
            binance: { ...AJUSTES_PAGO_DEFAULT.binance, ...(parsed.binance || {}) },
            cuentaBancaria: { ...AJUSTES_PAGO_DEFAULT.cuentaBancaria, ...(parsed.cuentaBancaria || {}) },
            whatsapp: { ...AJUSTES_PAGO_DEFAULT.whatsapp, ...(parsed.whatsapp || {}) },
            contacto: { ...AJUSTES_PAGO_DEFAULT.contacto, ...(parsed.contacto || {}) },
            tasaCambioUSD: parsed.tasaCambioUSD || TASA_BCV_FALLBACK,
          });
        } catch {
          /* ignore parse error */
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);

    // Sincronización con Supabase si está disponible
    if (isSupabaseConfigured && supabase) {
      // 0. Cargar ajustes y datos de contacto desde Supabase (tabla 'configuracion')
      supabase
        .from("configuracion")
        .select("datos")
        .eq("id", "ajustes_tienda")
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error && data?.datos) {
            setAjustesPago((prev) => {
              const merged: AjustesPago = {
                ...AJUSTES_PAGO_DEFAULT,
                ...prev,
                ...data.datos,
                pagoMovil: { ...AJUSTES_PAGO_DEFAULT.pagoMovil, ...prev.pagoMovil, ...(data.datos.pagoMovil || {}) },
                binance: { ...AJUSTES_PAGO_DEFAULT.binance, ...prev.binance, ...(data.datos.binance || {}) },
                cuentaBancaria: { ...AJUSTES_PAGO_DEFAULT.cuentaBancaria, ...prev.cuentaBancaria, ...(data.datos.cuentaBancaria || {}) },
                whatsapp: { ...AJUSTES_PAGO_DEFAULT.whatsapp, ...prev.whatsapp, ...(data.datos.whatsapp || {}) },
                contacto: { ...AJUSTES_PAGO_DEFAULT.contacto, ...prev.contacto, ...(data.datos.contacto || {}) },
              };
              try {
                localStorage.setItem(STORAGE_PAYMENT_KEY, JSON.stringify(merged));
              } catch {
                /* ignore */
              }
              return merged;
            });
          }
        });
      // 1. Cargar productos desde Supabase (tabla 'productos')
      supabase
        .from("productos")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            const validData = data.filter((d: any) => !["prod-1", "prod-2", "prod-3", "prod-4"].includes(d.id));
            if (validData.length > 0) {
              const mapped: Producto[] = validData.map((d: any) => ({
                id: d.id,
                nombre: d.nombre,
                precioUSD: Number(d.precio_usd || d.precio || 0),
                precio: Number(d.precio_usd || d.precio || 0),
                precioAnterior: d.precio_anterior ? Number(d.precio_anterior) : undefined,
                categoria: (d.categoria as Categoria) || "Anillos",
                departamento: ((categoriasMaquillaje as readonly string[]).includes(d.categoria) ? "maquillaje" : "accesorios") as Departamento,
                imagen: d.imagen,
                imagenes: Array.isArray(d.imagenes) ? d.imagenes : undefined,
                descripcion: d.descripcion || "",
                stock: d.stock ?? 10,
                destacado: Boolean(d.destacado),
                calificacion: Number(d.calificacion ?? 5.0),
                totalResenas: d.resenas_count ?? 12,
              }));
              setProductos(mapped);
              localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(mapped));
            } else {
              // Si la base de datos está vacía de productos reales, usar el catálogo de joyería original
              setProductos(productosIniciales);
              localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(productosIniciales));
            }
          }
        });

      // 2. Cargar pedidos desde Supabase (tabla 'pedidos')
      supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const mappedOrders: Order[] = data
              .filter((o: any) => !esPedidoDemo(o))
              .map((o: any) => ({
              id: o.id,
              fecha: o.created_at,
              userId: o.user_id,
              cliente: {
                nombre: o.cliente_nombre || "Cliente",
                cedula: o.cliente_cedula || "",
                telefono: o.cliente_telefono || "",
                email: o.cliente_email,
              },
              envio: {
                empresa: (o.empresa_envio || "MRW") as EmpresaEnvio,
                estado: "",
                ciudad: "",
                agencia: o.direccion_entrega || "",
                numeroGuia: o.numero_guia,
              },
              pago: {
                metodo: (o.metodo_pago || "pago_movil") as MetodoPago,
                referencia: o.referencia_pago,
                comprobanteNombre: o.comprobante_url ? (o.comprobante_url.startsWith("data:") ? "comprobante_pago.jpg" : o.comprobante_url) : undefined,
                comprobanteUrl: o.comprobante_url,
              },
              items: Array.isArray(o.items) ? o.items : [],
              totalUSD: Number(o.total_usd || 0),
              totalVES: `Bs. ${(Number(o.total_usd || 0) * 250).toLocaleString("es-VE")}`,
              estado: (o.estado as EstadoPedido) || "pendiente",
              actualizadoEn: o.created_at,
            }));
            setPedidos(mappedOrders);
            localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(mappedOrders));
          }
        });
    }
  }, []);

  const persistProductos = (prods: Producto[]) => {
    setProductos(prods);
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(prods));
  };

  const persistPedidos = (ords: Order[]) => {
    setPedidos(ords);
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(ords));
  };

  const agregarProducto = (p: Omit<Producto, "id">) => {
    const slugId = p.nombre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const id = `${slugId}-${Date.now().toString().slice(-4)}`;

    const nuevo: Producto = {
      ...p,
      id,
    };
    const actualizados = [nuevo, ...productos];
    persistProductos(actualizados);

    if (isSupabaseConfigured && supabase) {
      supabase.from("productos").insert({
        id,
        nombre: p.nombre,
        precio_usd: p.precio,
        precio_anterior: p.precioAnterior,
        categoria: p.categoria,
        imagen: p.imagen,
        descripcion: p.descripcion,
        stock: p.stock,
        destacado: true,
      }).then();
    }

    return nuevo;
  };

  const editarProducto = (id: string, p: Partial<Producto>) => {
    const actualizados = productos.map((item) => (item.id === id ? { ...item, ...p } : item));
    persistProductos(actualizados);

    if (isSupabaseConfigured && supabase) {
      const updates: any = {};
      if (p.nombre !== undefined) updates.nombre = p.nombre;
      if (p.precio !== undefined) updates.precio_usd = p.precio;
      if (p.precioAnterior !== undefined) updates.precio_anterior = p.precioAnterior;
      if (p.categoria !== undefined) updates.categoria = p.categoria;
      if (p.imagen !== undefined) updates.imagen = p.imagen;
      if (p.descripcion !== undefined) updates.descripcion = p.descripcion;
      if (p.stock !== undefined) updates.stock = p.stock;
      if (p.activo !== undefined) updates.activo = p.activo;
      supabase.from("productos").update(updates).eq("id", id).then();
    }
  };

  const toggleActivoProducto = (id: string) => {
    const actualizados = productos.map((p) =>
      p.id === id ? { ...p, activo: p.activo === false ? true : false } : p
    );
    persistProductos(actualizados);
    if (isSupabaseConfigured && supabase) {
      const prod = actualizados.find((p) => p.id === id);
      supabase.from("productos").update({ activo: prod?.activo }).eq("id", id).then();
    }
  };

  const eliminarProducto = (id: string) => {
    const actualizados = productos.filter((item) => item.id !== id);
    persistProductos(actualizados);

    if (isSupabaseConfigured && supabase) {
      supabase.from("productos").delete().eq("id", id).then();
    }
  };

  const restablecerCatalogo = () => {
    persistProductos(productosIniciales);
    if (isSupabaseConfigured && supabase) {
      const mapped = productosIniciales.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        precio_usd: p.precioUSD,
        categoria: p.categoria,
        imagen: p.imagen,
        descripcion: p.descripcion || "",
        stock: p.stock ?? 10,
        destacado: Boolean(p.destacado),
        precio_anterior: p.precioAnterior ?? null,
        calificacion: p.calificacion ?? 5.0,
        resenas_count: p.totalResenas ?? 12,
      }));
      supabase.from("productos").upsert(mapped).then();
    }
  };

  const crearPedido = (data: {
    numeroPedido?: string | undefined;
    userId?: string | undefined;
    cliente: Order["cliente"];
    envio: Order["envio"];
    pago: Order["pago"];
    items: OrderItem[];
    totalUSD: number;
    totalVES: string;
  }) => {
    const id = data.numeroPedido || `VC-${Math.floor(100000 + Math.random() * 900000)}`;
    const nuevoPedido: Order = {
      id,
      fecha: new Date().toISOString(),
      userId: data.userId,
      cliente: data.cliente,
      envio: data.envio,
      pago: data.pago,
      items: data.items,
      totalUSD: data.totalUSD,
      totalVES: data.totalVES,
      estado: "pendiente",
      actualizadoEn: new Date().toISOString(),
    };

    const actualizados = [nuevoPedido, ...pedidos];
    persistPedidos(actualizados);

    // Descontar inventario/stock automáticamente de los productos comprados
    const productosActualizados = productos.map((prod) => {
      const comprado = data.items.find((it) => it.id === prod.id);
      if (comprado) {
        const stockActual = prod.stock ?? 10;
        const nuevoStock = Math.max(0, stockActual - comprado.cantidad);
        return { ...prod, stock: nuevoStock };
      }
      return prod;
    });
    persistProductos(productosActualizados);

    if (isSupabaseConfigured && supabase) {
      supabase.from("pedidos").insert({
        id,
        user_id: data.userId || null,
        cliente_nombre: data.cliente.nombre,
        cliente_telefono: data.cliente.telefono,
        cliente_email: data.cliente.email || null,
        cliente_cedula: data.cliente.cedula,
        items: data.items,
        total_usd: data.totalUSD,
        metodo_pago: data.pago.metodo,
        referencia_pago: data.pago.referencia || data.pago.idBinance || null,
        comprobante_url: data.pago.comprobanteUrl || data.pago.comprobanteNombre || null,
        estado: "pendiente",
        empresa_envio: data.envio.empresa,
        direccion_entrega: `${data.envio.agencia} (${data.envio.ciudad}, ${data.envio.estado})`,
        notas: data.envio.notas || null,
      }).then();
    }

    return id;
  };

  const aprobarPago = (pedidoId: string) => {
    const actualizados = pedidos.map((p) =>
      p.id === pedidoId
        ? {
            ...p,
            estado: "aprobado" as EstadoPedido,
            motivoRechazo: undefined,
            actualizadoEn: new Date().toISOString(),
          }
        : p,
    );
    persistPedidos(actualizados);

    if (isSupabaseConfigured && supabase) {
      supabase.from("pedidos").update({ estado: "aprobado" }).eq("id", pedidoId).then();
    }
  };

  const rechazarPago = (pedidoId: string, motivo: string) => {
    const ped = pedidos.find((p) => p.id === pedidoId);
    if (ped?.estado === "enviado" || ped?.estado === "completado") {
      console.warn("No se puede rechazar el pago: el pedido ya ha sido enviado y la compra está cerrada.");
      return;
    }

    const actualizados = pedidos.map((p) =>
      p.id === pedidoId
        ? {
            ...p,
            estado: "rechazado" as EstadoPedido,
            motivoRechazo: motivo,
            actualizadoEn: new Date().toISOString(),
          }
        : p,
    );
    persistPedidos(actualizados);

    if (isSupabaseConfigured && supabase) {
      supabase.from("pedidos").update({ estado: "rechazado" }).eq("id", pedidoId).then();
    }
  };

  const marcarEnviado = (pedidoId: string, numeroGuia: string) => {
    const actualizados = pedidos.map((p) =>
      p.id === pedidoId
        ? {
            ...p,
            estado: "enviado" as EstadoPedido,
            envio: { ...p.envio, numeroGuia },
            actualizadoEn: new Date().toISOString(),
          }
        : p,
    );
    persistPedidos(actualizados);

    if (isSupabaseConfigured && supabase) {
      supabase.from("pedidos").update({ estado: "enviado", numero_guia: numeroGuia, estado_envio: "enviado" }).eq("id", pedidoId).then();
    }
  };

  const cambiarEstadoPedido = (pedidoId: string, nuevoEstado: EstadoPedido) => {
    const actualizados = pedidos.map((p) =>
      p.id === pedidoId
        ? {
            ...p,
            estado: nuevoEstado,
            actualizadoEn: new Date().toISOString(),
          }
        : p,
    );
    persistPedidos(actualizados);

    if (isSupabaseConfigured && supabase) {
      supabase.from("pedidos").update({ estado: nuevoEstado }).eq("id", pedidoId).then();
    }
  };

  const obtenerPedidosUsuario = (identifier: string) => {
    if (!identifier) return [];
    const term = identifier.toLowerCase().trim();
    return pedidos.filter(
      (p) =>
        p.userId === identifier ||
        p.cliente.email?.toLowerCase().trim() === term ||
        p.cliente.cedula.toLowerCase().trim() === term ||
        p.cliente.telefono.includes(term),
    );
  };

  const actualizarAjustesPago = (nuevos: Partial<AjustesPago>) => {
    setAjustesPago((prev) => {
      const combinados: AjustesPago = {
        ...prev,
        ...nuevos,
        pagoMovil: { ...prev.pagoMovil, ...(nuevos.pagoMovil || {}) },
        binance: { ...prev.binance, ...(nuevos.binance || {}) },
        cuentaBancaria: { ...prev.cuentaBancaria, ...(nuevos.cuentaBancaria || {}) },
        whatsapp: { ...prev.whatsapp, ...(nuevos.whatsapp || {}) },
        contacto: { ...prev.contacto, ...(nuevos.contacto || {}) },
      };
      try {
        localStorage.setItem(STORAGE_PAYMENT_KEY, JSON.stringify(combinados));
      } catch {
        /* ignore */
      }

      if (isSupabaseConfigured && supabase) {
        supabase
          .from("configuracion")
          .upsert({ id: "ajustes_tienda", datos: combinados })
          .then(({ error }) => {
            if (error) {
              // Silencioso si la tabla no ha sido creada aún en Supabase
              console.warn("Aviso de sincronización Supabase configuracion:", error.message);
            }
          });
      }

      return combinados;
    });
  };

  const eliminarPedido = (pedidoId: string) => {
    const actualizados = pedidos.filter((p) => p.id !== pedidoId);
    persistPedidos(actualizados);

    if (isSupabaseConfigured && supabase) {
      supabase.from("pedidos").delete().eq("id", pedidoId).then();
    }
  };

  const vaciarPedidos = () => {
    persistPedidos([]);

    if (isSupabaseConfigured && supabase) {
      supabase.from("pedidos").delete().neq("id", "none").then();
    }
  };

  return (
    <AdminStoreContext.Provider
      value={{
        productos,
        pedidos,
        ajustesPago,
        actualizarAjustesPago,
        agregarProducto,
        editarProducto,
        eliminarProducto,
        toggleActivoProducto,
        crearPedido,
        aprobarPago,
        rechazarPago,
        marcarEnviado,
        cambiarEstadoPedido,
        eliminarPedido,
        vaciarPedidos,
        obtenerPedidosUsuario,
        restablecerCatalogo,
        tasaBCV,
        tasaBCVFecha,
        tasaBCVFuente,
        tasaBCVCargando,
        actualizarTasaBCV,
      }}
    >
      {children}
    </AdminStoreContext.Provider>
  );
}

export function useAdminStore() {
  const ctx = useContext(AdminStoreContext);
  if (!ctx) throw new Error("useAdminStore debe usarse dentro de AdminStoreProvider");
  return ctx;
}
