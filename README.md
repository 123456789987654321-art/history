# 时空修复师

TypeScript + Three.js + Express 的单器物 Web 应用。模型定位为**器型示意**，不作照片识别、具体文物鉴定或考古复原。

## 本地启动

需要 Node.js 22 或更新版本。

```powershell
npm.cmd ci --include=dev
npm.cmd run dev
```

打开 http://127.0.0.1:5173 。开发前端 5173 代理后端 3001。

生产方式：

```powershell
npm.cmd run build
npm.cmd start
```

打开 http://127.0.0.1:3001 。生产服务直接提供 `dist` 和 `/api`，适合 Render 单服务部署。后端监听 `0.0.0.0`，端口使用 `PORT` 环境变量。

## 操作闭环

1. 填写照片拍摄者或素材来源，上传 JPEG / PNG / WebP；也可不上传，以纯几何模型体验。照片本地解码并缩小到最大边 1600 像素，不上传原图；文件名和素材来源会进入后端操作记录。
2. 人工确认“方鼎示意”。系统没有自动识别，不把器类与特定文物关联。
3. 调整器腹宽高深、足长和照片投影面、缩放、偏移；拖动旋转、滚轮或双指缩放。
4. 拆解双耳、鼎腹、四足，点击模型或热点按钮查看结构说明；复核或淡化推定区。
5. 选择三种语体之一生成草稿。核对后勾选确认，才进入讲解展示态。
6. 勾选导出披露确认，下载 PNG 数字文物卡；另行下载 JSON 操作记录。

重新生成或调整照片、参数、贴图、区域复核，会使人工确认失效。后端独立验证讲解版本和导出披露，不只依赖按钮禁用。

## 内容边界与 AI

- 附件中的具体文物信息为待核验占位，未导入为确定事实。名称、年代、出土信息等默认显示“未核验 / 无已核验来源”。
- 结构热点的来源是 `src/viewer.ts` 的程序模型定义，明确不是文物史实。未来接入馆藏条目时需独立身份确认和逐字段人工来源核验。
- 仅选定的鼎腹一面使用照片投影；其余为中性几何推定，不生成背面纹饰。整张照片中的背景也可能被投影，请使用裁切合适的照片。
- 未配置密钥时三种讲解均为“离线示例讲解（固定模板，未调用 AI）”。
- 可复制 `.env.example` 为 `.env` 并仅在后端配置 `AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL`。不要使用 `VITE_` 前缀保存密钥。
- 在线模式为 **AI 辅助编排固定句库**：接口只返回三句的排列编号，服务器检查完整且不重复，再从本地句库构造讲解。模型的任意自由文本不会进入展示，因此目前不是开放式文物事实改写。调用失败自动降级并标注原因类别。
- AI 调用仅发送语体与固定模型说明，不发送照片、文件名或素材署名。

## GitHub + Render 公网部署

项目已提供 `render.yaml`。使用一个 Web Service 同时提供页面与 API，无需单独跨域后端。

本项目目标仓库：https://github.com/123456789987654321-art/history 。代码推送后可通过 https://render.com/deploy?repo=https://github.com/123456789987654321-art/history 创建 Blueprint；或在已创建的 `history` Render Project 中新建 Web Service。

1. 在 GitHub 创建空仓库，通过 GitHub Desktop 添加当前文件夹并发布，或执行以下命令（替换真实仓库 URL）：

```powershell
git init
git add .
git commit -m "Build Time Restorer web application"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/time-restorer.git
git push -u origin main
```

2. 在 Render 登录并连接 GitHub，选择 **New → Blueprint**，选择该仓库，使用根目录的 `render.yaml` 创建服务。
3. 或选择 **New → Web Service**，Runtime 为 Node；Build Command 为 `npm ci --include=dev && npm run build`；Start Command 为 `npm start`；Health Check Path 为 `/api/health`。
4. 初次可完全不填 AI 密钥，先验证离线闭环。如需在线模式，在 Render Environment 中设置后端环境变量，不能提交密钥到 GitHub。
5. 部署成功后使用 Render 分配的 `https://…onrender.com` 公网地址。`/api/health` 应返回 `ok: true`，按上面的六步验收。

Render 免费服务可能冷启动，且本地文件系统不是持久存储；正式比赛证据请主动下载 JSON。当前会话存内存，操作日志同时写 `data/`；刷新开始新会话，服务重启后旧会话不可继续。需要持久账号、跨设备恢复或多实例服务时应接入数据库及对象存储。不要把本版当作长期文物档案系统。

公开演示已有每 IP 请求限速、会话容量与日志条数上限、输入体积限制和服务端确认校验。若启用付费 AI 面向大量访客，建议额外添加登录、全局调用预算和网关限流。

## 验证

```powershell
npm.cmd run build
npm.cmd test
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

自动化覆盖后端确认与导出门禁、重新生成失效、非法输入、三语体固定句库、上传贴图、拆解、热点、PNG 下载、手机布局和异常文件。浏览器测试生成 `test-results/desktop.png`、`mobile.png` 与 `card.png`。

## 尚未实现

- 自动器类识别、自动抠图、框选裁剪、反光抑制、纹饰生成、照片测量式几何重建。
- 后母戊鼎等具体馆藏的权威来源核验及身份关联；当前没有已核验的具体文物事实数据集。
- 多器物、语音、二维码传播、账号、持久数据库、离线 PWA、原生移动端。
- 比赛演示录屏、人工核验表和官方提交材料。

无需外部 CDN 或三维模型；部署后的前端资源来自构建产物。依赖版本由 `package-lock.json` 锁定。
