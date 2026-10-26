import * as SystemModel from "../model/SystemModel.js";
export const status = async (req, res) => {
  await SystemModel.ping([]);
  res.json({
    database: "connected",
    storage: !!(
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY
    ),
  });
};
