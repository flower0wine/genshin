# 工具与开发流程分析

## 技术选型

- 语言：TypeScript（Node.js 20+）
- 命令框架：`commander`
- 校验：`ajv`（UIGF schema）
- HTTP：原生 `fetch`（Node 20）+ timeout 包装
- 构建：`tsup`（快速产出 CJS/ESM）
- 测试：`vitest`
- 代码规范：`eslint` + `prettier`

## 选择理由

- 与现有项目依赖兼容（已有 `ajv`）
- CLI 需要快速冷启动，`tsup` 成本低
- `commander` 可维护命令与帮助输出

## 开发流程

1. 先实现纯函数核心模块（parse/fetch/merge/uigf）
2. 再接入命令层
3. 再补测试向量（合并、导入导出、分析）
4. 最后补打包与发布配置

## 迭代计划

- M1：`fetch + list + analyze` 可用
- M2：`export-uigf + import-uigf`
- M3：完善错误码、日志、测试覆盖
- M4：发布准备（README、版本、CI）
