import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  MapPin,
  Satellite,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useFarmData } from "../../hooks/useFarmData";
import {
  date,
  health,
  latestReading,
  number,
  variation,
} from "../../lib/format";
import type { Talhao } from "../../types";
import { StatusBadge } from "../ui";
export function TalhaoCard({
  talhao,
  compact = false,
}: {
  talhao: Talhao;
  compact?: boolean;
}) {
  const { data } = useFarmData();
  const current = latestReading(data, talhao.codigo);
  const image = data.imagens
    .filter((i) => i.talhao === talhao.codigo)
    .sort((a, b) => b.data.localeCompare(a.data))[0];
  const delta = variation(
    data.leituras.filter((r) => r.talhao === talhao.codigo),
  );
  return (
    <article className={`talhao-card ${compact ? "compact" : ""}`}>
      <div className="talhao-top">
        <div className="talhao-identifier">
          <span className="field-icon">
            <MapPin size={18} aria-hidden="true" />
          </span>
          <div>
            <Link
              to={`/talhoes/${encodeURIComponent(talhao.codigo)}`}
              className="talhao-name"
            >
              {talhao.codigo}
            </Link>
            {talhao.nome ? <p>{talhao.nome}</p> : null}
          </div>
        </div>
        <StatusBadge status={talhao.status ?? health(current?.ndvi)} />
      </div>
      <div className="talhao-value">
        <span>NDVI atual</span>
        <strong>{number(current?.ndvi)}</strong>
        {delta !== undefined ? (
          <span className={`trend ${delta >= 0 ? "positive" : "negative"}`}>
            {delta >= 0 ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}{" "}
            {delta > 0 ? "+" : ""}
            {number(delta)}%
            <span className="sr-only">em relação à captura anterior</span>
          </span>
        ) : null}
      </div>
      {!compact ? (
        <>
          <div className="talhao-meta">
            {talhao.cultura ? <span>{talhao.cultura}</span> : null}
            {talhao.areaHa !== undefined ? (
              <span>{number(talhao.areaHa)} ha</span>
            ) : null}
          </div>
          <div className="talhao-capture">
            <span>
              <Satellite size={14} aria-hidden="true" />
              {image?.satelite ?? "Satélite não informado"}
            </span>
            <span>{date(image?.data)}</span>
          </div>
        </>
      ) : null}
      <Link
        className="card-link"
        to={`/talhoes/${encodeURIComponent(talhao.codigo)}`}
      >
        Ver detalhes
        <ChevronRight size={15} />
      </Link>
    </article>
  );
}
