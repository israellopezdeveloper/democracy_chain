# 🗳️ 民主链（Democracy Chain）

**Democracy Chain** 是一个旨在通过自动化文档分析来促进选民理解选举纲领的平台。它帮助选民发现与自己理念最契合的候选人，使用自然语言处理、嵌入向量、区块链和向量数据库实现智能分析。该平台还包含一个基于 Web3 的 DApp，可与以太坊智能合约交互。

本项目有两个核心动机：

- **练习 Web3 技术和 RAG（检索增强生成）系统的构建。**
- **推动更加真实和参与性的民主实践**，通过公开透明的方式呈现候选人提案，并保证其可验证性。

---

## 📁 项目结构

```
.
├── docker-compose.yml         # 服务编排配置
├── backend/                   # 文件上传的 REST API
│   ├── Dockerfile
│   ├── poetry.lock
│   ├── pyproject.toml         # 依赖与配置
│   └── src/backend/
│       ├── __init__.py
│       └── main.py            # FastAPI 启动入口
├── hardhat-node/              # 用于测试的本地以太坊节点（Hardhat）
├── deploy-contract/           # 部署智能合约的脚本
├── frontend/                  # Web3 DApp，与合约交互
│   ├── public/
│   ├── src/
│   └── package.json           # 基于 Vite + ethers.js
```

---

## 📊 技术栈

- **FastAPI** — 后端框架
- **Poetry** — Python 依赖管理工具
- **Qdrant** — 用于嵌入向量的向量数据库
- **SentenceTransformers** — 生成语义向量
- **RabbitMQ** — 异步任务队列
- **aio-pika** — 异步 RabbitMQ 客户端
- **Docker & docker-compose** — 服务容器编排
- **Hardhat** — 智能合约开发框架
- **Solidity** — 以太坊智能合约语言
- **ethers.js** — Web3 JavaScript 库
- **Vite / React** — DApp 前端开发框架（推测）

---

## 🚀 安装与部署

### 1. 克隆仓库

```bash
git clone https://github.com/your_user/democracy_chain.git
cd democracy_chain
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

根据需要编辑 `.env` 文件。

### 3. 构建并启动服务

```bash
docker-compose up --build
```

这将启动：

- 后端服务：`http://localhost:8000`
- RabbitMQ 和 Qdrant
- 本地以太坊节点（Hardhat）
- 自动部署智能合约
- DApp 前端：`http://localhost:5173`

---

## 📄 工作流程

1. 用户通过 API 上传文件，并附带 `wallet_address`。
2. 后端存储文件并通过 RabbitMQ 将其发送给 worker。
3. worker 执行以下任务：
   - 根据 `mime_type` 提取文本
   - 将文本分块
   - 使用模型生成嵌入向量
   - 将向量连同元数据写入 Qdrant

4. 每个向量标记其对应的 `wallet_address`，用于识别候选人。
5. DApp 可展示已上链的文件哈希并验证其未被篡改。

---

## 📂 支持的文件格式（计划）

- `.txt`, `.md`, `.html`, `.xml`, `.csv`
- `.pdf`, `.doc`, `.docx`, `.odt`
- `.xls`, `.xlsx`, `.ods`
- `.pptx`, `.odp`

> 未来版本将支持图像 OCR、音频转写与视频处理。

---

## 📦 API（开发中）

### 上传文件

```
POST /api/v1/{wallet_address}/file
```

### 获取推荐候选人（计划中）

```
GET /api/v1/suggest?query="free education"
```

---

## 🧹 文件删除

当文件被删除时：

- 本地文件被清除
- 与该文件相关的向量（通过 `wallet_address` 和 `filename`）从 Qdrant 中删除

---

## 🔐 安全与区块链

- 每位候选人通过唯一的 `wallet_address` 标识
- 每个处理文件的哈希被记录到本地以太坊链（Hardhat）中的智能合约
- DApp 允许用户链上验证文件是否遭到篡改
- 功能包括：
  - 验证选举纲领的完整性
  - 提供可公开验证的真实性证明

---

## 🔮 未来改进

- [ ] Web 管理后台
- [ ] 语义搜索 API
- [ ] 候选人相似度可视化
- [ ] 文本情感分析与摘要
- [ ] 文件哈希链上登记
- [ ] 面向选民的公开 DApp 界面

---

## 👤 作者

**Israel López**
[GitHub](https://github.com/your_user) | [LinkedIn](https://linkedin.com/in/your_user)
