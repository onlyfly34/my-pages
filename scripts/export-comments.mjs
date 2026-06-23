#!/usr/bin/env node
/**
 * export-comments.mjs —— 把 Giscus（GitHub Discussions）留言完整匯出。
 *
 * 這是「不被供應商綁死」的退路：未來想換成自架留言板（Cusdis / Remark42 / Artalk / Isso）時，
 * 先用這支把資料拿回來。
 *
 * 用法：
 *   GITHUB_TOKEN=ghp_xxx node scripts/export-comments.mjs
 *   GITHUB_TOKEN=ghp_xxx REPO=onlyfly34/my-pages SITE_URL=https://onlyfly34.github.io/my-pages node scripts/export-comments.mjs
 *
 * 環境變數：
 *   GITHUB_TOKEN  必填，唯讀權限即可（public_repo / read:discussion）。不會寫死在程式裡。
 *   REPO          選填，owner/repo，預設讀 src/config/giscus.ts 裡的值。
 *   SITE_URL      選填，網站根網址，用來把 mapping(pathname) 還原成頁面連結。
 *
 * 產出（exports/）：
 *   comments.json          結構化原始資料（完整保真）
 *   comments-disqus.xml    Disqus WXR 相容格式，方便匯入 Cusdis / Remark42 / Artalk
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error('✗ 需要 GITHUB_TOKEN 環境變數（唯讀權限即可）。');
  process.exit(1);
}

async function resolveRepo() {
  if (process.env.REPO) return process.env.REPO;
  try {
    const src = await readFile(join(ROOT, 'src/config/giscus.ts'), 'utf8');
    const m = src.match(/repo:\s*'([^']+)'/);
    if (m) return m[1];
  } catch {
    /* ignore */
  }
  console.error('✗ 找不到 repo：請設定 REPO=owner/repo 環境變數。');
  process.exit(1);
}

const GQL = 'https://api.github.com/graphql';

async function graphql(query, variables) {
  const res = await fetch(GQL, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'export-comments-script',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error('GraphQL errors: ' + JSON.stringify(json.errors));
  }
  return json.data;
}

const AUTHOR = 'author { login url }';

const REPLIES_Q = `
query ($id: ID!, $cursor: String) {
  node(id: $id) {
    ... on DiscussionComment {
      replies(first: 100, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes { id body bodyHTML createdAt ${AUTHOR} }
      }
    }
  }
}`;

const COMMENTS_Q = `
query ($id: ID!, $cursor: String) {
  node(id: $id) {
    ... on Discussion {
      comments(first: 50, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id body bodyHTML createdAt ${AUTHOR}
          replies(first: 100) {
            pageInfo { hasNextPage endCursor }
            nodes { id body bodyHTML createdAt ${AUTHOR} }
          }
        }
      }
    }
  }
}`;

const DISCUSSIONS_Q = `
query ($owner: String!, $name: String!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    discussions(first: 25, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes { id number title body bodyHTML url createdAt ${AUTHOR} }
    }
  }
}`;

/** 通用分頁：反覆呼叫 fetchPage(cursor)，把 nodes 串起來。 */
async function paginate(fetchPage) {
  const all = [];
  let cursor = null;
  for (;;) {
    const conn = await fetchPage(cursor);
    all.push(...conn.nodes);
    if (!conn.pageInfo.hasNextPage) break;
    cursor = conn.pageInfo.endCursor;
  }
  return all;
}

async function fetchReplies(commentId, seeded) {
  const replies = [...seeded.nodes];
  if (!seeded.pageInfo.hasNextPage) return replies;
  let cursor = seeded.pageInfo.endCursor;
  for (;;) {
    const data = await graphql(REPLIES_Q, { id: commentId, cursor });
    const conn = data.node.replies;
    replies.push(...conn.nodes);
    if (!conn.pageInfo.hasNextPage) break;
    cursor = conn.pageInfo.endCursor;
  }
  return replies;
}

async function fetchComments(discussionId) {
  const comments = await paginate(async (cursor) => {
    const data = await graphql(COMMENTS_Q, { id: discussionId, cursor });
    return data.node.comments;
  });
  for (const c of comments) {
    c.replies = await fetchReplies(c.id, c.replies);
  }
  return comments;
}

function xmlEscape(s) {
  return String(s).replace(/[<>&]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[ch]);
}
function cdata(s) {
  return `<![CDATA[${String(s).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

function toDisqusXml(discussions, siteUrl) {
  const items = discussions
    .map((d) => {
      const identifier = d.title; // giscus mapping=pathname → discussion title 就是 pathname
      const link = siteUrl ? siteUrl.replace(/\/$/, '') + identifier : d.url;
      let cid = 0;
      const flat = [];
      for (const c of d.comments) {
        const parentId = ++cid;
        flat.push({ id: parentId, parent: 0, c });
        for (const r of c.replies) flat.push({ id: ++cid, parent: parentId, c: r });
      }
      const comments = flat
        .map(
          ({ id, parent, c }) => `    <wp:comment>
      <wp:comment_id>${id}</wp:comment_id>
      <wp:comment_author>${xmlEscape(c.author?.login ?? 'ghost')}</wp:comment_author>
      <wp:comment_author_email></wp:comment_author_email>
      <wp:comment_author_url>${xmlEscape(c.author?.url ?? '')}</wp:comment_author_url>
      <wp:comment_date_gmt>${new Date(c.createdAt).toISOString().replace('T', ' ').slice(0, 19)}</wp:comment_date_gmt>
      <wp:comment_content>${cdata(c.body ?? '')}</wp:comment_content>
      <wp:comment_approved>1</wp:comment_approved>
      <wp:comment_parent>${parent}</wp:comment_parent>
    </wp:comment>`,
        )
        .join('\n');
      return `  <item>
    <title>${xmlEscape(d.title)}</title>
    <link>${xmlEscape(link)}</link>
    <content:encoded>${cdata(d.body ?? '')}</content:encoded>
    <dsq:thread_identifier>${xmlEscape(identifier)}</dsq:thread_identifier>
    <wp:post_date_gmt>${new Date(d.createdAt).toISOString().replace('T', ' ').slice(0, 19)}</wp:post_date_gmt>
    <wp:comment_status>open</wp:comment_status>
${comments}
  </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dsq="http://www.disqus.com/"
  xmlns:wp="http://wordpress.org/export/1.0/">
<channel>
${items}
</channel>
</rss>
`;
}

async function main() {
  const repo = await resolveRepo();
  const [owner, name] = repo.split('/');
  const siteUrl = process.env.SITE_URL || '';
  console.log(`→ 匯出 ${owner}/${name} 的 Discussions…`);

  const discussions = await paginate(async (cursor) => {
    const data = await graphql(DISCUSSIONS_Q, { owner, name, cursor });
    return data.repository.discussions;
  });

  let total = 0;
  for (const d of discussions) {
    d.comments = await fetchComments(d.id);
    total += d.comments.reduce((n, c) => n + 1 + c.replies.length, 0);
  }

  const out = join(ROOT, 'exports');
  await mkdir(out, { recursive: true });
  await writeFile(
    join(out, 'comments.json'),
    JSON.stringify({ repo, exportedAt: new Date().toISOString(), discussions }, null, 2),
  );
  await writeFile(join(out, 'comments-disqus.xml'), toDisqusXml(discussions, siteUrl));

  console.log(`✓ ${discussions.length} 個 thread、${total} 則留言`);
  console.log(`✓ exports/comments.json`);
  console.log(`✓ exports/comments-disqus.xml`);
}

main().catch((err) => {
  console.error('✗ 匯出失敗：', err.message);
  process.exit(1);
});
