# AuthKey 获取与请求参数解析细节

## 1. 两种 authkey 获取模式

### 模式 A：本地日志 + 缓存文件解析（默认）

入口：`readLog()`

1. 根据系统和配置识别日志路径：
   - 国服：`%HOME%/AppData/LocalLow/miHoYo/原神/output_log.txt`
   - 国际服：`%HOME%/AppData/LocalLow/miHoYo/Genshin Impact/output_log.txt`
   - 云原神：`%HOME%/AppData/Local/miHoYo/GenshinImpactCloudGame/config/logs/MiHoYoSDK.log`
2. 从 `output_log.txt` 提取游戏目录（正则匹配 `.../(GenshinImpact_Data|YuanShen_Data)`）。
3. 在游戏目录下查找最新缓存文件：
   - `webCaches{/,/*/}Cache/Cache_Data/data_2`
4. 从缓存文本中正则提取祈愿历史 URL：
   - `https...auth_appid=webview_gacha...authkey=...game_biz=hk4e_xxx`
5. 取最后一个匹配 URL 作为有效 URL。

### 模式 B：系统代理 + MITM 抓包（备用）

入口：`fetchData('proxy')` -> `useProxy()`

1. 启动本地代理（默认端口 `8325`）。
2. 修改 Windows 代理注册表（HKCU Internet Settings）。
3. `node-mitmproxy` 仅拦截：
   - `webstatic*.mihoyo.com`
   - `webstatic*.hoyoverse.com`
4. 在请求路径里捕获 `authkey=...` 时拼接完整 URL 返回。
5. 拿到 URL 后立即关闭系统代理。

## 2. URL 清洗与 query 参数解析

入口：`getQuerystring(url)`

### 2.1 域名判定

- 若 URL host 包含以下任一关键字：
  - `webstatic-sea`
  - `hk4e-api-os`
  - `hoyoverse.com`
- 则 API 域名设置为：
  - `https://public-operation-hk4e-sg.hoyoverse.com`
- 否则使用：
  - `https://public-operation-hk4e.mihoyo.com`

### 2.2 authkey 编码修复

- `fixAuthkey(url)` 会检测 `authkey` 是否包含 `=` 且未 URL 编码。
- 若未编码，执行 `encodeURIComponent(authkey)` 再替换回 URL。

### 2.3 规范化 query 参数

从 URL `searchParams` 中移除以下翻页相关参数：

- `page`
- `size`
- `gacha_type`
- `end_id`

保留其余参数（常见包括）：

- `authkey`
- `authkey_ver`
- `sign_type`
- `init_type`
- `lang`
- `device_type`
- `game_version`
- `plat_type`
- `region`
- `timestamp`
- `game_biz`

> 实际参数以游戏返回的 URL 为准，工具并不硬编码白名单。

### 2.4 请求参数建议分层

实现你自己的工具时，建议把 query 参数分为三类：

- 鉴权参数：`authkey`、`authkey_ver`、`sign_type`
- 会话/设备参数：`timestamp`、`init_type`、`device_type`、`game_version`、`plat_type`
- 业务参数：`region`、`lang`、`game_biz`

这样在排查问题时可以快速定位：

- 鉴权失败：先查 authkey 生命周期
- 400/参数错误：先查设备参数和 region
- 多语言错乱：先查 lang 和本地语言复用逻辑

## 3. 请求预检查

入口：`tryRequest(url)`

- 先请求：
  - `GET {apiDomain}/gacha_info/api/getConfigList?{query}`
- 作用：验证 `authkey` 是否可用。
- 响应检查：`retcode === 0` 才继续。

`retcode != 0` 处理：

- `message === 'authkey timeout'`：
  - 触发 IPC 通知 `AUTHKEY_TIMEOUT = true`
  - 抛错并终止抓取。
- 其它错误：直接抛错并写日志。

常见响应结构（按代码使用字段推断）：

```json
{
  "retcode": 0,
  "message": "OK",
  "data": {
    "list": [
      {
        "uid": "100000001",
        "id": "1234567890123456789",
        "gacha_type": "301",
        "item_type": "Character",
        "name": "Xxx",
        "rank_type": "5",
        "time": "2026-04-01 12:34:56"
      }
    ]
  }
}
```

## 4. tryGetUid 的容错策略

在正式抓取前，代码会尝试用默认卡池顺序请求第一页（size=6）找到 UID：

- 301、302、500、200、100

如果全部失败，回退 `config.current`。

目的：

- 在抓取前尽早锁定账户 UID，便于语言复用与增量判断。

## 5. 实现注意事项（你复刻时容易踩坑）

- `authkey` 经常出现编码问题，务必做“二次编码修复”。
- 只依赖固定日志文件路径不够，需兼容多目录和云原神日志。
- 代理抓包必须保证“抓到即关”，否则用户系统网络会被持续代理。
- URL 参数不要手写模板，应以实际捕获 URL 参数集为准并仅移除翻页参数。
- `authkey` 是短期凭据，不要持久缓存太久，建议失败自动提示重新打开祈愿历史页。
- 如果 URL 提取失败，后续预检查前应先判空；否则可能在 `new URL()` 阶段抛异常。
