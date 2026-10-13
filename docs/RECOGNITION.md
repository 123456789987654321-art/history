# 图片识别接入

当前识别链路：浏览器预览并缩小图片 → 用户同意发送 → 后端视觉模型请求 → 候选名称、照片依据、不确定项。

此模块没有接入权威文物数据库，不宣称馆藏匹配，不把 AI 返回的年代或其他历史字段写入事实表。空候选是有效结果；人工确认和三维生成仍需后续接入。

## Render 配置

在 history 服务的 Environment 中添加以下变量并保存部署：

| 变量 | 值 |
|---|---|
| VISION_API_KEY | 在服务商控制台创建的视觉模型 API 密钥 |
| VISION_BASE_URL | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| VISION_MODEL | `qwen-vl-plus` |
| VISION_PROVIDER_NAME | `通义千问视觉服务` |

默认示例是阿里云百炼中国内地的兼容接口。模型可用性、权限、额度及地域以账号控制台为准；其他地域需配套端点和密钥。支持同类 chat/completions 图像消息协议、JSON 输出的视觉服务也可通过这些变量配置。不要使用纯文字模型，不要用 VITE_ 前缀，不要把密钥提交 GitHub 或发送到聊天里。接口调用可能产生服务商费用。

原有 AI_API_KEY 仅用于旧实验页的文字讲解，不会自动当作视觉密钥。

## 接口

- GET `/api/vision/status`：只返回是否配置、服务名、模型名，不返回密钥。
- POST `/api/vision/identify`：`{image: "data:image/jpeg;base64,...", consent: true}`。仅支持本地编码的 JPEG/PNG/WebP，图片字节不超过 2 MB；不接受远程图片 URL。
- 返回 candidates（最多 3 条）、message、source、provider、model、requestId、createdAt、verified=false、databaseMatched=false。
- 每 IP 每分钟最多 6 次请求，全服务最多 3 个并发请求，单次超时 45 秒。

本站只在请求内存中传递照片，不写入本地文件；外部服务的数据处理政策由该服务商决定。更换照片和重新识别清空旧候选，需重新授权新照片。

无密钥时返回 503 并在界面明确提示；格式异常、请求失败或额度不足不生成示例结果。当前自动化验证使用模拟视觉响应，尚未用真实密钥进行在线识别验收。
