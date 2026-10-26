export async function api(path, options = {}) {
  const r = await fetch("/api" + path, {
    credentials: "same-origin",
    ...options,
    headers:
      options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json", ...options.headers },
    body:
      options.body instanceof FormData
        ? options.body
        : options.body
          ? JSON.stringify(options.body)
          : undefined,
  });
  const text = await r.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      "Backend belum dapat dihubungi. Jalankan npm run dev dari folder proyek, lalu coba lagi.",
    );
  }

  if (r.status === 401 && path !== "/auth/login")
    window.dispatchEvent(new Event("tekad:session-expired"));
  if (!r.ok) throw new Error(data.message || "Permintaan gagal");
  return data;
}
