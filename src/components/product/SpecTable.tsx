import type { Json } from "@/types/database";

export function SpecTable({ specs }: { specs: Json }) {
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) return null;
  const rows = Object.entries(specs).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (rows.length === 0) return null;

  return (
    <table className="w-full overflow-hidden rounded-xl border border-line text-sm">
      <tbody>
        {rows.map(([key, value]) => (
          <tr key={key} className="border-b border-line last:border-0">
            <th scope="row" className="w-1/3 bg-background px-4 py-2.5 text-left font-medium text-muted">
              {key}
            </th>
            <td className="bg-surface px-4 py-2.5">{String(value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
