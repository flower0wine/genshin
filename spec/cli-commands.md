# CLI 命令规范

## 命令总览

- `gwc fetch`：抓取并合并祈愿记录
- `gwc analyze`：输出统计结果
- `gwc export-uigf`：导出 UIGF JSON
- `gwc import-uigf`：导入 UIGF JSON
- `gwc list`：列出本地账号与摘要
- `gwc config`：查看/写入配置

## 关键参数

### fetch

- `--url <wishUrl>`：手动指定祈愿 URL
- `--auto`：自动日志提取 URL（默认）
- `--full`：全量抓取，忽略增量提前停止
- `--uid <uid>`：指定优先更新 UID（可选）
- `--data-dir <path>`：数据目录

### analyze

- `--uid <uid>`：目标 UID
- `--pool <key>`：可重复，限定池子
- `--json`：JSON 输出

### export-uigf

- `--uid <uid>`：仅导出单账号；不传则导出全部
- `--version <3.0|4.1>`：默认 `4.1`
- `--out <file>`：输出文件

### import-uigf

- `--file <path>`：导入文件路径
- `--backup`：导入前备份（默认开启）

## 退出码

- `0`：成功
- `2`：参数错误
- `3`：URL/鉴权错误
- `4`：网络错误
- `5`：存储错误
- `6`：Schema 校验错误
- `10`：未知错误
