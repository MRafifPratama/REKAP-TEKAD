import { showInputError } from "./inputError.js";
export function installValidationPopup(target, notify = showInputError) {
  let timer;
  let invalid = [];
  function handleInvalid(event) {
    event.preventDefault();
    invalid.push(event.target);
    if (timer !== undefined) return;
    timer = setTimeout(() => {
      const fields = [...new Set(invalid)];
      const messages = fields.map((field) => {
        const label =
          field.labels?.[0]?.textContent?.trim().split("\n")[0] ||
          field.getAttribute("aria-label") ||
          field.name ||
          "Isian formulir";
        return label + ": " + field.validationMessage;
      });
      notify(
        "Periksa kembali isian berikut:\n\n" + messages.join("\n"),
        fields[0],
      );
      invalid = [];
      timer = undefined;
    }, 0);
  }
  target.addEventListener("invalid", handleInvalid, true);
  return () => {
    target.removeEventListener("invalid", handleInvalid, true);
    clearTimeout(timer);
  };
}
