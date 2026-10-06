"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { PublicData } from "@/lib/types";
import { api } from "@/lib/api";
import { Brand } from "./brand/Brand";
const empty: PublicData = {
  configured: false,
  catalog: [],
  categories: [],
  faqs: [],
  packages: [],
  testimonials: [],
  gallery: [],
  settings: {},
};
const DataContext = createContext({
  data: empty,
  loading: true,
  error: "",
  reload: () => {},
});
const ToastContext = createContext<(message: string, error?: boolean) => void>(
  () => {},
);
export function Providers({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState(empty),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    error?: boolean;
  } | null>(null);
  const reload = useCallback(() => {
    setLoading(true);
    setError("");
    api<PublicData>("/public")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(reload, [reload]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(id);
  }, [toast]);
  return (
    <DataContext.Provider value={{ data, loading, error, reload }}>
      <ToastContext.Provider
        value={(message, error) => setToast({ message, error })}
      >
        {children}
        <div
          className={`tantre-toast ${toast ? "visible" : ""}`}
          role="status"
          aria-live="polite"
        >
          {toast && (
            <>
              <Brand
                name={
                  toast.error ? "state-error-compact" : "state-success-compact"
                }
              />
              <span>{toast.message}</span>
            </>
          )}
        </div>
      </ToastContext.Provider>
    </DataContext.Provider>
  );
}
export const usePublicData = () => useContext(DataContext);
export const useToast = () => useContext(ToastContext);
