# impl 文档索引

本目录是对 `genshin-wish-export` 非 UI 逻辑的深度拆解，按“可复刻实现”组织。

## 文档列表

1. `01-core-architecture.md`
   - 整体架构、主流程、IPC 总览
2. `02-authkey-and-query-parsing.md`
   - authkey 获取、URL 清洗、query 参数解析
3. `03-api-pagination-and-merge.md`
   - API 端点、分页、重试、增量合并
4. `04-data-model-import-export.md`
   - 数据模型、导入导出、Schema 约束
5. `05-build-your-own-tool.md`
   - 模块化设计与工程化建议
6. `06-function-level-trace.md`
   - 函数级输入输出与副作用追踪
7. `07-implementation-playbook.md`
   - 从零实现的操作手册
8. `08-completeness-audit.md`
   - 完整性审计与缺口清单
9. `09-portable-spec.md`
   - 语言/平台无关规范（MUST/SHOULD）

## 使用建议

- 先读 `01` + `02` 建立抓取链路认知
- 再读 `03` + `04` 完成核心实现
- 最后参考 `05` `06` `07` 做工程化与扩展
- 交付前用 `08` `09` 做完整性与跨语言一致性验收
