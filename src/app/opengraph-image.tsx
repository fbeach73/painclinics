import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'PainClinics.com - Find Pain Management Clinics Near You';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #3b82f6)',
          }}
        />

        {/* Medical cross icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              color: 'white',
              fontWeight: 700,
            }}
          >
            +
          </div>
        </div>

        {/* Site name */}
        <div
          style={{
            fontSize: '28px',
            color: '#94a3b8',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          PainClinics.com
        </div>

        {/* Main headline */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: 800,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: '20px',
          }}
        >
          Find Pain Management
        </div>
        <div
          style={{
            fontSize: '56px',
            fontWeight: 800,
            background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
            backgroundClip: 'text',
            color: 'transparent',
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: '30px',
          }}
        >
          Clinics Near You
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: '40px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#94a3b8',
              fontSize: '22px',
            }}
          >
            <span style={{ color: '#3b82f6', fontWeight: 700 }}>5,000+</span> Verified Clinics
          </div>
          <div
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#475569',
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#94a3b8',
              fontSize: '22px',
            }}
          >
            <span style={{ color: '#3b82f6', fontWeight: 700 }}>50</span> States
          </div>
          <div
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#475569',
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#94a3b8',
              fontSize: '22px',
            }}
          >
            <span style={{ color: '#3b82f6', fontWeight: 700 }}>4.5+</span> Avg Rating
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
