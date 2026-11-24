import { useEffect, useRef, useState } from 'react'
import type { FieldRowResult, LeafScreening, LeafStatus } from '../../ai/fieldRow.types'
import { STATUS_COPY, ABSTAIN_COPY } from './fieldRowCopy'
import { toBanglaDigits, toBanglaPercent } from '../about/format'
import { getCard } from '../../content/getCard'

export interface FieldRowCanvasProps {
  image: HTMLImageElement
  result: FieldRowResult
  lang?: 'bn' | 'en'
  onSelectLeaf?: (leaf: LeafScreening) => void
}

const STATUS_COLORS: Record<LeafStatus, string> = {
  healthy: '#16A34A',
  diseased: '#DC2626',
  uncertain: '#D97706',
  abstained: '#6B7280',
}

export function FieldRowCanvas({
  image,
  result,
  lang = 'bn',
  onSelectLeaf,
}: FieldRowCanvasProps) {
  const isBn = lang === 'bn'
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [selectedLeafId, setSelectedLeafId] = useState<number | null>(
    result.leaves[0]?.id ?? null
  )

  const selectedLeaf =
    result.leaves.find((l) => l.id === selectedLeafId) ?? result.leaves[0] ?? null

  const handleSelectLeaf = (leaf: LeafScreening) => {
    setSelectedLeafId(leaf.id)
    onSelectLeaf?.(leaf)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const container = containerRef.current
    const displayWidth = container ? container.clientWidth : result.imageWidth
    const scale = displayWidth / result.imageWidth
    const displayHeight = result.imageHeight * scale

    canvas.width = displayWidth
    canvas.height = displayHeight

    // Draw the source image
    try {
      ctx.drawImage(image, 0, 0, displayWidth, displayHeight)
    } catch {
      // In case image is not ready or failed to draw in some environments
    }

    // Draw leaf bounding boxes
    for (const leaf of result.leaves) {
      const isSelected = leaf.id === selectedLeafId
      const color = STATUS_COLORS[leaf.status]
      const bx = leaf.box.x * scale
      const by = leaf.box.y * scale
      const bw = leaf.box.w * scale
      const bh = leaf.box.h * scale

      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = isSelected ? 3.5 : 2
      if (leaf.status === 'abstained') {
        ctx.setLineDash([4, 4])
      } else {
        ctx.setLineDash([])
      }
      ctx.strokeRect(bx, by, bw, bh)

      // Draw numbered badge
      const tagText = isBn ? toBanglaDigits(leaf.id) : String(leaf.id)
      ctx.font = 'bold 12px sans-serif'
      const textWidth = ctx.measureText(tagText).width
      const badgeW = textWidth + 10
      const badgeH = 18

      ctx.fillStyle = color
      ctx.fillRect(bx, by, badgeW, badgeH)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText(tagText, bx + 5, by + 13)

      ctx.restore()
    }
  }, [image, result, selectedLeafId, isBn])

  // Handle canvas clicks to select leaves
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    const scale = canvas.width / result.imageWidth

    // Find leaf covering the click (reverse order for top-most)
    for (let i = result.leaves.length - 1; i >= 0; i--) {
      const leaf = result.leaves[i]
      const bx = leaf.box.x * scale
      const by = leaf.box.y * scale
      const bw = leaf.box.w * scale
      const bh = leaf.box.h * scale
      if (clickX >= bx && clickX <= bx + bw && clickY >= by && clickY <= by + bh) {
        handleSelectLeaf(leaf)
        return
      }
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-4 w-full">
      {/* Canvas view with overlay */}
      <div className="relative w-full overflow-hidden rounded-3xl border border-emerald-700/20 bg-black/5 shadow-md">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          aria-label={isBn ? 'মাঠের সারি চিহ্নিতকরণ ক্যানভাস' : 'Field row detection canvas'}
          className="block w-full max-w-full cursor-pointer"
        />
      </div>

      {/* Selected leaf details inspector card */}
      {selectedLeaf && (
        <div
          data-testid="selected-leaf-detail"
          className="flex flex-col gap-2 rounded-2xl border border-emerald-700/15 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-900">
              {isBn ? `পাতা #${toBanglaDigits(selectedLeaf.id)}` : `Leaf #${selectedLeaf.id}`}
            </span>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
              style={{ backgroundColor: STATUS_COLORS[selectedLeaf.status] }}
            >
              {STATUS_COPY[selectedLeaf.status][lang]}
            </span>
          </div>

          {selectedLeaf.status === 'abstained' ? (
            <div className="mt-1 flex flex-col gap-0.5">
              <span className="font-bold text-gray-900 text-[15px]">
                {ABSTAIN_COPY[selectedLeaf.abstain ?? 'not_rice'].title[lang]}
              </span>
              <span className="text-xs text-gray-600 leading-relaxed">
                {ABSTAIN_COPY[selectedLeaf.abstain ?? 'not_rice'].desc[lang]}
              </span>
            </div>
          ) : (
            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="font-extrabold text-[#0E1F16] text-[16px]">
                {selectedLeaf.label ? getCard(selectedLeaf.label).name[lang] : STATUS_COPY.healthy[lang]}
              </span>
              <span className="text-sm font-black text-[#0B5D3B]">
                {isBn ? toBanglaPercent(selectedLeaf.confidence, 0) : `${Math.round(selectedLeaf.confidence * 100)}%`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Accessible list for screen readers and automated testing */}
      <div className="flex flex-col gap-2">
        <h4 className="sr-only">
          {isBn ? 'শনাক্তকৃত পাতার তালিকা' : 'Screened Leaves List'}
        </h4>
        <ul
          data-testid="leaf-list"
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        >
          {result.leaves.map((leaf) => {
            const isSelected = leaf.id === selectedLeafId
            const statusLabel = STATUS_COPY[leaf.status][lang]
            const nameLabel =
              leaf.status === 'abstained'
                ? ABSTAIN_COPY[leaf.abstain ?? 'not_rice'].title[lang]
                : leaf.label
                  ? getCard(leaf.label).name[lang]
                  : STATUS_COPY.healthy[lang]

            return (
              <li key={leaf.id}>
                <button
                  type="button"
                  data-testid={`leaf-item-${leaf.id}`}
                  onClick={() => handleSelectLeaf(leaf)}
                  aria-pressed={isSelected}
                  className={`flex w-full flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/30'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex w-full items-center justify-between text-xs font-semibold">
                    <span>
                      {isBn ? `পাতা ${toBanglaDigits(leaf.id)}` : `Leaf ${leaf.id}`}
                    </span>
                    <span
                      className="rounded-full px-1.5 py-0.2 text-[10px] font-bold text-white"
                      style={{ backgroundColor: STATUS_COLORS[leaf.status] }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 truncate w-full">
                    {nameLabel}
                  </span>
                  {leaf.status !== 'abstained' && (
                    <span className="text-[11px] font-semibold text-[#0B5D3B]">
                      {isBn ? toBanglaPercent(leaf.confidence, 0) : `${Math.round(leaf.confidence * 100)}%`}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
