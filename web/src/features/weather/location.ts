export function roundCoord(coord: number): number {
  return Math.round(coord * 100) / 100
}

export interface Coordinates {
  lat: number
  lon: number
}

export async function getPosition(
  geo?: Geolocation | null,
): Promise<Coordinates> {
  const geolocation =
    geo !== undefined
      ? geo
      : typeof navigator !== 'undefined'
        ? navigator.geolocation
        : null

  if (!geolocation || typeof geolocation.getCurrentPosition !== 'function') {
    return Promise.reject(new Error('Geolocation is not supported'))
  }

  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: roundCoord(position.coords.latitude),
          lon: roundCoord(position.coords.longitude),
        })
      },
      (error) => {
        reject(error || new Error('Geolocation failed'))
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 30 * 60 * 1000,
      },
    )
  })
}
