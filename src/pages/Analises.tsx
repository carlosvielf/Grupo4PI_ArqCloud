import { useFarmData } from "../hooks/useFarmData";
import {
  DataBoundary,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "../components/ui";
import { NdviChart } from "../components/charts/NdviChart";
import { health, latestReading, number, variation } from "../lib/format";
import { Link } from "react-router-dom";
export default function Analises() {
  const { data } = useFarmData();
  return (
    <DataBoundary resources={["talhoes", "leituras"]}>
      <PageHeader
        title="Análises da vegetação"
        description="Compare o comportamento dos talhões e identifique mudanças entre leituras."
      />
      <NdviChart compare />
      <section className="panel">
        <SectionHeader
          title="Última leitura por talhão"
          description="Variação relativa à leitura imediatamente anterior"
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Talhão</th>
                <th>NDVI atual</th>
                <th>Variação</th>
                <th>Condição</th>
              </tr>
            </thead>
            <tbody>
              {data.talhoes.map((t) => {
                const r = latestReading(data, t.codigo);
                const delta = variation(
                  data.leituras.filter((v) => v.talhao === t.codigo),
                );
                return (
                  <tr key={t.codigo}>
                    <td>
                      <Link
                        className="text-link"
                        to={`/talhoes/${encodeURIComponent(t.codigo)}`}
                      >
                        {t.codigo}
                      </Link>
                    </td>
                    <td>{number(r?.ndvi)}</td>
                    <td>
                      {delta === undefined
                        ? "—"
                        : `${delta > 0 ? "+" : ""}${number(delta)}%`}
                    </td>
                    <td>
                      <StatusBadge status={t.status ?? health(r?.ndvi)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!data.talhoes.length ? (
            <p className="muted">Nenhum talhão disponível para análise.</p>
          ) : null}
        </div>
      </section>
    </DataBoundary>
  );
}
