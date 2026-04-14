# 核心架构总览（非 UI）

> 项目：`genshin-wish-export`
> 目标：抓取原神祈愿记录 API 数据，做本地持久化合并，并支持 Excel/UIGF 导入导出。

## 1. 运行时分层

- Electron 主进程（`src/main`）负责：
  - 获取 `authkey`（读日志或代理抓包）
  - 调用祈愿记录 API
  - 分页拉取与本地增量合并
  - 本地文件保存
  - 导入导出（Excel / UIGF）
- 渲染进程（`src/renderer`）负责 UI，统计逻辑中仅 `gachaDetail.js` 有可复用计算。

## 2. 主流程入口

- 启动主进程：`src/main/main.js`
  - 通过 `require('./getData')` 注册 IPC：`FETCH_DATA`、`READ_DATA` 等。
  - 通过 `require('./excel')`、`require('./UIGFJson')` 注册导入导出 IPC。

## 3. 抽卡数据主链路（FETCH_DATA）

1. 渲染层调用：`ipcRenderer.invoke('FETCH_DATA', param)`。
2. 主进程 `getData.js`：
   - `readData()` 读取本地历史 `userData/gacha-list-<uid>.json`。
   - 如果 `param` 为空：
     - `getUrl()` -> `readLog()` 从日志+缓存提取 URL。
   - 如果 `param === 'proxy'`：
     - `useProxy()` 开本地 MITM 代理抓取 URL。
   - 如果 `param` 是 URL 字符串：直接使用。
3. `getQuerystring(url)` 解析 URL，提取并清洗 query 参数。
4. 对每个卡池类型调用 `getGachaLogs()` 分页抓取。
5. 每个卡池结果标准化为数组：
   - `[time, name, item_type, rank(int), gacha_type, id]`
6. `mergeData(local, remote)` 增量合并。
7. `saveData()` 持久化到本地 JSON，并更新当前 UID。

补充：`fetchData('proxy')` 会先抓 URL，再复用同一抓取链路，不是另一套 API 实现。

## 4. 关键设计原则

- **authkey 不长期明文存配置**：`config.urls` 存储前 AES 加密。
- **分页链路稳定性**：每页重试 5 次，带 sleep 节流。
- **增量更新优先**：默认只抓到本地最新 ID 即停止，避免全量慢拉。
- **跨语言兼容**：`lang` 会尽量复用当前 UID 历史语言，确保池子名和道具名可对齐。

## 5. 本地数据核心结构

单 UID 文件（`gacha-list-<uid>.json`）主要字段：

- `uid: string`
- `lang: string`（如 `zh-cn` / `en-us`）
- `time: number`（最后更新时间戳）
- `typeMap: [[gachaType, displayName], ...]`
- `result: [[gachaType, logs], ...]`
  - `logs` 项：`[time, name, item_type, rank, gacha_type, id]`

> 注意：内存中 `result/typeMap` 会转成 `Map`。

## 6. IPC 接口清单（非 UI 核心）

- 数据抓取：`FETCH_DATA` / `READ_DATA` / `FORCE_READ_DATA`
- 账号切换：`CHANGE_UID`
- 配置：`GET_CONFIG` / `SAVE_CONFIG` / `LANG_MAP`
- 代理辅助：`DISABLE_PROXY` / `COPY_URL` / `OPEN_CACHE_FOLDER`
- 导出：`SAVE_EXCEL` / `EXPORT_UIGF_JSON`
- 导入：`IMPORT_UIGF_JSON`

消息通道（主进程 -> 渲染）：

- `LOAD_DATA_STATUS`：抓取进度文本
- `ERROR`：异常信息
- `AUTHKEY_TIMEOUT`：authkey 过期标记
- `UPDATE_HINT`：自动更新状态提示

## 7. 做你自己的工具时的最小可行链路

1. 复刻“获取 URL + query 参数提取”。
2. 复刻 `getGachaLog` 分页抓取策略（`size=20 + end_id`）。
3. 复刻统一记录结构 `[time, name, item_type, rank, gacha_type, id]`。
4. 复刻合并逻辑（按 ID + 时间窗口对齐）。
5. 增加导出层（JSON/UIGF）即可快速形成可用版本。
