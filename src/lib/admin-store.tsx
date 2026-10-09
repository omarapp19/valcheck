import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { productos as productosIniciales, type Producto, type Categoria, setTasaBCVActual } from "./products";
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
    idBinance?: string | undefined;
  };
  items: OrderItem[];
  totalUSD: number;
  totalVES: string;
  estado: EstadoPedido;
  motivoRechazo?: string | undefined;
  actualizadoEn: string;
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
  obtenerPedidosUsuario: (emailOrPhoneOrId: string) => Order[];
  restablecerCatalogo: () => void;
  tasaBCV: number;
  tasaBCVFecha: string;
  tasaBCVFuente: string;
  tasaBCVCargando: boolean;
  actualizarTasaBCV: () => Promise<void>;
}

const AdminStoreContext = createContext<AdminStoreContextValue | null>(null);

const STORAGE_PRODUCTS_KEY = "valcheck_catalog_products_v3";
const STORAGE_ORDERS_KEY = "valcheck_all_orders";
const STORAGE_PAYMENT_KEY = "valcheck_payment_settings";

const PEDIDOS_DEMO: Order[] = [
  {
    id: "VC-784201",
    fecha: "2026-10-07T14:30:00.000Z",
    userId: "user-cliente-1",
    cliente: {
      nombre: "Valentina Romero",
      cedula: "V-25.432.109",
      telefono: "0412-9876543",
      email: "cliente@valcheck.ve",
    },
    envio: {
      empresa: "MRW",
      estado: "Carabobo",
      ciudad: "Valencia",
      agencia: "Agencia MRW Los Sauces #0412",
      notas: "Retiro en la tarde",
    },
    pago: {
      metodo: "pago_movil",
      bancoOrigen: "Banesco",
      referencia: "094821",
      telefonoOrigen: "0412-9876543",
      comprobanteNombre: "capture-pago-094821.jpg",
    },
    items: [
      {
        id: productosIniciales[0]?.id || "earcuff",
        nombre: productosIniciales[0]?.nombre || "Earcuff",
        categoria: productosIniciales[0]?.categoria || "Aretes",
        precioUSD: productosIniciales[0]?.precioUSD || 6,
        cantidad: 1,
        imagen: productosIniciales[0]?.imagen || "",
      },
      {
        id: productosIniciales[1]?.id || "anillo-7-indiv",
        nombre: productosIniciales[1]?.nombre || "Anillo #7 indiv",
        categoria: productosIniciales[1]?.categoria || "Anillos",
        precioUSD: productosIniciales[1]?.precioUSD || 2.5,
        cantidad: 1,
        imagen: productosIniciales[1]?.imagen || "",
      },
    ],
    totalUSD: 8.5,
    totalVES: "Bs. 7.435,21",
    estado: "pendiente",
    actualizadoEn: "2026-10-07T14:30:00.000Z",
  },
  {
    id: "VC-652190",
    fecha: "2026-10-06T10:15:00.000Z",
    cliente: {
      nombre: "Carlos Mendoza",
      cedula: "V-19.876.543",
      telefono: "0414-1122334",
    },
    envio: {
      empresa: "ZOOM",
      estado: "Distrito Capital",
      ciudad: "Caracas",
      agencia: "ZOOM Chacao Calle Pantin",
      numeroGuia: "ZM-98471203",
    },
    pago: {
      metodo: "binance",
      idBinance: "847291048291",
      comprobanteNombre: "binance-usdt-txid.png",
    },
    items: [
      {
        id: productosIniciales[3]?.id || "anillo-ajustable-con-textura",
        nombre: productosIniciales[3]?.nombre || "Anillo ajustable con textura",
        categoria: productosIniciales[3]?.categoria || "Anillos",
        precioUSD: productosIniciales[3]?.precioUSD || 4,
        cantidad: 2,
        imagen: productosIniciales[3]?.imagen || "",
      },
    ],
    totalUSD: 8,
    totalVES: "Bs. 6.997,84",
    estado: "enviado",
    actualizadoEn: "2026-10-06T16:00:00.000Z",
  },
  {
    id: "VC-519823",
    fecha: "2026-10-05T09:00:00.000Z",
    cliente: {
      nombre: "Andrea Castillo",
      cedula: "V-22.334.455",
      telefono: "0424-5566778",
    },
    envio: {
      empresa: "MRW",
      estado: "Lara",
      ciudad: "Barquisimeto",
      agencia: "MRW Av. Lara Centro",
    },
    pago: {
      metodo: "transferencia",
      bancoOrigen: "Mercantil",
      referencia: "002934",
    },
    items: [
      {
        id: productosIniciales[2]?.id || "anillo-8-indiv",
        nombre: productosIniciales[2]?.nombre || "Anillo #8 indiv",
        categoria: productosIniciales[2]?.categoria || "Anillos",
        precioUSD: productosIniciales[2]?.precioUSD || 2.5,
        cantidad: 2,
        imagen: productosIniciales[2]?.imagen || "",
      },
    ],
    totalUSD: 5,
    totalVES: "Bs. 4.373,65",
    estado: "aprobado",
    actualizadoEn: "2026-10-05T12:00:00.000Z",
  },
];

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [productos, setProductos] = useState<Producto[]>(productosIniciales);
  const [pedidos, setPedidos] = useState<Order[]>(PEDIDOS_DEMO);
  const [ajustesPago, setAjustesPago] = useState<AjustesPago>(AJUSTES_PAGO_DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  // Estado reactivo de la Tasa BCV Oficial
  const cacheInicial = getCachedBcvRate();
  const [tasaBCV, setTasaBCV] = useState<number>(cacheInicial.tasa);
  const [tasaBCVFecha, setTasaBCVFecha] = useState<string>(cacheInicial.fecha);
  const [tasaBCVFuente, setTasaBCVFuente] = useState<string>(cacheInicial.fuente);
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
    // Consulta inicial al abrir la aplicación
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

      const storedOrders = localStorage.getItem(STORAGE_ORDERS_KEY);
      if (storedOrders) {
        setPedidos(JSON.parse(storedOrders));
      } else {
        localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(PEDIDOS_DEMO));
      }

      const storedPayment = localStorage.getItem(STORAGE_PAYMENT_KEY);
      if (storedPayment) {
        const parsed = JSON.parse(storedPayment);
        setAjustesPago({
          ...AJUSTES_PAGO_DEFAULT,
          ...parsed,
          tasaCambioUSD: cacheInicial.tasa || parsed.tasaCambioUSD || TASA_BCV_FALLBACK,
        });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);

    // Sincronización con Supabase si está disponible
    if (isSupabaseConfigured && supabase) {
      // 1. Cargar productos desde Supabase (tabla 'productos')
      supabase
        .from("productos")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const mapped: Producto[] = data.map((d: any) => ({
              id: d.id,
              nombre: d.nombre,
              precioUSD: Number(d.precio_usd || d.precio || 0),
              precio: Number(d.precio_usd || d.precio || 0),
              precioAnterior: d.precio_anterior ? Number(d.precio_anterior) : undefined,
              categoria: (d.categoria as Categoria) || "Bolsos",
              imagen: d.imagen,
              imagenes: Array.isArray(d.imagenes) ? d.imagenes : undefined,
              descripcion: d.descripcion || "",
              stock: d.stock ?? 10,
              calificacion: Number(d.calificacion ?? 5.0),
              totalResenas: d.resenas_count ?? 12,
            }));
            setProductos(mapped);
            localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(mapped));
          }
        });

      // 2. Cargar pedidos desde Supabase (tabla 'pedidos')
      supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const mappedOrders: Order[] = data.map((o: any) => ({
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
                comprobanteNombre: o.comprobante_url,
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
      supabase.from("productos").update(updates).eq("id", id).then();
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
        comprobante_url: data.pago.comprobanteNombre || null,
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
      const combinados = {
        ...prev,
        ...nuevos,
        pagoMovil: { ...prev.pagoMovil, ...(nuevos.pagoMovil || {}) },
        binance: { ...prev.binance, ...(nuevos.binance || {}) },
        cuentaBancaria: { ...prev.cuentaBancaria, ...(nuevos.cuentaBancaria || {}) },
        whatsapp: { ...prev.whatsapp, ...(nuevos.whatsapp || {}) },
      };
      localStorage.setItem(STORAGE_PAYMENT_KEY, JSON.stringify(combinados));
      return combinados;
    });
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
        crearPedido,
        aprobarPago,
        rechazarPago,
        marcarEnviado,
        cambiarEstadoPedido,
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
