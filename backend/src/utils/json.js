// MariaDB exposes JSON columns as text, while MySQL has a native JSON type.
export function decodeJsonColumn(value, name) {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (
    name === "data" &&
    parsed &&
    typeof parsed === "object" &&
    "received" in parsed
  ) {
    if (parsed.received === 0 || parsed.received === 1)
      parsed.received = Boolean(parsed.received);
    else if (parsed.received === "true" || parsed.received === "false")
      parsed.received = parsed.received === "true";
  }
  return parsed;
}
export function jsonTypeCast(field, next) {
  if (["profile", "data", "owner", "changes"].includes(field.name)) {
    const value = field.string("utf8");
    return value === null ? null : decodeJsonColumn(value, field.name);
  }
  return next();
}
