import { useEffect, useRef, useState } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { District } from './districts'
import type { WeatherRiskReport } from './weatherService'
import { MapPin, Compass, Layers } from 'lucide-react'

export interface InteractiveMapProps {
  district: District
  report?: WeatherRiskReport | null
  className?: string
  lang?: 'bn' | 'en'
}

export function InteractiveMap({
  district,
  report,
  className = '',
  lang = 'bn',
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const districtRef = useRef<District>(district)

  useEffect(() => {
    districtRef.current = district
  }, [district])

  const [webGlSupported, setWebGlSupported] = useState<boolean>(true)
  const [pitch, setPitch] = useState<number>(50)
  const isBn = lang === 'bn'

  useEffect(() => {
    // Dynamic import to prevent SSR/jsdom issues
    let isCancelled = false

    async function initMap() {
      try {
        const maplibre: any = await import('maplibre-gl')
        const maplibregl = maplibre.default || maplibre

        if (!maplibregl || typeof maplibregl.supported !== 'function' || !maplibregl.supported()) {
          setWebGlSupported(false)
          return
        }

        if (!containerRef.current || isCancelled) return

        // Clean up previous instance
        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        }

        const initialDistrict = districtRef.current

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
          center: [initialDistrict.lon, initialDistrict.lat],
          zoom: 10.5,
          pitch: 50,
          bearing: -15,
          attributionControl: false,
        })

        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')

        // Resize when loaded
        map.on('load', () => {
          if (!isCancelled) {
            map.resize()
          }
        })

        // Custom Green Marker
        const el = document.createElement('div')
        el.className = 'custom-map-marker'
        el.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; width: 36px; height: 36px; background-color: rgba(16, 185, 129, 0.4); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 28px; height: 28px; background-color: #047857; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>
        `

        const popupText = `
          <div style="font-family: inherit; padding: 6px 8px; font-size: 13px; color: #0f172a;">
            <strong style="color: #065f46; font-size: 14px;">${initialDistrict.nameBn} (${initialDistrict.nameEn})</strong>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">${initialDistrict.divisionBn} বিভাগ • ${initialDistrict.lat.toFixed(2)}°N, ${initialDistrict.lon.toFixed(2)}°E</p>
          </div>
        `
        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupText)

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([initialDistrict.lon, initialDistrict.lat])
          .setPopup(popup)
          .addTo(map)

        markerRef.current = marker
        mapRef.current = map

        // Trigger resize after small delay to handle layout transitions
        setTimeout(() => {
          if (!isCancelled && mapRef.current) {
            mapRef.current.resize()
          }
        }, 300)
      } catch (err) {
        console.warn('MapLibre init fallback:', err)
        setWebGlSupported(false)
      }
    }

    initMap()

    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.resize()
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      isCancelled = true
      window.removeEventListener('resize', handleResize)
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, []) // initialize once

  // Update center when district changes
  useEffect(() => {
    if (!mapRef.current) return

    mapRef.current.flyTo({
      center: [district.lon, district.lat],
      zoom: 11,
      pitch: pitch,
      bearing: -15,
      essential: true,
      duration: 1800,
    })

    if (markerRef.current) {
      markerRef.current.setLngLat([district.lon, district.lat])
    }
  }, [district, pitch])

  const togglePitch = () => {
    const nextPitch = pitch === 50 ? 0 : 50
    setPitch(nextPitch)
    if (mapRef.current) {
      mapRef.current.easeTo({ pitch: nextPitch, duration: 600 })
    }
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-emerald-900/15 bg-slate-900 shadow-sm ${className}`}
      style={{ minHeight: '340px' }}
      aria-label={isBn ? '৩ডি মানচিত্র — কৃষি আবহাওয়া ও অবস্থান' : '3D Agricultural Weather Map'}
    >
      {webGlSupported ? (
        <div ref={containerRef} className="h-full w-full" style={{ minHeight: '340px' }} />
      ) : (
        /* Stylized Accessible Fallback when WebGL is unavailable */
        <div className="relative flex h-full min-h-[340px] w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-6 text-center text-white">
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 shadow-lg">
              <MapPin className="h-7 w-7" strokeWidth={2.2} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">
                {district.nameBn} জেলা ({district.nameEn})
              </h4>
              <p className="text-xs text-emerald-300 font-medium mt-0.5">
                {district.divisionBn} বিভাগ • {district.lat.toFixed(4)}°N, {district.lon.toFixed(4)}°E
              </p>
            </div>
            <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-1.5 text-xs text-slate-200 backdrop-blur-xs border border-white/15">
              <Compass className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isBn ? '৩ডি মানচিত্র ভিউ (সক্রিয় অবস্থান)' : '3D View Position Active'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Map Controls & Badges */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-900/85 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md border border-white/10 shadow-sm">
          <MapPin className="h-3.5 w-3.5 text-emerald-400" />
          <span>
            {isBn ? district.nameBn : district.nameEn} ({isBn ? district.nameEn : district.nameBn})
          </span>
        </div>

        {webGlSupported && (
          <button
            type="button"
            onClick={togglePitch}
            className="flex items-center gap-1 rounded-xl bg-emerald-800/90 hover:bg-emerald-700 px-2.5 py-1.5 text-xs font-bold text-white backdrop-blur-md border border-emerald-600 shadow-sm transition active:scale-95"
            title={isBn ? '৩ডি / ২ডি ভিউ পরিবর্তন করুন' : 'Toggle 3D / 2D Tilt'}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{pitch > 0 ? '3D' : '2D'}</span>
          </button>
        )}
      </div>

      {report && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-xl bg-slate-900/85 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md border border-white/10 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            {report.weather.temp}°C • {report.weather.humidity}% {isBn ? 'আর্দ্রতা' : 'Humidity'}
          </span>
        </div>
      )}
    </div>
  )
}
