import { useState } from "react";
import type { Imagem } from "../../types";
import { date, number } from "../../lib/format";
import { useFarmData } from "../../hooks/useFarmData";
import { ImagePreview } from "./ImagePreview";
export function ComparisonSlider({
  first,
  second,
}: {
  first: Imagem;
  second: Imagem;
}) {
  const [position, setPosition] = useState(50);
  const { data } = useFarmData();
  const ordered = [first, second].sort((a, b) => a.data.localeCompare(b.data));
  const a = data.leituras.find(
    (r) =>
      r.talhao === first.talhao &&
      r.data.slice(0, 10) === ordered[0].data.slice(0, 10),
  )?.ndvi;
  const b = data.leituras.find(
    (r) =>
      r.talhao === first.talhao &&
      r.data.slice(0, 10) === ordered[1].data.slice(0, 10),
  )?.ndvi;
  const delta =
    a !== undefined && a !== 0 && b !== undefined
      ? ((b - a) / Math.abs(a)) * 100
      : undefined;
  return (
    <div className="comparison">
      <div className="comparison-labels">
        <span>Antes · {date(ordered[0].data)}</span>
        <span>Depois · {date(ordered[1].data)}</span>
      </div>
      <div className="comparison-stage">
        <ImagePreview key={ordered[1].url} image={ordered[1]} />
        <div
          className="comparison-overlay"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <ImagePreview key={ordered[0].url} image={ordered[0]} />
        </div>
        <span className="comparison-divider" style={{ left: `${position}%` }} />
        <span
          className="comparison-handle"
          style={{ left: `${position}%` }}
          aria-hidden="true"
        >
          ↔
        </span>
      </div>
      <label className="slider-label">
        Arraste para comparar
        <input
          name="comparacao"
          type="range"
          min="0"
          max="100"
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          aria-label="Divisão entre a imagem anterior e a posterior"
        />
      </label>
      <div className="comparison-values">
        <span>
          NDVI anterior <strong>{number(a)}</strong>
        </span>
        <span>
          NDVI posterior <strong>{number(b)}</strong>
        </span>
        <span>
          Variação{" "}
          <strong>
            {delta === undefined
              ? "—"
              : `${delta > 0 ? "+" : ""}${number(delta)}%`}
          </strong>
        </span>
      </div>
    </div>
  );
}
