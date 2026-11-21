import type { ModelMeta, ModelReport } from '../../ai/types'

export type ReportLoadResult =
  | { status: 'loaded'; report: ModelReport; meta: ModelMeta }
  | { status: 'missing' }

export async function loadReport(): Promise<ReportLoadResult> {
  try {
    const [reportRes, metaRes] = await Promise.all([
      fetch('/model/report.json'),
      fetch('/model/model_meta.json'),
    ])

    if (!reportRes.ok || !metaRes.ok) {
      return { status: 'missing' }
    }

    const report = (await reportRes.json()) as ModelReport
    const meta = (await metaRes.json()) as ModelMeta

    if (!report || !meta || !report.test) {
      return { status: 'missing' }
    }

    return { status: 'loaded', report, meta }
  } catch {
    return { status: 'missing' }
  }
}
