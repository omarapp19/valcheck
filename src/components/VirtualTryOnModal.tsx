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
  Image as ImageIcon,
  FlipHorizontal,
  Move,
  Sliders,
  Layers,
  Sun,
} from "lucide-react";
import { type Producto, formatUSD, getDepartamentoProducto } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

interface VirtualTryOnModalProps {
  producto: Producto;
  isOpen: boolean;
  onClose: () => void;
}

export function VirtualTryOnModal({ producto, isOpen, onClose }: VirtualTryOnModalProps) {
  // El probador virtual está habilitado exclusivamente para Joyería y Accesorios
  if (getDepartamentoProducto(producto) !== "accesorios") {
    return null;
  }

  const { agregar, abrirCarrito } = useCart();

  // Foto propia del usuario (selfie o archivo subido)
  const [baseImage, setBaseImage] = useState<string>("");

  // Cámara web / selfie
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Recorte transparente de la joya
  const [cutoutUrl, setCutoutUrl] = useState<string>(producto.imagen);

  // Controles de Colocación, Escala, Giro, Espejo e Iluminación
  const photoContainerRef = useRef<HTMLDivElement | null>(null);
  const [itemPos, setItemPos] = useState<{ x: number; y: number }>({ x: 38, y: 36 });
  const [itemScale, setItemScale] = useState<number>(0.9);
  const [itemRotation, setItemRotation] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [hasShadow, setHasShadow] = useState<boolean>(true);
  const [itemBrightness, setItemBrightness] = useState<number>(100);
  const [blendMultiply, setBlendMultiply] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number }>({
    x: 0,
    y: 0,
    posX: 38,
    posY: 36,
  });

  // Preset inteligente de posición según la categoría de la joya
  const resetPosPorCategoria = () => {
    const cat = producto.categoria.toLowerCase();
    if (cat.includes("arete") || cat.includes("earcuff")) {
      setItemPos({ x: 36, y: 34 });
      setItemScale(0.85);
    } else if (cat.includes("collar")) {
      setItemPos({ x: 50, y: 64 });
      setItemScale(1.15);
    } else if (cat.includes("anillo")) {
      setItemPos({ x: 50, y: 50 });
      setItemScale(0.75);
    } else {
      setItemPos({ x: 45, y: 58 });
      setItemScale(0.95);
    }
    setItemRotation(0);
    setIsFlipped(false);
    setItemBrightness(100);
  };

  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case "oreja-izq":
        setItemPos({ x: 33, y: 35 });
        setItemScale(0.85);
        setItemRotation(-4);
        setIsFlipped(false);
        break;
      case "oreja-der":
        setItemPos({ x: 67, y: 35 });
        setItemScale(0.85);
        setItemRotation(4);
        setIsFlipped(true);
        break;
      case "cuello":
        setItemPos({ x: 50, y: 64 });
        setItemScale(1.15);
        setItemRotation(0);
        setIsFlipped(false);
        break;
      case "muneca-izq":
        setItemPos({ x: 35, y: 76 });
        setItemScale(0.95);
        setItemRotation(-15);
        setIsFlipped(false);
        break;
      case "muneca-der":
        setItemPos({ x: 65, y: 76 });
        setItemScale(0.95);
        setItemRotation(15);
        setIsFlipped(true);
        break;
      case "mano":
        setItemPos({ x: 50, y: 55 });
        setItemScale(0.75);
        setItemRotation(0);
        setIsFlipped(false);
        break;
      default:
        resetPosPorCategoria();
        break;
    }
  };

  // Al cambiar de producto, resetear posición y procesar recorte
  useEffect(() => {
    resetPosPorCategoria();

    // Procesar cutout con fondo transparente para la joya del catálogo
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = producto.imagen;
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, c.width, c.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i] ?? 0;
          const g = d[i + 1] ?? 0;
          const b = d[i + 2] ?? 0;
          if (r > 232 && g > 232 && b > 232) {
            d[i + 3] = 0;
          } else if (r > 215 && g > 215 && b > 215) {
            const alpha = 255 - (Math.min(r, g, b) - 215) * 15;
            d[i + 3] = Math.max(0, Math.min(255, alpha));
          }
        }
        ctx.putImageData(imgData, 0, 0);
        setCutoutUrl(c.toDataURL("image/png"));
      } catch {
        setCutoutUrl(producto.imagen);
      }
    };
    img.onerror = () => {
      setCutoutUrl(producto.imagen);
    };
  }, [producto.id, producto.imagen]);

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
          stopCamera();
          toast.success("Foto cargada con éxito");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Arrastre interactivo de la joya
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: itemPos.x,
      posY: itemPos.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !photoContainerRef.current) return;
    const rect = photoContainerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
    setItemPos({
      x: Math.max(5, Math.min(95, dragStartRef.current.posX + deltaX)),
      y: Math.max(5, Math.min(95, dragStartRef.current.posY + deltaY)),
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Descargar foto compuesta del Probador Fiel en HD
  const descargarFotoCompuesta = () => {
    if (!baseImage) return;
    const c = document.createElement("canvas");
    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.src = baseImage;
    bgImg.onload = () => {
      c.width = bgImg.naturalWidth || 800;
      c.height = bgImg.naturalHeight || 1000;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(bgImg, 0, 0, c.width, c.height);

      const itemImg = new Image();
      itemImg.crossOrigin = "anonymous";
      itemImg.src = cutoutUrl || producto.imagen;
      itemImg.onload = () => {
        const itemW = c.width * 0.32 * itemScale;
        const itemH = (itemW * (itemImg.naturalHeight || 1)) / (itemImg.naturalWidth || 1);
        const itemCenterX = (itemPos.x / 100) * c.width;
        const itemCenterY = (itemPos.y / 100) * c.height;

        ctx.save();
        ctx.translate(itemCenterX, itemCenterY);
        ctx.rotate((itemRotation * Math.PI) / 180);
        if (isFlipped) ctx.scale(-1, 1);

        if (hasShadow) {
          ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
          ctx.shadowBlur = 14;
          ctx.shadowOffsetX = 4;
          ctx.shadowOffsetY = 6;
        }

        if (itemBrightness !== 100) {
          ctx.filter = `brightness(${itemBrightness}%)`;
        }

        if (blendMultiply && cutoutUrl === producto.imagen) {
          ctx.globalCompositeOperation = "multiply";
        }

        ctx.drawImage(itemImg, -itemW / 2, -itemH / 2, itemW, itemH);
        ctx.restore();

        const dataUrl = c.toDataURL("image/jpeg", 0.95);
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `valcheck-probador-${producto.nombre.toLowerCase().replace(/\s+/g, "-")}.jpg`;
        a.click();
        toast.success("Foto guardada con éxito en tu dispositivo");
      };
    };
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
                Probador Virtual de Joyería y Accesorios
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Comprueba exactamente cómo luce <strong className="text-foreground">{producto.nombre}</strong> ({formatUSD(producto.precioUSD)}) sobre ti.
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
                <video ref={videoRef} playsInline autoPlay muted className="size-full object-cover -scale-x-100" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 z-10">
                  <button
                    type="button"
                    onClick={takePhoto}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Camera className="size-4" /> Capturar Foto
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="rounded-full bg-black/60 backdrop-blur-md px-4 py-3 text-xs font-semibold text-white hover:bg-black/80 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : baseImage ? (
              /* PROBADOR DE ALTA FIDELIDAD: Foto con la joya real interactiva */
              <div
                ref={photoContainerRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="relative w-full max-w-[420px] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-white/10 select-none bg-black/40 touch-none"
              >
                <img src={baseImage} alt="Tu foto" className="size-full object-cover pointer-events-none" />

                {/* Elemento de la Joya interactivo */}
                <div
                  onPointerDown={handlePointerDown}
                  style={{
                    position: "absolute",
                    left: `${itemPos.x}%`,
                    top: `${itemPos.y}%`,
                    transform: `translate(-50%, -50%) rotate(${itemRotation}deg) scale(${itemScale}) ${
                      isFlipped ? "scaleX(-1)" : ""
                    }`,
                    cursor: isDragging ? "grabbing" : "grab",
                    filter: `${hasShadow ? "drop-shadow(3px 6px 8px rgba(0,0,0,0.45))" : ""} brightness(${itemBrightness}%)`,
                    mixBlendMode: blendMultiply && cutoutUrl === producto.imagen ? "multiply" : "normal",
                  }}
                  className="touch-none select-none z-10 transition-[filter] group/item"
                  title="Arrastra para mover la joya sobre tu foto"
                >
                  <img
                    src={cutoutUrl || producto.imagen}
                    alt={producto.nombre}
                    className="w-28 sm:w-32 h-auto max-h-36 object-contain pointer-events-none"
                    draggable={false}
                  />

                  {/* Indicador táctil sutil al pasar o tocar */}
                  <div className="absolute -inset-1.5 rounded-xl border border-dashed border-white/50 opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none flex items-start justify-end p-0.5">
                    <Move className="size-3 text-white bg-black/60 rounded" />
                  </div>
                </div>

                {/* Sugerencia flotante de uso */}
                <div className="absolute top-3 left-3 bg-black/65 backdrop-blur-md text-white/90 text-[10px] font-medium px-2.5 py-1 rounded-full pointer-events-none flex items-center gap-1.5 shadow-md">
                  <Move className="size-3 text-brand-yellow" />
                  <span>Arrastra la joya con el dedo o mouse</span>
                </div>

                {/* Miniatura informativa de la pieza original */}
                <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur-md p-2 rounded-xl border border-border shadow-2xl flex items-center gap-2 max-w-[190px] pointer-events-none">
                  <img src={producto.imagen} alt={producto.nombre} className="size-9 object-cover rounded-lg" />
                  <div className="text-[10px] leading-tight truncate">
                    <p className="font-bold truncate text-foreground">{producto.nombre}</p>
                    <p className="text-muted-foreground">{producto.categoria}</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Estado inicial: pedir foto o selfie */
              <div className="relative w-full max-w-[420px] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center p-6 text-center text-white bg-black/40">
                <div className="size-16 rounded-full bg-white/10 flex items-center justify-center mb-4 text-brand-yellow shadow-inner">
                  <Camera className="size-8" />
                </div>
                <h4 className="font-display text-lg font-bold">Toma una selfie o sube tu foto</h4>
                <p className="mt-2 text-xs text-white/70 max-w-xs leading-relaxed">
                  Para probarte <strong className="text-white">{producto.nombre}</strong> con proporciones exactas y ver cómo luce en tu piel.
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
          {/* COLUMNA 2: CONTROLES DEL PROBADOR */}
          {/* ============================================================ */}
          <div className="md:col-span-5 p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-card">
            <div className="space-y-4">
              {/* Sección: Tu foto */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
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
                  <div className="mt-2.5 flex items-center justify-between rounded-xl bg-muted/50 p-2 border border-border text-xs">
                    <span className="flex items-center gap-1.5 text-foreground font-semibold">
                      <ImageIcon className="size-3.5 text-primary" />
                      <span>Foto lista para probar</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setBaseImage("")}
                      className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                    >
                      Cambiar foto
                    </button>
                  </div>
                )}
              </div>

              {/* CONTROLES DEL ESTUDIO FIEL */}
              <div className="rounded-2xl border border-border bg-muted/30 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Sliders className="size-4 text-primary" /> Calibrar Joya en tu Foto
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wide">
                    100% Real
                  </span>
                </div>

                {/* Atajos de posición rápida por categoría */}
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground block">Posición rápida:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(producto.categoria.toLowerCase().includes("arete") || producto.categoria.toLowerCase().includes("earcuff")) && (
                      <>
                        <button
                          type="button"
                          onClick={() => applyPreset("oreja-izq")}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-card border border-border hover:bg-muted text-foreground transition-all cursor-pointer"
                        >
                          Oreja Izq.
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset("oreja-der")}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-card border border-border hover:bg-muted text-foreground transition-all cursor-pointer"
                        >
                          Oreja Der.
                        </button>
                      </>
                    )}

                    {producto.categoria.toLowerCase().includes("collar") && (
                      <button
                        type="button"
                        onClick={() => applyPreset("cuello")}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-card border border-border hover:bg-muted text-foreground transition-all cursor-pointer"
                      >
                        Cuello / Escote
                      </button>
                    )}

                    {producto.categoria.toLowerCase().includes("pulsera") && (
                      <>
                        <button
                          type="button"
                          onClick={() => applyPreset("muneca-izq")}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-card border border-border hover:bg-muted text-foreground transition-all cursor-pointer"
                        >
                          Muñeca Izq.
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset("muneca-der")}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-card border border-border hover:bg-muted text-foreground transition-all cursor-pointer"
                        >
                          Muñeca Der.
                        </button>
                      </>
                    )}

                    {producto.categoria.toLowerCase().includes("anillo") && (
                      <button
                        type="button"
                        onClick={() => applyPreset("mano")}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-card border border-border hover:bg-muted text-foreground transition-all cursor-pointer"
                      >
                        Mano / Dedo
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={resetPosPorCategoria}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    >
                      Centrar
                    </button>
                  </div>
                </div>

                {/* Slider de Tamaño / Escala */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Tamaño</span>
                    <span className="font-mono text-foreground font-semibold">{Math.round(itemScale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="180"
                    value={itemScale * 100}
                    onChange={(e) => setItemScale(Number(e.target.value) / 100)}
                    className="w-full accent-primary h-1.5 bg-border rounded-lg cursor-pointer"
                  />
                </div>

                {/* Slider de Inclinación / Rotación */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Inclinación / Ángulo</span>
                    <span className="font-mono text-foreground font-semibold">{itemRotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    value={itemRotation}
                    onChange={(e) => setItemRotation(Number(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-border rounded-lg cursor-pointer"
                  />
                </div>

                {/* Slider de Iluminación / Brillo */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Sun className="size-3 text-primary" /> Brillo e iluminación</span>
                    <span className="font-mono text-foreground font-semibold">{itemBrightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="135"
                    value={itemBrightness}
                    onChange={(e) => setItemBrightness(Number(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-border rounded-lg cursor-pointer"
                  />
                </div>

                {/* Botones de acción rápida: Voltear, Sombra y Fusión de Fondo */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsFlipped(!isFlipped)}
                    className={`flex-1 min-w-[110px] py-1.5 px-2.5 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isFlipped
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:bg-muted text-foreground"
                    }`}
                  >
                    <FlipHorizontal className="size-3.5" />
                    <span>Voltear lado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHasShadow(!hasShadow)}
                    className={`flex-1 min-w-[100px] py-1.5 px-2.5 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      hasShadow
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:bg-muted text-foreground"
                    }`}
                    title="Profundidad 3D con sombras suaves"
                  >
                    <Layers className="size-3.5" />
                    <span>Sombra {hasShadow ? "ON" : "OFF"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBlendMultiply(!blendMultiply)}
                    className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      blendMultiply
                        ? "bg-card border-primary text-primary font-bold"
                        : "bg-card border-border hover:bg-muted text-muted-foreground"
                    }`}
                    title="Disuelve fondos blancos sobre tu piel"
                  >
                    <span>Fusión fondo {blendMultiply ? "activa" : "off"}</span>
                  </button>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed pt-1 border-t border-border/50">
                  ✓ Preserva tu ropa, piel y rostro 100% intactos. Muestra la joya auténtica de ValCheck sin alterar piezas.
                </p>
              </div>
            </div>

            {/* Acciones Finales (Descargar & Comprar) */}
            <div className="space-y-2 pt-2 border-t border-border">
              {baseImage && (
                <button
                  type="button"
                  onClick={descargarFotoCompuesta}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary bg-card px-4 py-2.5 text-xs sm:text-sm font-bold text-foreground transition-all hover:bg-brand-yellow/30 active:scale-95 cursor-pointer shadow-xs"
                >
                  <Download className="size-4 text-brand-brown" /> Guardar mi foto con la joya
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
