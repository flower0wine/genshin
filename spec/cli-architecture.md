# CLI 架构设计

## 目录结构（目标）

```text
cli-ts/
  src/
    cli.ts                  # 命令入口
    commands/               # 命令处理器
    core/
      auth/                 # URL 解析与预检
      fetch/                # 分页抓取与重试
      merge/                # 增量合并
      uigf/                 # 导入导出
      analyze/              # 统计分析
    infra/
      fs/                   # 存储适配器
      http/                 # 请求适配器
      log/                  # 日志输出
    model/                  # 类型定义
    config/                 # 默认配置与加载
  data/                     # 默认数据目录（可配置）
```

## 设计原则

- 单一职责：命令层不含核心业务计算
- 核心逻辑纯函数优先，便于测试
- I/O 通过 infra 适配，便于替换运行环境

## 核心流程

1. resolve-url（手动或自动）
2. parse-query + preflight
3. fetch-pools（分页）
4. normalize + merge
5. persist
6. export / analyze

## 状态机

`idle -> resolve_url -> preflight -> fetch -> merge -> persist -> done`

任一步可进入 `failed(code, message, context)`。
