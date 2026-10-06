import { useFarmData } from "../hooks/useFarmData";
import { latestMachines } from "../lib/format";
import {
  DataBoundary,
  EmptyState,
  Field,
  PageHeader,
  SearchInput,
  useFilters,
} from "../components/ui";
import { MachineCard } from "../components/telemetry/MachineCard";
export default function Maquinas() {
  const { data } = useFarmData();
  const f = useFilters();
  const machines = latestMachines(data).filter(
    (m) =>
      `${m.nome ?? ""} ${m.maquina}`
        .toLowerCase()
        .includes(f.get("q").toLowerCase()) &&
      (!f.get("status") ||
        (f.get("status") === "online"
          ? m.online === true
          : m.online === false)),
  );
  return (
    <DataBoundary resources={["telemetria"]}>
      <PageHeader
        title="Máquinas"
        description="Condições dos equipamentos na última comunicação registrada."
      />
      <div className="filter-bar">
        <SearchInput
          value={f.get("q")}
          onChange={(v) => f.set("q", v)}
          placeholder="Buscar máquina…"
        />
        <Field label="Conexão">
          <select
            value={f.get("status")}
            onChange={(e) => f.set("status", e.target.value)}
          >
            <option value="">Todos os estados</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </Field>
        <span className="filter-count">{machines.length} equipamentos</span>
      </div>
      {machines.length ? (
        <div className="machine-grid">
          {machines.map((machine) => (
            <MachineCard key={machine.maquina} machine={machine} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma máquina disponível"
          description="Ajuste os filtros ou configure a fonte de telemetria. Não há métricas estimadas."
        />
      )}
    </DataBoundary>
  );
}
