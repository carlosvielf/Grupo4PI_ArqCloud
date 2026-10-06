import {
  AlertTriangle,
  ArrowUpRight,
  Inbox,
  RefreshCw,
  Search,
} from "lucide-react";
import { cloneElement, useId, type ReactElement, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useFarmData } from "../../hooks/useFarmData";
import { labels } from "../../lib/format";
import type { FarmData, Severity } from "../../types";
export function StatusBadge({
  status,
  label,
}: {
  status: Severity;
  label?: string;
}) {
  return (
    <span className={`badge ${status}`}>
      <span className="status-dot" />
      {label ?? labels[status]}
    </span>
  );
}
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="header-actions">{actions}</div> : null}
    </header>
  );
}
export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
export function EmptyState({
  title = "Nenhum registro encontrado",
  description = "Ajuste os filtros ou aguarde novos dados.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Inbox size={27} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function LoadingState() {
  return (
    <div role="status" aria-label="Carregando dados" className="loading-state">
      <span className="sr-only">Carregando dados…</span>
      <div className="skeleton heading" />
      <div className="kpi-grid">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton metric" />
        ))}
      </div>
      <div className="skeleton chart-skeleton" />
    </div>
  );
}
export function DataBoundary({
  resources,
  children,
}: {
  resources: (keyof FarmData)[];
  children: ReactNode;
}) {
  const { loading, error, issues, refresh } = useFarmData();
  if (loading) return <LoadingState />;
  if (error)
    return (
      <div className="error-state" role="alert">
        <AlertTriangle aria-hidden="true" />
        <h2>Não foi possível carregar a operação</h2>
        <p>{error}</p>
        <button className="button" onClick={refresh}>
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      </div>
    );
  const related = issues.filter((i) => resources.includes(i.resource));
  return (
    <>
      {related.length ? (
        <div className="resource-error" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <div>
            <strong>Algumas informações estão indisponíveis</strong>
            {related.map((i) => (
              <p key={i.resource}>
                {
                  {
                    talhoes: "Talhões",
                    imagens: "Imagens",
                    alertas: "Alertas",
                    leituras: "Leituras NDVI",
                    telemetria: "Telemetria",
                  }[i.resource]
                }
                : {i.message}
              </p>
            ))}
          </div>
          <button className="button small" onClick={refresh}>
            Tentar novamente
          </button>
        </div>
      ) : null}
      {children}
    </>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactElement<{ id?: string }>;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, { id })}
    </div>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar talhão…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="search-input">
      <Search size={17} aria-hidden="true" />
      <label className="sr-only" htmlFor={id}>
        {placeholder}
      </label>
      <input
        id={id}
        type="search"
        name="busca"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
export function MetricCard({
  title,
  value,
  description,
  icon,
  trend,
}: {
  title: string;
  value: ReactNode;
  description: string;
  icon: ReactNode;
  trend?: string;
}) {
  return (
    <article className="metric-card">
      <div className="metric-label">
        {title}
        <span aria-hidden="true">{icon}</span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-description">
        {trend ? (
          <span className="positive">
            <ArrowUpRight size={13} aria-hidden="true" />
            {trend}
          </span>
        ) : null}
        {description}
      </div>
    </article>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export function useFilters() {
  const [params, setParams] = useSearchParams();
  return {
    get: (key: string, fallback = "") => params.get(key) ?? fallback,
    set: (key: string, value: string) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          next.delete("page");
          return next;
        },
        { replace: true },
      ),
    params,
    setParams,
  };
}
export function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (total <= 1) return null;
  return (
    <nav className="pagination" aria-label="Paginação">
      <button
        className="button small"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Anterior
      </button>
      <span>
        Página {page} de {total}
      </span>
      <button
        className="button small"
        disabled={page >= total}
        onClick={() => onChange(page + 1)}
      >
        Próxima
      </button>
    </nav>
  );
}
