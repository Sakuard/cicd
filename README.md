
# 服務工具使用手冊

## 使用手冊

### 設定步驟
1. 請首先複製 `config.js.example` 文件，並將其重命名為 `config.js`。
2. 打開 `config.js`，根據您的需求將其中的相關參數變更為適合您環境的指定參數。這包括設定repo位置、資料夾路徑、服務器端口等。

## 功能說明
本工具包含兩個主要部分：`release_agent` 和 `update_agent`，分別負責不同的自動化任務。

- **release_agent:** 負責定期確認 `config.js` 內指定對應的 repo 與 folder 的資料連動性。當發現指定的 repo 有新的 commit 或 push 更新時，它會在對應的指定資料夾底下執行 `git pull` 和 `npm install`，以確保代碼是最新的。
- **update_agent：** 負責在指定時間確認 `config.js` 內指定對應的 folders 間的資料連動性。這主要用於確保 hosted server 的 service folder dir 與 `release_agent` 某個 repo 的 folder dir 之間的文件是同步的，從而控制 server 上 service 的更新時間。
- **API Endpoints：** 兩個 server 都提供 API endpoint，使可以透過外部方式觸發其功能。這為遠程管理和自動化提供了靈活性。
