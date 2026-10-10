import { setTasaBCVActual } from "./products";

export interface BcvRateInfo {
  tasa: number;
  fecha: string;
  fuente: string;
  ultimaConsulta: string;
}

const STORAGE_BCV_KEY = "valcheck_bcv_cache";
export const TASA_BCV_FALLBACK = 874.73;

// Cargar tasa en caché inicial si existe (función pura sin efectos secundarios en render)
export function getCachedBcvRate(): BcvRateInfo {
  if (typeof window === "undefined") {
    return {
      tasa: TASA_BCV_FALLBACK,
      fecha: "Tasa Oficial",
      fuente: "Banco Central de Venezuela (BCV)",
      ultimaConsulta: "",
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_BCV_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.tasa === "number" && parsed.tasa > 0) {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }

  return {
    tasa: TASA_BCV_FALLBACK,
    fecha: "Tasa Oficial",
    fuente: "Banco Central de Venezuela (BCV)",
    ultimaConsulta: "",
  };
}

/**
 * Consulta la tasa oficial del BCV en tiempo real.
 * Intenta primero la API de DolarApi (BCV oficial), y si falla, Open ER API como respaldo.
 */
export async function consultarTasaBCVOficial(): Promise<BcvRateInfo> {
  const ahora = new Date().toISOString();

  // Intento 1: DolarApi Oficial BCV
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const promedio = Number(data?.promedio);
      if (!isNaN(promedio) && promedio > 0) {
        const info: BcvRateInfo = {
          tasa: Number(promedio.toFixed(4)),
          fecha: data?.fechaActualizacion
            ? new Date(data.fechaActualizacion).toLocaleDateString("es-VE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : new Date().toLocaleDateString("es-VE"),
          fuente: "Banco Central de Venezuela (BCV Oficial)",
          ultimaConsulta: ahora,
        };

        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_BCV_KEY, JSON.stringify(info));
        }
        setTasaBCVActual(info.tasa);
        return info;
      }
    }
  } catch (err) {
    console.warn("[BCV] Falló consulta primaria DolarApi, intentando respaldo:", err);
  }

  // Intento 2: Respaldo Open Exchange Rates API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const ves = Number(data?.rates?.VES);
      if (!isNaN(ves) && ves > 0) {
        const info: BcvRateInfo = {
          tasa: Number(ves.toFixed(4)),
          fecha: new Date().toLocaleDateString("es-VE", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          fuente: "Tasa Oficial BCV (Respaldo Open ER)",
          ultimaConsulta: ahora,
        };

        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_BCV_KEY, JSON.stringify(info));
        }
        setTasaBCVActual(info.tasa);
        return info;
      }
    }
  } catch (err) {
    console.warn("[BCV] Falló consulta secundaria:", err);
  }

  // Si fallan las redes, usar caché guardado
  return getCachedBcvRate();
}
