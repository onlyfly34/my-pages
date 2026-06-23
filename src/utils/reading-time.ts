/**
 * 估算閱讀時間。
 *
 * 中英文混排：把 CJK 字元逐字計算（中文閱讀速度約每分鐘 300–400 字），
 * 拉丁字母以「詞」計算（約每分鐘 200 字）。兩者各自換算成分鐘再相加，
 * 取最少 1 分鐘。回傳整數分鐘數。
 */
export function readingTime(content: string): number {
  // 去掉 MDX / Markdown 裡的程式碼區塊與 import，避免被當成正文字數。
  const text = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/^import\s.*$/gm, '')
    .replace(/<[^>]+>/g, ' ');

  const cjkChars = (text.match(/[一-鿿぀-ヿ가-힯]/g) || []).length;
  const nonCjk = text.replace(/[一-鿿぀-ヿ가-힯]/g, ' ');
  const words = (nonCjk.match(/[A-Za-z0-9]+/g) || []).length;

  const minutes = cjkChars / 350 + words / 200;
  return Math.max(1, Math.round(minutes));
}
