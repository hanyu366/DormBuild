const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function loadBroadcast() {
  const channels = [];
  class FakeChannel {
    constructor(name) { this.name = name; this.sent = []; channels.push(this); }
    postMessage(value) { this.sent.push(value); }
    close() { this.closed = true; }
  }
  const source = fs.readFileSync(path.join(__dirname, "../src/lib/broadcast.ts"), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const sandbox = { exports: {}, BroadcastChannel: FakeChannel };
  vm.runInNewContext(compiled.outputText, sandbox);
  return { api: sandbox.exports, channels };
}

test("different dorms use separate browser channels", () => {
  const { api, channels } = loadBroadcast();
  api.initBroadcast("DEMO-A", () => {});
  api.initBroadcast("DEMO-B", () => {});
  assert.notEqual(channels[0].name, channels[1].name);
  assert.equal(channels[0].closed, true);
});

test("messages from another dorm cannot replace local state", () => {
  const { api, channels } = loadBroadcast();
  const received = [];
  api.initBroadcast("DEMO-A", (state) => received.push(state));
  channels[0].onmessage({ data: { type: "state_update", state: { dormCode: "DEMO-B" } } });
  channels[0].onmessage({ data: null });
  assert.equal(received.length, 0);
  channels[0].onmessage({ data: { type: "state_update", state: { dormCode: "DEMO-A" } } });
  assert.equal(received.length, 1);
});

test("switching dorms does not broadcast the new state to the old channel", () => {
  const { api, channels } = loadBroadcast();
  api.initBroadcast("DEMO-A", () => {});
  api.broadcastStateUpdate({ dormCode: "DEMO-B" });
  assert.equal(channels[0].sent.length, 0);
  api.broadcastStateUpdate({ dormCode: "DEMO-A" });
  assert.equal(channels[0].sent.length, 1);
});

test("closed channels no longer send state", () => {
  const { api, channels } = loadBroadcast();
  api.initBroadcast("DEMO-A", () => {});
  api.closeBroadcast();
  api.broadcastStateUpdate({ dormCode: "DEMO-A" });
  assert.equal(channels[0].closed, true);
  assert.equal(channels[0].sent.length, 0);
});
