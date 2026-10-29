import { showInputError } from "./lib/inputError.js";
import { recordBody } from "./lib/receipts.js";
import React, { useState, useEffect } from "react";
import { Building2, CheckCircle2 } from "lucide-react";
import { RecordForm, Detail } from "./components.jsx";
import { emptyRecord } from "./lib/model.js";
import { api } from "./lib/api.js";
export default function UserRecordPage({
  user,
  record,
  additionalCount,
  loadState,
  onReload,
  action,
  busy,
}) {
  const [pendingFiles, setPendingFiles] = useState({});
  const [fileError, setFileError] = useState("");
  useEffect(() => {
    if (fileError) {
      showInputError(fileError);
      setFileError("");
    }
  }, [fileError]);
  const regionKeys = [
    "province",
    "regency",
    "district",
    "village",
    "provinceCode",
    "regencyCode",
    "districtCode",
    "villageCode",
  ];
  const initial = record
    ? { ...record.data, id: record.id, version: record.version }
    : {
        ...emptyRecord,
        ...Object.fromEntries(regionKeys.map((k) => [k, user[k] || ""])),
      };
  if (loadState !== "ready")
    return (
      <section className="panel">
        <div className="empty">
          <Building2 size={30} />
          <p>
            {loadState === "error"
              ? "Data belum dapat dimuat. Muat ulang agar formulir menampilkan data yang benar."
              : "Memuat formulir BUMDes Anda…"}
          </p>
          {loadState === "error" && (
            <button type="button" className="primary" onClick={onReload}>
              Muat ulang data
            </button>
          )}
        </div>
      </section>
    );
  async function save(value) {
    if (fileError) return;
    await action(async () => {
      const result = await api("/records" + (value.id ? "/" + value.id : ""), {
        method: value.id ? "PUT" : "POST",
        body: recordBody(value),
      });
      const id = value.id || result.id;
      try {
        for (const [kind, file] of Object.entries(pendingFiles)) {
          const body = new FormData();
          body.append("kind", kind);
          body.append("file", file);
          await api("/records/" + id + "/files", { method: "POST", body });
          setPendingFiles((current) => {
            const next = { ...current };
            delete next[kind];
            return next;
          });
        }
      } catch (error) {
        await onReload();
        throw new Error(
          "Data BUMDes sudah tersimpan, tetapi unggahan belum selesai: " +
            error.message +
            ". Pilih kembali berkas yang gagal bila diperlukan, lalu simpan ulang.",
        );
      }
    }, "Data BUMDes dan lampiran yang dipilih berhasil disimpan.");
  }
  return (
    <div className="user-record-page">
      {additionalCount > 0 && (
        <div className="setup-note">
          Terdapat {additionalCount} data tambahan dari alur lama yang tetap
          tersimpan untuk ditinjau admin. Formulir ini menampilkan data pertama
          akun Anda.
        </div>
      )}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Formulir pendataan BUMDes</h3>
            <p>
              Satu akun pengguna memiliki satu formulir tetap. Lengkapi atau
              perbarui informasi pada formulir ini.
            </p>
          </div>
          <span className={"badge " + (record ? "received" : "pending")}>
            {record ? (
              <>
                <CheckCircle2 size={13} />
                Data tersimpan
              </>
            ) : (
              "Belum diisi"
            )}
          </span>
        </div>
        <RecordForm
          key={record ? record.id + ":" + record.version : "new"}
          value={initial}
          save={save}
          busy={busy}
          embedded
        >
          {(!record || Object.keys(pendingFiles).length > 0) && (
            <div className="wide form-stack">
              <h3>Dokumentasi dan bukti penerimaan</h3>
              <p className="hint">
                Pilih lampiran sekarang. Berkas akan diunggah saat Anda menekan
                Simpan data BUMDes. Foto: PNG/JPG/JPEG. Bukti penerimaan: PDF.
                Maksimal unggahan 2 MB per berkas; dikompres otomatis hingga
                maksimal 1 MB sebelum disimpan.
              </p>
              {[
                ["organization", "Foto bagan pengurus"],
                ["building", "Foto bangunan BUMDes"],
              ].map(([kind, label]) => (
                <label className="field" key={kind}>
                  {label}
                  <input
                    type="file"
                    disabled={busy}
                    accept={kind === "proof" ? ".pdf" : ".jpg,.jpeg,.png"}
                    onChange={(event) => {
                      const file = event.target.files[0];
                      if (file && file.size > 2 * 1024 * 1024) {
                        event.target.value = "";
                        setFileError(
                          "Ukuran berkas maksimal 2 MB. Pilih berkas yang lebih kecil.",
                        );
                        return;
                      }
                      if (
                        file &&
                        !(
                          kind === "proof" ? /\.pdf$/i : /\.(png|jpe?g)$/i
                        ).test(file.name)
                      ) {
                        event.target.value = "";
                        setFileError(
                          "Foto hanya PNG/JPG/JPEG; bukti penerimaan hanya PDF.",
                        );
                        return;
                      }
                      setFileError("");
                      setPendingFiles((current) => {
                        const next = { ...current };
                        if (file) next[kind] = file;
                        else delete next[kind];
                        return next;
                      });
                    }}
                  />
                  {pendingFiles[kind] && (
                    <span className="hint selected-file">
                      Siap diunggah: {pendingFiles[kind].name}
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </RecordForm>
      </section>
      <section className="panel">
        {record ? (
          <Detail record={record} action={action} busy={busy} attachmentsOnly />
        ) : (
          <div className="padded">
            <p className="hint">
              Lampiran yang berhasil diunggah akan ditampilkan di sini setelah
              formulir disimpan.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
