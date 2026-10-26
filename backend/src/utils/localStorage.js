import {
  mkdir,
  writeFile,
  readFile,
  unlink,
  access,
  realpath,
} from "node:fs/promises";
import { constants } from "node:fs";
import { resolve, dirname } from "node:path";
import { storageRoot } from "../config/storage.js";
export function createLocalStorage(root) {
  root = resolve(root);
  const missing = () =>
    Object.assign(
      new Error(
        "Berkas tidak ditemukan di penyimpanan server. Berkas lama dari R2 perlu dipindahkan terlebih dahulu.",
      ),
      { status: 404 },
    );
  function pathFor(key) {
    if (!/^assets\/(images|documents)\/[1-9][0-9]*\/[0-9a-f-]{36}$/.test(key))
      throw Object.assign(new Error("Lokasi berkas tidak valid."), {
        status: 400,
      });
    return resolve(root, key);
  }
  async function checkParent(path) {
    const base = await realpath(root);
    const parent = await realpath(dirname(path));
    if (parent !== resolve(base, dirname(path).slice(root.length + 1)))
      throw Object.assign(new Error("Lokasi berkas tidak diizinkan."), {
        status: 400,
      });
  }
  return {
    async ready() {
      await mkdir(root, { recursive: true, mode: 0o700 });
      await access(root, constants.R_OK | constants.W_OK);
    },
    async put(key, body) {
      if (body.length > 1024 * 1024)
        throw Object.assign(new Error("Hasil kompresi melebihi 1 MB."), {
          status: 413,
        });
      const path = pathFor(key);
      await mkdir(dirname(path), { recursive: true, mode: 0o700 });
      await checkParent(path);
      await writeFile(path, body, { flag: "wx", mode: 0o600 });
    },
    async get(key) {
      const path = pathFor(key);
      try {
        await checkParent(path);
        return await readFile(path, {
          flag: constants.O_RDONLY | constants.O_NOFOLLOW,
        });
      } catch (error) {
        if (error.code === "ENOENT") throw missing();
        throw error;
      }
    },
    async remove(key) {
      const path = pathFor(key);
      try {
        await checkParent(path);
        await unlink(path);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    },
  };
}
export const localStorage = createLocalStorage(storageRoot);
