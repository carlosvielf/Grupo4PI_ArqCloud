import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftRight, Satellite, X } from "lucide-react";
import type { Imagem } from "../../types";
import { date } from "../../lib/format";
import { isDemo } from "../../services/api";
import { EmptyState, Field, Pagination } from "../ui";
import { ComparisonSlider } from "./ComparisonSlider";
import { ImagePreview } from "./ImagePreview";
export function ImageGallery({ images }: { images: Imagem[] }) {
  const [selected, setSelected] = useState<Imagem | null>(null);
  const [page, setPage] = useState(1);
  const count = Math.ceil(images.length / 12);
  const current = Math.min(page, count || 1);
  if (!images.length)
    return (
      <EmptyState
        title="Nenhuma imagem neste período"
        description="Ajuste os filtros para encontrar outras capturas."
      />
    );
  return (
    <>
      <div className="image-grid">
        {images.slice((current - 1) * 12, current * 12).map((image) => (
          <button
            key={image.id}
            className="image-card"
            onClick={() => setSelected(image)}
            aria-label={`Abrir imagem ${image.tipo} do talhão ${image.talhao} em ${date(image.data)}`}
          >
            <div className="image-thumb">
              <ImagePreview key={image.url} image={image} />
              <span className="image-type">{image.tipo.toUpperCase()}</span>
            </div>
            <div className="image-card-body">
              <div>
                <strong>{image.talhao}</strong>
                <span>{date(image.data)}</span>
              </div>
              <p>
                <Satellite size={14} aria-hidden="true" />
                {image.satelite}
              </p>
            </div>
          </button>
        ))}
      </div>
      <Pagination page={current} total={count} onChange={setPage} />
      {selected ? (
        <ImageViewer
          image={selected}
          images={images}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}
export function ImageViewer({
  image,
  images,
  onClose,
}: {
  image: Imagem;
  images: Imagem[];
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [compare, setCompare] = useState(false);
  const candidates = images
    .filter(
      (i) =>
        i.talhao === image.talhao &&
        i.tipo === image.tipo &&
        i.satelite === image.satelite &&
        i.data !== image.data,
    )
    .sort((a, b) => a.data.localeCompare(b.data));
  const [otherId, setOtherId] = useState(candidates[0]?.id ?? "");
  const other = candidates.find((i) => i.id === otherId);
  useEffect(() => {
    const d = dialog.current;
    const previousFocus = document.activeElement;
    d?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      d?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="image-modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const box = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < box.left ||
            e.clientX > box.right ||
            e.clientY < box.top ||
            e.clientY > box.bottom
          )
            onClose();
        }
      }}
      aria-labelledby="image-viewer-title"
    >
      <div className="modal-header">
        <div>
          <h2 id="image-viewer-title">Talhão {image.talhao}</h2>
          <p>
            {image.tipo.toUpperCase()} · {image.satelite} · {date(image.data)}
          </p>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Fechar visualização"
        >
          <X size={21} />
        </button>
      </div>
      <div className="modal-body">
        {compare && other ? (
          <>
            <Field label="Comparar com a captura">
              <select
                value={otherId}
                onChange={(e) => setOtherId(e.target.value)}
              >
                {candidates.map((i) => (
                  <option key={i.id} value={i.id}>
                    {date(i.data)}
                  </option>
                ))}
              </select>
            </Field>
            <ComparisonSlider first={other} second={image} />
          </>
        ) : (
          <div className="viewer-image">
            <ImagePreview image={image} eager />
          </div>
        )}
        {isDemo ? (
          <p className="muted small-text">
            Imagem ilustrativa de demonstração. Não é uma captura real de
            satélite.
          </p>
        ) : null}
      </div>
      <div className="modal-footer">
        <button
          className="button"
          onClick={() => setCompare((v) => !v)}
          disabled={!candidates.length}
          title={
            !candidates.length
              ? "É necessária outra captura do mesmo talhão, tipo e satélite"
              : undefined
          }
        >
          <ArrowLeftRight size={16} />
          {compare ? "Ver imagem" : "Comparar capturas"}
        </button>
        <Link
          className="button primary"
          to={`/talhoes/${encodeURIComponent(image.talhao)}`}
          onClick={onClose}
        >
          Ver histórico do talhão
        </Link>
      </div>
    </dialog>
  );
}
