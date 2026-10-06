import { useFarmData } from "../hooks/useFarmData";
import { health, latestReading } from "../lib/format";
import {
  DataBoundary,
  EmptyState,
  Field,
  PageHeader,
  SearchInput,
  useFilters,
} from "../components/ui";
import { TalhaoCard } from "../components/talhoes/TalhaoCard";
export default function Talhoes() {
  const { data } = useFarmData();
  const filters = useFilters();
  const q = filters.get("q");
  const status = filters.get("status");
  const sort = filters.get("sort", "codigo");
  const records = data.talhoes
    .filter(
      (t) =>
        `${t.codigo} ${t.nome ?? ""} ${t.cultura ?? ""}`
          .toLocaleLowerCase("pt-BR")
          .includes(q.toLocaleLowerCase("pt-BR")) &&
        (!status ||
          (t.status ?? health(latestReading(data, t.codigo)?.ndvi)) === status),
    )
    .sort((a, b) =>
      sort === "ndvi"
        ? (latestReading(data, b.codigo)?.ndvi ?? -2) -
          (latestReading(data, a.codigo)?.ndvi ?? -2)
        : a.codigo.localeCompare(b.codigo),
    );
  return (
    <DataBoundary resources={["talhoes", "leituras", "imagens"]}>
      <PageHeader
        title="Talhões"
        description="Uma visão de cada área, da última leitura ao histórico de capturas."
      />
      <div className="filter-bar">
        <SearchInput value={q} onChange={(v) => filters.set("q", v)} />
        <Field label="Condição">
          <select
            value={status}
            onChange={(e) => filters.set("status", e.target.value)}
          >
            <option value="">Todas as condições</option>
            <option value="normal">Saudável</option>
            <option value="atencao">Atenção</option>
            <option value="risco">Risco</option>
            <option value="critico">Crítico</option>
            <option value="desconhecido">Sem leitura</option>
          </select>
        </Field>
        <Field label="Ordenar por">
          <select
            value={sort}
            onChange={(e) => filters.set("sort", e.target.value)}
          >
            <option value="codigo">Código do talhão</option>
            <option value="ndvi">Maior NDVI</option>
          </select>
        </Field>
        <span className="filter-count">{records.length} talhões</span>
      </div>
      {records.length ? (
        <div className="talhoes-grid">
          {records.map((t) => (
            <TalhaoCard key={t.codigo} talhao={t} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum talhão encontrado"
          description="Ajuste a busca e os filtros ou confira a fonte de dados."
        />
      )}
    </DataBoundary>
  );
}
