export type ProductType = 'solar' | 'heat_pump' | 'battery' | 'ev_charger'

export interface Certification {
  product: ProductType
  status: 'verified' | 'pending' | 'expired'
}

export interface Installer {
  id: string
  company_name: string
  status: 'verified' | 'pending' | 'suspended'
  products: ProductType[]
  coverage_postcodes: string[] // postcode districts e.g. ['DH1', 'DH2', 'SR2']
  base_lat: number
  base_lng: number
  certifications: Certification[]
}

export interface Enquiry {
  product: ProductType
  postcode: string           // full postcode e.g. 'DH1 3AB'
  postcode_district: string  // derived district e.g. 'DH1'
  lat: number
  lng: number
}

export interface RankedInstaller extends Installer {
  distance_km: number
}

// Haversine formula — great-circle distance between two lat/lng points in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function selectInstallers(
  enquiry: Enquiry,
  installers: Installer[],
  limit = 3,
): RankedInstaller[] {
  return installers
    .filter(
      (i) =>
        i.status === 'verified' &&
        i.certifications.some(
          (c) => c.product === enquiry.product && c.status === 'verified',
        ) &&
        i.coverage_postcodes.includes(enquiry.postcode_district),
    )
    .map((i) => ({
      ...i,
      distance_km: haversineKm(enquiry.lat, enquiry.lng, i.base_lat, i.base_lng),
    }))
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, limit)
}
