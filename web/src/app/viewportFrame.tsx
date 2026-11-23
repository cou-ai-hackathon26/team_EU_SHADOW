import { createContext, useContext } from 'react'

/**
 * True when the content is rendered inside the laptop "Mobile Preview" phone frame.
 * The frame is 375px wide but the browser viewport is still desktop-sized, so
 * Tailwind `lg:` breakpoints would wrongly apply. Components use this to force
 * their compact mobile layout.
 */
const PhoneFrameContext = createContext(false)

export const PhoneFrameProvider = PhoneFrameContext.Provider

// oxlint-disable-next-line react/only-export-components
export function useInPhoneFrame(): boolean {
  return useContext(PhoneFrameContext)
}
