import * as ActivityModel from "../model/ActivityModel.js";
export function audit(
  connection,
  userId,
  action,
  entity,
  entityId,
  changes = {},
) {
  return ActivityModel.create(
    [userId, action, entity, String(entityId), JSON.stringify(changes)],
    connection,
  );
}
