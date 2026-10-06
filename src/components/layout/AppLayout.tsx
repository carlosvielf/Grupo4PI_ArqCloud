import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  Bell,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronLeft,
  Images,
  LayoutDashboard,
  Leaf,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sprout,
  Tractor,
  X,
} from "lucide-react";
import { isDemo } from "../../services/api";
import { useFarmData } from "../../hooks/useFarmData";
const items = [
  { to: "/", title: "Dashboard", icon: LayoutDashboard },
  { to: "/talhoes", title: "Talhões", icon: Sprout },
  { to: "/imagens", title: "Imagens", icon: Images },
  { to: "/analises", title: "Análises", icon: ChartNoAxesCombined },
  { to: "/maquinas", title: "Máquinas", icon: Tractor },
  { to: "/telemetria", title: "Telemetria", icon: Activity },
  { to: "/alertas", title: "Alertas", icon: Bell },
];
function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const { data } = useFarmData();
  const count = data.alertas.filter((a) => a.status === "ativo").length;
  return (
    <>
      <Link className="brand" to="/" onClick={onNavigate}>
        <span className="brand-mark">
          <Leaf size={23} aria-hidden="true" />
        </span>
        <span className="brand-copy">
          campo<span>Monitoramento agrícola</span>
        </span>
      </Link>
      <div className="workspace-label">Sua operação</div>
      <nav aria-label="Navegação principal" className="navigation">
        {items.map(({ to, title, icon: Icon }) => (
          <NavLink
            end={to === "/"}
            key={to}
            to={to}
            onClick={onNavigate}
            title={title}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <Icon size={19} aria-hidden="true" />
            <span className="nav-text">{title}</span>
            {to === "/alertas" && count ? (
              <span className="nav-count">{count}</span>
            ) : null}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <NavLink
          to="/configuracoes"
          onClick={onNavigate}
          className="nav-link"
          title="Configurações"
        >
          <Settings size={19} aria-hidden="true" />
          <span className="nav-text">Configurações</span>
        </NavLink>
        <div className="operation-note">
          <span className="status-dot" />
          <span>
            {isDemo ? "Ambiente de demonstração" : "Monitoramento da operação"}
          </span>
        </div>
      </div>
    </>
  );
}
export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { data, loading } = useFarmData();
  const alerts = data.alertas.filter((a) => a.status === "ativo").length;
  const title =
    items.find((i) => i.to !== "/" && location.pathname.startsWith(i.to))
      ?.title ??
    (location.pathname === "/configuracoes" ? "Configurações" : "Dashboard");
  useEffect(() => {
    const d = dialog.current;
    if (drawer && !d?.open) d?.showModal();
    else if (!drawer && d?.open) d.close();
  }, [drawer]);
  useEffect(() => {
    if (!drawer) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawer]);
  return (
    <div className={`app-layout ${collapsed ? "collapsed" : ""}`}>
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      <aside className="sidebar">
        <Navigation />
        <button
          className="collapse-button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <PanelLeftOpen size={19} />
          ) : (
            <PanelLeftClose size={19} />
          )}
          <span className="nav-text">Recolher menu</span>
        </button>
      </aside>
      <dialog
        ref={dialog}
        className="mobile-drawer"
        aria-label="Menu de navegação"
        onCancel={() => setDrawer(false)}
        onClose={() => setDrawer(false)}
      >
        <button
          className="drawer-close icon-button"
          onClick={() => setDrawer(false)}
          aria-label="Fechar menu"
        >
          <X size={20} />
        </button>
        <Navigation onNavigate={() => setDrawer(false)} />
      </dialog>
      <div className="app-content">
        <header className="topbar">
          <div className="topbar-context">
            <button
              className="icon-button mobile-menu"
              onClick={() => setDrawer(true)}
              aria-label="Abrir menu"
            >
              <Menu size={21} />
            </button>
            <span className="topbar-title">{title}</span>
            <span className="topbar-divider" />
            <span className="topbar-property">
              {isDemo ? "Propriedade demonstrativa" : "Sua propriedade"}
              <ChevronDown size={13} aria-hidden="true" />
            </span>
          </div>
          <div className="topbar-tools">
            <form
              className="topbar-search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/talhoes?q=${encodeURIComponent(search)}`);
              }}
            >
              <Search size={16} aria-hidden="true" />
              <label className="sr-only" htmlFor="global-search">
                Buscar talhão
              </label>
              <input
                id="global-search"
                name="q"
                placeholder="Buscar talhão…"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            <Link
              className="notification icon-button"
              to="/alertas"
              aria-label={`Alertas${loading ? "" : `: ${alerts} ativos`}`}
            >
              <Bell size={19} />
              {alerts ? <span className="notification-dot" /> : null}
            </Link>
            <Link
              to="/configuracoes"
              className="user-avatar"
              aria-label="Configurações da operação"
            >
              OP
            </Link>
          </div>
        </header>
        {isDemo ? (
          <div className="demo-banner">
            <span>
              <span className="demo-tag">Demonstração</span>Dados e imagens
              ilustrativos. Nenhuma fonte real conectada.
            </span>
            <Link to="/configuracoes">
              Configurar integração
              <ArrowUpRight size={14} />
            </Link>
          </div>
        ) : null}
        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Campo · Inteligência para a sua operação</span>
          <span>
            {isDemo
              ? "Visualização demonstrativa"
              : "Dados fornecidos pela API configurada"}
          </span>
        </footer>
      </div>
    </div>
  );
}
export function BackLink() {
  return (
    <Link to="/talhoes" className="text-link">
      <ChevronLeft size={16} />
      Todos os talhões
    </Link>
  );
}
