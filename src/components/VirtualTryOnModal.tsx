import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Camera,
  Upload,
  Download,
  ShoppingBag,
  RefreshCw,
  Wand2,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { type Producto, formatUSD, getDepartamentoProducto } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { generateVirtualTryOn } from "@/lib/try-on-ai";
import { toast } from "sonner";

interface VirtualTryOnModalProps {
  producto: Producto;
  isOpen: boolean;
  onClose: () => void;
}

export function VirtualTryOnModal({ producto, isOpen, onClose }: VirtualTryOnModalProps) {
  // El probador virtual con IA está habilitado exclusivamente para Joyería y Accesorios
  if (getDepartamentoProducto(producto) !== "accesorios") {
    return null;
  }

  const { agregar, abrirCarrito } = useCart();

  // Foto propia del usuario (selfie o archivo)
  const [baseImage, setBaseImage] = useState<string>("");

  // Cámara web / selfie
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Estados de IA Generativa (Hugging Face IDM-VTON)
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiGenStep, setAiGenStep] = useState<string>("");
  const [aiResultUrl, setAiResultUrl] = useState<string | null>(null);
  const [compareSliderPos, setCompareSliderPos] = useState<number>(50); // 0 a 100%

  // Limpiar resultado si cambia el producto
  useEffect(() => {
    setAiResultUrl(null);
  }, [producto.id]);

  // Manejo de Cámara
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch {
      toast.error("No se pudo acceder a la cámara", {
        description: "Revisa los permisos de tu navegador o sube una foto.",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = v.videoWidth || 640;
    tempCanvas.height = v.videoHeight || 480;
    const ctx = tempCanvas.getContext("2d");
    if (ctx) {
      ctx.translate(tempCanvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(v, 0, 0, tempCanvas.width, tempCanvas.height);
      const data = tempCanvas.toDataURL("image/jpeg", 0.95);
      setBaseImage(data);
      setAiResultUrl(null);
      toast.success("¡Selfie capturada con éxito!");
    }
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setBaseImage(ev.target.result as string);
          setAiResultUrl(null);
          stopCamera();
          toast.success("Foto cargada con éxito");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // ============================================================
  // EJECUCIÓN DE IA GENERATIVA (Hugging Face IDM-VTON)
  // ============================================================
  const ejecutarIAGenerativa = async () => {
    if (!baseImage) {
      toast.error("Por favor toma una selfie o sube tu foto primero");
      return;
    }

    setIsGeneratingAi(true);
    setAiResultUrl(null);
    setAiGenStep("1/3 Conectando con IA de prueba virtual...");

    const timer1 = setTimeout(() => {
      setAiGenStep("2/3 Analizando anatomía, pose e iluminación...");
    }, 4000);

    const timer2 = setTimeout(() => {
      setAiGenStep("3/3 Fusionando joya con sombras y textura hiperrealista...");
    }, 10000);

    try {
      const res = await generateVirtualTryOn({
        userImage: baseImage,
        productImage: producto.imagen,
        productName: producto.nombre,
        category: producto.categoria,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (res.success && res.resultImageUrl) {
        setAiResultUrl(res.resultImageUrl);
        toast.success("¡Look fotorrealista generado con Hugging Face!");
      } else {
        toast.error("Aviso de Hugging Face", {
          description: res.error || "No se pudo completar la generación.",
        });
      }
    } catch (err: unknown) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      const msg = err instanceof Error ? err.message : "Error inesperado";
      toast.error("Error al procesar con IA", { description: msg });
    } finally {
      setIsGeneratingAi(false);
      setAiGenStep("");
    }
  };

  const descargarFoto = (imageUrl: string) => {
    const link = document.createElement("a");
    link.download = `valcheck-ia-${producto.nombre.toLowerCase().replace(/\s+/g, "-")}.jpg`;
    link.href = imageUrl;
    link.target = "_blank";
    link.click();
    toast.success("Foto descargada");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          stopCamera();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-5xl p-0 overflow-hidden sm:rounded-3xl border-2 border-primary/20 bg-card max-h-[94vh] flex flex-col">
        {/* Encabezado */}
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border bg-card/90 flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-brand-yellow/60 text-brand-brown">
                <Camera className="size-4" />
              </span>
              <DialogTitle className="text-base sm:text-xl font-display font-bold">
                Probador Virtual con IA Generativa
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Genera tu foto hiperrealista usando <strong className="text-foreground">{producto.nombre}</strong> ({formatUSD(producto.precioUSD)})
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Cuerpo Principal */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto">
          {/* ============================================================ */}
          {/* COLUMNA 1: ÁREA VISUAL PRINCIPAL */}
          {/* ============================================================ */}
          <div className="md:col-span-7 bg-[#1c1917]/95 p-3 sm:p-5 flex flex-col items-center justify-center relative min-h-[380px] sm:min-h-[480px]">
            {isCameraActive ? (
              /* Cámara en vivo */
              <div className="relative w-full max-w-[420px] aspect-[4/5] rounded-2xl overflow-hidden bg-black shadow-2xl flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="size-full object-cover scale-x-[-1]" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={takePhoto}
                    className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Camera className="size-4" /> Capturar Selfie
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white hover:bg-black/80 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : aiResultUrl ? (
              /* Comparador Antes / Después con divisor deslizable */
              <div className="relative w-full max-w-[420px] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl select-none group">
                {/* Foto Después (Con la joya fotorrealista generada por IA) */}
                <img src={aiResultUrl} alt="Look con IA" className="absolute inset-0 size-full object-cover" />

                {/* Foto Antes (Original) recortada por el slider */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${compareSliderPos}%` }}
                >
                  <img
                    src={baseImage}
                    alt="Foto original"
                    className="absolute inset-0 size-full object-cover max-w-none"
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>

                {/* Línea divisoria interactiva */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)] cursor-ew-resize flex items-center justify-center"
                  style={{ left: `${compareSliderPos}%` }}
                >
                  <div className="size-6 rounded-full bg-white text-brand-brown shadow-lg flex items-center justify-center text-[10px] font-bold">
                    ↔
                  </div>
                </div>

                {/* Slider interactivo para deslizar touch/mouse */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={compareSliderPos}
                  onChange={(e) => setCompareSliderPos(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize size-full z-20"
                  aria-label="Deslizar para comparar Antes y Después"
                />

                {/* Etiquetas Antes / Después */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full pointer-events-none">
                  Antes
                </div>
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full pointer-events-none flex items-center gap-1 shadow-md">
                  Después (IA)
                </div>
              </div>
            ) : baseImage ? (
              /* Previsualización de la foto seleccionada con miniatura del accesorio */
              <div className="relative w-full max-w-[420px] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center bg-black/40">
                <img src={baseImage} alt="Tu foto" className="size-full object-cover opacity-90" />

                {/* Miniatura de la joya de catálogo que la IA integrará */}
                <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur-md p-2 rounded-2xl border border-border shadow-2xl flex items-center gap-2 max-w-[190px]">
                  <img src={producto.imagen} alt={producto.nombre} className="size-10 object-cover rounded-xl" />
                  <div className="text-[10px] leading-tight truncate">
                    <p className="font-bold truncate text-foreground">{producto.nombre}</p>
                    <p className="text-muted-foreground">Pieza a integrar con IA</p>
                  </div>
                </div>

                {/* Pantalla de carga animada durante inferencia */}
                {isGeneratingAi && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white z-30">
                    <div className="relative size-16 mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-brand-yellow/30 animate-ping" />
                      <div className="size-16 rounded-full border-4 border-t-brand-yellow border-r-transparent border-b-transparent border-l-transparent animate-spin flex items-center justify-center">
                        <Wand2 className="size-6 text-brand-yellow animate-pulse" />
                      </div>
                    </div>
                    <h4 className="font-display text-lg font-bold text-brand-yellow">Generando tu Look</h4>
                    <p className="mt-1 text-xs text-white/80 max-w-xs">{aiGenStep || "La IA está trabajando..."}</p>
                    <p className="mt-4 text-[11px] text-white/50">Procesando con modelo fotorrealista de fal.ai</p>
                  </div>
                )}
              </div>
            ) : (
              /* Estado inicial cuando el usuario aún no ha subido ni tomado foto */
              <div className="relative w-full max-w-[420px] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center p-6 text-center text-white bg-black/40">
                <div className="size-16 rounded-full bg-white/10 flex items-center justify-center mb-4 text-brand-yellow shadow-inner">
                  <Camera className="size-8" />
                </div>
                <h4 className="font-display text-lg font-bold">Toma una selfie o sube tu foto</h4>
                <p className="mt-2 text-xs text-white/70 max-w-xs leading-relaxed">
                  Para que la IA generativa integre <strong className="text-white">{producto.nombre}</strong> con iluminación natural y sombras directamente sobre tu piel.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:scale-105 transition-transform cursor-pointer"
                  >
                    <Camera className="size-4" /> Tomar Selfie
                  </button>
                  <label className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all cursor-pointer">
                    <Upload className="size-4" /> Subir Foto
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* COLUMNA 2: CONTROLES DE IA GENERATIVA */}
          {/* ============================================================ */}
          <div className="md:col-span-5 p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-card">
            <div className="space-y-4">
              {/* Sección 1: Elegir foto propia */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  1. Tu foto
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-all cursor-pointer"
                  >
                    <Camera className="size-3.5" /> Mi Selfie
                  </button>

                  <label className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-all cursor-pointer">
                    <Upload className="size-3.5" /> Subir foto
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {baseImage && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/50 p-2.5 border border-border text-xs">
                    <span className="flex items-center gap-2 text-foreground font-semibold">
                      <ImageIcon className="size-4 text-primary" />
                      <span>Foto lista para IA</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setBaseImage("")}
                      className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                    >
                      Cambiar
                    </button>
                  </div>
                )}
              </div>

              {/* Sección 2: Panel de Generación con IA */}
              <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Wand2 className="size-4 text-brand-brown" />
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">Generación Fotorrealista con IA</h4>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  La IA generará la fotografía luciendo <strong>{producto.nombre}</strong> con sombras, reflejos e iluminación natural directamente sobre la piel.
                </p>

                {/* Botón Principal Generar con IA */}
                <button
                  type="button"
                  disabled={isGeneratingAi}
                  onClick={ejecutarIAGenerativa}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-md transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingAi ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      <span>Generando con IA...</span>
                    </>
                  ) : aiResultUrl ? (
                    <>
                      <RefreshCw className="size-4" />
                      <span>Regenerar otra versión con IA</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="size-4" />
                      <span>Generar mi Look con IA</span>
                    </>
                  )}
                </button>

                {/* Confirmación cuando hay resultado */}
                {aiResultUrl && (
                  <div className="rounded-xl bg-card p-2.5 border border-border flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <CheckCircle2 className="size-3.5" /> Fotorrealismo completado
                    </span>
                    <span className="text-[11px] text-muted-foreground">Desliza el centro para comparar</span>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones Finales (Descargar & Comprar) */}
            <div className="space-y-2 pt-2 border-t border-border">
              {aiResultUrl && (
                <button
                  type="button"
                  onClick={() => descargarFoto(aiResultUrl)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary bg-card px-4 py-2.5 text-xs sm:text-sm font-bold text-foreground transition-all hover:bg-brand-yellow/30 active:scale-95 cursor-pointer shadow-xs"
                >
                  <Download className="size-4 text-brand-brown" /> Guardar foto generada en HD
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  agregar(producto.id);
                  toast.success(`${producto.nombre}`, {
                    description: "Agregado a tu bolsa de compras",
                    action: {
                      label: "Ver bolsa",
                      onClick: () => abrirCarrito(),
                    },
                  });
                  onClose();
                  abrirCarrito();
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-md"
              >
                <ShoppingBag className="size-4" /> Comprar este accesorio ({formatUSD(producto.precioUSD)})
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
