import { ImageResponse } from 'next/og'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const alt = 'WattSmart — Green-energy quotes without the 20 phone calls.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  const logoData = readFileSync(join(process.cwd(), 'public', 'logo.png'))
  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`

  // Intrinsic logo is 1812×510 — render at 680 wide to keep the ratio
  const logoWidth = 680
  const logoHeight = Math.round((510 / 1812) * logoWidth)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F2F6F3 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          width={logoWidth}
          height={logoHeight}
          alt=""
          style={{ marginBottom: 48 }}
        />
        <div
          style={{
            display: 'flex',
            color: '#15201B',
            fontSize: 40,
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          Green-energy quotes without the 20 phone calls.
        </div>
        <div
          style={{
            display: 'flex',
            color: '#0E7A43',
            fontSize: 26,
            fontWeight: 600,
            marginTop: 40,
          }}
        >
          wattsmart.co.uk
        </div>
      </div>
    ),
    { ...size }
  )
}
