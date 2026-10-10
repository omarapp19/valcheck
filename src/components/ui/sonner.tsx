import { Toaster as Sonner } from "sonner";
import { Check, AlertCircle, Info, AlertTriangle, Loader2 } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster valcheck-toaster group"
      position="bottom-left"
      richColors={false}
      closeButton
      duration={3600}
      icons={{
        success: (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-brand-brown shadow-xs border border-brand-brown/15">
            <Check className="size-3.5 stroke-[3]" />
          </span>
        ),
        error: (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#fde8e4] text-[#8c2317] shadow-xs border border-[#f5b8ad]">
            <AlertCircle className="size-3.5 stroke-[2.5]" />
          </span>
        ),
        info: (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-yellow/60 text-brand-brown shadow-xs border border-brand-brown/10">
            <Info className="size-3.5 stroke-[2.5]" />
          </span>
        ),
        warning: (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#fef3c7] text-[#92400e] shadow-xs border border-[#fde68a]">
            <AlertTriangle className="size-3.5 stroke-[2.5]" />
          </span>
        ),
        loading: (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-yellow/40 text-brand-brown">
            <Loader2 className="size-3.5 animate-spin" />
          </span>
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast valcheck-toast group-[.toaster]:bg-[#fffdfa] group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
