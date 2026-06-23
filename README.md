# whereabouts notes

一個「整理技術內容」的個人筆記站：以靜態頁面為主、可在文章內嵌 HTML 動畫與互動元件、用表格呈現結構化資料，每篇文章底部有留言（Giscus）。整站部署在 GitHub Pages，零後端、零維運。

- **框架**：Astro（Islands 架構，預設零 JS）＋ MDX 內容
- **互動**：Three.js island、純 CSS/SVG 動畫、可排序表格，以及自製的逐 byte「記憶體 buffer」動畫
- **留言**：Giscus（GitHub Discussions），含匯出 / 遷移腳本
- **部署**：GitHub Actions → GitHub Pages

設計走 **乾淨白底的 minimalist** 路線（文章一篇篇條列），保留深淺色切換。

---

## 快速開始

需要 Node 20+ 與 pnpm。

```bash
pnpm install      # 安裝相依
pnpm dev          # 本機開發（http://localhost:4321/<base>/）
pnpm build        # astro check + 靜態建置到 dist/
pnpm preview      # 預覽 build 結果
pnpm lint         # ESLint
pnpm format       # Prettier 自動排版
```

---

## 新增一篇文章

1. 在 `src/content/posts/` 新增 `your-slug.mdx`（檔名即網址 slug）。
2. 最上面寫 frontmatter（schema 定義在 `src/content.config.ts`）：

   ```yaml
   ---
   title: 標題
   description: 一句話簡述（列表與 SEO 用）
   pubDate: 2026-06-23
   tags: [Linux, C]
   draft: false # true 時不會出現在正式站
   toc: true # 是否顯示側邊目錄
   ---
   ```

3. 正文用 Markdown 撰寫。要嵌入互動元件，就在 frontmatter 下方 `import` 後使用（見下節）。

> 站內所有連結請走 `withBase()`（`src/utils/path.ts`），子路徑部署才不會破圖。**禁止**寫死 `/...` 絕對路徑。

---

## 內嵌互動元件

| 元件                            | 類型               | 載入方式               | 用途                                 |
| ------------------------------- | ------------------ | ---------------------- | ------------------------------------ |
| `islands/StrCopyAnimator.astro` | 自訂 web 元件      | 隨頁面（輕量、零框架） | 逐 byte 的記憶體複製動畫（本站招牌） |
| `islands/ThreeDemo.tsx`         | Three.js（Preact） | `client:visible`       | 可拖曳旋轉的線框多面體               |
| `islands/SignalWave.astro`      | 純 CSS/SVG         | 無 JS                  | 訊號 / 資料流 loop 動畫              |
| `islands/DataTable.tsx`         | Preact             | `client:visible`       | 可點欄位排序的表格                   |

範例：

```mdx
import StrCopyAnimator from '../../components/islands/StrCopyAnimator.astro';
import ThreeDemo from '../../components/islands/ThreeDemo.tsx';

<StrCopyAnimator config={{ fn: 'strscpy', src: 'cat', srcKind: 'string', dstSize: 8 }} />

<ThreeDemo client:visible />
```

所有動畫都尊重 `prefers-reduced-motion`：在「減少動態效果」偏好下會降級為靜態（仍可手動單步）。

### StrCopyAnimator 的 config 欄位

| 欄位       | 說明                                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `fn`       | `strncpy` / `strscpy` / `strscpy_pad` / `strtomem` / `strtomem_pad` / `memtostr` / `memtostr_pad` / `memcpy_and_pad` |
| `src`      | 來源內容字串                                                                                                         |
| `srcKind`  | `string`（NUL 結尾）或 `fixed`（定長、非字串）                                                                       |
| `srcWidth` | `fixed` 來源的總寬度                                                                                                 |
| `dstSize`  | 目的地緩衝區大小 `n`                                                                                                 |
| `count`    | 給 `memcpy_and_pad` 的複製長度                                                                                       |
| `scenario` | 顯示在右上角的情境標籤                                                                                               |

---

## 兩種部署模式

部署模式由 `src/config/site.ts` 的 `mode` 決定，`astro.config.mjs` 會自動推導 `site` / `base`，**只改這一處即可**。

### 模式 B：專案站（**預設**）

- 倉庫名任意（例如 `my-pages`）。
- 設定：`mode: 'project'`、`username`、`repo`。
- 網址：`https://<username>.github.io/<repo>/`，`base` 為 `/<repo>`。

### 模式 A：使用者站

- 倉庫名必須是 `<username>.github.io`。
- 設定：`mode: 'user'`。
- 網址：`https://<username>.github.io/`，無 `base`。

---

## 啟用 GitHub Pages

1. push 到 `main`（`.github/workflows/deploy.yml` 會自動 build + deploy）。
2. 到 repo → **Settings → Pages → Source**，選 **GitHub Actions**。
3. 等 Actions 跑完，網址會出現在該頁。

> `public/.nojekyll` 一定要在（已附），否則 GitHub Pages 的 Jekyll 會忽略 `_astro/` 底線目錄，導致 CSS/JS 載不出來。

---

## Giscus 留言設定

設定集中在 `src/config/giscus.ts`。在 `repoId` / `categoryId` 還是 placeholder 時，文章底部會顯示「留言尚未設定」提示（不報錯）。完成以下步驟即可啟用：

1. 倉庫必須是 **public**。
2. 安裝 giscus GitHub App：<https://github.com/apps/giscus>。
3. 開啟 repo 的 **Discussions**（Settings → General → Features）。
4. 建一個 Discussion 分類（建議自訂 `Comments`，格式選 Announcement）。
5. 到 <https://giscus.app> 產生 `repoId` / `categoryId`，填入 `src/config/giscus.ts`。

留言主題會跟著站點深淺色模式切換（透過 `postMessage` 通知 giscus iframe）。

---

## 留言匯出 / 遷移（不被供應商綁死）

Giscus 把留言存在 GitHub Discussions。為了保有資料主動權，附了 `scripts/export-comments.mjs`：

```bash
GITHUB_TOKEN=ghp_xxx pnpm export:comments
# 或指定 repo 與站台網址（讓 Disqus 連結正確）
GITHUB_TOKEN=ghp_xxx REPO=onlyfly34/my-pages SITE_URL=https://onlyfly34.github.io/my-pages pnpm export:comments
```

- 用 GitHub GraphQL API 抓取全部 Discussions（含留言、回覆、作者、時間、內文），自動處理分頁。
- `GITHUB_TOKEN` 唯讀權限即可，**不寫死**在程式裡。
- 輸出到 `exports/`：
  - `comments.json`：結構化原始資料（完整保真）。
  - `comments-disqus.xml`：Disqus WXR 相容格式，方便日後匯入自架留言板（Cusdis / Remark42 / Artalk / Isso）。

這是 Giscus 的退路：未來要轉自架留言時用得到。

---

## Design tokens

設計目標是「乾淨、白底、好讀的技術筆記站」（參考 mtk.tw 那類簡潔的文章列表），刻意避開 AI 預設樣板。色票與字體定義在 `src/styles/global.css`：

- **色彩**：亮色以純白 `#ffffff` 打底、近黑文字 `#1b1f24`、一個收斂的藍色 accent `#2256d6`；暗色換成低彩度的深灰藍。另外定義一組**語意色**給動畫（複製＝綠、`\0` 結尾＝紫、補 0＝灰、垃圾值＝橘、危險＝紅），讓記憶體動畫一眼能讀。
- **字體**：採用系統字堆疊（`system-ui` + `PingFang TC` / `Noto Sans TC` 等），確保中文在各平台都清楚、且零外部 webfont 負擔（GitHub Pages 上更快、也不受網路政策影響）；等寬字體（`JetBrains Mono` 等）給 code 與記憶體格子，這是技術站可讀性的關鍵。標題以較重字重與緊縮字距取得 display 個性。
- **無障礙地板**：RWD 到手機、focus 可見、尊重 `prefers-reduced-motion`、語法高亮用 Astro 內建 Shiki 的亮 / 暗雙主題。

---

## 專案結構

```text
src/
  components/
    islands/        互動元件（動畫 / 圖表）
    BaseHead / Header / Footer / ThemeToggle / TableOfContents / Giscus / PostCard
  config/
    site.ts         站台設定（單一來源，推導 site / base）
    giscus.ts       Giscus 設定
  content/
    posts/          文章（.mdx）
  layouts/          BaseLayout / PostLayout
  pages/            路由（首頁 / 文章 / 標籤 / 關於 / 404 / rss.xml）
  styles/global.css Design tokens 與全域樣式
  utils/            path（withBase）/ posts / reading-time
scripts/export-comments.mjs   留言匯出
.github/workflows/deploy.yml   Pages 部署
public/.nojekyll
```

---

## 第一次部署清單

詳見 [SETUP.md](./SETUP.md)。簡述：建立 repo → 改 `src/config/site.ts` →（選配）設定 Giscus → push → 把 Pages Source 設為 GitHub Actions。

## 授權

見 [LICENSE](./LICENSE)。
