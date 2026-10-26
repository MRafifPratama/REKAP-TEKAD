import { RegionFields } from "./RegionFields.jsx";
import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Building2,
  ArrowUpRight,
  ShieldCheck,
  Save,
  KeyRound,
  UserRound,
  MapPin,
  ChevronRight,
  FileText,
  Download,
  Trash2,
  Upload,
} from "lucide-react";
import { api } from "./lib/api.js";
import { money, emptyProfile, profileLabels } from "./lib/model.js";
function Brand() {
  return (
    <div className="brand">
      <div className="brandlogos">
        <img src="/logo-kemendes.svg" alt="Logo Kemendesa" />
        <span />
        <img className="tekad" src="/logo-tekad.jpeg" alt="Logo TEKAD" />
      </div>
      <div className="brandname">
        Rekap<span>TEKAD</span>
        <small>SISTEM INFORMASI BANTUAN</small>
      </div>
    </div>
  );
}
function Field({
  name,
  label,
  value,
  onChange,
  type = "text",
  required = true,
  ...props
}) {
  return (
    <label className="field">
      {label}
      <input
        name={name}
        type={type}
        value={value ?? ""}
        onChange={(e) =>
          onChange(type === "number" ? Number(e.target.value) : e.target.value)
        }
        required={required}
        {...props}
      />
    </label>
  );
}
function ProfileFields({ value, onChange }) {
  return (
    <>
      {Object.entries(profileLabels)
        .filter(
          ([k]) => !["province", "regency", "district", "village"].includes(k),
        )
        .map(([k, label]) => (
          <Field
            key={k}
            label={label}
            name={k}
            value={value[k]}
            type={k === "email" ? "email" : "text"}
            onChange={(v) => onChange({ ...value, [k]: v })}
          />
        ))}
      <RegionFields value={value} onChange={onChange} />
    </>
  );
}
function Auth({ onLogin }) {
  const [register, setRegister] = useState(false),
    [showPassword, setShowPassword] = useState(false),
    [form, setForm] = useState({ ...emptyProfile, password: "" }),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (register) {
        await api("/auth/register", { method: "POST", body: form });
        setRegister(false);
        setShowPassword(false);
        setSuccess(
          "Registrasi berhasil. Akun Anda langsung aktif. Silakan masuk.",
        );
      } else
        onLogin(
          await api("/auth/login", {
            method: "POST",
            body: { username: form.username, password: form.password },
          }),
        );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth">
      <section className="auth-story">
        <Brand />
        <div>
          <span className="eyebrow">
            KEMENTERIAN DESA DAN PEMBANGUNAN DAERAH TERTINGGAL
          </span>
          <h1>
            Data terhubung.
            <br />
            Desa bertumbuh.
          </h1>
          <p>
            Pantau penyaluran bantuan, kenali potensi BUMDes, dan bangun ekonomi
            kampung yang lebih kuat bersama TEKAD.
          </p>
          <div className="auth-orbit">
            <Building2 size={70} />
            <span>TEKAD 2026</span>
            <small>Membangun dari kampung</small>
          </div>
        </div>
        <footer>
          <ShieldCheck size={17} /> Akses terautentikasi · Data tercatat dengan
          aman
        </footer>
      </section>
      <section className="auth-form">
        <div className="mobile-brand">
          <Brand />
        </div>
        <div className="auth-box">
          <span className="pill">PORTAL REKAP TEKAD</span>
          <h2>{register ? "Buat akun Anda" : "Selamat datang kembali"}</h2>
          <p>
            {register
              ? "Lengkapi identitas untuk mulai menghimpun data bantuan."
              : "Masuk untuk mengelola data bantuan TEKAD 2026."}
          </p>
          {error && (
            <div role="alert" className="alert error">
              {error}
            </div>
          )}
          {success && <div className="alert success">{success}</div>}
          <form
            onSubmit={submit}
            className={register ? "form-grid" : "form-stack"}
          >
            {register ? (
              <ProfileFields value={form} onChange={setForm} />
            ) : (
              <Field
                label="Username"
                value={form.username}
                onChange={(v) => setForm({ ...form, username: v })}
                autoComplete="username"
              />
            )}
            <div className="field">
              <label htmlFor="auth-password">Password</label>
              <div className="password-input">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  minLength={register ? 12 : 1}
                  autoComplete={register ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  aria-pressed={showPassword}
                  aria-controls="auth-password"
                  onClick={() => setShowPassword((shown) => !shown)}
                >
                  {showPassword ? (
                    <EyeOff size={20} aria-hidden="true" />
                  ) : (
                    <Eye size={20} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            {register && (
              <p className="wide hint">
                Minimal 12 karakter, mengandung huruf besar, huruf kecil, dan
                angka. Akun langsung aktif setelah registrasi.
              </p>
            )}
            <button disabled={busy} className="primary wide">
              {busy
                ? "Memproses…"
                : register
                  ? "Daftar akun"
                  : "Masuk ke dashboard"}{" "}
              <ArrowUpRight size={18} />
            </button>
          </form>
          <div className="auth-switch">
            {register ? "Sudah memiliki akun?" : "Belum memiliki akun?"}{" "}
            <button
              onClick={() => {
                setRegister(!register);
                setShowPassword(false);
                setError("");
                setSuccess("");
              }}
            >
              {register ? "Masuk di sini" : "Daftar sekarang"}
            </button>
          </div>
        </div>
        <small className="copyright">© 2026 Rekap TEKAD · Kemendesa</small>
      </section>
    </div>
  );
}
function Empty({ text }) {
  return (
    <div className="empty">
      <Building2 size={30} />
      <p>{text}</p>
    </div>
  );
}
function Badge({ received }) {
  return (
    <span className={"badge " + (received ? "received" : "pending")}>
      <i />
      {received ? "Sudah menerima" : "Belum menerima"}
    </span>
  );
}
function RecordForm({ value, save, busy, embedded = false, children }) {
  const [v, set] = useState(value),
    s = (k, x) => set({ ...v, [k]: x });
  return (
    <form
      className="modal-body form-grid"
      onSubmit={(e) => {
        e.preventDefault();
        save(v);
      }}
    >
      <h3 className="form-section">
        01 <span>Profil wilayah</span>
      </h3>
      <RegionFields value={v} onChange={set} />
      <h3 className="form-section">
        02 <span>Profil BUMDes</span>
      </h3>
      {[
        ["name", "Nama BUMDes"],
        ["address", "Alamat BUMDes"],
        ["contactName", "Nama contact person"],
        ["contactEmail", "Email contact person"],
        ["contactPhone", "Nomor HP contact person"],
        ["location", "Tautan Google Maps (HTTPS)"],
      ].map(([k, l]) => (
        <Field
          key={k}
          label={l}
          type={
            k === "contactEmail" ? "email" : k === "location" ? "url" : "text"
          }
          value={v[k]}
          onChange={(x) => s(k, x)}
        />
      ))}
      <label className="field wide">
        Susunan pengurus
        <textarea
          required
          value={v.management}
          onChange={(e) => s("management", e.target.value)}
          placeholder="Nama, jabatan, dan keterangan pengurus"
        />
      </label>
      <label className="field wide">
        Produk yang dijual
        <textarea
          required
          value={v.products}
          onChange={(e) => s("products", e.target.value)}
          placeholder="Daftar produk / jasa BUMDes"
        />
      </label>
      <h3 className="form-section">
        03 <span>Penerimaan bantuan TEKAD 2026</span>
      </h3>
      <label className="field wide">
        Status penerimaan
        <select
          value={String(v.received)}
          onChange={(e) =>
            set({
              ...v,
              received: e.target.value === "true",
              ...(e.target.value === "false"
                ? { amount: 0, receivedDate: "" }
                : {}),
            })
          }
        >
          <option value="false">Belum menerima</option>
          <option value="true">Sudah menerima</option>
        </select>
      </label>
      {v.received && (
        <>
          <Field
            label="Tanggal diterima"
            type="date"
            min="2026-01-01"
            max={new Date().toISOString().slice(0, 10)}
            value={v.receivedDate}
            onChange={(x) => s("receivedDate", x)}
          />
          <Field
            label="Jumlah diterima (Rp)"
            type="number"
            min="1"
            step="1"
            value={v.amount}
            onChange={(x) => s("amount", x)}
          />
        </>
      )}
      <div className="hint wide">
        {embedded
          ? "Lampiran dapat dipilih saat mengisi formulir pertama kali. Setelah data tersimpan, kelola lampiran melalui bagian dokumentasi di bawah."
          : "Foto bagan pengurus, foto bangunan, dan bukti penerimaan dapat diunggah setelah data disimpan melalui tombol Lihat detail."}
      </div>
      {children}
      <div className="form-actions wide">
        <button className="primary" disabled={busy}>
          <Save size={17} />
          {busy
            ? "Menyimpan…"
            : value.id
              ? "Perbarui data BUMDes"
              : "Simpan data BUMDes"}
        </button>
      </div>
    </form>
  );
}
function UserForm({ value, save, busy }) {
  const [v, set] = useState(value);
  return (
    <form
      className="modal-body form-grid"
      onSubmit={(e) => {
        e.preventDefault();
        save(v);
      }}
    >
      <ProfileFields value={v} onChange={set} />
      {!v.id && (
        <Field
          label="Password (12+ karakter, huruf besar/kecil, angka)"
          type="password"
          minLength={12}
          value={v.password}
          onChange={(x) => set({ ...v, password: x })}
        />
      )}
      <label className="field">
        Peran
        <select
          value={v.role}
          onChange={(e) => set({ ...v, role: e.target.value })}
        >
          <option value="user">Pengguna</option>
          <option value="admin">Administrator</option>
        </select>
      </label>
      <label className="field">
        Status
        <select
          value={String(v.active)}
          onChange={(e) => set({ ...v, active: e.target.value === "true" })}
        >
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
      </label>
      <div className="form-actions wide">
        <button disabled={busy} className="primary">
          <Save size={17} />
          Simpan pengguna
        </button>
      </div>
    </form>
  );
}
function Profile({ user, setUser, action, busy }) {
  const [v, set] = useState(user),
    [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  return (
    <div className="profile-layout">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Informasi pribadi</h3>
            <p>Identitas dan wilayah pengguna</p>
          </div>
          <UserRound size={22} />
        </div>
        <form
          className="form-grid padded"
          onSubmit={async (e) => {
            e.preventDefault();
            let updated;
            if (
              await action(async () => {
                updated = await api("/me", { method: "PUT", body: v });
              }, "Profil berhasil diperbarui.")
            )
              setUser(updated);
          }}
        >
          <ProfileFields value={v} onChange={set} />
          <div className="form-actions wide">
            <button className="primary" disabled={busy}>
              <Save size={17} />
              Simpan profil
            </button>
          </div>
        </form>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Keamanan akun</h3>
            <p>Ganti password secara berkala</p>
          </div>
          <KeyRound size={22} />
        </div>
        <form
          className="form-stack padded"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await action(
                () => api("/me/password", { method: "PUT", body: pw }),
                "Password diperbarui. Silakan masuk kembali.",
              )
            )
              setUser(null);
          }}
        >
          <Field
            label="Password saat ini"
            type="password"
            value={pw.currentPassword}
            onChange={(x) => setPw({ ...pw, currentPassword: x })}
          />
          <Field
            label="Password baru"
            type="password"
            minLength={12}
            value={pw.newPassword}
            onChange={(x) => setPw({ ...pw, newPassword: x })}
          />
          <p className="hint">
            Minimal 12 karakter: huruf besar, huruf kecil, dan angka. Semua sesi
            akan diakhiri setelah perubahan.
          </p>
          <button className="primary" disabled={busy}>
            Perbarui password
          </button>
        </form>
      </section>
    </div>
  );
}
function Detail({ record, action, busy, attachmentsOnly = false }) {
  const [files, setFiles] = useState([]),
    [kind, setKind] = useState("organization"),
    [file, setFile] = useState(null),
    [err, setErr] = useState("");
  async function load() {
    try {
      setFiles(await api("/records/" + record.id + "/files"));
    } catch (e) {
      setErr(e.message);
    }
  }
  useEffect(() => {
    load();
  }, [record.id]);
  const d = record.data;
  return (
    <div className="modal-body">
      {!attachmentsOnly && (
        <>
          <div className="detail-title">
            <div className="table-icon">
              <Building2 size={27} />
            </div>
            <div>
              <h2>{d.name}</h2>
              <p>
                {d.village} · {d.district} · {d.regency} · {d.province}
              </p>
            </div>
            <Badge received={d.received} />
          </div>
          <div className="detail-grid">
            {[
              ["Pengirim data", record.owner?.fullName || "—"],
              [
                "Username pengirim",
                record.owner?.username ? "@" + record.owner.username : "—",
              ],
              ["Alamat BUMDes", d.address],
              ["Contact person", d.contactName],
              ["Email", d.contactEmail],
              ["Nomor handphone", d.contactPhone],
              ["Susunan pengurus", d.management],
              ["Produk", d.products],
              ["Tanggal penerimaan", d.receivedDate || "—"],
              ["Jumlah bantuan", money(d.amount)],
            ].map(([l, v]) => (
              <div key={l}>
                <small>{l}</small>
                <p>{v}</p>
              </div>
            ))}
          </div>
          <a
            className="text-button"
            href={d.location}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MapPin size={17} />
            Lihat lokasi di Google Maps <ArrowUpRight size={15} />
          </a>
        </>
      )}
      <h3 className="attachment-heading">Dokumentasi & bukti penerimaan</h3>
      <p className="hint">
        PNG / JPG / JPEG untuk foto. Bukti penerimaan hanya PDF. Maksimal 2 MB
        per berkas; dikompres otomatis hingga maksimal 1 MB sebelum disimpan.
      </p>
      {err && <div className="alert error">{err}</div>}
      <div className="file-list">
        {files.map((f) => (
          <div key={f.id}>
            <FileText size={21} />
            <span>
              <strong>{f.filename}</strong>
              <small>
                {
                  {
                    organization: "Bagan pengurus",
                    building: "Foto bangunan",
                    proof: "Bukti penerimaan",
                  }[f.kind]
                }
              </small>
            </span>
            <button
              aria-label="Unduh berkas"
              onClick={async () => {
                try {
                  const { url } = await api("/files/" + f.id);
                  window.open(url, "_blank", "noopener,noreferrer");
                } catch (e) {
                  setErr(e.message);
                }
              }}
            >
              <Download size={18} />
            </button>
            <button
              aria-label="Hapus lampiran"
              onClick={async () => {
                if (window.confirm("Hapus lampiran ini?")) {
                  await action(
                    () => api("/files/" + f.id, { method: "DELETE" }),
                    "Lampiran dihapus.",
                  );
                  load();
                }
              }}
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>
      {!files.length && (
        <p className="hint">
          Belum ada lampiran. Lengkapi dokumentasi BUMDes dan bukti bantuan yang
          sudah diterima.
        </p>
      )}
      <form
        className="upload-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!file || file.size > 2 * 1024 * 1024) {
            setErr("Pilih berkas dengan ukuran maksimal 2 MB.");
            return;
          }
          if (
            !(kind === "proof" ? /\.pdf$/i : /\.(png|jpe?g)$/i).test(file.name)
          ) {
            setErr("Foto hanya PNG/JPG/JPEG; bukti penerimaan hanya PDF.");
            return;
          }
          setErr("");
          const body = new FormData();
          body.append("kind", kind);
          body.append("file", file);
          if (
            await action(
              () =>
                api("/records/" + record.id + "/files", {
                  method: "POST",
                  body,
                }),
              "Lampiran berhasil diunggah.",
            )
          ) {
            setFile(null);
            e.target.reset();
            load();
          }
        }}
      >
        <select
          aria-label="Jenis lampiran"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setFile(null);
            setErr("");
          }}
        >
          <option value="organization">Bagan pengurus</option>
          <option value="building">Foto bangunan</option>
          <option value="proof">Bukti penerimaan</option>
        </select>
        <input
          key={kind}
          aria-label="Pilih lampiran"
          type="file"
          accept={kind === "proof" ? ".pdf" : ".jpg,.jpeg,.png"}
          required
          onChange={(e) => setFile(e.target.files[0])}
        />
        {file && <p className="selected-file">Berkas dipilih: {file.name}</p>}
        <button disabled={busy} className="primary">
          <Upload size={16} />
          Unggah
        </button>
      </form>
    </div>
  );
}

export { Auth, Brand, Empty, Badge, RecordForm, UserForm, Profile, Detail };
