import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { aidSummary, monthlyAidSummary } from "./lib/aidSummary.js";
import { money } from "./lib/model.js";
const colors = {
  demplot: "#1684ef",
  ritd: "#12a990",
  investment: "#8661db",
  unclassified: "#91a0b3",
};
const labels = {
  demplot: "Demplot",
  ritd: "RITD",
  investment: "Investment Fund",
  unclassified: "Jenis belum dilengkapi",
};
const compact = (value) =>
  new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
export default function AidCharts({ records }) {
  const summary = aidSummary(records).map((row) => ({
    ...row,
    name: labels[row.type],
  }));
  const months = monthlyAidSummary(records);
  const hasAid = summary.some((row) => row.receipts > 0);
  const chart = (key, name, currency = false) => (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={summary}
        margin={{ top: 16, right: 18, left: 6, bottom: 12 }}
        accessibilityLayer
      >
        <CartesianGrid
          vertical={false}
          strokeDasharray="3 3"
          stroke="#e8edf4"
        />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11 }}
          tickFormatter={currency ? compact : undefined}
          width={64}
        />
        <Tooltip
          formatter={(value) => (currency ? money(value) : `${value} BUMDes`)}
        />
        <Bar
          dataKey={key}
          name={name}
          fill="#1684ef"
          maxBarSize={64}
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
  return (
    <section
      className="aid-charts"
      aria-label="Grafik penerimaan berdasarkan jenis bantuan"
    >
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h3>BUMDes penerima per jenis bantuan</h3>
            <p>Satu BUMDes dihitung sekali pada setiap jenis yang diterima.</p>
          </div>
        </div>
        {hasAid ? (
          chart("recipients", "BUMDes penerima")
        ) : (
          <p className="padded hint">
            Belum ada penerimaan dengan jenis bantuan yang dilengkapi.
          </p>
        )}
      </article>
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h3>Total dana per jenis bantuan</h3>
            <p>Akumulasi seluruh penerimaan dalam rupiah.</p>
          </div>
        </div>
        {hasAid ? (
          chart("amount", "Total dana", true)
        ) : (
          <p className="padded hint">
            Belum ada nominal penerimaan berdasarkan jenis bantuan.
          </p>
        )}
      </article>
      <article className="panel aid-chart-wide">
        <div className="panel-heading">
          <div>
            <h3>Penerimaan bantuan per bulan · 2026</h3>
            <p>
              Jumlah penerimaan, bukan jumlah BUMDes. Satu BUMDes dapat menerima
              dana beberapa kali.
            </p>
          </div>
        </div>
        {months.some((row) => row.total > 0) ? (
          <ResponsiveContainer width="100%" height={310}>
            <BarChart
              data={months}
              margin={{ top: 16, right: 18, left: 0, bottom: 8 }}
              accessibilityLayer
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#e8edf4"
              />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} minTickGap={6} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => `${value} penerimaan`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {Object.entries(labels)
                .filter(
                  ([type]) =>
                    type !== "unclassified" ||
                    months.some((row) => row.unclassified > 0),
                )
                .map(([type, label]) => (
                  <Bar
                    key={type}
                    dataKey={type}
                    name={label}
                    fill={colors[type]}
                    stackId="receipts"
                    maxBarSize={40}
                  />
                ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="padded hint">
            Belum ada penerimaan bertanggal pada tahun 2026.
          </p>
        )}
        <details className="padded">
          <summary>Lihat angka pada grafik</summary>
          <div
            className="table-scroll"
            role="region"
            tabIndex={0}
            aria-label="Angka grafik per jenis bantuan"
          >
            <table>
              <thead>
                <tr>
                  <th>Jenis bantuan</th>
                  <th>BUMDes</th>
                  <th>Penerimaan</th>
                  <th>Total dana</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row) => (
                  <tr key={row.type}>
                    <td>{row.label}</td>
                    <td>{row.recipients}</td>
                    <td>{row.receipts}</td>
                    <td>{money(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div
            className="table-scroll"
            role="region"
            tabIndex={0}
            aria-label="Angka grafik bulanan"
          >
            <table>
              <thead>
                <tr>
                  <th>Bulan</th>
                  {Object.entries(labels).map(([key, label]) => (
                    <th key={key}>{label}</th>
                  ))}
                  <th>Total penerimaan</th>
                </tr>
              </thead>
              <tbody>
                {months.map((row) => (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    {Object.keys(labels).map((key) => (
                      <td key={key}>{row[key]}</td>
                    ))}
                    <td>{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </article>
    </section>
  );
}
