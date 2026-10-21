const test = require("node:test");
const assert = require("node:assert/strict");

const base = process.env.DORMMATE_TEST_BASE_URL || "http://127.0.0.1:3000";

test("local demo joins, executes a status action and keeps dorm states separate", async () => {
  const code = `DEMO-${Date.now()}`;
  const post = async (path, body) => {
    const response = await fetch(`${base}${path}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    assert.equal(response.status, 200);
    return response.json();
  };
  const joined = await post(`/api/dorm/${code}/join`, { nickname: "演示成员", role: "member" });
  assert.ok(joined.members.some((member) => member.name === "演示成员"));
  const result = await post("/api/ai/action", { dormCode: code, userName: "演示成员", message: "帮我把今日状态修改为晚归" });
  assert.equal(result.state.members.find((member) => member.name === "演示成员").status, "晚归");
  const saved = await (await fetch(`${base}/api/dorm/${code}`)).json();
  assert.equal(saved.members.find((member) => member.name === "演示成员").status, "晚归");
  const other = await (await fetch(`${base}/api/dorm/${code}-OTHER`)).json();
  assert.ok(other.members.every((member) => member.name !== "演示成员"));
});
