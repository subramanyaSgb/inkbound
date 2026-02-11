import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#0D0B0E',
          borderRadius: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
          fontSize: 90,
          color: '#C4956A',
        }}
      >
        I
      </div>
    ),
    { ...size }
  )
}
