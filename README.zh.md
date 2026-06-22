# Hugo Knowledge Graph

Hugo Knowledge Graph (HKG) 是一個 Hugo module，用來視覺化部落格文章之間的連結關係。

| 使用 docker docs 的範例 | Legend on |
| --- | --- |
| <img width="780" height="780" alt="docker" src="https://github.com/user-attachments/assets/e6848a50-0a2d-4e50-8212-db9bf6aaf95c" /> | <img width="786" height="784" alt="docker-lgd" src="https://github.com/user-attachments/assets/de75d71e-4b21-4bb6-b5fc-7ae84aaf8b93" /> |

## How it Works

透過設定自定義 Hugo 檔案輸出類型，HKG 在網站開始建立之前先索引好記錄文章關係的 JSON 字典，並藉由這個字典使用 [force-graph][fg] 畫出文章之間的關係連結。HKG 使用兩種方式來建立連結：

1. **backlinks:** 透過 Markdown 連結在被連結的頁面建立索引記錄
2. **tags:** Hugo 標籤系統

> [!IMPORTANT]
> 請注意 backlinks 一定要能被 [.Page.GetPage][getpage] 方式解析，被連結的頁面才能成功記錄 backlink。

## Getting Started

git submodule 或是 Hugo module 兩種方式擇一安裝 HKG。

### 安裝與設定

<details>
<summary>git submodule</summary>

```bash
git submodule add https://github.com/ZhenShuo2021/hugo-knowledge-graph themes/hugo-knowledge-graph
```

設定 `hugo.toml`：

```toml
theme = ["hugo-knowledge-graph", "your original theme"]

[markup.goldmark.renderHooks.link]
  useEmbedded = "always"

[outputs]
  home = ["html", "backlinks", "knowledge-graph"]
```

</details>

<details>
<summary>Hugo module</summary>

請確認你的專案已啟用 Hugo module，若尚未啟用，請先執行 `hugo mod init NAME`。

設定 `hugo.toml`：

```toml
[[module.imports]]
  path = "github.com/ZhenShuo2021/hugo-knowledge-graph"

[markup.goldmark.renderHooks.link]
  useEmbedded = "always"

[outputs]
  home = ["html", "backlinks", "knowledge-graph"]
```

</details>

### Usage

HKG 提供兩種使用方式，分別是全功能的 `full` 和小組件類型的 `widget`，`full` 會建立全功能的 knowledge graph，包含搜尋、filter 等功能，widget 則是頁面小組件，適合在頁面角落放置。

一般用戶建立 `content/graph/_index.md` 或是在 front matter 設定 `type: graph` 就會啟動 `full` 版本。

如果你想以頁面小組件的方式載入 HKG，則在您想要的 partial 檔案使用 `{{ partial "knowledge-graph/widget.html" . }}`。

## Customization

### Styles

所有可自定義的顏色都在 [vars.css][css] 中，你可以在您主題的 `custom.css` 中自定義變數值，或是使用本專案自行提供的入口檔案 `assets/css/knowledge-graph/override.css`。

節點顏色遵循 `--kg-node-GROUP_NAME` 命名規則，group 名稱預設對應 Hugo 的 content section，例如 `content/posts/` 的節點顏色變數是 `--kg-node-posts`。你可以用這個方式替任意 group 指定顏色，不限於內建的幾個：

```css
:root {
    --kg-node-posts: rgb(99, 153, 34);
    --kg-node-notes: rgb(99, 150, 200);
}
```

> [!IMPORTANT]
> 只接受 RGB 格式的顏色數值。

### Graph

建立 `data/knowledgeGraph.yaml` 以自訂以下參數，支援自動合併設定，不需複製完整檔案，可以只覆寫要改的項目。

```yaml
# ==========================================
# External Resources
# ==========================================
forceGraphSrc: https://cdn.jsdelivr.net/npm/force-graph@1.51.4/dist/force-graph.min.js
forceGraphSri: sha256-EAhTm7nhcaDcNDRTNmRRobOm3tBgKO9Pl4YItli6LQo=
d3ForceSrc: https://esm.sh/d3-force # Must be ESM format

# ==========================================
# Global Environment
# ==========================================
darkSelectors: '' # CSS selector to observe dark mode (used when no event is dispatched)

# ==========================================
# Mode-Specific Configs
# ==========================================

# 1. Full Graph Mode
full:
  nodeRelSize: 12 # Base radius unit for nodes
  nodeValMin: 4 # Minimum physical/visual node size
  nodeValMax: 128 # Maximum physical/visual node size
  nodeValDegScale: 1.5 # Weight for scaling node size by link degree
  labelZoomThreshold: 0.2 # Zoom level at which labels start appearing (lower = earlier)
  labelFontScale: 0.12 # Label text scale factor
  labelFontMin: 30 # Minimum label font size in pixels
  labelMaxChars: 99 # Maximum characters shown in a node label
  labelFadeRate: 0.1 # Label fade-in animation rate
  labelOffsetPx: 2 # Vertical gap between label and node (px)
  chargeStrength: -1500 # D3 many-body force strength (negative = repulsion) https://d3js.org/d3-force/many-body#manyBody_strength
  linkDistance: 250 # Ideal distance between linked nodes https://d3js.org/d3-force/link#link_distance
  graphZoomInit: 0.05 # Initial zoom level when the canvas loads
  showTags: true # Whether to show tag nodes
  tagMinCount: 2 # Minimum number of articles a tag must be linked to in order to appear
  animSpeed: 0.1 # Rate for color transitions and other animations

  # full only
  fixedLayout: '' # Static layout algorithm (options: uniform, layered, organic)
  searchZoomDest: 0.6 # Zoom level after focusing on a search result
  searchZoomDur: 1000 # Duration of search focus animation (ms)

# 2. Widget / Local Graph Mode
widget:
  nodeRelSize: 3
  nodeValMin: 2
  nodeValMax: 16
  nodeValDegScale: 1.5
  labelZoomThreshold: 0.005
  labelFontScale: 1
  labelFontMin: 10
  labelMaxChars: 99
  labelFadeRate: 0.1
  labelOffsetPx: 2
  chargeStrength: -3000
  linkDistance: 10
  graphZoomInit: 0.7
  showTags: true
  tagMinCount: 0
  animSpeed: 0.1

  # widget only
  hopDepth: 1 # How many hops outward to include in the local graph view
```

## Tips and Tricks

### 管理連結

`.Page.GetPage` 初次看到可能不容易理解，重要原則是「永遠使用包含檔案名稱的路徑」。

這能讓您非常直觀易懂的看出到底有沒有成功解析，如果有成功解析就會顯示正確 URL，否則 URL 會被渲染成包含檔案名稱的路徑；如果不包含檔案名稱，您可能會難以分辨渲染結果路徑是被被 fallback 成字串還是成功解析。

### 檢查死連結

您可以使用 rumdl 的 [MD057][md057] 規則檢查連結正確性。

### 自動補全連結

絕對路徑是從 `content` 往下算，因此 VS Code 無法自動補全連結，可以在 `.vscode/settings.json` 中設定 [rumdl.linkCompletions.contentRoots][md-root] 規則解決此問題。

### 節點之間沒有連線

HKG 在資料蒐集階段就會過濾掉「只被一篇文章引用的標籤」，因為這些資訊屬於雜訊。

可能出現的問題包含 `.GetPage` 解析失敗、沒有設定 tag taxonomy、該 tag 使用的文章數量過少、tagMinCount 設定過大、hopDepth 設定成 0。如果都不是，請回報錯誤。

### 自訂力圖

自訂力圖非常難以上手，因為力是環環相扣互相影響，一個推薦的調整流程是：

1. 設定 chargeStrength，影響節點之間的排斥力。具體影響的是
   1. cluster 能不能被彈出來獨立顯示，避免多個 cluster 交織
   2. 節點是否能放射狀顯示而不偏向同一方向
2. 設定 linkDistance，影響線的長度。
3. 反覆校正步驟 1\~2 直到滿意
4. 設定 nodeRelSize
5. 設定初始大小 graphZoomInit、縮放門檻 labelZoomThreshold

### 自訂節點 group

HKG 預設使用 Hugo [.Section][hugo-section] 方法回傳每篇文章的 top level section name 作為節點群組，如果您的內容組織不符合此方式 (e.g. `posts/frontend` `posts/backend` 這樣就無法區分兩個 group) 就需要自訂 group。在 `data/knowledgeGraph.yaml` 設定，範例為

```yaml
group:
  - path: /posts/frontend # 開頭包含 /
    name: display name for x
  - path: /posts/backend
    name: display name for y
```

這樣就會把兩個子目錄分成兩個群組。找不到群組的文章會 fallback 使用 `.Section`。

### Dark mode support

HKG 支援 dark mode，如果你的網站沒有在支援的覆蓋範圍，可以自訂 `darkSelectors` 設定。

設定主題切換 dark mode 的 CSS selector 如 `darkSelectors: html.dark`，HKG 會監聽此 selector 變化並切換主題。

### 新增新 taxonomy

目前不支援新增 taxonomy。

### useEmbedded

啟用 [Hugo 內建的 link 解析][link-resolution]，該設定的預設值為 auto 代表*不會啟用內建 link 解析*，因此才需要修改設定。

改用 always 後會覆蓋掉您原始主題的 link render hook（如果有），如果需要主題自帶的 link render hook，請自行 override 您的 link render hook，將連結解析邏輯改為 [Hugo 版本][link-resolution-src]，其餘代碼保持您原有主題的功能。

## Development

1. `git clone https://github.com/ZhenShuo2021/hugo-knowledge-graph`
2. `git clone https://github.com/ZhenShuo2021/hugo-kg-example hugo-kg-example`
3. `cd hugo-knowledge-graph`
4. `hugo server --source ../hugo-kg-example --themesDir .. -e docker`

[fg]: https://github.com/vasturiano/force-graph
[css]: https://github.com/ZhenShuo2021/hugo-knowledge-graph/blob/main/assets/css/knowledge-graph/vars.css
[getpage]: https://gohugo.io/methods/page/getpage/
[md-root]: https://github.com/rvben/rumdl-vscode
[md057]: https://rumdl.dev/md057/?h=md057#absolute-links
[hugo-section]: https://gohugo.io/methods/page/section/
[link-resolution]: https://gohugo.io/configuration/markup/#renderhookslinkuseembedded
[link-resolution-src]: https://github.com/gohugoio/hugo/blob/ff22c62a32628fcf51f82de2f72a749e1cdf4fc3/tpl/tplimpl/embedded/templates/_markup/render-link.html
