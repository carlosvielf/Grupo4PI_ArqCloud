import {
  Component,
  lazy,
  Suspense,
  useEffect,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { FarmProvider } from "./hooks/useFarmData";
import { AppLayout } from "./components/layout/AppLayout";
import { EmptyState, LoadingState } from "./components/ui";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Talhoes = lazy(() => import("./pages/Talhoes"));
const Detail = lazy(() => import("./pages/TalhaoDetail"));
const Imagens = lazy(() => import("./pages/Imagens"));
const Alertas = lazy(() => import("./pages/Alertas"));
const Maquinas = lazy(() => import("./pages/Maquinas"));
const Telemetria = lazy(() => import("./pages/Telemetria"));
const Analises = lazy(() => import("./pages/Analises"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Falha na interface", error, info.componentStack);
  }
  render() {
    return this.state.failed ? (
      <div className="error-state">
        <h1>Não foi possível abrir esta tela</h1>
        <p>Recarregue a aplicação para tentar novamente.</p>
        <button className="button" onClick={() => window.location.reload()}>
          Recarregar
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    const name = pathname.split("/")[1] || "dashboard";
    document.title = `${name.charAt(0).toUpperCase() + name.slice(1)} · Monitora.G4`;
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}
export function App() {
  return (
    <ErrorBoundary>
      <FarmProvider>
        <RouteEffects />
        <Suspense fallback={<LoadingState />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="talhoes" element={<Talhoes />} />
              <Route path="talhoes/:id" element={<Detail />} />
              <Route path="imagens" element={<Imagens />} />
              <Route path="analises" element={<Analises />} />
              <Route path="alertas" element={<Alertas />} />
              <Route path="maquinas" element={<Maquinas />} />
              <Route path="telemetria" element={<Telemetria />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              <Route
                path="*"
                element={
                  <EmptyState
                    title="Página não encontrada"
                    description="O endereço não corresponde a uma página da aplicação."
                    action={
                      <Link to="/" className="button">
                        Voltar ao dashboard
                      </Link>
                    }
                  />
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </FarmProvider>
    </ErrorBoundary>
  );
}
