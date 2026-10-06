import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Satellite, Sprout } from "lucide-react";
import { useFarmData } from "../hooks/useFarmData";
import { date, health, latestReading, number } from "../lib/format";
import {
  DataBoundary,
  EmptyState,
  Field,
  MetricCard,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "../components/ui";
import { NdviChart } from "../components/charts/NdviChart";
import { ImageGallery } from "../components/imagens/ImageGallery";
import { ImagePreview } from "../components/imagens/ImagePreview";
import { ComparisonSlider } from "../components/imagens/ComparisonSlider";
import { AlertList } from "../components/alerts/AlertList";
export default function TalhaoDetail() {
  const { id } = useParams();
  const { data } = useFarmData();
  const talhao = data.talhoes.find((t) => t.codigo === id);
  const records = data.imagens
    .filter((i) => i.talhao === id)
    .sort((a, b) => a.data.localeCompare(b.data));
  const [selectedId, setSelectedId] = useState("");
  const [beforeId, setBeforeId] = useState("");
  const selected = records.find((i) => i.id === selectedId) ?? records.at(-1);
  const compatible = records.filter(
    (i) => i.tipo === selected?.tipo && i.satelite === selected?.satelite,
  );
  const before =
    compatible.find((i) => i.id === beforeId && i.data !== selected?.data) ??
    compatible.find((i) => i.data !== selected?.data);
  const ndvi = talhao ? latestReading(data, talhao.codigo) : undefined;
  return (
    <DataBoundary resources={["talhoes", "imagens", "leituras", "alertas"]}>
      {!talhao ? (
        <EmptyState
          title="Talhão não encontrado"
          description="Confira o código ou volte à lista de talhões."
          action={
            <Link className="button" to="/talhoes">
              Ver talhões
            </Link>
          }
        />
      ) : (
        <>
          <nav className="breadcrumbs" aria-label="Caminho da página">
            <Link to="/">Dashboard</Link>
            <span>/</span>
            <Link to="/talhoes">Talhões</Link>
            <span>/</span>
            <span aria-current="page">{talhao.codigo}</span>
          </nav>
          <PageHeader
            title={`Talhão ${talhao.codigo}`}
            description={
              [
                talhao.nome,
                talhao.cultura,
                talhao.areaHa === undefined
                  ? undefined
                  : `${number(talhao.areaHa)} ha`,
              ]
                .filter(Boolean)
                .join(" · ") || "Histórico de condições e capturas da área."
            }
            actions={
              <StatusBadge status={talhao.status ?? health(ndvi?.ndvi)} />
            }
          />
          <div className="detail-metrics">
            <MetricCard
              title="NDVI atual"
              value={number(ndvi?.ndvi)}
              description={`Última leitura: ${date(ndvi?.data)}`}
              icon={<Sprout size={18} />}
            />
            <MetricCard
              title="Última captura"
              value={
                <span className="date-value">{date(records.at(-1)?.data)}</span>
              }
              description={`${records.length} imagens no histórico carregado`}
              icon={<CalendarDays size={18} />}
            />
            <MetricCard
              title="Satélite"
              value={
                <span className="date-value">
                  {records.at(-1)?.satelite ?? "Não informado"}
                </span>
              }
              description="Fonte da captura mais recente"
              icon={<Satellite size={18} />}
            />
          </div>
          <NdviChart talhao={talhao.codigo} />
          <section className="panel timeline-panel">
            <SectionHeader
              title="Histórico de capturas"
              description="Selecione uma data para explorar a imagem correspondente"
            />
            {selected ? (
              <>
                <div
                  className="date-timeline"
                  role="group"
                  aria-label="Selecionar captura histórica"
                >
                  {records.map((i) => (
                    <button
                      key={i.id}
                      aria-pressed={i.id === selected.id}
                      className={i.id === selected.id ? "active" : ""}
                      onClick={() => setSelectedId(i.id)}
                    >
                      <span className="timeline-dot" />
                      <time dateTime={i.data}>{date(i.data)}</time>
                      <small>{i.tipo.toUpperCase()}</small>
                    </button>
                  ))}
                </div>
                <div className="timeline-preview">
                  <div className="timeline-image">
                    <ImagePreview key={selected.url} image={selected} />
                  </div>
                  <div className="timeline-info">
                    <span className="muted">Captura selecionada</span>
                    <h3>{date(selected.data)}</h3>
                    <dl>
                      <div>
                        <dt>Tipo</dt>
                        <dd>{selected.tipo.toUpperCase()}</dd>
                      </div>
                      <div>
                        <dt>Satélite</dt>
                        <dd>{selected.satelite}</dd>
                      </div>
                      <div>
                        <dt>NDVI na data</dt>
                        <dd>
                          {number(
                            data.leituras.find(
                              (r) =>
                                r.talhao === id &&
                                r.data.slice(0, 10) ===
                                  selected.data.slice(0, 10),
                            )?.ndvi,
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                title="Sem capturas disponíveis"
                description="Novas imagens serão exibidas quando forem disponibilizadas pela fonte de dados."
              />
            )}
          </section>
          <section className="panel comparison-panel">
            <SectionHeader
              title="Comparação temporal"
              description="Mesma área, tipo de imagem e satélite em duas datas"
            />
            {selected && before ? (
              <>
                <div className="comparison-selectors">
                  <Field label="Primeira captura">
                    <select
                      value={before.id}
                      onChange={(e) => setBeforeId(e.target.value)}
                    >
                      {compatible
                        .filter((i) => i.data !== selected.data)
                        .map((i) => (
                          <option key={i.id} value={i.id}>
                            {date(i.data)}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <span className="muted">
                    Comparada com {date(selected.data)} · altere pela timeline
                  </span>
                </div>
                <ComparisonSlider
                  key={`${before.id}-${selected.id}`}
                  first={before}
                  second={selected}
                />
              </>
            ) : (
              <EmptyState
                title="Ainda não é possível comparar"
                description="São necessárias duas capturas em datas distintas, do mesmo tipo e satélite."
              />
            )}
          </section>
          <section className="panel">
            <SectionHeader title="Alertas deste talhão" />
            <AlertList alerts={data.alertas.filter((a) => a.talhao === id)} />
          </section>
          <section>
            <SectionHeader title="Galeria do talhão" />
            <ImageGallery images={[...records].reverse()} />
          </section>
        </>
      )}
    </DataBoundary>
  );
}
