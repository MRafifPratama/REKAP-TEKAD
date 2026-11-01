import { aidTypes, receiptsOf } from "./receipts.js";
export function aidSummary(records) {
  return Object.entries(aidTypes).map(([type, label]) => {
    let recipients = 0,
      receipts = 0,
      amount = 0;
    for (const record of records) {
      const matches = receiptsOf(record.data).filter(
        (receipt) => receipt.type === type,
      );
      if (matches.length) recipients++;
      receipts += matches.length;
      amount += matches.reduce(
        (sum, receipt) => sum + Number(receipt.amount || 0),
        0,
      );
    }
    return { type, label, recipients, receipts, amount };
  });
}
export function matchesAidType(data, type) {
  if (type === "all") return true;
  return receiptsOf(data).some((receipt) =>
    type === "unclassified" ? !aidTypes[receipt.type] : receipt.type === type,
  );
}
export function monthlyAidSummary(records) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  const result = months.map((month) => ({
    month,
    demplot: 0,
    ritd: 0,
    investment: 0,
    unclassified: 0,
    total: 0,
  }));
  for (const record of records)
    for (const receipt of receiptsOf(record.data)) {
      if (!/^2026-(0[1-9]|1[0-2])-\d{2}$/.test(receipt.date || "")) continue;
      const row = result[Number(receipt.date.slice(5, 7)) - 1];
      const type = Object.hasOwn(aidTypes, receipt.type)
        ? receipt.type
        : "unclassified";
      row[type]++;
      row.total++;
    }
  return result;
}
