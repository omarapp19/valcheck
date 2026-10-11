/**
 * Servicio de Virtual Try-On gratuito usando Hugging Face Spaces (IDM-VTON / ZeroGPU)
 * Conexión serverless 100% gratuita mediante @gradio/client sin necesidad de tarjeta de crédito.
 */

import { Client } from "@gradio/client";

export interface GenerateTryOnParams {
  userImage: string; // URL pública o base64 Data URI
  productImage: string; // URL pública del catálogo
  productName: string;
  category: string;
  apiKey?: string; // Token de lectura gratuito de Hugging Face (opcional)
}

export interface GenerateTryOnResult {
  success: boolean;
  resultImageUrl?: string;
  error?: string;
}

const DEFAULT_HF_TOKEN = "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";
const STORAGE_KEY_HF = "valcheck_hf_api_token";

export function getStoredHfToken(): string {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HF);
      if (stored) return stored;
    } catch {
      /* ignore */
    }
  }
  return (import.meta.env["VITE_HF_TOKEN"] as string) || DEFAULT_HF_TOKEN;
}

export function saveStoredHfToken(token: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_HF, token.trim());
    } catch {
      /* ignore */
    }
  }
}

// Alias de retrocompatibilidad
export const getStoredFalKey = getStoredHfToken;
export const saveStoredFalKey = saveStoredHfToken;

/**
 * Convierte una URL o Data URI (base64) a un Blob en el navegador
 */
async function toBlob(input: string): Promise<Blob> {
  const res = await fetch(input);
  return await res.blob();
}

/**
 * Genera la prueba virtual en Hugging Face usando IDM-VTON (ZeroGPU)
 */
export async function generateVirtualTryOn({
  userImage,
  productImage,
  productName,
  category,
  apiKey,
}: GenerateTryOnParams): Promise<GenerateTryOnResult> {
  try {
    const token = (apiKey || getStoredHfToken()).trim();
    const clientOptions = token ? { hf_token: token as `hf_${string}` } : {};

    // 1. Preparar Blobs de la foto del usuario y la joya
    const [userBlob, garmentBlob] = await Promise.all([
      toBlob(userImage),
      toBlob(productImage),
    ]);

    // 2. Conectar al Space de Hugging Face
    let client: any;
    try {
      client = await Client.connect("yisol/IDM-VTON", clientOptions);
    } catch (err) {
      console.warn("Fallo conectando a yisol/IDM-VTON, intentando alternativa Nymbo/Virtual-Try-On...", err);
      client = await Client.connect("Nymbo/Virtual-Try-On", clientOptions);
    }

    // 3. Ejecutar predicción en el endpoint /tryon
    // Parámetros: [dict, garm_img, garment_des, is_checked, is_checked_crop, denoise_steps, seed]
    const result = await client.predict("/tryon", [
      {
        background: userBlob,
        layers: [],
        composite: null,
      },
      garmentBlob,
      `high quality luxury jewelry, ${productName}, category: ${category}`,
      true, // auto-masking
      false, // is_checked_crop
      30, // denoise_steps
      Math.floor(Math.random() * 100000), // seed aleatorio
    ]);

    // 4. Extraer URL de la imagen generada
    if (!result || !result.data) {
      return {
        success: false,
        error: "El servicio de Hugging Face no devolvió datos.",
      };
    }

    const firstOutput = Array.isArray(result.data) ? result.data[0] : result.data;
    let finalImageUrl: string | undefined;

    if (typeof firstOutput === "string") {
      finalImageUrl = firstOutput;
    } else if (firstOutput && typeof firstOutput === "object") {
      if ("url" in firstOutput && typeof firstOutput.url === "string") {
        finalImageUrl = firstOutput.url;
      } else if ("path" in firstOutput && typeof firstOutput.path === "string") {
        finalImageUrl = firstOutput.path;
      }
    }

    if (finalImageUrl) {
      return {
        success: true,
        resultImageUrl: finalImageUrl,
      };
    }

    return {
      success: false,
      error: "No se pudo extraer la imagen del resultado de Hugging Face.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido al procesar con Hugging Face";
    return {
      success: false,
      error: `Error de Hugging Face: ${msg}`,
    };
  }
}
