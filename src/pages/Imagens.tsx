import { useFarmData } from "../hooks/useFarmData";
import {
  DataBoundary,
  EmptyState,
  Field,
  PageHeader,
  useFilters,
} from "../components/ui";
import { ImageGallery } from "../components/imagens/ImageGallery";
export default function Imagens() {
  const { data } = useFarmData();
  const f = useFilters();
  const unique = (key: "talhao" | "tipo" | "satelite") =>
    [...new Set(data.imagens.map((i) => i[key]))].sort();
  const invalid =
    !!f.get("from") && !!f.get("to") && f.get("from") > f.get("to");
  const images = data.imagens
    .filter(
      (i) =>
        (!f.get("talhao") || i.talhao === f.get("talhao")) &&
        (!f.get("tipo") || i.tipo === f.get("tipo")) &&
        (!f.get("satelite") || i.satelite === f.get("satelite")) &&
        (!f.get("from") || i.data.slice(0, 10) >= f.get("from")) &&
        (!f.get("to") || i.data.slice(0, 10) <= f.get("to")),
    )
    .sort((a, b) => b.data.localeCompare(a.data));
  return (
    <DataBoundary resources={["imagens"]}>
      <PageHeader
        title="Imagens de satélite"
        description="Explore as capturas e compare a evolução de cada talhão."
      />
      <div className="filter-bar gallery-filters">
        {(["talhao", "tipo", "satelite"] as const).map((key) => (
          <Field
            key={key}
            label={
              { talhao: "Talhão", tipo: "Tipo", satelite: "Satélite" }[key]
            }
          >
            <select
              value={f.get(key)}
              onChange={(e) => f.set(key, e.target.value)}
            >
              <option value="">
                {key === "talhao"
                  ? "Todos os talhões"
                  : key === "tipo"
                    ? "Todos os tipos"
                    : "Todos os satélites"}
              </option>
              {unique(key).map((v) => (
                <option key={v} value={v}>
                  {key === "tipo" ? v.toUpperCase() : v}
                </option>
              ))}
            </select>
          </Field>
        ))}
        <Field label="De">
          <input
            type="date"
            value={f.get("from")}
            max={f.get("to") || undefined}
            onChange={(e) => f.set("from", e.target.value)}
          />
        </Field>
        <Field label="Até">
          <input
            type="date"
            value={f.get("to")}
            min={f.get("from") || undefined}
            onChange={(e) => f.set("to", e.target.value)}
          />
        </Field>
      </div>
      <div className="results-caption">
        {images.length} capturas encontradas <span>Mais recentes primeiro</span>
      </div>
      {invalid ? (
        <EmptyState
          title="Revise o período"
          description="A data inicial deve ser anterior à data final."
        />
      ) : (
        <ImageGallery images={images} />
      )}
    </DataBoundary>
  );
}
