import { useFarmData } from "../hooks/useFarmData";
import { AlertList } from "../components/alerts/AlertList";
import {
  DataBoundary,
  PageHeader,
  SearchInput,
  useFilters,
} from "../components/ui";
const tabs = [
  ["", "Todos"],
  ["critico", "Críticos"],
  ["risco", "Risco"],
  ["atencao", "Atenção"],
  ["resolvido", "Resolvidos"],
];
export default function Alertas() {
  const { data } = useFarmData();
  const f = useFilters();
  const q = f.get("q");
  const filter = f.get("status");
  const alerts = data.alertas
    .filter(
      (a) =>
        (!filter ||
          (filter === "resolvido"
            ? a.status === "resolvido"
            : a.severidade === filter && a.status === "ativo")) &&
        `${a.titulo} ${a.descricao} ${a.talhao ?? ""} ${a.maquina ?? ""}`
          .toLocaleLowerCase("pt-BR")
          .includes(q.toLocaleLowerCase("pt-BR")),
    )
    .sort((a, b) => b.data.localeCompare(a.data));
  return (
    <DataBoundary resources={["alertas"]}>
      <PageHeader
        title="Central de alertas"
        description="Priorize ocorrências e acompanhe as condições da operação."
      />
      <div className="alert-toolbar">
        <div
          className="filter-tabs"
          role="group"
          aria-label="Filtrar alertas por condição"
        >
          {tabs.map(([value, label]) => (
            <button
              className={filter === value ? "active" : ""}
              key={value}
              aria-pressed={filter === value}
              onClick={() => f.set("status", value)}
            >
              {label}
              <span>
                {
                  data.alertas.filter(
                    (a) =>
                      !value ||
                      (value === "resolvido"
                        ? a.status === "resolvido"
                        : a.severidade === value && a.status === "ativo"),
                  ).length
                }
              </span>
            </button>
          ))}
        </div>
        <SearchInput
          value={q}
          onChange={(v) => f.set("q", v)}
          placeholder="Buscar ocorrência…"
        />
      </div>
      <section className="panel full-alerts">
        <AlertList alerts={alerts} />
      </section>
    </DataBoundary>
  );
}
