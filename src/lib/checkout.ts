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
  cedula: string;
  telefono: string;
  estado: string;
  ciudad: string;
  empresa: EmpresaEnvio;
  agenciaDestino: string;
  notas?: string | undefined;
}

export interface DatosPago {
  metodo: MetodoPago;
  bancoOrigen?: string | undefined;
  referencia?: string | undefined;
  telefonoOrigen?: string | undefined;
  comprobanteNombre?: string | undefined;
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
      return "Directo vía WhatsApp (Acordar pago)";
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
• *Banco Origen:* ${pago.bancoOrigen || "N/A"}
• *Nro. de Referencia:* ${pago.referencia || "Pendiente"}
${pago.telefonoOrigen ? `• *Teléfono emisor:* ${pago.telefonoOrigen}\n` : ""}• *Monto Pagado:* ${formatVES(totalUSD)} (${formatUSD(totalUSD)})
• *Comprobante:* ${pago.comprobanteNombre ? `Adjunto en este chat (${pago.comprobanteNombre})` : "Adjunto en este chat"}`;
  } else if (pago.metodo === "binance") {
    bloquePago = `🟡 *MÉTODO DE PAGO: BINANCE (USDT)*
• *ID de Pago / TXID:* ${pago.idTransaccionBinance || pago.referencia || "Pendiente"}
• *Monto en USDT:* ${totalUSD.toFixed(2)} USDT
• *Comprobante:* ${pago.comprobanteNombre ? `Adjunto en este chat (${pago.comprobanteNombre})` : "Adjunto en este chat"}`;
  } else if (pago.metodo === "transferencia") {
    bloquePago = `🏦 *MÉTODO DE PAGO: TRANSFERENCIA BANCARIA*
• *Banco Origen:* ${pago.bancoOrigen || "N/A"}
• *Nro. de Referencia:* ${pago.referencia || "Pendiente"}
• *Monto Transferido:* ${formatVES(totalUSD)} (${formatUSD(totalUSD)})
• *Comprobante:* ${pago.comprobanteNombre ? `Adjunto en este chat (${pago.comprobanteNombre})` : "Adjunto en este chat"}`;
  } else {
    bloquePago = `💬 *MÉTODO DE PAGO: DIRECTO VÍA WHATSAPP*
• _Deseo acordar/coordinar el pago directamente con ustedes por este chat._
• *Monto a coordinar:* ${formatUSD(totalUSD)} / ${formatVES(totalUSD)}`;
  }

  const mensaje = `🛍️ *NUEVO PEDIDO VALCHECK* 🛍️
*Pedido:* #${numeroPedido}

👤 *DATOS DEL CLIENTE:*
• *Nombre:* ${envio.nombreCompleto}
• *Cédula:* ${envio.cedula}
• *Teléfono:* ${envio.telefono}

${
  envio.empresa === "Coordinar con la tienda"
    ? `🤝 *ENTREGA / DESPACHO: COORDINAR CON LA TIENDA*
• *Modalidad:* Retiro en tienda o entrega acordada
• *Ubicación:* ${envio.ciudad}, ${envio.estado}
• *Punto / Detalles:* ${envio.agenciaDestino || "Coordinar directamente por este chat"}
${envio.notas ? `• *Notas adicionales:* ${envio.notas}\n` : ""}`
    : `📦 *ENVÍO NACIONAL (${envio.empresa}):*
• *Empresa:* ${envio.empresa} (Cobro en Destino)
• *Ubicación:* ${envio.ciudad}, ${envio.estado}
• *Agencia de Destino:* ${envio.agenciaDestino}
${envio.notas ? `• *Notas adicionales:* ${envio.notas}\n` : ""}`
}
${bloquePago}

🛒 *DETALLE DE PIEZAS:*
${lineasProductos}

💰 *TOTAL:* ${formatUSD(totalUSD)} / ${formatVES(totalUSD)} (Tasa BCV: ${TASA_BCV})
---------------------------------
⏳ *Gestión:* ${
  envio.empresa === "Coordinar con la tienda"
    ? "En el transcurso de 24 a 48 horas se verifica el pago y coordinamos la entrega contigo."
    : `En el transcurso de 24 a 48 horas se verifica el pago y se gestiona el envío por ${envio.empresa}.`
}
✨ _¡Gracias por elegir ValCheck!_`;

  return encodeURIComponent(mensaje);
}
