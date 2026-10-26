import React, { useState, useEffect } from "react";
import { api } from "./lib/api.js";
const levels = [
  ["province", "Provinsi"],
  ["regency", "Kabupaten / kota"],
  ["district", "Kecamatan"],
  ["village", "Desa / kelurahan"],
];
const cache = new Map();
function optionsFor(parent) {
  const key = parent || "";
  if (!cache.has(key))
    cache.set(
      key,
      api("/regions" + (key ? "?parent=" + encodeURIComponent(key) : "")).catch(
        (error) => {
          cache.delete(key);
          throw error;
        },
      ),
    );
  return cache.get(key);
}
function RegionSelect({ label, parent, enabled, value, onChange }) {
  const [options, setOptions] = useState([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setOptions([]);
    setError("");
    setLoading(enabled);
    if (enabled)
      optionsFor(parent)
        .then((rows) => {
          if (!rows.length)
            throw new Error(
              parent
                ? "Wilayah turunan belum tersedia pada master data."
                : "Master wilayah kosong. Impor backend/database/02_wilayah.sql terlebih dahulu.",
            );
          if (live) setOptions(rows);
        })
        .catch((e) => {
          if (live) setError(e.message);
        })
        .finally(() => {
          if (live) setLoading(false);
        });
    return () => {
      live = false;
    };
  }, [parent, enabled, retry]);
  return (
    <label className="field">
      {label}
      <select
        value={value || ""}
        required
        disabled={!enabled || loading || !!error}
        onChange={(e) =>
          onChange(
            e.target.value,
            options.find((r) => r.kode === e.target.value)?.nama || "",
          )
        }
      >
        <option value="">
          {loading ? "Memuat wilayah…" : "Pilih " + label.toLowerCase()}
        </option>
        {options.map((r) => (
          <option key={r.kode} value={r.kode}>
            {r.nama}
          </option>
        ))}
      </select>
      {error && (
        <span role="alert" className="region-error">
          {error}
          <button
            type="button"
            onClick={() => {
              cache.delete(parent || "");
              setRetry((v) => v + 1);
            }}
          >
            Coba lagi
          </button>
        </span>
      )}
    </label>
  );
}
export function RegionFields({ value, onChange }) {
  function select(index, code, name) {
    const next = { ...value };
    for (let i = index; i < levels.length; i++) {
      const key = levels[i][0];
      next[key + "Code"] = i === index ? code : "";
      next[key] = i === index ? name : "";
    }
    onChange(next);
  }
  return (
    <>
      {levels.map(([key, label], i) => (
        <RegionSelect
          key={key}
          label={label}
          value={value[key + "Code"]}
          enabled={i === 0 || !!value[levels[i - 1][0] + "Code"]}
          parent={i === 0 ? "" : value[levels[i - 1][0] + "Code"]}
          onChange={(code, name) => select(i, code, name)}
        />
      ))}
    </>
  );
}
