import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from "../.tmp-docx/node_modules/docx/dist/index.mjs";

const root = process.cwd();
const articleDir = path.join(root, "artigo-redis-minio");
const markdown = await readFile(path.join(articleDir, "artigo.md"), "utf8");
const lines = markdown.split(/\r?\n/);
const children = [];

const clean = (text) => text
  .replaceAll(/`([^`]+)`/g, "$1")
  .replaceAll(/\*\*([^*]+)\*\*/g, "$1")
  .replaceAll(/\*([^*]+)\*/g, "$1")
  .trim();

for (let index = 0; index < lines.length; index += 1) {
  const line = lines[index];
  if (!line.trim()) continue;
  const heading = line.match(/^(#{1,3})\s+(.+)$/);
  if (heading) {
    const level = heading[1].length;
    children.push(new Paragraph({
      text: clean(heading[2]),
      heading: level === 1 ? HeadingLevel.TITLE : level === 2 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
      spacing: { before: level === 1 ? 0 : 260, after: 120 },
    }));
    continue;
  }
  const image = line.match(/^!\[[^\]]*\]\(([^)]+)\)$/);
  if (image) {
    const imagePath = path.join(articleDir, image[1].replaceAll("/", path.sep));
    const data = await readFile(imagePath);
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 80 },
      children: [new ImageRun({ data, transformation: { width: 600, height: 338 }, type: "png" })],
    }));
    continue;
  }
  if (line.startsWith("*") && line.endsWith("*")) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [new TextRun({ text: clean(line), italics: true, color: "555555" })],
    }));
    continue;
  }
  children.push(new Paragraph({
    text: clean(line),
    spacing: { after: 140, line: 300 },
  }));
}

const document = new Document({
  creator: "Projeto Integrador — Grupo 4",
  title: "Redis e MinIO na prática",
  description: "Artigo do LinkedIn sobre Redis e MinIO na Fazenda São João",
  sections: [{
    properties: { page: { margin: { top: 900, right: 1000, bottom: 900, left: 1000 } } },
    children,
  }],
});

const output = path.join(articleDir, "artigo-redis-minio.docx");
await writeFile(output, await Packer.toBuffer(document));
console.log(output);
