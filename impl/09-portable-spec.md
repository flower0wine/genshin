# 语言/平台无关实现规范（可直接作为开发规格）

本规范用于在任意语言、任意形态（CLI/App/Web/服务）中复刻核心能力。

## 1. 术语

- `WishRecord`：`[time, name, item_type, rank, gacha_type, id]`
- `PoolKey`：`100 | 200 | 301 | 302 | 500`
- `ApiDomainCN`：`https://public-operation-hk4e.mihoyo.com`
- `ApiDomainOS`：`https://public-operation-hk4e-sg.hoyoverse.com`

## 2. 规范级要求

### 2.1 URL 与参数

- 实现 MUST 支持从完整祈愿 URL 提取 query。
- 实现 MUST 删除 `page,size,gacha_type,end_id` 后再发请求。
- 实现 MUST 做 authkey 编码修复（未编码时 URL encode）。
- 实现 SHOULD 保留原 URL 其他参数，不做自定义裁剪。

### 2.2 域名选择

- 若来源 host 含 `webstatic-sea|hk4e-api-os|hoyoverse.com`，MUST 使用 `ApiDomainOS`。
- 否则 MUST 使用 `ApiDomainCN`。

### 2.3 预检

- 实现 MUST 在正式拉取前请求 `getConfigList`。
- 若 `retcode != 0` MUST 终止抓取并返回结构化错误。

### 2.4 分页

- 每池 MUST 使用 `size=20`。
- 每池 MUST 从 `page=1` 开始。
- 每页若有数据 MUST 用末条 `id` 更新 `end_id`。
- 空页 MUST 终止该池。

### 2.5 重试与节流

- 单页失败 MUST 重试（至少 3 次，参考实现 5 次）。
- 实现 SHOULD 在页间节流（>=200ms，参考 300ms）。

### 2.6 标准化

- `rank_type` MUST 转整数。
- 记录数组 MUST 规范为：

```text
[time, name, item_type, rank, gacha_type, id]
```

- 本地落库顺序 MUST 为“旧 -> 新”。

### 2.7 增量合并

- 合并 MUST 先尝试 `id` 对齐。
- 若 `id` 对齐失败，MUST 使用窗口签名兜底（至少比较 `time,name,item_type,rank`）。
- 合并后 MUST 无重复记录。

### 2.8 多账号与语言

- 实现 MUST 以 UID 作为隔离键。
- 同 UID 更新时 SHOULD 复用历史 `lang` 参数。
- 非中文语言 SHOULD 支持短码与长码互转（如 `en` <-> `en-us`）。

### 2.9 导入导出

- 导入 MUST 校验 schema。
- 导入 MUST 在覆盖前备份旧数据。
- 导出 UIGF 时，缺失 `id` MUST 生成稳定假 ID。

## 3. 推荐状态机

```text
idle
 -> resolve_url
 -> parse_query
 -> preflight
 -> fetch_pools
 -> normalize
 -> merge
 -> persist
 -> done
```

失败可在任一步进入：`failed(code,message,context)`。

## 4. 统一错误码（建议）

- `URL_NOT_FOUND`
- `URL_INVALID`
- `AUTHKEY_TIMEOUT`
- `AUTHKEY_INVALID`
- `NETWORK_TIMEOUT`
- `NETWORK_ERROR`
- `API_ERROR`
- `SCHEMA_INVALID`
- `STORAGE_ERROR`
- `UNKNOWN`

## 5. 最小兼容输入输出契约

### 输入

```ts
type FetchInput = {
  mode: 'auto' | 'proxy' | 'url'
  url?: string
  fetchFullHistory?: boolean
}
```

### 输出

```ts
type FetchOutput = {
  uid: string
  lang: string
  pools: Record<string, number>
  addedCount: number
  totalCount: number
  updatedAt: number
}
```

## 6. 平台适配要求

- Windows 桌面：可实现日志自动解析 + 系统代理抓包。
- macOS/Linux：路径规则与代理配置 MUST 抽象为适配器。
- Web/移动端：若无法读本地日志或改系统代理，MUST 提供手动 URL 输入模式。

## 7. 一致性测试向量（必须具备）

- 向量 A：本地空库 + 全量抓取
- 向量 B：已有历史 + 增量抓取
- 向量 C：无 id 旧数据 + 窗口兜底合并
- 向量 D：导入 UIGF 后再导出，字段闭环一致

通过标准：四个向量均满足“条数、顺序、五星位置”一致。
