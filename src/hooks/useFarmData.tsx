import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { loadFarmData } from "../services/api";
import type { DataResult } from "../types";
interface DataContext extends DataResult {
  loading: boolean;
  error?: string;
  refresh: () => void;
}
const Context = createContext<DataContext | null>(null);
export function FarmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<DataContext, "refresh">>({
    data: {
      talhoes: [],
      imagens: [],
      alertas: [],
      leituras: [],
      telemetria: [],
    },
    issues: [],
    loading: true,
  });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: undefined }));
    // Adia o HTTP para permitir o cancelamento do primeiro efeito do StrictMode.
    Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) return undefined;
        return loadFarmData(controller.signal);
      })
      .then((result) => {
        if (result && !controller.signal.aborted)
          setState({ ...result, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState((s) => ({
            ...s,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Falha ao carregar os dados.",
          }));
      });
    return () => controller.abort();
  }, [version]);
  return (
    <Context.Provider
      value={{ ...state, refresh: () => setVersion((v) => v + 1) }}
    >
      {children}
    </Context.Provider>
  );
}
// Hook e provider compartilham o contexto intencionalmente.
// eslint-disable-next-line react-refresh/only-export-components
export function useFarmData() {
  const context = useContext(Context);
  if (!context) throw new Error("FarmProvider ausente.");
  return context;
}
