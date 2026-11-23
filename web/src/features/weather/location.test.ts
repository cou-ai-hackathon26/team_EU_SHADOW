import { describe, it, expect, vi } from 'vitest'
import { roundCoord, getPosition } from './location'

describe('F16: Location Helper (location.ts)', () => {
  it('roundCoord(23.81234) === 23.81 and rounds coordinates to 2 decimals', () => {
    expect(roundCoord(23.81234)).toBe(23.81)
    expect(roundCoord(90.4149)).toBe(90.41)
    expect(roundCoord(22.3567)).toBe(22.36)
    expect(roundCoord(24.370001)).toBe(24.37)
  })

  it('getPosition calls getCurrentPosition with low accuracy, 8s timeout, and 30m maxAge', async () => {
    let capturedOptions: PositionOptions | undefined

    const fakeGeo = {
      getCurrentPosition: vi.fn(
        (
          success: PositionCallback,
          _error?: PositionErrorCallback | null,
          options?: PositionOptions,
        ) => {
          capturedOptions = options
          success({
            coords: {
              latitude: 23.8123,
              longitude: 90.4149,
              accuracy: 100,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          } as GeolocationPosition)
        },
      ),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    }

    const pos = await getPosition(fakeGeo as unknown as Geolocation)

    expect(pos).toEqual({ lat: 23.81, lon: 90.41 })
    expect(capturedOptions).toEqual({
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 30 * 60 * 1000,
    })
  })

  it('getPosition rejects on error or unsupported geolocation', async () => {
    await expect(getPosition(null as unknown as Geolocation)).rejects.toThrow()

    const failingGeo = {
      getCurrentPosition: vi.fn(
        (
          _success: PositionCallback,
          error?: PositionErrorCallback | null,
        ) => {
          error?.({
            code: 1,
            message: 'User denied Geolocation',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError)
        },
      ),
    }

    await expect(
      getPosition(failingGeo as unknown as Geolocation),
    ).rejects.toThrow(/denied/i)
  })
})
