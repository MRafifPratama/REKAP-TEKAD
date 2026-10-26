import * as UserModel from "../model/UserModel.js";
import * as RecordModel from "../model/RecordModel.js";
// The account row is the serialization point, including when no record exists yet.
// Locking it before checking records prevents simultaneous first submissions.
export async function ensureCanCreate(
  connection,
  user,
  models = { users: UserModel, records: RecordModel },
) {
  if (user.role === "admin") return;
  const [accounts] = await models.users.findByIdForUpdate(
    [user.id],
    connection,
  );
  if (!accounts.length || !accounts[0].active)
    throw Object.assign(new Error("Akun tidak aktif"), { status: 403 });
  const [existing] = await models.records.findPrimaryForUser(
    user.id,
    connection,
    true,
  );
  if (existing.length)
    throw Object.assign(
      new Error(
        "Akun Anda sudah memiliki data BUMDes. Perbarui formulir yang sama, bukan membuat data baru.",
      ),
      { status: 409 },
    );
}
export function ensureCanDelete(user) {
  if (user.role !== "admin")
    throw Object.assign(
      new Error(
        "Data BUMDes pengguna bersifat tetap. Gunakan formulir untuk memperbaruinya; penghapusan hanya dapat dilakukan admin.",
      ),
      { status: 403 },
    );
}
