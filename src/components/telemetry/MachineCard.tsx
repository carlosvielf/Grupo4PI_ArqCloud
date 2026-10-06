import { Tractor } from "lucide-react";
import type { Telemetry } from "../../types";
import { date, number } from "../../lib/format";
import { StatusBadge } from "../ui";
import { Link } from "react-router-dom";
export function MachineCard({ machine }: { machine: Telemetry }) {
  const values = [
    ["Velocidade", machine.velocidade, "km/h"],
    ["Combustível", machine.combustivel, "%"],
    ["Motor", machine.rpm, "RPM"],
    ["Temperatura", machine.temperatura, "°C"],
  ] as const;
  return (
    <article className="machine-card">
      <div className="machine-header">
        <span className="machine-icon">
          <Tractor size={24} aria-hidden="true" />
        </span>
        <StatusBadge
          status={
            machine.online === undefined
              ? "desconhecido"
              : machine.online
                ? "normal"
                : "atencao"
          }
          label={
            machine.online === undefined
              ? "Status indisponível"
              : machine.online
                ? "Online"
                : "Offline"
          }
        />
      </div>
      <h2>{machine.nome ?? machine.maquina}</h2>
      <p className="muted">Equipamento {machine.maquina}</p>
      <dl className="machine-metrics">
        {values
          .filter(([, v]) => v !== undefined)
          .map(([label, value, unit]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                {number(value)}
                <small>{unit}</small>
              </dd>
            </div>
          ))}
      </dl>
      <p className="machine-communication">
        Última comunicação{" "}
        <time dateTime={machine.data}>
          {date(machine.data)} ·{" "}
          {new Intl.DateTimeFormat("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Sao_Paulo",
          }).format(new Date(machine.data))}
        </time>
      </p>
      <Link
        className="card-link"
        to={`/telemetria?maquina=${encodeURIComponent(machine.maquina)}`}
      >
        Ver telemetria
      </Link>
    </article>
  );
}
