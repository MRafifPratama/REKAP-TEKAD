import { listRegions } from "../utils/regions.js";

export const list = async (req, res) =>
  res.json(await listRegions(req.query.parent));
