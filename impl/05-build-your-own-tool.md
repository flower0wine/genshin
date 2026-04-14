# 基于该项目实现“你的抽卡分析工具”执行方案

## 1. 推荐的模块拆分

- `link-source`
  - 职责：获取并刷新可用 URL（日志解析 + 代理兜底）
- `wish-client`
  - 职责：封装 API 请求、重试、分页、节流
- `wish-store`
  - 职责：本地数据读写、版本化、备份、合并
- `analyzer`
  - 职责：保底统计、五星间隔、角色武器分布、时间分布
- `exporter`
  - 职责：Excel/UIGF/你自定义 JSON

## 2. 可直接照搬的关键流程

### 2.1 抓取流程

1. `getUrl()` 获取祈愿历史 URL。
2. `parseQuery(url)` 保留 authkey 等参数，清理翻页参数。
3. `validateAuthKey()` 调 `getConfigList`。
4. 按池子依次分页拉 `getGachaLog`。
5. 标准化 + reverse + merge + save。

建议额外加一层 `fetch-session` 状态机：

- `idle` -> `resolving_url` -> `validating_key` -> `fetching_pages` -> `merging` -> `saved`
- 任一步失败都打点错误码，方便定位问题。

### 2.2 分析流程

1. 加载标准化记录数组。
2. 对每个池子线性扫描：
   - 记录总抽数
   - 计算每个五星出现位置
   - 计算 pity 分布
3. 输出统计聚合 JSON 供前端展示。

## 3. 你可以新增的分析能力（本项目未做深）

- 小保底/大保底命中推断（基于 UP 角色/武器池规则）
- 每版本抽卡行为分析（按时间切片）
- “距离下个五星概率区间”预测
- 抽卡策略模拟（例如存抽规划）

## 4. 请求与存储层的工程建议

- 请求层加超时、重试、错误码分类（鉴权/限流/网络）。
- 存储层加 schema 版本号，预留迁移脚本。
- 每次导入导出记录审计日志（时间、uid、条数、来源）。
- 对外导出时默认脱敏（可选隐藏 UID）。

## 5. 安全与合规建议

- `authkey` 仅短期内存使用，禁止明文日志落盘。
- 错误日志里统一做 authkey 掩码。
- 代理模式必须可一键关闭且异常退出时自动清理系统代理。

## 6. 最小实现里程碑（建议 4 个迭代）

1. `M1`：能抓全量并保存本地 JSON。
2. `M2`：支持增量更新与重复去重。
3. `M3`：支持 UIGF 导入导出与备份恢复。
4. `M4`：加入高级分析（保底推断 + 时间趋势）。

## 7. 验收清单

- 同一 UID 连续更新不会重复数据。
- authkey 过期能被正确识别并提示。
- 导入异常 JSON 不会污染本地库。
- 多账号数据可并存且可切换。
- 导出 UIGF 通过 schema 校验。

## 8. 建议的接口契约（便于前后端解耦）

### 8.1 抓取接口

```ts
type FetchInput = { mode: 'auto' | 'proxy' | 'url'; url?: string; full?: boolean };
type FetchOutput = { uid: string; updatedPools: string[]; added: number; total: number; };
```

### 8.2 分析接口

```ts
type AnalyzeInput = { uid: string; pools?: string[] };
type AnalyzeOutput = {
  pool: string;
  total: number;
  star3: number;
  star4: number;
  star5: number;
  ssrPos: Array<{ name: string; pity: number; time: string }>;
}[];
```
