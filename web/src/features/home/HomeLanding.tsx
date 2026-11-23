import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, Camera, CheckCircle2, Languages, Leaf, Sun, Volume2 } from 'lucide-react'
import { useT } from '../../i18n/useT'
import { CROPS, HERO_PHOTO } from './crops'
import { useInPhoneFrame } from '../../app/viewportFrame'

const BASE = import.meta.env.BASE_URL

interface HomeLandingProps {
  onStartRice: () => void
}

/** Home / landing: hero + crop selector. Only rice is active; other crops are clearly marked "upcoming". */
export function HomeLanding({ onStartRice }: HomeLandingProps) {
  const { t } = useT()
  const inFrame = useInPhoneFrame()
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const showUpcoming = () => {
    setToast(t('cropUpcomingToast'))
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 3500)
  }

  // Inside the laptop phone frame, always use the mobile layout.
  const desk = inFrame ? 'hidden' : 'hidden lg:block'
  const mob = inFrame ? 'block' : 'block lg:hidden'
  // Mobile: one uniform 2-column grid. Desktop: 5 equal columns.
  const gridCols = inFrame ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-5'
  const desktopOnlyText = 'hidden lg:inline'
  const mobileOnlyText = 'lg:hidden'
  // Desktop-only (lg:) classes; dropped inside the phone frame, which always uses the mobile look.
  const D = (cls: string) => (inFrame ? '' : cls)

  return (
    <div className="flex w-full flex-col gap-4 lg:gap-6">
      {/* Desktop hero: full-bleed, edge to edge under the navbar */}
      <section
        aria-labelledby="landing-headline"
        className={`${desk} relative left-1/2 w-screen -translate-x-1/2 -mt-4 overflow-hidden bg-[radial-gradient(ellipse_at_50%_55%,rgba(34,160,96,0.40)_0%,rgba(15,81,50,0.15)_45%,transparent_72%)] text-white`}
      >
        {/* subtle leaf-vein texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(115deg,#fff_0_1px,transparent_1px_22px)]"
        />
        <div className="relative mx-auto grid min-h-[500px] max-w-6xl grid-cols-[1fr_1.45fr_0.9fr] items-center gap-8 px-10 py-12">
          <div className="flex flex-col gap-5">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-white/15">
              <Leaf className="h-3.5 w-3.5" aria-hidden="true" /> AgroLeaf AI
            </span>
            <h2 id="landing-headline" className="text-5xl font-extrabold leading-[1.15] tracking-tight xl:text-6xl">
              {t('landingHeadline')}
            </h2>
            <p className="max-w-md text-base leading-relaxed text-emerald-100/85">{t('landingSubtitle')}</p>
          </div>

          <div className="relative mx-auto h-[470px] w-[360px]">
            <img
              src={`${BASE}${HERO_PHOTO}`}
              alt={t('landingHeroPhotoAlt')}
              width={478}
              height={560}
              fetchPriority="high"
              className="h-full w-full object-cover [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_40%,transparent_98%)]"
            />
            <Callout side="left" className="right-[66%] top-[20%]" icon={<Leaf className="h-3.5 w-3.5" />} text={t('landingBadgeSpecies')} />
            <Callout side="left" className="right-[58%] top-[47%]" icon={<CheckCircle2 className="h-3.5 w-3.5" />} text={t('landingBadgeClasses')} />
            <Callout side="left" className="right-[64%] bottom-[18%]" icon={<Volume2 className="h-3.5 w-3.5" />} text={t('landingBadgeVoice')} />
          </div>

          <div className="flex flex-col gap-3">
            <p data-testid="photo-guide-title" className="text-sm font-semibold tracking-wide text-emerald-200">{t('landingGuideTitle')}</p>
            <ul className="flex flex-col gap-2">
              {(['landingGuide1', 'landingGuide2', 'landingGuide3'] as const).map((k, i) => (
                <li key={k} data-testid="photo-guide-step" className="flex items-center gap-2.5 rounded-xl border border-emerald-300/30 bg-white/12 px-4 py-3 text-sm font-medium text-white shadow-sm md:text-[15px]">
                  {i === 1 ? <Sun className="h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" /> : <Camera className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />}
                  <span>{t(k)}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onStartRice}
              className="mt-2 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-base font-bold text-[#06291A] shadow-lg transition hover:bg-emerald-300 active:scale-95"
            >
              {t('landingCta')} <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Mobile hero */}
      <section
        aria-labelledby="landing-mobile-title"
        className={`${mob} relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B3B24] via-[#0F5132] to-[#14532D] p-4 text-white shadow-lg`}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 id="landing-mobile-title" className="text-xl font-extrabold leading-snug">
              {t('landingMobileTitle')}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-emerald-100/85">
              <Languages className="mr-1 inline h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
              {t('landingBadgeClasses')} • {t('landingBadgeVoice')}
            </p>
          </div>
          <img
            src={`${BASE}${CROPS[0].photo}`}
            alt={t('landingHeroPhotoAlt')}
            width={300}
            height={300}
            className="h-24 w-24 shrink-0 rounded-2xl object-cover shadow-md ring-1 ring-white/15"
          />
        </div>
      </section>

      {/* Crop selector: light & colourful on mobile, glass cards on the dark desktop canvas */}
      <section aria-labelledby="crops-title" className="flex flex-col gap-3 lg:gap-4">
        <h2 id="crops-title" className={`text-lg font-bold text-[#0B3B24] ${D('lg:text-xl lg:text-white')}`}>
          {t('landingCropsTitle')}
        </h2>
        <ul className={`grid ${gridCols} gap-3 lg:gap-4`}>
          {CROPS.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                data-crop={c.id}
                aria-disabled={c.active ? undefined : true}
                onClick={c.active ? onStartRice : showUpcoming}
                className={
                  c.active
                    ? `group relative flex h-full w-full flex-col items-center gap-1 rounded-2xl border-2 border-emerald-500 bg-gradient-to-b from-emerald-400 to-emerald-600 p-3 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-95 lg:p-4 ${D('lg:bg-none lg:bg-emerald-500/25 lg:border-emerald-400 lg:ring-0 lg:shadow-emerald-950/50 lg:hover:bg-emerald-500/35')}`
                    : `group relative flex h-full w-full cursor-help flex-col items-center gap-1 rounded-2xl border border-emerald-900/10 bg-white/85 p-3 shadow-sm backdrop-blur-sm transition duration-200 hover:bg-white lg:p-4 ${D('lg:bg-white/[0.06] lg:hover:bg-white/[0.10] lg:border-white/15 lg:backdrop-blur-md lg:shadow-none')}`
                }
              >
                <span
                  className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    c.active
                      ? `bg-white text-emerald-700 ${D('lg:bg-emerald-300 lg:text-[#06291A]')}`
                      : `bg-amber-100 text-amber-800 ${D('lg:bg-white/10 lg:text-emerald-100 lg:ring-1 lg:ring-white/20')}`
                  }`}
                >
                  {c.active ? t('cropActive') : t('cropUpcoming')}
                </span>
                {/* Photo in a dark-emerald frame with a soft vignette; zooms gently on hover */}
                <span className="relative mt-5 block h-24 w-full overflow-hidden rounded-xl bg-[#0B3B24] shadow-md ring-1 ring-[#0B3B24]/60">
                  <img
                    src={`${BASE}${c.photo}`}
                    alt=""
                    width={300}
                    height={300}
                    loading="lazy"
                    className={`h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 ${c.active ? '' : 'opacity-80'}`}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(7,42,25,0.55)_100%)] shadow-[inset_0_0_0_2px_rgba(11,59,36,0.45)]"
                  />
                </span>
                <span className={`text-lg font-extrabold ${c.active ? 'text-white' : `text-[#0E1F16] ${D('lg:text-white')}`}`}>
                  {t(c.labelKey)}
                </span>
                <span className={`text-xs italic ${c.active ? 'text-emerald-50' : `text-emerald-800/80 ${D('lg:text-emerald-200')}`}`}>
                  ({c.scientific})
                </span>
                {c.active && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-bold text-white ring-1 ring-white/30 transition group-hover:bg-white/30">
                    {inFrame ? t('cropTapHint') : (
                      <>
                        <span className={desktopOnlyText}>{t('cropScanHint')}</span>
                        <span className={mobileOnlyText}>{t('cropTapHint')}</span>
                      </>
                    )}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <details className={`text-xs text-emerald-900/70 ${D('lg:text-emerald-100/60')}`}>
          <summary className="cursor-pointer select-none">{t('landingPhotoCredits')}</summary>
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {CROPS.map((c) => (
              <li key={c.id}>
                {t(c.labelKey)}:{' '}
                <a href={c.credit.url} target="_blank" rel="noreferrer" className="underline">
                  {c.credit.author}
                </a>{' '}
                ({c.credit.licence})
              </li>
            ))}
          </ul>
        </details>
        {toast && (
          <p
            role="status"
            className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 shadow-sm ${D('lg:border-amber-400/30 lg:bg-amber-500/15 lg:text-amber-100 lg:shadow-none')}`}
          >
            {toast}
          </p>
        )}
      </section>
    </div>
  )
}

/** Editorial callout: a label, a thin rule and a dot pointing at the plant. */
function Callout({ className, icon, text, side }: { className: string; icon: ReactNode; text: string; side: 'left' | 'right' }) {
  const label = (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#06291A]/75 px-3 py-1.5 text-sm font-semibold text-emerald-50 shadow-lg ring-1 ring-emerald-300/30 backdrop-blur-sm">
      <span className="text-emerald-300" aria-hidden="true">{icon}</span>
      {text}
    </span>
  )
  const rule = <span aria-hidden="true" className="h-px w-10 bg-emerald-100/60" />
  const dot = <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-emerald-100 bg-[#0B3B24]" />
  return (
    <span className={`absolute ${className} flex items-center gap-0`}>
      {side === 'left' ? (<>{label}{rule}{dot}</>) : (<>{dot}{rule}{label}</>)}
    </span>
  )
}
