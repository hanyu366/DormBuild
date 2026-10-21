# DormMate AI 比赛版

这是宿舍协作助手的 Next.js 比赛原型，独立于仓库根目录后续的 React / Express 实现。主要展示共享看板、自然语言理解、程序操作和状态回写。

## 本地运行

需要 Node.js 20.9+，在本目录执行：

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

打开 `http://127.0.0.1:3000`，使用演示昵称和宿舍代码进入。未填写密钥时使用本地规则回退；需要真实模型调用时，自行在 `.env.local` 填入 `DEEPSEEK_API_KEY`。模型为 `deepseek-chat`，通过服务端接口调用，密钥不进入前端。

生产构建的本地检查：

```powershell
npm run build
npm run start
```

默认开发和启动命令只监听本机地址。

## 代码与实际范围

- `src/app/`：加入宿舍、看板、值日、费用、月报、洗晒等页面与 API。
- `src/app/api/ai/action/route.ts`：调用 DeepSeek，读取回复与动作；未配置或调用失败时使用本地规则回退。
- `src/lib/aiEngine.ts`：处理成员状态、值日、费用与交互记录等动作，结果写回宿舍状态。
- `src/lib/serverStore.ts`：服务端内存状态，重启后恢复演示数据。
- `src/data/mock.ts`：模拟成员、账单、天气和统计数据。

例如，先使用演示昵称加入宿舍，再输入“帮我把今日状态修改为晚归”，查看模型或规则解析后的回复和状态变化。实际模型效果取决于自行配置的服务；此仓库不提供可用密钥。

部分动作仍是比赛原型：如 `add_makeup_task` 尚未创建独立补扫记录；月报和天气中含预置演示数据。代码中的功能入口不代表完整的生产服务。

## 数据与隐私边界

本版不提供真实多账号认证与权限控制，适合本地模拟演示。昵称和演示会话保存在浏览器 localStorage，宿舍状态保存在服务端内存；未接入真实学生、宿舍或账务数据库。

填写 DeepSeek 密钥后，AI 请求会将当前输入、昵称、宿舍代码、成员昵称及当前值日等上下文发送给 DeepSeek。演示请使用模拟数据；不填写密钥时不请求该模型。页面不再自动请求外部字体。

真实环境变量、运行数据、依赖目录及构建产物均排除在提交范围之外。压缩包原有的实际密钥已从发布副本中排除。

发布整理中，Next.js 从压缩包中的 16.2.6 更新至 16.4.2，并重新生成依赖锁文件。跨标签页广播按宿舍代码隔离，避免同一浏览器不同演示宿舍之间混入状态。字体改用本机回退，开发检查采用 ESLint、TypeScript 与 React Hooks 规则，移除依赖未修复 glob 组件的 Next 专用 lint 预设。

## 验证

```powershell
npm run test
npm run lint
npm run build
npm audit
```

`npm run test` 检查浏览器广播的宿舍隔离。启动本地服务且保持密钥为空时，可以在另一个终端执行 `npm run test:smoke`，验证加入宿舍、自然语言状态修改、结果读取及不同宿舍的状态隔离；使用其他端口时设置 `DORMMATE_TEST_BASE_URL`。

2026-10-21 发布检查：4 项广播回归测试、1 项本地 API 测试及生产构建通过，本目录依赖审计未报告已知漏洞。真实 DeepSeek 服务未使用压缩包中的密钥进行测试。

[返回 DormBuild 项目说明](../README.md)
