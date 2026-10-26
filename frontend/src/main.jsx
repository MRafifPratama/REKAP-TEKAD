import UserRecordPage from "./UserRecordPage.jsx";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/plus-jakarta-sans/latin-600.css";
import "@fontsource/plus-jakarta-sans/latin-700.css";
import "@fontsource/plus-jakarta-sans/latin-800.css";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  Building2,
  Users,
  History,
  UserRound,
  LogOut,
  Plus,
  Search,
  ArrowUpRight,
  ChevronRight,
  MapPin,
  Wallet,
  CheckCircle2,
  Clock3,
  Download,
  Menu,
  X,
  FileText,
  ShieldCheck,
  Eye,
  Pencil,
  Trash2,
  Save,
  Upload,
  KeyRound,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./style.css";
import "./styles/mobile.css";
import { api } from "./lib/api.js";
import { money, emptyProfile, emptyRecord } from "./lib/model.js";
import {
  Auth,
  Brand,
  Empty,
  Badge,
  RecordForm,
  UserForm,
  Profile,
  Detail,
} from "./components.jsx";
function App() {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [page, setPage] = useState("dashboard"),
    [records, setRecords] = useState([]),
    [logs, setLogs] = useState([]),
    [users, setUsers] = useState([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [modal, setModal] = useState(null),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [mobile, setMobile] = useState(false),
    [health, setHealth] = useState(null),
    [recordLoadState, setRecordLoadState] = useState("loading"),
    [additionalCount, setAdditionalCount] = useState(0),
    [smallScreen, setSmallScreen] = useState(false);
  function enterAccount(account) {
    setPage(account.role === "admin" ? "dashboard" : "form");
    setUser(account);
  }
  useEffect(() => {
    api("/me")
      .then(enterAccount)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  async function refresh() {
    try {
      const [r, l, h] = await Promise.all([
        api(user?.role === "admin" ? "/records" : "/records/mine"),
        api("/logs"),
        api("/health"),
      ]);
      setRecords(user?.role === "admin" ? r : r.record ? [r.record] : []);
      setAdditionalCount(user?.role === "admin" ? 0 : r.additionalCount);
      setRecordLoadState("ready");
      setLogs(l);
      setHealth(h);
      if (user?.role === "admin") setUsers(await api("/users"));
      setError("");
    } catch (e) {
      setError(e.message);
      setRecordLoadState("error");
    }
  }
  useEffect(() => {
    if (user) {
      setRecordLoadState("loading");
      refresh();
    } else {
      setRecords([]);
      setLogs([]);
      setUsers([]);
      setModal(null);
      setMobile(false);
      setPage("dashboard");
      setNotice("");
      setError("");
    }
  }, [user]);
  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener("tekad:session-expired", expire);
    return () => window.removeEventListener("tekad:session-expired", expire);
  }, []);
  useEffect(() => {
    setQuery("");
    setStatus("all");
  }, [page]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement;
    const dialog = document.querySelector('[role="dialog"]');
    const selector =
      "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]";
    dialog?.querySelector(selector)?.focus();
    function handle(e) {
      if (e.key === "Escape") {
        setModal(null);
        return;
      }
      if (e.key !== "Tab") return;
      const elements = [...dialog.querySelectorAll(selector)].filter(
        (el) => el.getClientRects().length,
      );
      const first = elements[0],
        last = elements[elements.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, [modal]);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 800px)");
    const update = () => {
      setSmallScreen(query.matches);
      if (!query.matches) setMobile(false);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!modal && !(smallScreen && mobile)) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [modal, smallScreen, mobile]);
  useEffect(() => {
    if (!smallScreen || !mobile) return;
    const previous = document.activeElement;
    const drawer = document.getElementById("primary-navigation");
    drawer?.querySelector(".sidebar-close")?.focus();
    function handle(event) {
      if (event.key === "Escape") {
        setMobile(false);
        return;
      }
      if (event.key !== "Tab") return;
      const controls = [
        ...drawer.querySelectorAll("button:not([disabled]), a[href]"),
      ].filter((el) => el.getClientRects().length);
      const first = controls[0],
        last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, [mobile, smallScreen]);
  async function action(fn, msg) {
    setBusy(true);
    setError("");
    try {
      await fn();
      setNotice(msg);
      await refresh();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
    } catch (e) {
      setError(e.message);
    }
  }
  const nav = [
    ...(user?.role === "admin"
      ? [
          ["dashboard", "Dashboard", LayoutDashboard],
          ["records", "Data penerima", Building2],
          ["users", "Manajemen pengguna", Users],
        ]
      : [["form", "Formulir BUMDes saya", Building2]]),
    ["logs", "Log aktivitas", History],
    ["profile", "Profil saya", UserRound],
  ];
  const received = records.filter((r) => r.data.received),
    total = received.reduce((s, r) => s + r.data.amount, 0),
    provinces = [...new Set(records.map((r) => r.data.province))],
    filtered = records.filter(
      (r) =>
        (status === "all" || String(r.data.received) === status) &&
        [r.data.name, r.data.province, r.data.regency, r.data.village].some(
          (v) => v.toLowerCase().includes(query.toLowerCase()),
        ),
    );
  const chart = provinces.map((name) => ({
    name,
    sudah: records.filter((r) => r.data.province === name && r.data.received)
      .length,
    belum: records.filter((r) => r.data.province === name && !r.data.received)
      .length,
  }));
  if (loading) return <div className="loading">Memuat Rekap TEKAD…</div>;
  if (!user) return <Auth onLogin={enterAccount} />;
  function go(p) {
    setPage(p);
    setMobile(false);
  }
  function exportCsv() {
    const rows = [
      [
        "Nama BUMDes",
        "Provinsi",
        "Kabupaten",
        "Kecamatan",
        "Desa",
        "Status",
        "Tanggal",
        "Jumlah",
      ],
      ...filtered.map((r) => [
        r.data.name,
        r.data.province,
        r.data.regency,
        r.data.district,
        r.data.village,
        r.data.received ? "Sudah menerima" : "Belum menerima",
        r.data.receivedDate,
        r.data.amount,
      ]),
    ];
    const csv =
      "\ufeff" +
      rows
        .map((row) =>
          row
            .map(
              (v) =>
                '"' +
                String(v)
                  .replace(/^[=+@-]/, "'$&")
                  .replaceAll('"', '""') +
                '"',
            )
            .join(","),
        )
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "rekap-tekad-2026.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="app">
      <aside
        id="primary-navigation"
        aria-label="Navigasi utama"
        aria-hidden={smallScreen && !mobile ? true : undefined}
        className={mobile ? "sidebar open" : "sidebar"}
        inert={!!modal || (smallScreen && !mobile)}
      >
        <div className="sidebar-header">
          <Brand />
          <button
            type="button"
            className="sidebar-close"
            aria-label="Tutup menu"
            onClick={() => setMobile(false)}
          >
            <X size={21} />
          </button>
        </div>
        <div className="workspace">
          TAHUN PROGRAM{" "}
          <strong>
            2026 <span>Aktif</span>
          </strong>
        </div>
        <small className="nav-label">MENU UTAMA</small>
        <nav>
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={page === id ? "selected" : ""}
              aria-current={page === id ? "page" : undefined}
              onClick={() => go(id)}
            >
              <Icon size={19} />
              {label}
              {page === id && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="support">
            <ShieldCheck size={24} />
            <strong>Data yang dapat dipercaya</strong>
            <p>Setiap perubahan tercatat untuk transparansi program.</p>
          </div>
          <button className="logout" onClick={logout}>
            <LogOut size={18} />
            Keluar akun
          </button>
          <small>REKAP TEKAD · KEMENDESA</small>
        </div>
      </aside>
      {smallScreen && mobile && (
        <button
          type="button"
          className="overlay"
          aria-label="Tutup menu navigasi"
          tabIndex={-1}
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main" inert={!!modal || (smallScreen && mobile)}>
        <header className="topbar">
          <button
            className="mobile-toggle"
            aria-label="Buka menu"
            aria-expanded={smallScreen && mobile}
            aria-controls="primary-navigation"
            onClick={() => setMobile(true)}
          >
            <Menu />
          </button>
          <div className="breadcrumbs">
            <span className="breadcrumb-root">Workspace</span>
            <ChevronRight className="breadcrumb-separator" size={14} />
            <strong>{nav.find((n) => n[0] === page)?.[1]}</strong>
          </div>
          <div className="top-right">
            <span className="local-dot">Localhost</span>
            <div className="user-avatar">
              {user.fullName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <strong>{user.fullName}</strong>
              <small>
                {user.role === "admin" ? "Administrator" : "Pengguna"}
              </small>
            </div>
          </div>
        </header>
        <main>
          <div className="page-head">
            <div>
              <span className="eyebrow">MONITORING BANTUAN TEKAD 2026</span>
              <h1>{nav.find((n) => n[0] === page)?.[1]}</h1>
              <p>
                {page === "form"
                  ? "Isi dan perbarui profil BUMDes serta penerimaan bantuan TEKAD Anda."
                  : page === "dashboard"
                    ? "Gambaran penyaluran bantuan untuk kemajuan ekonomi kampung."
                    : page === "records"
                      ? "Kelola profil BUMDes dan catat penerimaan bantuan secara terpusat."
                      : page === "users"
                        ? "Kelola akses dan akun pengguna aplikasi."
                        : page === "logs"
                          ? "Telusuri aktivitas dan riwayat perubahan data."
                          : "Kelola identitas dan keamanan akun Anda."}
              </p>
            </div>
            {user.role === "admin" &&
              ["dashboard", "records"].includes(page) && (
                <button
                  className="primary"
                  onClick={() =>
                    setModal({ type: "record", value: { ...emptyRecord } })
                  }
                >
                  <Plus size={18} />
                  Tambah data
                </button>
              )}
            {page === "users" && (
              <button
                className="primary"
                onClick={() =>
                  setModal({
                    type: "user",
                    value: {
                      ...emptyProfile,
                      password: "",
                      role: "user",
                      active: true,
                    },
                  })
                }
              >
                <Plus size={18} />
                Tambah pengguna
              </button>
            )}
          </div>
          {error && (
            <div role="alert" className="alert error">
              {error}
              <button onClick={() => setError("")} aria-label="Tutup pesan">
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div role="status" className="alert success">
              {notice}
              <button onClick={() => setNotice("")} aria-label="Tutup pesan">
                <X size={16} />
              </button>
            </div>
          )}
          {health && !health.storage && (
            <div className="setup-note">
              <ShieldCheck size={17} />{" "}
              {user.role === "admin"
                ? "Penyimpanan R2 belum terhubung. Lengkapi kredensial di konfigurasi server untuk mengunggah lampiran."
                : "Unggahan lampiran belum tersedia. Hubungi admin untuk mengaktifkan penyimpanan dokumen."}
            </div>
          )}
          {user.role !== "admin" && page === "form" && (
            <UserRecordPage
              user={user}
              record={records[0] || null}
              additionalCount={additionalCount}
              loadState={recordLoadState}
              onReload={refresh}
              action={action}
              busy={busy}
            />
          )}
          {user.role === "admin" && page === "dashboard" && (
            <>
              <section className="welcome">
                <div>
                  <span className="pill light">
                    DARI KAMPUNG, UNTUK INDONESIA
                  </span>
                  <h2>
                    Mendorong potensi desa.
                    <br />
                    Menghadirkan dampak nyata.
                  </h2>
                  <p>
                    Pantau perkembangan bantuan dan lengkapi data BUMDes
                    <br className="desktop" /> untuk mendukung penyaluran TEKAD
                    yang transparan.
                  </p>
                  <button onClick={() => go("records")}>
                    Lihat data penerima <ArrowUpRight size={17} />
                  </button>
                </div>
                <div className="hero-art">
                  <div className="art-ring ring1" />
                  <div className="art-ring ring2" />
                  <Building2 size={110} strokeWidth={1} />
                  <div className="art-label">
                    <span className="art-dot" /> TEKAD <strong>2026</strong>
                  </div>
                </div>
              </section>
              <section className="stats">
                {[
                  [
                    Building2,
                    "Total BUMDes",
                    records.length,
                    "Terdaftar dalam sistem",
                    "blue",
                  ],
                  [
                    CheckCircle2,
                    "Sudah menerima",
                    received.length,
                    "BUMDes penerima bantuan",
                    "green",
                  ],
                  [
                    Clock3,
                    "Belum menerima",
                    records.length - received.length,
                    "Menunggu penerimaan bantuan",
                    "orange",
                  ],
                  [
                    Wallet,
                    "Total bantuan",
                    money(total),
                    "Akumulasi bantuan yang diterima",
                    "purple",
                  ],
                ].map(([Icon, label, value, desc, color]) => (
                  <article className="stat" key={label}>
                    <div className={"stat-icon " + color}>
                      <Icon size={22} />
                    </div>
                    <span>{label}</span>
                    <strong
                      className={label === "Total bantuan" ? "money" : ""}
                    >
                      {value}
                    </strong>
                    <small>{desc}</small>
                  </article>
                ))}
              </section>
              <section className="charts">
                <article className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Penyaluran per provinsi</h3>
                      <p>Sebaran BUMDes berdasarkan status penerimaan</p>
                    </div>
                    <span className="tag">2026</span>
                  </div>
                  {chart.length ? (
                    <ResponsiveContainer width="100%" height={245}>
                      <BarChart
                        data={chart}
                        margin={{ top: 15, left: -20, right: 15 }}
                      >
                        <CartesianGrid
                          vertical={false}
                          strokeDasharray="3 3"
                          stroke="#e8edf4"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip />
                        <Bar
                          name="Sudah menerima"
                          dataKey="sudah"
                          stackId="a"
                          fill="#1684ef"
                          radius={[0, 0, 0, 0]}
                          maxBarSize={38}
                        />
                        <Bar
                          name="Belum menerima"
                          dataKey="belum"
                          stackId="a"
                          fill="#c9e3ff"
                          radius={[5, 5, 0, 0]}
                          maxBarSize={38}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Empty text="Grafik akan tampil setelah data BUMDes ditambahkan." />
                  )}
                  <div className="legend">
                    <span>
                      <i style={{ background: "#1684ef" }} />
                      Sudah menerima
                    </span>
                    <span>
                      <i style={{ background: "#c9e3ff" }} />
                      Belum menerima
                    </span>
                  </div>
                </article>
                <article className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Status penerimaan</h3>
                      <p>Progres penyaluran bantuan TEKAD</p>
                    </div>
                  </div>
                  {records.length ? (
                    <div className="donut">
                      <ResponsiveContainer width="100%" height={205}>
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Sudah menerima",
                                value: received.length,
                              },
                              {
                                name: "Belum menerima",
                                value: records.length - received.length,
                              },
                            ]}
                            innerRadius={67}
                            outerRadius={88}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            <Cell fill="#1684ef" />
                            <Cell fill="#e5effa" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="donut-label">
                        <strong>
                          {Math.round((received.length / records.length) * 100)}
                          %
                        </strong>
                        <small>Sudah menerima</small>
                      </div>
                    </div>
                  ) : (
                    <Empty text="Belum ada data penerimaan." />
                  )}
                  <div className="donut-footer">
                    <span>
                      <i />
                      Sudah menerima <strong>{received.length}</strong>
                    </span>
                    <span>
                      <i />
                      Belum menerima{" "}
                      <strong>{records.length - received.length}</strong>
                    </span>
                  </div>
                </article>
              </section>
            </>
          )}
          {user.role === "admin" && ["dashboard", "records"].includes(page) && (
            <section className="panel data-panel">
              <div className="panel-heading">
                <div>
                  <h3>
                    {page === "dashboard"
                      ? "Data BUMDes terbaru"
                      : "Daftar data BUMDes"}{" "}
                    <span className="count">{records.length}</span>
                  </h3>
                  <p>
                    {page === "dashboard"
                      ? "Pembaruan terakhir profil dan penerimaan bantuan"
                      : "Informasi wilayah, profil usaha, dan status bantuan"}
                  </p>
                </div>
                {page === "dashboard" ? (
                  <button className="text-button" onClick={() => go("records")}>
                    Lihat semua <ChevronRight size={16} />
                  </button>
                ) : (
                  <button className="secondary" onClick={exportCsv}>
                    <Download size={16} />
                    Ekspor CSV
                  </button>
                )}
              </div>
              <div className="table-tools">
                <div className="search">
                  <Search size={17} />
                  <input
                    aria-label="Cari data BUMDes"
                    placeholder="Cari nama BUMDes, desa, atau wilayah…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <select
                  aria-label="Filter status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">Semua status</option>
                  <option value="true">Sudah menerima</option>
                  <option value="false">Belum menerima</option>
                </select>
              </div>
              <p className="table-hint">
                Geser tabel ke samping untuk melihat seluruh kolom.
              </p>
              <div
                className="table-scroll"
                role="region"
                tabIndex={0}
                aria-label="Tabel data, dapat digeser ke samping"
              >
                <table>
                  <thead>
                    <tr>
                      <th>NAMA BUMDES</th>
                      <th>WILAYAH</th>
                      <th>STATUS BANTUAN</th>
                      <th>JUMLAH DITERIMA</th>
                      <th>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(page === "dashboard"
                      ? filtered.slice(0, 5)
                      : filtered
                    ).map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div className="name-cell">
                            <div className="table-icon">
                              <Building2 size={19} />
                            </div>
                            <div>
                              <strong>{r.data.name}</strong>
                              <small>Desa {r.data.village}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong>{r.data.regency}</strong>
                          <small>{r.data.province}</small>
                        </td>
                        <td>
                          <Badge received={r.data.received} />
                        </td>
                        <td className="amount">
                          {r.data.received ? money(r.data.amount) : "—"}
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              aria-label={"Lihat " + r.data.name}
                              onClick={() =>
                                setModal({ type: "detail", value: r })
                              }
                            >
                              <Eye size={17} />
                            </button>
                            <button
                              aria-label={"Edit " + r.data.name}
                              onClick={() =>
                                setModal({
                                  type: "record",
                                  value: {
                                    ...r.data,
                                    id: r.id,
                                    version: r.version,
                                  },
                                })
                              }
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              aria-label={"Hapus " + r.data.name}
                              onClick={() =>
                                setModal({ type: "deleteRecord", value: r })
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!filtered.length && (
                <Empty
                  text={
                    records.length
                      ? "Tidak ada hasil yang sesuai pencarian."
                      : "Belum ada data BUMDes. Mulai dengan menambahkan data pertama."
                  }
                />
              )}
              <div className="table-footer">
                Menampilkan{" "}
                {page === "dashboard"
                  ? Math.min(filtered.length, 5)
                  : filtered.length}{" "}
                dari {records.length} BUMDes{" "}
                <span>
                  <MapPin size={13} /> {provinces.length} provinsi terdata
                </span>
              </div>
            </section>
          )}
          {page === "users" && (
            <section className="panel">
              <div className="table-tools">
                <div className="search">
                  <Search size={17} />
                  <input
                    placeholder="Cari pengguna…"
                    aria-label="Cari pengguna"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
              <p className="table-hint">
                Geser tabel ke samping untuk melihat seluruh kolom.
              </p>
              <div
                className="table-scroll"
                role="region"
                tabIndex={0}
                aria-label="Tabel data, dapat digeser ke samping"
              >
                <table>
                  <thead>
                    <tr>
                      <th>PENGGUNA</th>
                      <th>EMAIL</th>
                      <th>PERAN</th>
                      <th>STATUS</th>
                      <th>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter((u) =>
                        (u.fullName + " " + u.username + " " + u.email)
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                      )
                      .map((u) => (
                        <tr key={u.id}>
                          <td>
                            <strong>{u.fullName}</strong>
                            <small>@{u.username}</small>
                          </td>
                          <td>{u.email}</td>
                          <td>
                            {u.role === "admin" ? "Administrator" : "Pengguna"}
                          </td>
                          <td>
                            <span
                              className={
                                "badge " + (u.active ? "received" : "pending")
                              }
                            >
                              {u.active ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td>
                            <div className="row-actions">
                              <button
                                aria-label="Edit pengguna"
                                onClick={() =>
                                  setModal({ type: "user", value: u })
                                }
                              >
                                <Pencil size={17} />
                              </button>
                              <button
                                aria-label="Hapus pengguna"
                                onClick={() =>
                                  setModal({ type: "deleteUser", value: u })
                                }
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {page === "logs" && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Riwayat aktivitas</h3>
                  <p>
                    500 aktivitas terbaru{" "}
                    {user.role === "admin" ? "seluruh pengguna" : "akun Anda"}.
                    Waktu ditampilkan sesuai zona komputer.
                  </p>
                </div>
              </div>
              <p className="table-hint">
                Geser tabel ke samping untuk melihat seluruh kolom.
              </p>
              <div
                className="table-scroll"
                role="region"
                tabIndex={0}
                aria-label="Tabel data, dapat digeser ke samping"
              >
                <table>
                  <thead>
                    <tr>
                      <th>WAKTU</th>
                      <th>PENGGUNA</th>
                      <th>AKTIVITAS</th>
                      <th>OBJEK</th>
                      <th>PERUBAHAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l.id}>
                        <td>
                          {new Date(l.created_at).toLocaleString("id-ID")}
                        </td>
                        <td>@{l.username}</td>
                        <td>
                          <span className="log-action">{l.action}</span>
                        </td>
                        <td>
                          {l.entity} #{l.entity_id}
                        </td>
                        <td>
                          <button
                            className="text-button"
                            onClick={() => setModal({ type: "log", value: l })}
                          >
                            Lihat detail <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!logs.length && <Empty text="Belum ada riwayat aktivitas." />}
            </section>
          )}
          {page === "profile" && (
            <Profile
              user={user}
              setUser={setUser}
              action={action}
              busy={busy}
            />
          )}
          <footer className="main-footer">
            <span>© 2026 Rekap TEKAD. Kemendesa.</span>
            <span>Transformasi Ekonomi Kampung Terpadu</span>
          </footer>
        </main>
      </div>
      {modal && (
        <div className="modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Detail dan pengelolaan data"
            className={
              "modal " +
              (["record", "user", "detail"].includes(modal.type) ? "large" : "")
            }
          >
            <header>
              <div>
                <span className="eyebrow">REKAP TEKAD 2026</span>
                <h2>
                  {
                    {
                      record: modal.value.id
                        ? "Edit data BUMDes"
                        : "Tambah data BUMDes",
                      user: modal.value.id
                        ? "Edit pengguna"
                        : "Tambah pengguna",
                      detail: "Detail BUMDes",
                      log: "Detail aktivitas",
                      deleteRecord: "Hapus data BUMDes",
                      deleteUser: "Hapus pengguna",
                    }[modal.type]
                  }
                </h2>
              </div>
              <button aria-label="Tutup dialog" onClick={() => setModal(null)}>
                <X />
              </button>
            </header>
            {error && (
              <div role="alert" className="alert error">
                {error}
              </div>
            )}
            {modal.type === "record" && (
              <RecordForm
                value={modal.value}
                busy={busy}
                save={async (v) => {
                  const ok = await action(
                    () =>
                      api("/records" + (v.id ? "/" + v.id : ""), {
                        method: v.id ? "PUT" : "POST",
                        body: v,
                      }),
                    "Data BUMDes tersimpan. Unggah lampiran melalui detail data.",
                  );
                  if (ok) setModal(null);
                }}
              />
            )}
            {modal.type === "user" && (
              <UserForm
                value={modal.value}
                busy={busy}
                save={async (v) => {
                  if (
                    await action(
                      () =>
                        api("/users" + (v.id ? "/" + v.id : ""), {
                          method: v.id ? "PUT" : "POST",
                          body: v,
                        }),
                      "Pengguna berhasil disimpan.",
                    )
                  )
                    setModal(null);
                }}
              />
            )}
            {modal.type === "detail" && (
              <Detail record={modal.value} action={action} busy={busy} />
            )}
            {modal.type === "log" && (
              <div className="modal-body">
                <p>
                  {modal.value.action} · @{modal.value.username}
                </p>
                <pre>{JSON.stringify(modal.value.changes, null, 2)}</pre>
              </div>
            )}
            {modal.type.startsWith("delete") && (
              <div className="modal-body">
                <p>
                  Hapus{" "}
                  <strong>
                    {modal.value.data?.name || modal.value.fullName}
                  </strong>
                  ? Data BUMDes yang dihapus tidak dapat dikembalikan.
                  Penghapusan akun akan menutup akses dan mengarsipkan akun;
                  data serta riwayat aktivitas tetap tersimpan.
                </p>
                <div className="form-actions">
                  <button className="secondary" onClick={() => setModal(null)}>
                    Batal
                  </button>
                  <button
                    className="danger"
                    disabled={busy}
                    onClick={async () => {
                      if (
                        await action(
                          () =>
                            api(
                              "/" +
                                (modal.type === "deleteRecord"
                                  ? "records"
                                  : "users") +
                                "/" +
                                modal.value.id,
                              { method: "DELETE" },
                            ),
                          "Data berhasil dihapus.",
                        )
                      )
                        setModal(null);
                    }}
                  >
                    Hapus data
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
