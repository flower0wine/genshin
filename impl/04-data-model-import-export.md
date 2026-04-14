# 数据模型、导入导出与统计逻辑

## 1. 配置与本地持久化

文件：`userData/config.json`

主要字段：

- `urls`: `[[uid, encryptedUrl], ...]`
- `logType`: 日志优先策略
- `lang`: 当前语言
- `current`: 当前 UID
- `proxyPort`: 默认 `8325`
- `fetchFullHistory`: 是否每次全量抓取
- `hideNovice`: 是否隐藏新手池
- `readableJSON`: 导出 JSON 是否格式化

### 1.1 urls 加密方式

- 算法：`aes-192-cbc`
- key：`scryptSync(userPath, 'hk4e', 24)`
- iv：16 字节 0

含义：

- 同机器、同用户目录可解密；跨机器直接拷贝通常不可解。

## 2. 本地抽卡数据格式（内部标准）

每条记录统一为：

```text
[time, name, item_type, rank(int), gacha_type, id]
```

`result` 是 `Map<gachaType, records[]>`。

典型 `gachaType` 集合：

- `100` 新手池
- `200` 常驻池
- `301` 角色活动池
- `302` 武器活动池
- `500` 集录池
- `400` 作为记录中的 `gacha_type` 可能出现（角色活动池-2）

## 3. Excel 导出逻辑（`SAVE_EXCEL`）

流程：

1. 逐卡池建 Sheet。
2. 给每条记录附加统计列：
   - `total`：该池累计抽数
   - `pity`：距上一个 5 星的抽数
3. 若池子 `key==='301'` 且 `gacha_type==='400'`，在备注列写 `wish2`。
4. 写文件到用户选择路径。

### 3.1 可直接复用的 pity 计算规则

- 每条 +1
- 遇到 5 星后 pity 重置 0

## 4. UIGF 导出逻辑（`EXPORT_UIGF_JSON`）

支持：`v3.0`、`v4.1`

### 4.1 item_id 获取机制

- 优先读取本地缓存 `item-id-dict.json`
- 先拉 `https://api.uigf.org/md5/genshin` 比较哈希
- 不一致再拉字典：
  - `https://api.uigf.org/dict/genshin/all.json`
  - 或回退到各语言单独字典
- 若字典缺某道具：
  - `GET https://api.uigf.org/identify/genshin/{name}` 即时补齐

### 4.2 v3.0 生成

- 单账号结构：`info + list`
- `region_time_zone`：
  - UID 前缀 `6` -> `-5`
  - UID 前缀 `7` -> `1`
  - 其他 -> `8`
- 缺失 `id` 时填充递增假 ID（从 `1000000000000000000` 开始）。

### 4.3 v4.1 生成

- 多账号结构：`info + hk4e[]`
- 每个账号：`uid/timezone/lang/list`
- `lang` 使用短码反查（如 `en` -> `en-us`）
- 同样会填补缺失 `id`。

## 5. UIGF / 本地 JSON 导入逻辑（`IMPORT_UIGF_JSON`）

导入顺序：

1. 先按 `local-data.json` schema 尝试当作本地格式导入。
2. 不匹配则尝试 UIGF：
   - 先修复 `item_id` 缺失字段
   - 再分别用 `uigf3_0` 与 `uigf4_1` schema 校验
3. 导入前自动备份旧文件到：
   - `userData/backup/<uid>/gacha-list-<uid>-<timestamp>.json`

### 5.1 导入排序关键点

- 按 `BigInt(id)` 升序排序后再写入，保持历史时间线稳定。

### 5.2 Schema 关键约束（你需要兼容）

- UIGF 3.0 条目必需字段：`uigf_gacha_type`、`gacha_type`、`item_id`、`time`、`id`
- UIGF 4.1（hk4e）条目必需字段：`uigf_gacha_type`、`gacha_type`、`item_id`、`time`、`id`
- 本地格式至少要求：`uid`、`lang`、`typeMap`、`result`

## 6. 非 UI 统计逻辑（`gachaDetail.js`）

它输出每个卡池的统计对象，包括：

- 3/4/5 星总数
- 武器/角色分项计数
- 每个具体道具出现次数
- `ssrPos`: `[name, 距上个5星抽数, time, wishType]`
- 时间范围 `date=[min,max]`

可直接复用来做“抽卡分析器后端统计模块”。

## 7. 你实现新工具时的强约束

- 统一内部记录结构，避免各模块传不同 shape。
- 所有导入都先 schema 校验再落库。
- 导入前必须自动备份，防止用户历史数据被覆盖。
- 对 `id` 统一按字符串处理，比较时转 `BigInt`。
- `time` 保留原字符串，不要提前转时区格式化字符串后覆盖原值。

## 8. 遗留功能说明（避免误判）

- 项目内有 `gists.js` 上传逻辑，但在主入口 `main.js` 默认未启用（`require('./gists')` 被注释）。
- 若你要复用该逻辑，先修复异步调用细节并补全错误处理，再接入正式流程。
