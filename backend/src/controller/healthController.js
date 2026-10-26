import { localStorage } from "../utils/localStorage.js";
import * as SystemModel from "../model/SystemModel.js";
export const status = async (req, res) => {
  await SystemModel.ping([]);
  let storage = true;
  try {
    await localStorage.ready();
  } catch {
    storage = false;
  }
  res.json({ database: "connected", storage, storageProvider: "local" });
};
