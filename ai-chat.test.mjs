import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));

test("chat config is offline mock mode", () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(root, "chat-config.json"), "utf8"));
  assert.equal(cfg.endpoint, "");
  assert.equal(cfg.mock, true);
});

test("chat.js implements a local offline demo", () => {
  const js = fs.readFileSync(path.join(root, "js/chat.js"), "utf8");
  assert.ok(js.includes("offlineMode"), "offlineMode marker missing");
  assert.ok(js.includes("offlineReply"), "offlineReply marker missing");
  assert.ok(js.includes("offlineHint"), "offlineHint marker missing");
});

test("main.js loads chat but keeps the real inquiry form", () => {
  const js = fs.readFileSync(path.join(root, "js/main.js"), "utf8");
  assert.ok(js.includes("js/chat.js"), "chat script injection missing");
  assert.ok(!js.includes("rfq-demo-note"), "trial form interception leaked into production");
  assert.ok(!/Sandbox demo|沙箱演示/.test(js), "sandbox demo note leaked");
  assert.ok(js.includes("FormSubmit"), "real FormSubmit form submission missing");
});