// Roof-layout Phase 1b: Google Solar API pipeline.
//
// Server-side ONLY. GOOGLE_SOLAR_API_KEY must never reach the browser, and
// nothing in this module may log or Sentry-capture addresses or coordinates —
// errors are thrown with generic machine-readable messages instead.
//
// Privacy model:
//   - Reads enquiry_addresses via the service role (installers have no RLS
//     access to that table).
//   - Writes to roof_designs, which installers CAN read — so only
//     azimuth/pitch/area/panel-count summaries are stored there, never
//     coordinates or address fragments.
//   - The layout PNG is stored in the private 'roof-designs' bucket as
//     {enquiryId}.png (UUID only, no address in the filename).

import { createAdminClient } from '@/lib/supabase/server'
import * as Sentry from '@sentry/nextjs'

// ---------------------------------------------------------------------------
// Partial Solar API response types (only the fields we use)
// ---------------------------------------------------------------------------

interface LatLng {
  latitude: number
  longitude: number
}

interface RoofSegmentStats {
  pitchDegrees?: number
  azimuthDegrees?: number
  stats?: { areaMeters2?: number }
}

interface SolarPanel {
  center?: LatLng
  orientation?: 'LANDSCAPE' | 'PORTRAIT' | string
  segmentIndex?: number
}

interface RoofSegmentSummary {
  pitchDegrees?: number
  azimuthDegrees?: number
  panelsCount?: number
  segmentIndex?: number
}

export interface SolarPanelConfig {
  panelsCount: number
  yearlyEnergyDcKwh: number
  roofSegmentSummaries?: RoofSegmentSummary[]
}

export interface BuildingInsights {
  imageryQuality?: string
  solarPotential?: {
    panelCapacityWatts?: number
    panelWidthMeters?: number
    panelHeightMeters?: number
    roofSegmentStats?: RoofSegmentStats[]
    solarPanels?: SolarPanel[]
    solarPanelConfigs?: SolarPanelConfig[]
  }
}

function apiKey(): string {
  const key = process.env.GOOGLE_SOLAR_API_KEY
  if (!key) throw new Error('solar_key_missing')
  return key
}

// ---------------------------------------------------------------------------
// 1. Geocoding — rooftop-precision lat/lng from the stored address
// ---------------------------------------------------------------------------

export async function geocodeAddress(
  line1: string,
  city: string | null,
  postcode: string
): Promise<{ lat: number; lng: number } | null> {
  const address = [line1, city, postcode].filter(Boolean).join(', ')
  const url =
    'https://maps.googleapis.com/maps/api/geocode/json' +
    `?address=${encodeURIComponent(address)}&region=uk&key=${apiKey()}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`geocode_http_${res.status}`)

  const json = await res.json()
  if (json.status !== 'OK' || !json.results?.length) return null

  type GeocodeResult = {
    geometry?: { location?: { lat: number; lng: number }; location_type?: string }
  }
  const results = json.results as GeocodeResult[]
  // Prefer rooftop precision; otherwise take the best result Google returned.
  const best =
    results.find(r => r.geometry?.location_type === 'ROOFTOP') ?? results[0]
  const loc = best.geometry?.location
  if (typeof loc?.lat !== 'number' || typeof loc?.lng !== 'number') return null
  return { lat: loc.lat, lng: loc.lng }
}

// ---------------------------------------------------------------------------
// 2. Building insights — roof geometry + panel configs
// ---------------------------------------------------------------------------

export async function getBuildingInsights(
  lat: number,
  lng: number
): Promise<BuildingInsights | null> {
  const url =
    'https://solar.googleapis.com/v1/buildingInsights:findClosest' +
    `?location.latitude=${lat}&location.longitude=${lng}` +
    `&requiredQuality=MEDIUM&key=${apiKey()}`

  const res = await fetch(url)
  if (res.status === 404) return null // no Solar API coverage here
  if (!res.ok) throw new Error(`solar_insights_http_${res.status}`)
  return (await res.json()) as BuildingInsights
}

// ---------------------------------------------------------------------------
// 3. Config selection — closest to the enquiry's recommended system size
// ---------------------------------------------------------------------------

export function pickPanelConfig(
  insights: BuildingInsights,
  targetKwp: number | null
): SolarPanelConfig | null {
  const configs = insights.solarPotential?.solarPanelConfigs
  if (!configs?.length) return null

  const panelWatts = insights.solarPotential?.panelCapacityWatts ?? 400

  if (targetKwp == null || !isFinite(targetKwp) || targetKwp <= 0) {
    // No recommendation to match — take the mid-range config.
    return configs[Math.floor(configs.length / 2)]
  }

  let best = configs[0]
  let bestDiff = Infinity
  for (const cfg of configs) {
    const kwp = (cfg.panelsCount * panelWatts) / 1000
    const diff = Math.abs(kwp - targetKwp)
    if (diff < bestDiff) {
      bestDiff = diff
      best = cfg
    }
  }
  return best
}

// ---------------------------------------------------------------------------
// 4. Layout image — satellite tile + panel-rectangle overlay
// ---------------------------------------------------------------------------

const TILE_SIZE = 640
const ZOOM = 20

// Web Mercator: lat/lng -> global pixel coordinates at a given zoom.
function projectToPixels(lat: number, lng: number, zoom: number) {
  const scale = 256 * Math.pow(2, zoom)
  const x = ((lng + 180) / 360) * scale
  const sinLat = Math.sin((lat * Math.PI) / 180)
  const y =
    (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale
  return { x, y }
}

// Ground resolution (metres per pixel) of Web Mercator at this latitude/zoom.
function metersPerPixel(lat: number, zoom: number): number {
  return (
    (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom)
  )
}

export async function renderLayoutImage(
  insights: BuildingInsights,
  config: SolarPanelConfig,
  lat: number,
  lng: number
): Promise<Buffer | null> {
  const tileUrl =
    'https://maps.googleapis.com/maps/api/staticmap' +
    `?center=${lat},${lng}&zoom=${ZOOM}&size=${TILE_SIZE}x${TILE_SIZE}` +
    `&maptype=satellite&key=${apiKey()}`

  const res = await fetch(tileUrl)
  // Static Maps API not enabled on this key (or any other failure) — degrade
  // gracefully: the caller stores specs with image_path null.
  if (!res.ok) return null
  const tile = Buffer.from(await res.arrayBuffer())

  const potential = insights.solarPotential
  const panels = (potential?.solarPanels ?? []).slice(0, config.panelsCount)
  const segments = potential?.roofSegmentStats ?? []
  const panelW = potential?.panelWidthMeters ?? 1.045
  const panelH = potential?.panelHeightMeters ?? 1.879

  const center = projectToPixels(lat, lng, ZOOM)
  const mpp = metersPerPixel(lat, ZOOM)

  const rects: string[] = []
  for (const panel of panels) {
    if (!panel.center) continue
    const p = projectToPixels(panel.center.latitude, panel.center.longitude, ZOOM)
    const cx = p.x - center.x + TILE_SIZE / 2
    const cy = p.y - center.y + TILE_SIZE / 2
    if (cx < -30 || cx > TILE_SIZE + 30 || cy < -30 || cy > TILE_SIZE + 30) continue

    // Panel footprint in pixels. PORTRAIT: long axis runs up/down the slope
    // (towards the azimuth); LANDSCAPE: swapped.
    const landscape = panel.orientation === 'LANDSCAPE'
    const wPx = (landscape ? panelH : panelW) / mpp
    const hPx = (landscape ? panelW : panelH) / mpp

    // Rotate so the panel's down-slope axis points along the segment azimuth
    // (degrees clockwise from north — matching SVG rotate() with y down).
    const azimuth =
      (panel.segmentIndex != null
        ? segments[panel.segmentIndex]?.azimuthDegrees
        : undefined) ?? 0

    rects.push(
      `<rect x="${(cx - wPx / 2).toFixed(1)}" y="${(cy - hPx / 2).toFixed(1)}" ` +
        `width="${wPx.toFixed(1)}" height="${hPx.toFixed(1)}" ` +
        `transform="rotate(${azimuth.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`
    )
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_SIZE}" height="${TILE_SIZE}">` +
    `<g fill="#123a8f" fill-opacity="0.6" stroke="#ffffff" stroke-width="0.8" stroke-opacity="0.9">` +
    rects.join('') +
    `</g></svg>`

  const { default: sharp } = await import('sharp')
  return sharp(tile)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer()
}

// ---------------------------------------------------------------------------
// 5. Orchestrator
// ---------------------------------------------------------------------------

type AdminClient = Awaited<ReturnType<typeof createAdminClient>>

async function upsertDesign(
  admin: AdminClient,
  enquiryId: string,
  fields: Record<string, unknown>
) {
  const { error } = await admin.from('roof_designs').upsert(
    {
      enquiry_id: enquiryId,
      source: 'google_solar',
      updated_at: new Date().toISOString(),
      ...fields,
    },
    { onConflict: 'enquiry_id' }
  )
  if (error) throw new Error(`roof_designs_upsert_failed: ${error.code ?? error.message}`)
}

export async function generateRoofDesign(enquiryId: string): Promise<void> {
  const admin = await createAdminClient()

  try {
    const [{ data: enquiry }, { data: address }] = await Promise.all([
      admin
        .from('enquiries')
        .select('id, recommended_system_kwp')
        .eq('id', enquiryId)
        .single(),
      admin
        .from('enquiry_addresses')
        .select('address_line1, city, postcode, lat, lng')
        .eq('enquiry_id', enquiryId)
        .single(),
    ])

    if (!enquiry) throw new Error('enquiry_not_found')
    if (!address) throw new Error('address_not_found')

    // Rooftop-precision geocode; fall back to the stored postcode centroid.
    let lat: number | null = null
    let lng: number | null = null
    try {
      const geo = await geocodeAddress(address.address_line1, address.city, address.postcode)
      if (geo) {
        lat = geo.lat
        lng = geo.lng
      }
    } catch {
      // fall through to centroid
    }
    if (lat == null || lng == null) {
      lat = address.lat
      lng = address.lng
    }
    if (lat == null || lng == null) throw new Error('no_location_available')

    const insights = await getBuildingInsights(lat, lng)
    if (!insights) {
      await upsertDesign(admin, enquiryId, { status: 'unavailable' })
      return
    }

    const config = pickPanelConfig(insights, enquiry.recommended_system_kwp)
    if (!config) {
      await upsertDesign(admin, enquiryId, {
        status: 'unavailable',
        imagery_quality: insights.imageryQuality ?? null,
      })
      return
    }

    // Render + upload the layout image; a failure here (e.g. Static Maps API
    // not enabled) must not block storing the specs.
    let imagePath: string | null = null
    try {
      const png = await renderLayoutImage(insights, config, lat, lng)
      if (png) {
        const path = `${enquiryId}.png` // UUID only — never address-derived
        const { error: uploadError } = await admin.storage
          .from('roof-designs')
          .upload(path, png, { contentType: 'image/png', upsert: true })
        if (!uploadError) imagePath = path
      }
    } catch {
      // image is best-effort
    }

    const panelWatts = insights.solarPotential?.panelCapacityWatts ?? 400
    const segments = insights.solarPotential?.roofSegmentStats ?? []
    // Azimuth/pitch/area summaries ONLY — installers can read roof_designs,
    // so no coordinates may appear here.
    const roofSegments = (config.roofSegmentSummaries ?? []).map(s => ({
      azimuth_degrees: s.azimuthDegrees ?? null,
      pitch_degrees: s.pitchDegrees ?? null,
      panels_count: s.panelsCount ?? null,
      area_m2:
        s.segmentIndex != null
          ? segments[s.segmentIndex]?.stats?.areaMeters2 ?? null
          : null,
    }))

    await upsertDesign(admin, enquiryId, {
      status: 'ready',
      panel_count: config.panelsCount,
      system_kwp: Math.round(config.panelsCount * panelWatts) / 1000,
      // Google reports DC output; apply the ~85% DC-to-AC derate it recommends.
      est_annual_kwh: Math.round(config.yearlyEnergyDcKwh * 0.85),
      roof_segments: roofSegments,
      image_path: imagePath,
      imagery_quality: insights.imageryQuality ?? null,
    })
  } catch (err) {
    // Errors from this module carry generic messages (no address/coords).
    Sentry.captureException(err, { extra: { enquiryId } })
    try {
      await upsertDesign(admin, enquiryId, { status: 'failed' })
    } catch {
      // row update is best-effort at this point
    }
  }
}
