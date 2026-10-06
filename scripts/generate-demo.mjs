import { mkdirSync, writeFileSync } from "node:fs";
// Ilustrações vetoriais procedurais para a demonstração, não imagens de satélite.
mkdirSync("public/demo", { recursive: true });
for (let field = 1; field <= 6; field++)
  for (let capture = 0; capture < 3; capture++) {
    let cells = "";
    for (let y = 0; y < 400; y += 14)
      for (let x = 0; x < 640; x += 14) {
        const wave =
          Math.sin(x * 0.021 + field) +
          Math.cos(y * 0.027 + capture) +
          Math.sin((x + y) * 0.013);
        const hue =
          field === 4
            ? 34 + wave * 10 + capture * 5
            : field === 3
              ? 55 + wave * 15 + capture * 7
              : 91 + wave * 13 + capture * 6;
        cells += `<rect x="${x}" y="${y}" width="15" height="15" fill="hsl(${hue} 44% ${36 + Math.sin(x * 0.04 + y * 0.03) * 7}%)"/>`;
      }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><defs><clipPath id="field"><path d="M84 55 453 24 566 115 531 339 208 373 73 259Z"/></clipPath><pattern id="rows" width="10" height="10" patternTransform="rotate(-25)" patternUnits="userSpaceOnUse"><path d="M0 0V10" stroke="#0c2014" opacity=".15"/></pattern></defs><rect width="640" height="400" fill="#172b22"/><path d="M0 82 640 38M32 0 96 400M598 0 544 400M0 337 640 369" stroke="#75806b" stroke-width="14" opacity=".35"/><g clip-path="url(#field)">${cells}<rect width="640" height="400" fill="url(#rows)"/></g><path d="M84 55 453 24 566 115 531 339 208 373 73 259Z" fill="none" stroke="#dbeac8" stroke-width="2" opacity=".8"/></svg>`;
    writeFileSync(`public/demo/field-${field}-${capture}.svg`, svg);
  }
