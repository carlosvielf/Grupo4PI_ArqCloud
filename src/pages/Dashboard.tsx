import {
  ArrowRight,
  CalendarDays,
  Download,
  Images,
  RefreshCw,
  Sprout,
  Tractor,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useFarmData } from "../hooks/useFarmData";
import {
  date,
  health,
  latestDate,
  latestMachines,
  latestReading,
} from "../lib/format";
import {
  DataBoundary,
  EmptyState,
  MetricCard,
  PageHeader,
  SectionHeader,
} from "../components/ui";
import { TalhaoCard } from "../components/talhoes/TalhaoCard";
import { NdviChart } from "../components/charts/NdviChart";
import { AlertList } from "../components/alerts/AlertList";
import { isDemo } from "../services/api";
function exportSummary(rows: string[][]) {
  const csv =
    "\uFEFF" +
    rows
      .map((row) =>
        row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";"),
      )
      .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `campo-resumo${isDemo ? "-demonstracao" : ""}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
export default function Dashboard() {
  const { data, refresh, issues } = useFarmData();
  const machines = latestMachines(data);
  const active = data.alertas.filter((a) => a.status === "ativo");
  const dateValue = latestDate(data);
  const healthy = data.talhoes.filter(
    (t) =>
      (t.status ?? health(latestReading(data, t.codigo)?.ndvi)) === "normal",
  ).length;
  const missing = (r: string) => issues.some((i) => i.resource === r);
  return (
    <DataBoundary
      resources={["talhoes", "imagens", "alertas", "leituras", "telemetria"]}
    >
      <PageHeader
        title="Visão geral da propriedade"
        description="Acompanhe as condições dos talhões, imagens, alertas e operações."
        actions={
          <>
            <button className="button" onClick={refresh}>
              <RefreshCw size={15} />
              Atualizar
            </button>
            <button
              className="button primary"
              onClick={() =>
                exportSummary([
                  ["Indicador", "Valor", "Origem"],
                  [
                    "Talhões",
                    String(data.talhoes.length),
                    isDemo ? "Demonstração" : "API",
                  ],
                  [
                    "Imagens",
                    String(data.imagens.length),
                    isDemo ? "Demonstração" : "API",
                  ],
                  [
                    "Alertas ativos",
                    String(active.length),
                    isDemo ? "Demonstração" : "API",
                  ],
                  [
                    "Último registro",
                    date(dateValue),
                    isDemo ? "Demonstração" : "API",
                  ],
                ])
              }
            >
              <Download size={15} />
              Exportar resumo
            </button>
          </>
        }
      />
      <div className="kpi-grid">
        <MetricCard
          title="Talhões monitorados"
          value={missing("talhoes") ? "—" : data.talhoes.length}
          description="Talhões nos registros carregados"
          icon={<Sprout size={18} />}
        />
        <MetricCard
          title="Imagens disponíveis"
          value={missing("imagens") ? "—" : data.imagens.length}
          description="Capturas nos registros carregados"
          icon={<Images size={18} />}
        />
        <MetricCard
          title="Alertas ativos"
          value={missing("alertas") ? "—" : active.length}
          description="Ocorrências que pedem atenção"
          icon={<TriangleAlert size={18} />}
        />
        <MetricCard
          title="Máquinas online"
          value={
            missing("telemetria") ||
            !machines.some((m) => m.online !== undefined) ? (
              "—"
            ) : (
              <>
                {machines.filter((m) => m.online === true).length}
                <small> / {machines.length}</small>
              </>
            )
          }
          description={
            machines.some((m) => m.online === undefined)
              ? `${machines.filter((m) => m.online === undefined).length} sem status de conexão`
              : "Status da última comunicação"
          }
          icon={<Tractor size={18} />}
        />
        <MetricCard
          title="Último registro"
          value={<span className="date-value">{date(dateValue)}</span>}
          description="Data mais recente dos dados"
          icon={<CalendarDays size={18} />}
        />
      </div>
      <div className="dashboard-main-grid">
        <section className="panel health-panel">
          <SectionHeader
            title="Saúde dos talhões"
            description="Condição na leitura mais recente"
            action={
              <Link className="text-link" to="/talhoes">
                Ver talhões
                <ArrowRight size={15} />
              </Link>
            }
          />
          <div className="health-summary">
            <span className="healthy-count">
              {healthy}
              <small> / {data.talhoes.length}</small>
            </span>
            <div>
              <strong>na faixa saudável</strong>
              <p>Referência ilustrativa de NDVI ≥ 0,70</p>
            </div>
            <div className="health-bar" aria-hidden="true">
              {data.talhoes.map((t) => (
                <span
                  key={t.codigo}
                  className={
                    t.status ?? health(latestReading(data, t.codigo)?.ndvi)
                  }
                />
              ))}
            </div>
          </div>
          {data.talhoes.length ? (
            <div className="health-grid">
              {data.talhoes.slice(0, 6).map((t) => (
                <TalhaoCard key={t.codigo} talhao={t} compact />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhum talhão disponível"
              description="Os talhões aparecerão quando houver registros na fonte de dados."
            />
          )}
        </section>
        <section className="panel recent-alerts">
          <SectionHeader
            title="Alertas recentes"
            description={`${active.length} ocorrências em aberto`}
            action={
              <Link to="/alertas" className="text-link">
                Ver todos
                <ArrowRight size={15} />
              </Link>
            }
          />
          <AlertList
            alerts={[...data.alertas]
              .sort((a, b) => b.data.localeCompare(a.data))
              .slice(0, 3)}
            compact
          />
          <div className="panel-bottom">
            <Link to="/alertas">
              Acompanhar ocorrências
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
      <NdviChart />
    </DataBoundary>
  );
}
