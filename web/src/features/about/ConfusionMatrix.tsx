import type { ClassId } from '../../ai/classes'
import { getClassLabelBn, toBanglaDigits } from './format'

interface ConfusionMatrixProps {
  matrix: number[][]
  classes: ClassId[]
}

export default function ConfusionMatrix({
  matrix,
  classes,
}: ConfusionMatrixProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-3">
        <h3 className="font-bold text-slate-900">কনফিউশন ম্যাট্রিক্স (Confusion Matrix)</h3>
        <p className="text-xs text-slate-600">
          সারি নির্দেশ করে আসল রোগ এবং কলাম নির্দেশ করে মডেলের উত্তর। ডায়াগনাল ঘরগুলো সঠিক শনাক্তকরণ নির্দেশ করে।
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[560px] border-collapse text-center text-xs">
          <caption className="sr-only">
            কনফিউশন ম্যাট্রিক্স: সারি আসল রোগ এবং কলাম মডেলের উত্তর
          </caption>
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              <th
                scope="col"
                rowSpan={2}
                className="p-2.5 font-semibold text-slate-700 border-r border-slate-200 bg-slate-100"
              >
                আসল রোগ
              </th>
              <th
                scope="col"
                colSpan={classes.length}
                className="p-2 font-bold text-leaf-800 border-b border-slate-200"
              >
                মডেলের উত্তর
              </th>
            </tr>
            <tr className="bg-slate-50 border-b border-slate-200">
              {classes.map((cls) => (
                <th
                  key={`col-${cls}`}
                  scope="col"
                  className="p-2 font-medium text-slate-800 whitespace-nowrap min-w-[70px]"
                >
                  {getClassLabelBn(cls)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classes.map((rowClass, rowIdx) => {
              const rowData = matrix[rowIdx] ?? []
              return (
                <tr
                  key={`row-${rowClass}`}
                  className="border-b border-slate-100 hover:bg-slate-50/70"
                >
                  <th
                    scope="row"
                    className="p-2.5 text-left font-medium text-slate-800 bg-slate-50 border-r border-slate-200 whitespace-nowrap"
                  >
                    {getClassLabelBn(rowClass)}
                  </th>
                  {classes.map((colClass, colIdx) => {
                    const value = rowData[colIdx] ?? 0
                    const isDiagonal = rowIdx === colIdx
                    return (
                      <td
                        key={`cell-${rowClass}-${colClass}`}
                        data-diagonal={isDiagonal ? 'true' : 'false'}
                        className={`p-2 transition-colors ${
                          isDiagonal
                            ? 'bg-leaf-100 font-bold text-leaf-800'
                            : 'text-slate-600'
                        }`}
                      >
                        {toBanglaDigits(value)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
