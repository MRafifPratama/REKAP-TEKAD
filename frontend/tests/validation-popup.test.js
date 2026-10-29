import test from "node:test";
import assert from "node:assert/strict";
import { installValidationPopup } from "../src/lib/validationPopup.js";
test("Invalid user inputs are grouped in one popup, native bubbles suppressed and first field passed to the page dialog", async () => {
  let handler,
    focused = 0,
    prevented = 0;
  const messages = [];
  let focusTarget;
  const target = {
    addEventListener(name, fn, capture) {
      assert.equal(name, "invalid");
      assert.equal(capture, true);
      handler = fn;
    },
    removeEventListener() {
      handler = null;
    },
  };
  const stop = installValidationPopup(target, (message, field) => {
    messages.push(message);
    focusTarget = field;
  });
  const field = (label) => ({
    labels: [{ textContent: label }],
    validationMessage: "Wajib diisi",
    focus() {
      focused++;
    },
  });
  const first = field("Nama BUMDes"),
    second = field("Email");
  for (const input of [first, first, second])
    handler({
      target: input,
      preventDefault() {
        prevented++;
      },
    });
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(messages.length, 1);
  assert.equal(prevented, 3);
  assert.equal(focused, 0);
  assert.equal(focusTarget, first);
  assert.equal((messages[0].match(/Nama BUMDes/g) || []).length, 1);
  assert.match(messages[0], /Email/);
  stop();
  assert.equal(handler, null);
});
