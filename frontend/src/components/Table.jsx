/**
 * Table — styled data table.
 * Props:
 *  - columns: { key: string, label: string, render?: (row) => ReactNode, width?: string }[]
 *  - data:    object[]
 *  - loading: boolean
 *  - empty:   ReactNode — shown when data is empty
 *  - onRowClick: (row) => void
 *  - rowKey:  string | (row) => string — key for each row (default 'id')
 */
export default function Table({
  columns = [],
  data    = [],
  loading = false,
  empty,
  onRowClick,
  rowKey  = 'id',
}) {
  const getKey = (row) =>
    typeof rowKey === 'function' ? rowKey(row) : (row[rowKey] ?? JSON.stringify(row));

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        {/* Head */}
        <thead>
          <tr style={{ backgroundColor: 'var(--bg-page, #F6F1E7)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary,#4a5568)] uppercase tracking-wide whitespace-nowrap"
                style={col.width ? { width: col.width } : {}}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="bg-white divide-y divide-gray-50">
          {loading ? (
            // Skeleton rows
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400">
                {empty ?? 'No data found.'}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={getKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={[
                  'transition-colors duration-100',
                  onRowClick ? 'cursor-pointer hover:bg-[var(--color-sage,#A9BFA0)]/10' : 'hover:bg-gray-50/60',
                ].join(' ')}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-[var(--text-primary,#1F3D2B)] align-middle"
                  >
                    {col.render ? col.render(row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
