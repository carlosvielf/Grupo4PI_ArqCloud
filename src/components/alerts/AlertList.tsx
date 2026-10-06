import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import type { Alerta } from "../../types";
import { date } from "../../lib/format";
import { EmptyState, StatusBadge } from "../ui";
export function AlertList({
  alerts,
  compact = false,
}: {
  alerts: Alerta[];
  compact?: boolean;
}) {
  if (!alerts.length)
    return (
      <EmptyState
        title="Nenhum alerta encontrado"
        description="Os alertas aparecerão aqui quando houver registros disponíveis."
      />
    );
  return (
    <div className={`alert-list ${compact ? "compact" : ""}`}>
      {alerts.map((a) => (
        <article key={a.id} className="alert-item">
          <div
            className={`alert-symbol ${a.status === "resolvido" ? "normal" : a.severidade}`}
          >
            <Bell size={16} aria-hidden="true" />
          </div>
          <div className="alert-body">
            <div className="alert-meta">
              <StatusBadge
                status={a.status === "resolvido" ? "normal" : a.severidade}
                label={a.status === "resolvido" ? "Resolvido" : undefined}
              />
              <time dateTime={a.data}>{date(a.data)}</time>
            </div>
            <h3>{a.titulo}</h3>
            <div className="alert-origin">
              {a.talhao ? (
                <Link to={`/talhoes/${encodeURIComponent(a.talhao)}`}>
                  Talhão {a.talhao}
                </Link>
              ) : a.maquina ? (
                <Link to="/maquinas">Máquina {a.maquina}</Link>
              ) : (
                "Operação"
              )}
              <span>{a.status === "ativo" ? "Em aberto" : "Encerrado"}</span>
            </div>
            {!compact ? (
              <details>
                <summary>Ver informações</summary>
                <p>{a.descricao}</p>
              </details>
            ) : (
              <p className="alert-preview">{a.descricao}</p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
