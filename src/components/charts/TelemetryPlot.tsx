import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Telemetry } from "../../types";
import { number } from "../../lib/format";
export default function TelemetryPlot({
  records,
  metric,
  unit,
}: {
  records: Telemetry[];
  metric: "velocidade" | "combustivel" | "rpm" | "temperatura";
  unit: string;
}) {
  const time = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(value));
  return (
    <div className="chart-area">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={records}
          margin={{ left: 0, right: 20, top: 15, bottom: 10 }}
          accessibilityLayer
        >
          <CartesianGrid stroke="#edf0ee" vertical={false} />
          <XAxis
            dataKey="data"
            tickFormatter={time}
            tick={{ fontSize: 11, fill: "#627268" }}
            minTickGap={30}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#627268" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            labelFormatter={(v) => time(String(v))}
            formatter={(v) => `${number(Number(v))} ${unit}`}
            contentStyle={{ borderRadius: 10, border: "1px solid #e1e7e3" }}
          />
          <Line
            dataKey={metric}
            stroke="#16934b"
            strokeWidth={2.3}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
