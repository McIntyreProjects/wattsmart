export type UserRole = 'customer' | 'installer' | 'admin'

export type ProductType = 'solar' | 'battery' | 'heatpump' | 'ev'

export type EnquiryStatus =
  | 'quotes_requested'
  | 'quotes_received'
  | 'client_deciding'
  | 'installer_chosen'
  | 'deposit_paid'
  | 'survey_booked'
  | 'installation_confirmed'
  | 'complete'
  | 'cancelled'

export type JobStatus =
  | 'brief_sent'
  | 'quote_submitted'
  | 'quote_selected'
  | 'revealed'
  | 'survey_booked'
  | 'installation_confirmed'
  | 'complete'
  | 'withdrawn'

export type InstallerStatus = 'pending' | 'active' | 'paused' | 'rejected'

export type CertType = 'mcs' | 'recc' | 'hies' | 'niceic' | 'napit' | 'ozev' | 'trustmark'

export type CertStatus = 'pending' | 'verified' | 'failed' | 'expired'

export type QuoteLabel = 'A' | 'B' | 'C'

export type QuoteStatus = 'submitted' | 'selected' | 'rejected'

export type PaymentType = 'deposit' | 'final'

export type PaymentStatus = 'pending' | 'held' | 'released' | 'refunded'

export type FeeInvoiceStatus = 'issued' | 'paid' | 'overdue'

export type ReviewSource = 'google' | 'trustpilot'

export type ContactMethod = 'whatsapp' | 'text' | 'email' | 'phone' | 'video' | 'face_to_face'

export interface Enquiry {
  id: string
  customer_id: string
  reference: string
  products: ProductType[]
  postcode: string
  property_type: string
  property_age: string
  ownership: string
  roof_type?: string
  roof_orientation?: string
  shading?: string
  monthly_elec_kwh: number
  monthly_bill: number
  electricity_supplier?: string
  goal: 'cover' | 'export'
  notes?: string
  recommended_panels?: number
  recommended_system_kwp?: number
  recommended_battery_kwh?: number
  status: EnquiryStatus
  created_at: string
}

export interface Installer {
  id: string
  user_id: string
  company_name: string
  companies_house_number: string
  contact_name: string
  contact_email: string
  contact_phone: string
  years_trading: number
  products: ProductType[]
  coverage_postcodes: string[]
  status: InstallerStatus
  stripe_account_id?: string
  average_rating_google?: number
  average_rating_trustpilot?: number
  google_place_id?: string
  trustpilot_url?: string
  created_at: string
  approved_at?: string
}

export interface Certification {
  id: string
  installer_id: string
  type: CertType
  certification_number: string
  status: CertStatus
  verified_at?: string
  expires_at?: string
  last_checked_at: string
  register_source: string
}

export interface Quote {
  id: string
  job_id: string
  enquiry_id: string
  installer_id: string
  panel_count?: number
  system_kwp?: number
  battery_kwh?: number
  panel_brand?: string
  inverter_brand?: string
  total_price: number
  deposit_amount: number
  estimated_install_timeframe: string
  additional_notes?: string
  label: QuoteLabel
  status: QuoteStatus
  submitted_at: string
  selected_at?: string
}

export interface Payment {
  id: string
  enquiry_id: string
  quote_id: string
  installer_id: string
  type: PaymentType
  amount: number
  wattsmart_fee: number
  installer_amount: number
  stripe_payment_intent_id?: string
  stripe_transfer_id?: string
  status: PaymentStatus
  paid_at?: string
  released_at?: string
  created_at: string
}

export interface Review {
  id: string
  installer_id: string
  source: ReviewSource
  rating: number
  review_text: string
  review_text_anonymised: string
  reviewer_date: string
  product_mentioned?: string
  fetched_at: string
  flagged: boolean
}

export interface RecommendationResult {
  panels?: number
  systemKwp?: number
  batteryKwh?: number
  annualSaving?: number
  exportEarning?: number
  systemCost?: number
  paybackYears?: number
}
