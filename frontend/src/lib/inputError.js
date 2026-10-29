export function showInputError(message, focusTarget) {
  window.dispatchEvent(
    new CustomEvent("tekad:input-error", { detail: { message, focusTarget } }),
  );
}
