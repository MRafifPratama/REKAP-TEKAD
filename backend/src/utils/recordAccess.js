import * as RecordModel from "../model/RecordModel.js";
export async function owned(conn, id, user, model = RecordModel) {
  const [rows] = await model.findForUpdate([id], conn);
  const r = rows[0];
  if (!r || (user.role !== "admin" && r.user_id !== user.id))
    throw Object.assign(new Error("Data tidak ditemukan"), { status: 404 });
  if (user.role !== "admin") {
    const [primary] = await model.findPrimaryForUser(user.id, conn);
    if (!primary.length || r.id !== primary[0].id)
      throw Object.assign(new Error("Data tidak ditemukan"), { status: 404 });
  }
  return r;
}
