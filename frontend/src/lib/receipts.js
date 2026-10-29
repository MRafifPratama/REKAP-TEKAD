export const aidTypes = {
  demplot: "Demonstration Plot (Demplot)",
  ritd: "Rumah Inovasi Teknologi Desa (RITD)",
  investment: "Dana Investasi (Investment Fund)",
};
export function receiptsOf(data) {
  return (
    data.receipts ??
    (data.received
      ? [
          {
            id: "legacy",
            type: "",
            date: data.receivedDate,
            amount: data.amount,
            description: "",
            proofId: "",
          },
        ]
      : [])
  );
}
export function recordBody(value) {
  const body = new FormData();
  const receipts = receiptsOf(value).map(({ file, ...receipt }) => {
    if (file) body.append(receipt.id, file);
    return receipt;
  });
  body.append("data", JSON.stringify({ ...value, receipts }));
  return body;
}
