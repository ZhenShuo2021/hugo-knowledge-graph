# Hugo Knowledge Graph

Hugo Knowledge Graph (HKG) is a Hugo module for visualizing the link relationships between blog posts.

| Example rendered using docker docs | Legend on |
| --- | --- |
| <img width="780" height="780" alt="docker" src="https://github.com/user-attachments/assets/e6848a50-0a2d-4e50-8212-db9bf6aaf95c" /> | <img width="786" height="784" alt="docker-lgd" src="https://github.com/user-attachments/assets/de75d71e-4b21-4bb6-b5fc-7ae84aaf8b93" /> |

## How it Works

By configuring custom Hugo output formats, HKG indexes a JSON dictionary recording article relationships before the site build begins. It then uses this dictionary to render the interconnected relationships between articles using [force-graph][fg]. HKG establishes connections in two ways:

1. **backlinks:** Records index entries on the linked page via Markdown links
2. **tags:** Hugo tag system

> [!IMPORTANT]
> Please note that backlinks must be resolvable via [.Page.GetPage][getpage] in order for the linked page to successfully record the backlink.

## Getting Started

Install HKG using either git submodule or Hugo module.

### Installation & Configuration

<details>
<summary>git submodule</summary>

```bash
git submodule add https://github.com/ZhenShuo2021/hugo-knowledge-graph themes/hugo-knowledge-graph
```

Configure `hugo.toml`:

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

Make sure your project already uses Hugo modules. If not, run `hugo mod init NAME` first.

Configure `hugo.toml`:

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

HKG provides two usage modes: full-featured `full` and widget-style `widget`. The `full` mode builds a complete knowledge graph with features like search and filtering, while `widget` is a small component suitable for placing in page corners.

For typical usage, creating `content/graph/_index.md` or setting `type: graph` in front matter will enable the `full` version.

If you want to load HKG as a page widget, use `{{ partial "knowledge-graph/widget.html" . }}` in your desired partial file.

## Customization

### Styles

All customizable colors are defined in [vars.css][css]. You can override variable values in your theme’s `custom.css`, or use the provided entry file `assets/css/knowledge-graph/override.css`.

Node colors follow the naming rule `--kg-node-GROUP_NAME`. Group names default to Hugo content sections. For example, nodes under `content/posts/` use the variable `--kg-node-posts`. You can define colors for any group using this pattern, not limited to built-in ones:

```css
:root {
    --kg-node-posts: rgb(99, 153, 34);
    --kg-node-notes: rgb(99, 150, 200);
}
```

> [!IMPORTANT]
> Only RGB color values are accepted.

### Graph

Create `data/knowledgeGraph.yaml` to customize the following parameters. Configuration supports automatic merging, so you don’t need to copy the entire file—only override the fields you want to change.

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

### Managing Links

`.Page.GetPage` may not be easy to understand at first. The key principle is: “always use paths that include the filename.”

This lets you clearly verify whether resolution succeeded. If it resolves successfully, it will render the correct URL; otherwise, the URL will render as a path containing the filename. If the filename is not included, it may be difficult to distinguish whether the rendered path is a fallback string or a successfully resolved path. Filename-based paths can be either absolute or relative, but absolute paths are generally recommended:

```markdown
[link text](/posts/my-article.md)
<!-- Absolute paths must include a leading slash "/" -->
```

Absolute paths are calculated from `content`, so `/content` does not need to be included.

### Auto-completing Links

Since absolute paths are calculated from `content`, VS Code cannot auto-complete them. To address this, you can install the [Markdown-Absolute-Path][md-abs-path] extension, a lightweight VS Code extension whose sole purpose is to customize the root of absolute links.

### Checking Dead Links

You can use rumdl to check link correctness. The [MD057][md057] rule verifies absolute links.

### No Connections Between Nodes

During data collection, HKG filters out tags that are referenced by only one article, as they are considered noise.

Possible issues include `.GetPage` resolution failure, missing tag taxonomy configuration, too few articles using the tag, overly large `tagMinCount`, or `hopDepth` set to 0. If none apply, please report a bug.

### Custom Force Graph

Customizing the force graph is difficult because forces are interdependent. A recommended tuning process:

1. Set `chargeStrength`, which affects repulsion between nodes. Specifically:

   1. Whether clusters can separate and display independently
   2. Whether nodes radiate outward instead of biasing in one direction
2. Set `linkDistance`, which affects edge length
3. Iterate steps 1–2 until satisfied
4. Set `nodeRelSize`
5. Set initial zoom `graphZoomInit` and label threshold `labelZoomThreshold`

### Custom Node Groups

By default, HKG uses Hugo’s [.Section][hugo-section] method to return each post’s top-level section name as the node group. If your content structure doesn’t fit this (e.g., `posts/frontend` and `posts/backend` cannot be distinguished), you need to define custom groups. Configure in `data/knowledgeGraph.yaml`, for example:

```yaml
group:
  - path: /posts/frontend # Must start with /
    name: display name for x
  - path: /posts/backend
    name: display name for y
```

This will separate the two subdirectories into different groups. Articles without a matching group will fall back to `.Section`.

### Dark mode support

HKG supports dark mode. If your site is not covered by the default detection, you can customize `darkSelectors`.

Set the CSS selector used for dark mode (e.g., `darkSelectors: html.dark`). HKG will observe changes to this selector and switch themes accordingly.

### Adding new taxonomy

Adding new taxonomy is not currently supported.

### useEmbedded

Enable [Hugo’s built-in link resolution][link-resolution]. The default value for this setting is `auto`, which means *built-in link resolution is not enabled*, so the configuration needs to be changed.

Switching to `always` will override your original theme’s link render hook (if any). If you need the theme’s built-in link render hook, override your link render hook manually—replace the link resolution logic with the [Hugo version][link-resolution-src], while keeping the rest of your theme’s original functionality unchanged.

## Development

1. `git clone https://github.com/ZhenShuo2021/hugo-knowledge-graph`
2. `git clone https://github.com/ZhenShuo2021/hugo-kg-example hugo-kg-example`
3. `cd hugo-knowledge-graph`
4. `hugo server --source ../hugo-kg-example --themesDir .. -e docker`

[fg]: https://github.com/vasturiano/force-graph
[css]: https://github.com/ZhenShuo2021/hugo-knowledge-graph/blob/main/assets/css/knowledge-graph/vars.css
[getpage]: https://gohugo.io/methods/page/getpage/
[md-abs-path]: https://marketplace.visualstudio.com/items?itemName=ZhenShuo2021.markdown-absolute-path
[md057]: https://rumdl.dev/md057/?h=md057#absolute-links
[hugo-section]: https://gohugo.io/methods/page/section/
[link-resolution]: https://gohugo.io/configuration/markup/#renderhookslinkuseembedded
[link-resolution-src]: https://github.com/gohugoio/hugo/blob/ff22c62a32628fcf51f82de2f72a749e1cdf4fc3/tpl/tplimpl/embedded/templates/_markup/render-link.html
