import type { RecommendationResult } from '@/types'

const UNIT_RATE = 0.245
const SEG_RATE = 0.25
const PANEL_W = 350
const PANEL_COST = 280
const BATTERY_COST_KWH = 600

const DIRECTION_FACTOR: Record<string, number> = {
  south: 1.0,
  'east-west': 0.85,
  north: 0.65,
  'not-sure': 0.85,
}

export function calculateRecommendation(params: {
  monthlyKwh: number
  roofOrientation?: string
  goal: 'cover' | 'export'
  products: string[]
}): RecommendationResult {
  const { monthlyKwh, roofOrientation = 'south', goal, products } = params

  const result: RecommendationResult = {}

  if (products.includes('solar') || products.includes('battery')) {
    const annualKwh = monthlyKwh * 12
    const dirFactor = DIRECTION_FACTOR[roofOrientation] ?? 0.85
    const panelOutputKwh = (PANEL_W / 1000) * dirFactor * 1100 // ~1100 peak hours/yr UK

    const coverPanels = Math.ceil(annualKwh / panelOutputKwh)
    const panels = goal === 'export' ? Math.ceil(coverPanels * 1.4) : coverPanels

    const systemKwp = parseFloat((panels * 0.35).toFixed(2))
    const batteryKwh =
      products.includes('battery')
        ? goal === 'export'
          ? Math.round(systemKwp * 0.8)
          : Math.round(systemKwp * 0.5)
        : 0

    const annualSaving = annualKwh * UNIT_RATE
    const exportEarning =
      goal === 'export' ? panels * PANEL_W * 0.15 * SEG_RATE : 0

    const systemCost =
      Math.round((panels * PANEL_COST + batteryKwh * BATTERY_COST_KWH) / 100) * 100

    const paybackYears = parseFloat(
      (systemCost / (annualSaving + exportEarning)).toFixed(1)
    )

    result.panels = panels
    result.systemKwp = systemKwp
    result.batteryKwh = batteryKwh
    result.annualSaving = Math.round(annualSaving)
    result.exportEarning = Math.round(exportEarning)
    result.systemCost = systemCost
    result.paybackYears = paybackYears
  }

  return result
}
