# 第一次部署：照順序做

1. **建立 / 確認 repo**

   - 專案站（預設）：repo 名任意，例如 `my-pages`。
   - 使用者站：repo 名必須是 `<username>.github.io`。

2. **改 `src/config/site.ts`**（整站唯一要動的設定來源）

   ```ts
   username: '<你的 github 帳號>',
   repo: '<repo 名>',
   mode: 'project',   // 使用者站改成 'user'
   title / description / author / links ...
   ```

   `astro.config.mjs` 會自動依此推導 `site` 與 `base`，不用再改別處。

3. **（選配）設定 Giscus 留言**

   - repo 設為 public → 安裝 [giscus app](https://github.com/apps/giscus) → 開啟 Discussions → 建分類。
   - 到 <https://giscus.app> 取得 `repoId` / `categoryId`，填入 `src/config/giscus.ts`。
   - 不設定也能正常部署，文章底部會顯示「留言尚未設定」提示。

4. **本機驗證**

   ```bash
   pnpm install
   pnpm build      # 應無 astro check 錯誤
   pnpm preview    # 開來看一下
   ```

5. **push 到 `main`**

   ```bash
   git add -A && git commit -m "init site" && git push
   ```

6. **開啟 Pages**

   - repo → **Settings → Pages → Source** 選 **GitHub Actions**。
   - 等 `Deploy to GitHub Pages` workflow 跑完，網址會出現在該頁。

完成後，之後每次 push 到 `main` 都會自動重新部署。
