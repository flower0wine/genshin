# 函数级实现追踪（输入 / 输出 / 副作用）

## 1. 主链路函数表（`src/main/getData.js`）

### `saveData(data, url)`（约 L15）

- 输入：
  - `data`: `{ uid, lang, time, typeMap(Map), result(Map) }`
  - `url`: 可选
- 输出：无（Promise）
- 副作用：
  - 若传 `url`，更新 `config.urls[uid]` 并持久化配置。
  - 保存 `userData/gacha-list-<uid>.json`。

### `readData(force)`（约 L35）

- 输入：`force:boolean`
- 输出：无
- 副作用：
  - 扫描 `userData` 下历史文件并转成内存 `Map`。
  - 根据 `config.current` 与已有 UID 自动纠正当前账号。

### `readLog()`（约 L149）

- 输入：无
- 输出：`string | false`（URL 或失败）
- 副作用：
  - 更新 `cacheFolder`（用于“打开缓存目录”功能）
  - 发送状态消息到渲染层

### `getQuerystring(url)`（约 L302）

- 输入：`url:string`
- 输出：`URLSearchParams | false`
- 副作用：
  - 根据 host 更新全局 `apiDomain`（国服/国际服）

### `getGachaLog({key,page,name,retryCount,url,endId})`（约 L197）

- 输入：单页请求参数
- 输出：`res.data.list`
- 副作用：失败重试时发送进度消息

### `getGachaLogs([key,name], queryString)`（约 L215）

- 输入：池子类型 + 公共 query
- 输出：`{ list, uid }`
- 副作用：
  - 分页网络请求
  - 节流等待
  - 增量停止判断

### `mergeList(a,b)`（约 L74）

- 输入：
  - `a`: 远端新拉取（旧->新）
  - `b`: 本地历史（旧->新）
- 输出：合并后的数组
- 关键策略：ID 对齐优先，失败后窗口比对。

### `fetchData(urlOverride)`（约 L376）

- 输入：`undefined | 'proxy' | url`
- 输出：无（通过内存 dataMap 与文件体现结果）
- 副作用：
  - 触发完整抓取-合并-落盘流程
  - 更新 `config.current`

## 2. 导入导出函数表（`src/main/UIGFJson.js`）

### `generateUigf30Json()`（约 L182）

- 输入：当前账号数据（隐式来自 `getData()`）
- 输出：UIGF v3.0 对象
- 关键点：
  - 拉取 `item_id`
  - 按时间排序
  - 缺 `id` 生成假 ID

### `generateUigf41Json(uigfAllAccounts)`（约 L230）

- 输入：是否导出所有账号
- 输出：UIGF v4.1 对象（`hk4e[]`）

### `saveAndBackup(data)`（约 L302）

- 输入：单账号标准数据对象
- 输出：无
- 副作用：
  - 若旧文件存在先备份
  - 再覆盖保存并切换当前 UID

### `importJson()`（约 L361）

- 输入：用户选中的 JSON 文件
- 输出：`'canceled' | void`
- 流程：
  - 优先按本地 schema 校验
  - 失败则尝试 UIGF 3.0/4.1

## 3. 工具函数表（`src/main/utils.js`）

### `request(url)`（约 L77）

- 行为：`electron-fetch` + `timeout=15s` + `res.json()`
- 注意：未做 HTTP 状态码分支处理，业务层依赖返回 JSON 的 `retcode`。

### `sendMsg(text,type)`（约 L45）

- 主进程到渲染层消息总线。
- 非 `LOAD_DATA_STATUS` 消息会写入 `userData/log.txt`。

### `cipherAes/decipherAes`（约 L200/L209）

- 用于加密配置里的 URL，降低明文暴露风险。

### `getCacheText(gamePath)`（约 L232）

- 在 webCaches 中找最近修改的 `data_2` 并读取文本。

## 4. IPC 契约速查

- `FETCH_DATA(param)`：`param` 可空/`'proxy'`/完整 URL
- `READ_DATA()`：读取缓存
- `FORCE_READ_DATA()`：强制重载文件
- `EXPORT_UIGF_JSON(version, allAccounts)`
- `IMPORT_UIGF_JSON()`
- `SAVE_EXCEL()`

## 5. 建议你复刻时保持一致的约束

- 统一“主存结构 = Map，落盘结构 = 数组”的双态约定。
- 统一“记录顺序 = 旧 -> 新”，减少统计歧义。
- 所有跨进程接口都固定入参 shape，避免 UI 与核心逻辑耦合。

## 6. 遗留缺陷与修复建议

- `gists.js` 中 `generateUigf30Json()` 是 async，但调用处未 `await`，会拿到 Promise 而非结果对象。
- 同文件相关功能默认未在 `main.js` 启用（`require('./gists')` 注释），属于未接线状态。
- 若你要启用该能力，建议：
  - 先补 `await`
  - 增加上传失败重试和 token 校验
  - 明确区分“导出文件”与“上传云端”两套流程入口
