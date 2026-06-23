/**
 * Giscus 留言設定（集中管理）。
 *
 * 第一次使用前，請完成以下前置作業（README「Giscus 設定」段有完整步驟）：
 *   1. 這個 repo 必須是 public。
 *   2. 安裝 giscus GitHub App：https://github.com/apps/giscus
 *   3. 開啟 repo 的 Discussions（Settings → General → Features → Discussions）。
 *   4. 建一個 Discussion 分類（建議自訂一個 "Comments"，格式選 Announcement）。
 *   5. 到 https://giscus.app 產生 repoId / categoryId，填入下面欄位。
 *
 * 在 repoId / categoryId 還是 placeholder 時，文章底部會顯示「留言尚未設定」的提示，
 * 不會報錯，也不會載入 giscus。
 */
export const GISCUS = {
  /** `owner/repo`，留言會存到這個倉庫的 Discussions */
  repo: 'onlyfly34/my-pages' as `${string}/${string}`,
  /** 由 giscus.app 產生，形如 R_kgD... */
  repoId: 'PLACEHOLDER_REPO_ID',
  /** Discussion 分類名稱 */
  category: 'Comments',
  /** 由 giscus.app 產生，形如 DIC_kwD... */
  categoryId: 'PLACEHOLDER_CATEGORY_ID',
  /** 文章與 Discussion 的對應方式 */
  mapping: 'pathname' as const,
  /** 是否啟用表情回應 */
  reactionsEnabled: '1' as '0' | '1',
  /** 是否回傳 metadata */
  emitMetadata: '0' as '0' | '1',
  /** 留言輸入框位置 */
  inputPosition: 'top' as 'top' | 'bottom',
  /** 介面語言 */
  lang: 'zh-TW',
  /** 載入策略 */
  loading: 'lazy' as 'lazy' | 'eager',
} as const;

/** 是否已完成設定（決定要不要真的載入 giscus）。 */
export const giscusConfigured =
  !GISCUS.repoId.startsWith('PLACEHOLDER') && !GISCUS.categoryId.startsWith('PLACEHOLDER');
