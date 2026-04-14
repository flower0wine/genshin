# 从零实现你自己的抽卡分析工具：操作手册

## 0. 目标范围（建议先实现）

- 支持自动获取 authkey（日志）+ 代理兜底
- 支持增量更新
- 支持多账号本地存储
- 支持基础分析（总抽数/五星间隔/池子分布）

## 1. Step-by-step 实现顺序

### Step 1：定义统一数据结构

```ts
type WishRecord = [
  time: string,
  name: string,
  itemType: string,
  rank: number,
  gachaType: string,
  id: string
]
```

### Step 2：实现 URL 获取

- `readLog()`：
  - 解析 `output_log.txt`
  - 定位 `..._Data/webCaches/.../data_2`
  - 正则抓 URL
- `useProxy()`：
  - 开本地代理
  - 抓到 `authkey` 即返回并关闭代理

### Step 3：实现 query 解析

- `new URL(url).searchParams`
- 移除 `page,size,gacha_type,end_id`
- 修复 authkey 编码

### Step 4：实现请求客户端

- 预检：`/gacha_info/api/getConfigList`
- 分页：`/gacha_info/api/getGachaLog`
- 重试：每页最多 5 次
- 节流：每页 300ms

### Step 5：实现增量合并

- 优先 ID 对齐
- 失败后窗口签名比对（time+name+type+rank）
- 保证结果顺序为“旧 -> 新”

### Step 6：实现本地存储

- `gacha-list-<uid>.json`
- `config.json`
- 导入前自动备份

### Step 7：实现分析层

- 每池统计：`count3/4/5`
- 五星位置与间隔：`ssrPos`
- 时间跨度：`dateMin/dateMax`

## 2. 请求失败分类建议

- `AUTH_EXPIRED`：`authkey timeout`
- `NETWORK_ERROR`：超时/断网
- `BAD_RESPONSE`：JSON 结构异常
- `UNKNOWN`：其他异常

统一返回：

```ts
type FetchError = {
  code: 'AUTH_EXPIRED' | 'NETWORK_ERROR' | 'BAD_RESPONSE' | 'UNKNOWN'
  message: string
  pool?: string
  page?: number
}
```

## 3. 质量保障清单

- 单元测试：
  - mergeList 去重正确
  - authkey 编码修复正确
  - import schema 校验正确
- 集成测试：
  - 全量抓取 + 增量抓取结果一致
  - 导入后再导出可回读
- 异常测试：
  - authkey 失效
  - 网络波动
  - 本地文件损坏

## 4. 迁移建议

如果你后续要支持更多米家游戏，建议一开始就抽象：

- `GameAdapter`：定义卡池类型、API 路径、字段映射
- `StorageAdapter`：定义导入导出格式
- `AnalyzerAdapter`：定义游戏专属保底规则
