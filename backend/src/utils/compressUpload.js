import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const run = promisify(execFile);
export const STORAGE_LIMIT = 1024 * 1024;
let active = 0;
const failure = (message, status = 422) =>
  Object.assign(new Error(message), { status });
export async function compressUpload(input, mime) {
  if (input.length > 2 * STORAGE_LIMIT)
    throw failure("Ukuran unggahan maksimal 2 MB.", 413);
  if (active >= 2)
    throw failure(
      "Server sedang mengompres berkas lain. Coba kembali sebentar lagi.",
      503,
    );
  active++;
  try {
    let best = input;
    if (mime === "application/pdf") {
      const original = await PDFDocument.load(input);
      const pages = original.getPageCount();
      if (!pages) throw failure("PDF tidak memiliki halaman.");
      if (input.length > STORAGE_LIMIT) {
        const dir = await mkdtemp(join(tmpdir(), "tekad-compress-"));
        try {
          const source = join(dir, "input.pdf"),
            output = join(dir, "output.pdf");
          await writeFile(source, input, { mode: 0o600 });
          for (const dpi of [150, 120, 96]) {
            await run(
              process.env.GHOSTSCRIPT_PATH || "gs",
              [
                "-dSAFER",
                "-dBATCH",
                "-dNOPAUSE",
                "-dQUIET",
                "-sDEVICE=pdfwrite",
                "-dCompatibilityLevel=1.6",
                "-dPDFSETTINGS=/ebook",
                "-dDownsampleColorImages=true",
                "-dDownsampleGrayImages=true",
                `-dColorImageResolution=${dpi}`,
                `-dGrayImageResolution=${dpi}`,
                `-sOutputFile=${output}`,
                source,
              ],
              { timeout: 20000, maxBuffer: 1024 * 1024 },
            );
            const size = (await stat(output)).size;
            if (size <= STORAGE_LIMIT) {
              const candidate = await readFile(output);
              if ((await PDFDocument.load(candidate)).getPageCount() !== pages)
                throw failure("PDF hasil kompresi tidak lengkap.");
              best = candidate;
              break;
            }
          }
        } finally {
          await rm(dir, { recursive: true, force: true });
        }
      }
    } else {
      const image = sharp(input, {
        limitInputPixels: 40000000,
        animated: false,
      });
      const meta = await image.metadata();
      if (!["jpeg", "png"].includes(meta.format))
        throw failure("Foto harus PNG/JPG/JPEG.");
      // Decode even small files so truncated/corrupt images cannot enter storage.
      for (const [width, quality] of [
        [2400, 85],
        [2000, 75],
        [1600, 65],
        [1200, 55],
      ]) {
        let pipeline = image
          .clone()
          .rotate()
          .resize({
            width,
            height: width,
            fit: "inside",
            withoutEnlargement: true,
          });
        pipeline =
          mime === "image/png"
            ? pipeline.png({ compressionLevel: 9, palette: true, quality })
            : pipeline.jpeg({ quality, mozjpeg: true });
        const candidate = await pipeline.toBuffer();
        if (candidate.length < best.length) best = candidate;
        if (best.length <= STORAGE_LIMIT) break;
      }
    }
    if (best.length > STORAGE_LIMIT)
      throw failure(
        "Berkas belum dapat dikompres hingga 1 MB. Kurangi resolusi atau jumlah halaman, lalu unggah kembali.",
      );
    return best;
  } catch (error) {
    if (error.status) throw error;
    if (error.code === "ENOENT")
      throw failure(
        "Kompresi PDF belum tersedia. Administrator perlu mengatur Ghostscript pada server.",
        503,
      );
    throw failure(
      "Berkas tidak dapat diproses. Pastikan berkas tidak rusak, tidak terkunci, dan gunakan resolusi yang lebih kecil.",
    );
  } finally {
    active--;
  }
}
