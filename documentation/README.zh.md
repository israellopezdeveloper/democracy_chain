# 🗳️ Democracy Chain

<!-- markdownlint-disable MD013 -->

**Democracy
Chain**是一个旨在通过自动化文档分析来简化对选举纲领理解的平台。它让选民能够利用自然语言处理、嵌入技术、区块链和向量数据库来发现哪些候选人与他们的理念最契合。此外，它还包含一个基于 Web3 的 DApp，使用户能够与以太坊上的智能合约进行交互。

<!-- markdownlint-enable MD013 -->

该项目诞生有两个动机：

- **实践 Web3 技术和 RAG（检索增强生成）系统**。
- **促进更加真实且有参与感的民主**，为公众提供透明的候选人提案访问渠道。

通过该应用，任何公民都可以成为候选人，这有助于民主参与。然而，这也可能带来
**大量候选人**，使得选民难以做出明智选择。

解决方案是创建一个
**智能搜索引擎**，选民可以用自然语言描述他们希望候选人具备的提案或价值观，并得到
**与其查询最契合的 10 位候选人**。

这将促进知情投票并减少政治“信息过载”。

## 📁 项目结构

```text
.
├── docker-compose.yml   # 服务编排
├── backend/             # 提供文件上传的 REST API
│   ├── Dockerfile
│   ├── poetry.lock
│   ├── pyproject.toml   # 依赖和配置
│   └── src/backend/
│       ├── __init__.py
│       └── main.py      # FastAPI 入口
├── hardhat-node/        # 用于测试的本地以太坊节点 (Hardhat)
├── deploy-contract/     # 部署智能合约的脚本
├── frontend/            # 与合约交互的 Web3 DApp
│   ├── public/
│   ├── src/
│   └── package.json     # 可能基于 Vite + ethers.js
```

## 📊 使用的技术

- **FastAPI** — 后端主要框架
- **Poetry** — Python 依赖管理器
- **Qdrant** — 嵌入向量存储
- **SentenceTransformers** — 语义向量生成
- **RabbitMQ** — 异步处理的消息队列
- **aio-pika** — RabbitMQ 异步客户端
- **Docker & docker-compose** — 服务编排
- **Hardhat** — 测试智能合约的本地区块链
- **Solidity** — 以太坊智能合约语言
- **ethers.js** — Web3 交互的 JavaScript 库
- **Vite / React** — DApp 前端框架（根据目录结构推测）

## 🚀 安装与部署

### 1. 克隆仓库

```bash
git clone https://github.com/your_user/democracy_chain.git
cd democracy_chain
```

### 2. 配置环境变量

将 `.env.example` 复制为 `.env` 并修改所需值：

```bash
cp .env.example .env
```

### 3. 构建并启动服务

```bash
docker-compose up --build
```

这将启动：

- 后端：`http://localhost:8000`
- RabbitMQ 和 Qdrant（各自端口）
- 本地以太坊节点（Hardhat）
- 智能合约的自动部署
- DApp 前端：`http://localhost:5173`（Vite 默认端口）

## 📄 工作流程

1. 用户通过 API 上传一个文件，并关联 `wallet_address`。

2. 后端存储该文件并通过 RabbitMQ 发送给 worker。

3. worker：
   - 根据 `mime_type` 提取文本
   - 分割为小块
   - 生成嵌入向量
   - 将向量连同元数据存入 Qdrant

4. 向量带有 `wallet_address` 标签，用于绑定候选人。

5. DApp 允许用户检查区块链上登记的纲领文件，关联文件哈希，并验证其未被篡改。

## 🛠 Makefile 使用

> 要求：
>
> - **Podman** + **podman-compose**（或与 `docker-compose`
>   兼容的别名）
> - `fzf` 用于交互菜单
> - （可选）位于 `~/.local/lib/bash/utils.sh` 的 banner 工具
>
>   > 如果没有这些工具，Makefile 仍能运行，只是缺少 banner 效果。

### 快速命令

```bash
# 后台启动并等待就绪
make up

# 查看所有服务日志（Ctrl+C 退出）
make logs

# 停止并移除孤立容器
make down

# 清理临时镜像/卷及示例文件
make clean
```

### 交互式运行菜单

```bash
make run
```

- 启动服务并显示 `fzf` 菜单：
  - `all` → 所有日志
  - `rebuild` → 重建（可选 `--no-cache`）
  - `rerun` → 重新编排
  - `clean` → 清理并重启
  - `check` → 执行 `check` 规则
  - 或选择某个 **具体服务** 查看日志

### 交互式构建

```bash
make build
```

- 选择：
  - `all` → 重建全部（询问是否 `--no-cache`）
  - 某个具体服务 → 仅重建该服务

### 容器健康检查

```bash
make wait-healthy
```

- 等待至 **`WAIT_TIMEOUT`**（默认 180 秒），直到所有容器为 `healthy`
  或 `running`。

### 子项目检查

有两条规则可验证 **子项目**（多仓库）：

```bash
# 交互式：选择某个子目录或 "all"
make check

# 非交互式 CI：遍历所有子目录
make check-ci
```

- 仅在一级或二级子目录中查找 Makefile。
- `check` 使用 `fzf` 选择。
- `check-ci` 在 CI 中使用：**首个失败即终止**。

### 其他脚本

```bash
# 注册示例纲领（examples/ 文件夹）
make programs

# 工具控制台（前提是容器存在）
make hh-console
make backend-console
```

### 打包

```bash
# 打包项目为 zip（排除构建产物、node_modules、tests 等）
make create-zip
```

### 变量与自定义

- `PROJECT` → 项目标签（用于容器过滤）。默认是当前目录名。
- `WAIT_TIMEOUT` → `wait-healthy` 的最长等待时间（默认 180 秒）。
- 如果使用 **Docker** 而非 Podman，可创建别名：

  ```bash
  alias podman-compose='docker compose'
  ```

  或修改 Makefile 中的 `COMPOSE` 变量。

### 提示与故障排查

- 若 `make run` 菜单未出现，检查是否安装 `fzf`。

- 若 `make wait-healthy` 超时：
  - 使用 `make logs` 检查哪个服务未启动。
  - 检查 healthcheck 或启动时间（数据库和 LLM 通常较慢）。

- 若使用 GPU，请确认 `docker/podman` 支持（NVIDIA CDI/Runtime）。

有了这些，任何人都可以通过 Makefile
**启动、重建、检查和打包项目**，无需记住复杂的编排命令。

## 📂 支持的文件格式（计划）

- `.txt`, `.md`, `.html`, `.xml`, `.csv`
- `.pdf`, `.doc`, `.docx`, `.odt`
- `.xls`, `.xlsx`, `.ods`
- `.pptx`, `.odp`

> 未来版本将支持图片 OCR 以及音视频转录。

## 📦 API（开发中）

### 上传文件

```sh
POST /api/v1/{wallet_address}/file
```

### 获取推荐候选人（计划）

```sh
GET /api/v1/suggest?query="免费教育"
```

## 🪑 文件清理

当文件被删除时：

- 从存储中移除
- 删除 Qdrant 中对应 `wallet_address` 和 `filename` 的向量

## 🔐 安全与区块链

- 每位候选人由唯一的 `wallet_address` 标识。
- 处理过的文档哈希会记录在本地以太坊智能合约（Hardhat）中。
- DApp 允许选民在链上验证文件是否被篡改。
- 这实现了：
  - 选举纲领的完整性验证
  - 公共的真实性证明

## 🔮 未来改进

- [ ] Web 管理面板
- [ ] 语义查询 API
- [ ] 候选人匹配的交互式可视化
- [ ] 情感分析与纲领摘要
- [ ] 将哈希写入智能合约
- [ ] 面向选民的公开 DApp 界面

[TODO](./TODO.zh.md)

[ROADMAP](./ROADMAP.zh.md)

## 👤 作者

**Israel López** [GitHub](https://github.com/israellopezdeveloper) |
[LinkedIn](https://linkedin.com/in/israellopezmaiz)
