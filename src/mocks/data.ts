import type { FarmData } from "../types";
// TEMPORÁRIO: dados de demonstração. Nenhum registro representa uma propriedade real.
const codes = ["T01", "T02", "T03", "T04", "T05", "T06"];
const dates = [
  "2026-06-05",
  "2026-06-21",
  "2026-07-07",
  "2026-07-23",
  "2026-08-08",
  "2026-08-24",
  "2026-09-09",
  "2026-09-25",
];
const readings = [
  [0.56, 0.59, 0.64, 0.68, 0.71, 0.75, 0.77, 0.81],
  [0.55, 0.58, 0.61, 0.65, 0.68, 0.72, 0.74, 0.76],
  [0.66, 0.65, 0.62, 0.61, 0.59, 0.6, 0.58, 0.56],
  [0.62, 0.59, 0.55, 0.5, 0.48, 0.43, 0.41, 0.38],
  [0.6, 0.64, 0.67, 0.7, 0.74, 0.78, 0.79, 0.83],
  [0.58, 0.62, 0.64, 0.66, 0.68, 0.7, 0.72, 0.74],
];
export const demoData: FarmData = {
  talhoes: codes.map((codigo, i) => ({
    codigo,
    nome: [
      "Sede norte",
      "Várzea",
      "Estrada leste",
      "Baixada",
      "Sede sul",
      "Chapadão",
    ][i],
    areaHa: [42.5, 38.2, 51.8, 29.4, 46.1, 62.0][i],
    cultura: i < 4 ? "Soja" : "Milho",
  })),
  imagens: codes.flatMap((talhao, i) =>
    dates.map((data, j) => ({
      id: `${talhao}-${data}`,
      talhao,
      data,
      tipo: "ndvi",
      satelite: "Sentinel-2",
      url: `/demo/field-${i + 1}-${j % 3}.svg`,
    })),
  ),
  leituras: codes.flatMap((talhao, i) =>
    dates.map((data, j) => ({ talhao, data, ndvi: readings[i][j] })),
  ),
  alertas: [
    {
      id: "a1",
      severidade: "critico",
      titulo: "Redução da atividade vegetativa",
      descricao:
        "A leitura mais recente está abaixo de 0,40. Compare as capturas e priorize uma inspeção em campo.",
      talhao: "T04",
      data: "2026-09-25T15:15:00-03:00",
      status: "ativo",
    },
    {
      id: "a2",
      severidade: "atencao",
      titulo: "NDVI em queda nas últimas capturas",
      descricao:
        "A tendência de redução persiste no histórico. Verifique as condições do solo e da cultura.",
      talhao: "T03",
      data: "2026-09-25T13:40:00-03:00",
      status: "ativo",
    },
    {
      id: "a3",
      severidade: "risco",
      titulo: "Temperatura do motor elevada",
      descricao:
        "A temperatura registrada chegou a 96 °C. Confira o sistema de arrefecimento antes de retomar a operação.",
      maquina: "M03",
      data: "2026-09-25T11:20:00-03:00",
      status: "ativo",
    },
    {
      id: "a4",
      severidade: "normal",
      titulo: "Condição do talhão normalizada",
      descricao:
        "O índice voltou à faixa de referência nas últimas duas leituras.",
      talhao: "T01",
      data: "2026-09-24T10:00:00-03:00",
      status: "resolvido",
    },
  ],
  telemetria: ["M01", "M02", "M03", "M04"].flatMap((maquina, i) =>
    [8, 10, 12, 14, 16].map((hour, j) => ({
      maquina,
      nome: ["Colhedora 01", "Trator 02", "Trator 03", "Pulverizador 04"][i],
      data: `2026-09-25T${hour.toString().padStart(2, "0")}:00:00-03:00`,
      online: i < 2,
      velocidade: i < 2 ? 4 + i + j * 0.4 : 0,
      combustivel: 82 - i * 12 - j * 2,
      rpm: i < 2 ? 1600 + j * 60 : 0,
      temperatura: i === 2 ? 96 : 74 + j * 2,
    })),
  ),
};
