import pulseraDorada from "@/assets/pulsera-dorada.jpg";
import pulseraCuentas from "@/assets/pulsera-cuentas.jpg";
import collarCorazon from "@/assets/collar-corazon.jpg";
import collarCapas from "@/assets/collar-capas.jpg";
import aretesAro from "@/assets/aretes-aro.jpg";
import aretesCristal from "@/assets/aretes-cristal.jpg";
import anillosSet from "@/assets/anillos-set.jpg";

export type Categoria = "Pulseras" | "Collares" | "Aretes" | "Anillos";

export interface Producto {
  id: string;
  nombre: string;
  categoria: Categoria;
  descripcion: string;
  precioUSD: number;
  precio?: number | undefined;
  precioAnterior?: number | undefined;
  stock?: number | undefined;
  calificacion?: number | undefined;
  totalResenas?: number | undefined;
  imagen: string;
  imagenes?: string[] | undefined;
  destacado?: boolean | undefined;
}

/** Tasa Oficial BCV activa y sincronizada en tiempo real */
let _tasaActual = 874.73;
export let TASA_BCV = 874.73;

export const setTasaBCVActual = (nueva: number) => {
  if (nueva > 0) {
    _tasaActual = nueva;
    TASA_BCV = nueva;
  }
};

export const getTasaBCVActual = () => _tasaActual;

export const formatUSD = (n: number) =>
  new Intl.NumberFormat("es-VE", { style: "currency", currency: "USD" }).format(n);

export const formatVES = (n: number, tasaPersonalizada?: number) => {
  const tasaUsar = tasaPersonalizada && tasaPersonalizada > 0 ? tasaPersonalizada : _tasaActual;
  return `Bs. ${new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n * tasaUsar)}`;
};

export const productos: Producto[] = [
  {
    id: "pulsera-perlas",
    nombre: "Pulsera Perlas Doradas",
    categoria: "Pulseras",
    descripcion:
      "Pulsera de bolitas bañadas en oro con perlas naturales y broche ajustable. Un clásico que eleva cualquier look.",
    precioUSD: 18,
    imagen: pulseraDorada,
    destacado: true,
  },
  {
    id: "pulsera-estrella",
    nombre: "Pulsera Estrella de Colores",
    categoria: "Pulseras",
    descripcion:
      "Cuentas de piedra natural en tonos vibrantes con dije de estrella bañado en oro. Alegre y llena de personalidad.",
    precioUSD: 15,
    imagen: pulseraCuentas,
  },
  {
    id: "collar-corazon",
    nombre: "Collar Corazón",
    categoria: "Collares",
    descripcion:
      "Cadena fina bañada en oro con dije de corazón pulido. Delicado, romántico y perfecto para el día a día.",
    precioUSD: 22,
    imagen: collarCorazon,
    destacado: true,
  },
  {
    id: "collar-capas",
    nombre: "Collar Doble Capa Moneda",
    categoria: "Collares",
    descripcion:
      "Set de dos cadenas con dije de moneda vintage. El layering perfecto en una sola pieza.",
    precioUSD: 28,
    imagen: collarCapas,
    destacado: true,
  },
  {
    id: "aretes-aro",
    nombre: "Aretes Aro Clásico",
    categoria: "Aretes",
    descripcion:
      "Aros medianos bañados en oro, ligeros y cómodos. El básico que nunca falla.",
    precioUSD: 16,
    imagen: aretesAro,
  },
  {
    id: "aretes-luna",
    nombre: "Aretes Luna de Cristal",
    categoria: "Aretes",
    descripcion:
      "Topos redondos con media luna de cristales incrustados. Brillo sutil para ocasiones especiales.",
    precioUSD: 20,
    imagen: aretesCristal,
    destacado: true,
  },
  {
    id: "anillos-trio",
    nombre: "Trío de Anillos Apilables",
    categoria: "Anillos",
    descripcion:
      "Set de tres anillos bañados en oro con circonias. Úsalos juntos o por separado.",
    precioUSD: 24,
    imagen: anillosSet,
  },
];

export const categorias: Categoria[] = ["Pulseras", "Collares", "Aretes", "Anillos"];
