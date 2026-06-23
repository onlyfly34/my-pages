import { useMemo, useState } from 'preact/hooks';

interface Column {
  key: string;
  label: string;
}
interface Props {
  columns: Column[];
  rows: Record<string, string | number>[];
}

/** 可點欄位標題排序的表格（純前端排序，進階範例）。 */
export default function DataTable({ columns, rows }: Props) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const x = a[sortKey];
      const y = b[sortKey];
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
      return String(x).localeCompare(String(y), 'zh-Hant') * dir;
    });
    return copy;
  }, [rows, sortKey, dir]);

  const onSort = (key: string) => {
    if (sortKey === key) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setDir(1);
    }
  };

  return (
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                onClick={() => onSort(c.key)}
                style="cursor:pointer;user-select:none"
                aria-sort={sortKey === c.key ? (dir === 1 ? 'ascending' : 'descending') : 'none'}
              >
                {c.label}
                <span style="opacity:.5;font-size:.8em">
                  {' '}
                  {sortKey === c.key ? (dir === 1 ? '▲' : '▼') : '⇅'}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key}>{row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
