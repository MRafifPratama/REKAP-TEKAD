import rateLimit from "express-rate-limit";
export const apiLimit = rateLimit({ windowMs: 60000, limit: 180 });
export const authLimit = rateLimit({ windowMs: 15 * 60000, limit: 30 });
