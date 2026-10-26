import * as ActivityModel from "../model/ActivityModel.js";
export const list = async (req, res) => {
  const [rows] = await ActivityModel.findForUser(req.user);
  res.json(rows);
};
