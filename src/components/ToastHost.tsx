import { useEffect, useState } from "react";
import { X } from "lucide-react";

type ToastVariant = "error" | "success" | "info";

type ToastItem = {
  id: number;
  variant: ToastVariant;
  title: string;
  message?: string;
};

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onToast(event: Event) {
      const payload = (event as CustomEvent<Partial<ToastItem>>).detail || {};
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const item: ToastItem = {
        id,
        variant: payload.variant || "info",
        title: payload.title || "Notice",
        message: payload.message,
      };

      setItems((current) => [...current.slice(-3), item]);
      window.setTimeout(() => {
        setItems((current) => current.filter((toast) => toast.id !== id));
      }, 6000);
    }

    window.addEventListener("admin-toast", onToast);
    return () => window.removeEventListener("admin-toast", onToast);
  }, []);

  if (!items.length) return null;

  return (
    <div className="fixed right-3 top-3 z-[300] flex w-[calc(100vw-1.5rem)] max-w-sm flex-col gap-2 sm:right-5 sm:top-5">
      {items.map((item) => (
        <div
          key={item.id}
          className={[
            "rounded-lg border bg-[#111111] px-4 py-3 text-white shadow-2xl",
            item.variant === "error" ? "border-red-500/50" : "border-zinc-700",
          ].join(" ")}
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className={item.variant === "error" ? "text-sm font-bold text-red-300" : "text-sm font-bold text-white"}>
                {item.title}
              </div>
              {item.message ? <div className="mt-1 break-words text-xs leading-relaxed text-zinc-300">{item.message}</div> : null}
            </div>
            <button
              type="button"
              aria-label="Close notification"
              onClick={() => setItems((current) => current.filter((toast) => toast.id !== item.id))}
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
