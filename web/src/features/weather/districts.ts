export interface District {
  id: string
  nameBn: string
  nameEn: string
  divisionBn: string
  divisionEn: string
  lat: number
  lon: number
}

export const BANGLADESH_DISTRICTS: District[] = [
  // Dhaka Division
  { id: 'dhaka', nameBn: 'ঢাকা', nameEn: 'Dhaka', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.8103, lon: 90.4125 },
  { id: 'gazipur', nameBn: 'গাজীপুর', nameEn: 'Gazipur', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 24.0023, lon: 90.4267 },
  { id: 'narayanganj', nameBn: 'নারায়ণগঞ্জ', nameEn: 'Narayanganj', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.6238, lon: 90.5000 },
  { id: 'tangail', nameBn: 'টাঙ্গাইল', nameEn: 'Tangail', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 24.2513, lon: 89.9167 },
  { id: 'faridpur', nameBn: 'ফরিদপুর', nameEn: 'Faridpur', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.6071, lon: 89.8429 },
  { id: 'kishoreganj', nameBn: 'কিশোরগঞ্জ', nameEn: 'Kishoreganj', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 24.4449, lon: 90.7766 },
  { id: 'manikganj', nameBn: 'মানিকগঞ্জ', nameEn: 'Manikganj', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.8617, lon: 90.0003 },
  { id: 'munshiganj', nameBn: 'মুন্সীগঞ্জ', nameEn: 'Munshiganj', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.5422, lon: 90.5305 },
  { id: 'narsingdi', nameBn: 'নরসিংদী', nameEn: 'Narsingdi', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.9322, lon: 90.7154 },
  { id: 'gopalganj', nameBn: 'গোপালগঞ্জ', nameEn: 'Gopalganj', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.0051, lon: 89.8266 },
  { id: 'madaripur', nameBn: 'মাদারীপুর', nameEn: 'Madaripur', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.1641, lon: 90.1897 },
  { id: 'rajbari', nameBn: 'রাজবাড়ী', nameEn: 'Rajbari', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.7574, lon: 89.6445 },
  { id: 'shariatpur', nameBn: 'শরীয়তপুর', nameEn: 'Shariatpur', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.2423, lon: 90.4348 },

  // Mymensingh Division
  { id: 'mymensingh', nameBn: 'ময়মনসিংহ', nameEn: 'Mymensingh', divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh', lat: 24.7471, lon: 90.4203 },
  { id: 'jamalpur', nameBn: 'জামালপুর', nameEn: 'Jamalpur', divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh', lat: 24.9375, lon: 89.9378 },
  { id: 'netrokona', nameBn: 'নেত্রকোণা', nameEn: 'Netrokona', divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh', lat: 24.8709, lon: 90.7279 },
  { id: 'sherpur', nameBn: 'শেরপুর', nameEn: 'Sherpur', divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh', lat: 25.0205, lon: 90.0153 },

  // Chattogram Division
  { id: 'chattogram', nameBn: 'চট্টগ্রাম', nameEn: 'Chattogram', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 22.3569, lon: 91.7832 },
  { id: 'coxsbazar', nameBn: 'কক্সবাজার', nameEn: 'Coxs Bazar', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 21.4272, lon: 92.0058 },
  { id: 'cumilla', nameBn: 'কুমিল্লা', nameEn: 'Cumilla', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 23.4607, lon: 91.1809 },
  { id: 'brahmanbaria', nameBn: 'ব্রাহ্মণবাড়িয়া', nameEn: 'Brahmanbaria', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 23.9571, lon: 91.1115 },
  { id: 'chandpur', nameBn: 'চাঁদপুর', nameEn: 'Chandpur', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 23.2333, lon: 90.6667 },
  { id: 'feni', nameBn: 'ফেনী', nameEn: 'Feni', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 23.0159, lon: 91.3976 },
  { id: 'noakhali', nameBn: 'নোয়াখালী', nameEn: 'Noakhali', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 22.8696, lon: 91.0998 },
  { id: 'lakshmipur', nameBn: 'লক্ষ্মীপুর', nameEn: 'Lakshmipur', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 22.9425, lon: 90.8412 },
  { id: 'rangamati', nameBn: 'রাঙ্গামাটি', nameEn: 'Rangamati', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 22.7324, lon: 92.2985 },
  { id: 'bandarban', nameBn: 'বান্দরবান', nameEn: 'Bandarban', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 22.1953, lon: 92.2184 },
  { id: 'khagrachhari', nameBn: 'খাগড়াছড়ি', nameEn: 'Khagrachhari', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 23.1193, lon: 91.9847 },

  // Rajshahi Division
  { id: 'rajshahi', nameBn: 'রাজশাহী', nameEn: 'Rajshahi', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', lat: 24.3636, lon: 88.6241 },
  { id: 'bogura', nameBn: 'বগুড়া', nameEn: 'Bogura', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', lat: 24.8465, lon: 89.3770 },
  { id: 'pabna', nameBn: 'পাবনা', nameEn: 'Pabna', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', lat: 24.0064, lon: 89.2372 },
  { id: 'sirajganj', nameBn: 'সিরাজগঞ্জ', nameEn: 'Sirajganj', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', lat: 24.4534, lon: 89.7008 },
  { id: 'naogaon', nameBn: 'নওগাঁ', nameEn: 'Naogaon', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', lat: 24.7936, lon: 88.9318 },
  { id: 'natore', nameBn: 'নাটোর', nameEn: 'Natore', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', lat: 24.4206, lon: 89.0003 },
  { id: 'chapai_nawabganj', nameBn: 'চাঁপাইনবাবগঞ্জ', nameEn: 'Chapai Nawabganj', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', lat: 24.5965, lon: 88.2775 },
  { id: 'joypurhat', nameBn: 'জয়পুরহাট', nameEn: 'Joypurhat', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', lat: 25.1015, lon: 89.0277 },

  // Rangpur Division
  { id: 'rangpur', nameBn: 'রংপুর', nameEn: 'Rangpur', divisionBn: 'রংপুর', divisionEn: 'Rangpur', lat: 25.7439, lon: 89.2752 },
  { id: 'dinajpur', nameBn: 'দিনাজপুর', nameEn: 'Dinajpur', divisionBn: 'রংপুর', divisionEn: 'Rangpur', lat: 25.6217, lon: 88.6355 },
  { id: 'kurigram', nameBn: 'কুড়িগ্রাম', nameEn: 'Kurigram', divisionBn: 'রংপুর', divisionEn: 'Rangpur', lat: 25.8054, lon: 89.6362 },
  { id: 'gaibandha', nameBn: 'গাইবান্ধা', nameEn: 'Gaibandha', divisionBn: 'রংপুর', divisionEn: 'Rangpur', lat: 25.3288, lon: 89.5407 },
  { id: 'nilphamari', nameBn: 'নীলফামারী', nameEn: 'Nilphamari', divisionBn: 'রংপুর', divisionEn: 'Rangpur', lat: 25.9318, lon: 88.8560 },
  { id: 'lalmonirhat', nameBn: 'লালমনিরহাট', nameEn: 'Lalmonirhat', divisionBn: 'রংপুর', divisionEn: 'Rangpur', lat: 25.9923, lon: 89.2847 },
  { id: 'thakurgaon', nameBn: 'ঠাকুরগাঁও', nameEn: 'Thakurgaon', divisionBn: 'রংপুর', divisionEn: 'Rangpur', lat: 26.0337, lon: 88.4617 },
  { id: 'panchagarh', nameBn: 'পঞ্চগড়', nameEn: 'Panchagarh', divisionBn: 'রংপুর', divisionEn: 'Rangpur', lat: 26.3411, lon: 88.5542 },

  // Khulna Division
  { id: 'khulna', nameBn: 'খুলনা', nameEn: 'Khulna', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 22.8456, lon: 89.5403 },
  { id: 'jashore', nameBn: 'যশোর', nameEn: 'Jashore', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 23.1664, lon: 89.2182 },
  { id: 'satkhira', nameBn: 'সাতক্ষীরা', nameEn: 'Satkhira', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 22.7185, lon: 89.0705 },
  { id: 'kushtia', nameBn: 'কুষ্টিয়া', nameEn: 'Kushtia', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 23.9013, lon: 89.1205 },
  { id: 'jhenaidah', nameBn: 'ঝিনাইদহ', nameEn: 'Jhenaidah', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 23.5450, lon: 89.1526 },
  { id: 'chuadanga', nameBn: 'চুয়াডাঙ্গা', nameEn: 'Chuadanga', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 23.6402, lon: 88.8418 },
  { id: 'bagerhat', nameBn: 'বাগেরহাট', nameEn: 'Bagerhat', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 22.6516, lon: 89.7859 },
  { id: 'magura', nameBn: 'মাগুরা', nameEn: 'Magura', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 23.4873, lon: 89.4199 },
  { id: 'meherpur', nameBn: 'মেহেরপুর', nameEn: 'Meherpur', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 23.7622, lon: 88.6318 },
  { id: 'narail', nameBn: 'নড়াইল', nameEn: 'Narail', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 23.1725, lon: 89.5127 },

  // Barishal Division
  { id: 'barishal', nameBn: 'বরিশাল', nameEn: 'Barishal', divisionBn: 'বরিশাল', divisionEn: 'Barishal', lat: 22.7010, lon: 90.3535 },
  { id: 'bhola', nameBn: 'ভোলা', nameEn: 'Bhola', divisionBn: 'বরিশাল', divisionEn: 'Barishal', lat: 22.6859, lon: 90.6482 },
  { id: 'patuakhali', nameBn: 'পটুয়াখালী', nameEn: 'Patuakhali', divisionBn: 'বরিশাল', divisionEn: 'Barishal', lat: 22.3596, lon: 90.3299 },
  { id: 'pirojpur', nameBn: 'পিরোজপুর', nameEn: 'Pirojpur', divisionBn: 'বরিশাল', divisionEn: 'Barishal', lat: 22.5841, lon: 89.9720 },
  { id: 'barguna', nameBn: 'বরগুনা', nameEn: 'বরগুনা', divisionBn: 'বরিশাল', divisionEn: 'Barishal', lat: 22.1587, lon: 90.1256 },
  { id: 'jhalokathi', nameBn: 'ঝালকাঠি', nameEn: 'Jhalokathi', divisionBn: 'বরিশাল', divisionEn: 'Barishal', lat: 22.6406, lon: 90.1987 },

  // Sylhet Division
  { id: 'sylhet', nameBn: 'সিলেট', nameEn: 'Sylhet', divisionBn: 'সিলেট', divisionEn: 'Sylhet', lat: 24.8949, lon: 91.8687 },
  { id: 'moulvibazar', nameBn: 'মৌলভীবাজার', nameEn: 'Moulvibazar', divisionBn: 'সিলেট', divisionEn: 'Sylhet', lat: 24.4829, lon: 91.7774 },
  { id: 'habiganj', nameBn: 'হবিগঞ্জ', nameEn: 'Habiganj', divisionBn: 'সিলেট', divisionEn: 'Sylhet', lat: 24.3749, lon: 91.4155 },
  { id: 'sunamganj', nameBn: 'সুনামগঞ্জ', nameEn: 'Sunamganj', divisionBn: 'সিলেট', divisionEn: 'Sylhet', lat: 25.0658, lon: 91.3950 },
]

/**
 * Finds the nearest Bangladesh district from given lat/lon coordinates
 * using Haversine distance formula.
 */
export function findNearestDistrict(lat: number, lon: number): District {
  let nearest = BANGLADESH_DISTRICTS[0]
  let minDistance = Infinity

  for (const d of BANGLADESH_DISTRICTS) {
    const dLat = ((d.lat - lat) * Math.PI) / 180
    const dLon = ((d.lon - lon) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((d.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const dist = 6371 * c // distance in km

    if (dist < minDistance) {
      minDistance = dist
      nearest = d
    }
  }

  return nearest
}

export function getDistrictById(id: string): District {
  return BANGLADESH_DISTRICTS.find((d) => d.id === id) ?? BANGLADESH_DISTRICTS[0]
}
