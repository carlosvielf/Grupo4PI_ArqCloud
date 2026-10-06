import { useState } from "react";
import { ImageOff } from "lucide-react";
import type { Imagem } from "../../types";
import { date } from "../../lib/format";
import { isDemo } from "../../services/api";
export function ImagePreview({
  image,
  eager = false,
}: {
  image: Imagem;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  let url: string | undefined;
  try {
    if (image.url) {
      const parsed = new URL(image.url, window.location.origin);
      if (["http:", "https:"].includes(parsed.protocol)) url = parsed.href;
    }
  } catch {
    /* URL inválida aparece como estado indisponível. */
  }
  return url && !failed ? (
    <img
      src={url}
      width={640}
      height={400}
      loading={eager ? "eager" : "lazy"}
      alt={`${image.tipo.toUpperCase()} do talhão ${image.talhao}, captura de ${date(image.data)}${isDemo ? " — ilustração de demonstração" : ""}`}
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="image-unavailable">
      <ImageOff size={25} aria-hidden="true" />
      <span>
        {failed ? "Não foi possível abrir a imagem" : "Imagem não disponível"}
      </span>
    </div>
  );
}
