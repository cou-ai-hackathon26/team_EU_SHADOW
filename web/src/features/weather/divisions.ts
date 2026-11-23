export interface Division {
  id: string
  nameBn: string
  nameEn: string
  lat: number
  lon: number
}

// 8 Divisions of Bangladesh with headquarters coordinates
export const DIVISIONS: Division[] = [
  { id: 'dhaka', nameBn: 'ঢাকা', nameEn: 'Dhaka', lat: 23.81, lon: 90.41 },
  { id: 'chattogram', nameBn: 'চট্টগ্রাম', nameEn: 'Chattogram', lat: 22.36, lon: 91.80 },
  { id: 'rajshahi', nameBn: 'রাজশাহী', nameEn: 'Rajshahi', lat: 24.37, lon: 88.60 },
  { id: 'khulna', nameBn: 'খুলনা', nameEn: 'Khulna', lat: 22.85, lon: 89.54 },
  { id: 'barishal', nameBn: 'বরিশাল', nameEn: 'Barishal', lat: 22.70, lon: 90.37 },
  { id: 'sylhet', nameBn: 'সিলেট', nameEn: 'Sylhet', lat: 24.89, lon: 91.87 },
  { id: 'rangpur', nameBn: 'রংপুর', nameEn: 'Rangpur', lat: 25.75, lon: 89.24 },
  { id: 'mymensingh', nameBn: 'ময়মনসিংহ', nameEn: 'Mymensingh', lat: 24.75, lon: 90.41 },
]

export function getDivisionById(id: string): Division | undefined {
  return DIVISIONS.find((d) => d.id === id)
}
