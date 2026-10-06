import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NdviRecord } from "../../types";
import { date, number } from "../../lib/format";
const colors = [
  "#16934b",
  "#6682ab",
  "#c39e32",
  "#c96748",
  "#778148",
  "#7a6997",
];
export default function NdviPlot({ records }: { records: NdviRecord[] }) {
  const codes = [...new Set(records.map((r) => r.talhao))];
  const map = new Map<string, Record<string, string | number>>();
  for (const r of records) {
    const item = map.get(r.data) ?? { data: r.data };
    item[r.talhao] = r.ndvi;
    map.set(r.data, item);
  }
  return (
    <div
      className="chart-area"
      role="group"
      aria-label={`Histórico NDVI dos talhões ${codes.join(", ")}, ${records.length} leituras. A tabela abaixo contém os valores.`}
    >
      <ResponsiveContainer width="100%" height={270}>
        <LineChart
          data={[...map.values()]}
          margin={{ top: 15, right: 15, left: -16, bottom: 5 }}
          accessibilityLayer
        >
          <CartesianGrid stroke="#edf0ee" vertical={false} />
          <XAxis
            dataKey="data"
            tickFormatter={(v) =>
              date(String(v)).replace(/ de /g, " ").replace(/ 2026/, "")
            }
            tick={{ fill: "#627268", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={25}
          />
          <YAxis
            domain={[-1, 1]}
            ticks={[-1, -0.5, 0, 0.5, 1]}
            tickFormatter={(v) => number(Number(v))}
            tick={{ fill: "#627268", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            labelFormatter={(v) => date(String(v))}
            formatter={(v) => number(Number(v))}
            contentStyle={{
              border: "1px solid #e1e7e3",
              borderRadius: 10,
              fontSize: 12,
            }}
          />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 12 }}
          />
          {codes.map((code, i) => (
            <Line
              key={code}
              dataKey={code}
              name={code}
              stroke={colors[i % colors.length]}
              strokeWidth={2.3}
              dot={{ r: 3, strokeWidth: 2, fill: "white" }}
              activeDot={{ r: 5 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <details className="chart-data">
        <summary>Ver valores do gráfico</summary>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">Leituras do gráfico NDVI</caption>
            <thead>
              <tr>
                <th>Talhão</th>
                <th>Data</th>
                <th>NDVI</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={`${r.talhao}-${r.data}`}>
                  <td>{r.talhao}</td>
                  <td>{date(r.data)}</td>
                  <td>{number(r.ndvi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
