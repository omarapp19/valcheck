import { CartItem } from "./cart";
import { formatUSD, formatVES, TASA_BCV } from "./products";

export type MetodoPago = "pago_movil" | "binance" | "transferencia" | "whatsapp";

export interface PagoMovilConfig {
  banco: string;
  codigoBanco: string;
  telefono: string;
  cedula: string;
  titular: string;
}

export const PAGO_MOVIL_DATOS: PagoMovilConfig = {
  banco: "Banesco",
  codigoBanco: "0134",
  telefono: "0414-0000000",
  cedula: "V-28.000.000",
  titular: "ValCheck Belleza Verificada",
};

export const BINANCE_DATOS = {
  payId: "847291034",
  correo: "valcheck.pagos@gmail.com",
  red: "USDT (Red BNB Smart Chain BEP-20 / Tron TRC-20)",
  titular: "ValCheck Official",
};

export const CUENTA_BANCARIA_DATOS = {
  banco: "Banesco Banco Universal",
  codigoBanco: "0134",
  tipo: "Cuenta Corriente",
  numeroCuenta: "0134-0987-12-0001234567",
  titular: "ValCheck Belleza Verificada, C.A.",
  rif: "J-50123456-7",
};

export const WHATSAPP_CONFIG = {
  numero: "584120000000",
  numeroFormateado: "+58 412 000 0000",
};

export type EmpresaEnvio = "ZOOM" | "MRW" | "Coordinar con la tienda";

export interface DatosEnvio {
  nombreCompleto: string;
  cedula?: string | undefined;
  telefono: string;
  estado?: string | undefined;
  ciudad: string;
  empresa?: EmpresaEnvio | undefined;
  agenciaDestino?: string | undefined;
  notas?: string | undefined;
}

export interface DatosPago {
  metodo: MetodoPago;
  bancoOrigen?: string | undefined;
  referencia?: string | undefined;
  telefonoOrigen?: string | undefined;
  comprobanteNombre?: string | undefined;
  comprobanteUrl?: string | undefined;
  idTransaccionBinance?: string | undefined;
}

export function generarNumeroPedido(): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `VC-${random}`;
}

export function labelMetodoPago(metodo: MetodoPago): string {
  switch (metodo) {
    case "pago_movil":
      return "Pago Móvil (Bs)";
    case "binance":
      return "Binance (USDT / Pay)";
    case "transferencia":
      return "Transferencia Bancaria (Bs)";
    case "whatsapp":
      return "Directo vía WhatsApp (Acordar con asesor)";
  }
}

export function construirMensajeWhatsApp({
  numeroPedido,
  items,
  totalUSD,
  envio,
  pago,
}: {
  numeroPedido: string;
  items: CartItem[];
  totalUSD: number;
  envio: DatosEnvio;
  pago: DatosPago;
}): string {
  const lineasProductos = items
    .map(
      (item) =>
        `• ${item.cantidad}x ${item.producto.nombre} - ${formatUSD(item.producto.precioUSD * item.cantidad)}`,
    )
    .join("\n");

  let bloquePago = "";
  if (pago.metodo === "pago_movil") {
    bloquePago = `💳 *MÉTODO DE PAGO: PAGO MÓVIL*
• *Banco Origen:* ${pago.bancoOrigen || "Por coordinar"}
• *Nro. de Referencia:* ${pago.referencia || "Por confirmar"}
• *Monto en Bs:* ${formatVES(totalUSD)} (${formatUSD(totalUSD)})`;
  } else if (pago.metodo === "binance") {
    bloquePago = `🟡 *MÉTODO DE PAGO: BINANCE (USDT)*
• *ID de Pago / TXID:* ${pago.idTransaccionBinance || pago.referencia || "Por confirmar"}
• *Monto en USDT:* ${totalUSD.toFixed(2)} USDT`;
  } else if (pago.metodo === "transferencia") {
    bloquePago = `🏦 *MÉTODO DE PAGO: TRANSFERENCIA BANCARIA*
• *Banco Origen:* ${pago.bancoOrigen || "Por coordinar"}
• *Nro. de Referencia:* ${pago.referencia || "Por confirmar"}
• *Monto:* ${formatVES(totalUSD)} (${formatUSD(totalUSD)})`;
  } else {
    bloquePago = `💬 *MÉTODO: DIRECTO VÍA WHATSAPP*
• _Deseo acordar el pago y la entrega directamente con ustedes por este chat._`;
  }

  const detalleEnvio =
    envio.empresa && envio.empresa !== "Coordinar con la tienda"
      ? `• *Preferencia de envío:* ${envio.empresa}${envio.agenciaDestino ? ` (${envio.agenciaDestino})` : ""}`
      : "• *Entrega:* La tienda coordinará la entrega conmigo por WhatsApp";

  const mensaje = `🛍️ *NUEVO PEDIDO VALCHECK*
*Pedido:* #${numeroPedido}

👤 *DATOS DEL CLIENTE:*
• *Nombre:* ${envio.nombreCompleto}
• *WhatsApp:* ${envio.telefono}
• *Ciudad:* ${envio.ciudad}${envio.cedula && envio.cedula !== "Por coordinar" ? `\n• *Cédula:* ${envio.cedula}` : ""}
${detalleEnvio}
${envio.notas ? `• *Notas:* ${envio.notas}\n` : ""}
${bloquePago}

🛒 *PRODUCTOS SOLICITADOS:*
${lineasProductos}

💰 *TOTAL A PAGAR:* ${formatUSD(totalUSD)} / ${formatVES(totalUSD)}
---------------------------------
✨ _Hola ValCheck, acabo de generar este pedido en la web. ¿Me pueden confirmar para concretar?_`;

  return encodeURIComponent(mensaje);
}
