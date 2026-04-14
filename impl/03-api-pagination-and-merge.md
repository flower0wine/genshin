# API 调用、分页抓取、增量合并实现细节

## 1. 真实请求端点

### 1.1 配置端点（校验 authkey）

- `GET {apiDomain}/gacha_info/api/getConfigList?{query}`
- 校验条件：`retcode === 0`

### 1.2 记录端点（分页）

- `GET {apiDomain}/gacha_info/api/getGachaLog?{query}&gacha_type={type}&page={page}&size=20[&end_id={id}]`

其中：

- `type` 取值顺序：`301 -> 302 -> 200 -> 500 -> 100`
- `page` 从 1 开始
- `size` 固定 20
- `end_id` 为上一页最后一条记录的 `id`（BigInt）

参数语义建议：

- `gacha_type`：目标卡池类型（注意 `301` 与 `400` 关系）
- `page`：页码，服务端用于分页游标辅助
- `size`：每页条数，当前实现固定 `20`
- `end_id`：上一页最后一条记录 ID，用于继续翻页

## 2. 单页请求的重试机制

函数：`getGachaLog()`

- 每页失败最多重试 5 次（总尝试 6 次）。
- 每次重试前 `sleep(5s)`。
- 最终失败抛异常终止本次抓取。

## 3. 分页循环终止条件

函数：`getGachaLogs()`

默认循环：

- 执行直到 `res.length === 0`。

额外“增量提前终止”（`fetchFullHistory=false`）：

- 若本地已有该 UID+池子数据，取本地最后一条 `localLatestId`。
- 当当前页任意条目 `item.id === localLatestId`，提前 `break`。

作用：

- 只增量抓取新记录，避免每次全量扫描历史。

## 4. 拉取节流策略

- 每页后 `sleep(0.3s)`。
- 每 10 页额外提示并 `sleep(1s)`。

这套节流降低了接口压力和短时网络波动影响。

## 5. API 响应到内部结构的标准化

每条接口记录映射为：

```js
[time, name, item_type, parseInt(rank_type), gacha_type, id]
```

关键点：

- `rank_type` 从字符串转数字。
- 转换后会对整池 `logs.reverse()`：
  - 存储顺序为“旧 -> 新”。

注意：请求返回通常是“新 -> 旧”，本地保存改成“旧 -> 新”后，统计和导出都依赖这个顺序。

## 6. 合并算法（核心）

入口：`mergeData(local, origin)` -> `mergeList(remoteList, localList)`

### 6.1 同 UID 才允许合并

- 若 `local.uid !== origin.uid`，直接使用远端数据，不做混合。

### 6.2 优先按 ID 对齐

- 取远端首条 `idA`（即本次抓到的数据中最旧的一条，因先抓新后 reverse）。
- 在本地列表倒序查找同 ID。
- 找到位置 `pos` 后：
  - `merged = local.slice(0, pos).concat(remote)`

这一步本质是：保留本地更老的前缀 + 用远端覆盖重叠段和新段。

### 6.3 ID 对齐失败时，按时间窗口 + 片段比对

- 取远端首条时间 `minA`。
- 在本地从时间 >= `minA` 的位置开始尝试窗口匹配。
- `compareList` 用每条前 4 字段（time,name,type,rank）构造签名比较。
- 默认窗口宽度：`min(11, lenA, lenB)`。

片段签名仅比较前 4 列（不含 gacha_type 和 id），是为了兼容旧数据缺少后两列的场景。

### 6.4 为什么这样做

- 兼容部分旧数据无 `id` 或 `id` 不稳定的情况。
- 通过时间+片段避免简单拼接导致重复记录。

## 7. 伪代码（可直接复用）

```text
for type in [301,302,200,500,100]:
  page = 1
  end_id = 0
  list = []
  while true:
    res = request(type, page, end_id)
    if res.empty: break
    list += res
    end_id = res.last.id
    if not fetchFullHistory and hitLocalLatestId(res):
      break
    page += 1
  logs = normalize(list).reverse()
  result[type] = merge(logs, local[type])
save(result)
```

## 8. 构建你自己的工具时，建议的增强点

- 重试策略建议升级为指数退避（5s/10s/20s）。
- 增量检查建议同时支持 `id` 与 `(time,name,rank)` 复合指纹。
- 将抓取日志结构化（JSON log），方便排查 authkey 过期、网络抖动。
- 增加“单池并发 + 全局限速器”，提高首轮全量抓取速度。

## 9. 已识别边界与风险

- `end_id` 在代码里转 `BigInt`，最终拼 URL 时会转字符串；你复刻时保持字符串即可。
- 如果 API 偶发返回空页但后续还有数据，当前实现会直接终止循环；可考虑二次确认机制。
- 增量提前停止依赖 `localLatestId` 命中，若本地被用户手工修改可能导致多抓或漏抓。
