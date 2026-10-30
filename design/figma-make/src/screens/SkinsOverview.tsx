import { useApp } from '../App';
import { skins, revenueData } from '../theme';

function MiniSparkline({ color }: { color: string }) {
  const data = revenueData;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 80;
  const H = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H * 0.8 - H * 0.1;
    return `${x},${y}`;
  });
  const linePath = `M ${pts.join(' L ')}`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <path d={linePath} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MiniHomeCard({ skin }: { skin: typeof skins[0] }) {
  return (
    <div
      style={{
        borderRadius: 20,
        background: skin.bg,
        overflow: 'hidden',
        fontFamily: 'Manrope, sans-serif',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 12px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: skin.accent, fontFamily: 'Unbounded, sans-serif' }}>
            OrderIN
          </div>
          <div style={{ fontSize: 8, color: '#888' }}>{skin.name}</div>
        </div>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: `1.5px solid ${skin.accent}`,
            background: skin.tint,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Unbounded, sans-serif',
            fontSize: 6,
            fontWeight: 700,
            color: skin.accent,
          }}
        >
          {skin.initials}
        </div>
      </div>

      {/* Hero card */}
      <div style={{ padding: '0 8px 8px' }}>
        <div
          style={{
            borderRadius: 14,
            padding: '12px 12px 10px',
            background: `
              radial-gradient(ellipse at 15% 65%, ${skin.accent}EE 0%, transparent 55%),
              radial-gradient(ellipse at 85% 15%, ${skin.second}CC 0%, transparent 50%),
              ${skin.accent}
            `,
          }}
        >
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 2, letterSpacing: 0.3 }}>
            ВЫРУЧКА СЕГОДНЯ
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'Unbounded, sans-serif', marginBottom: 6 }}>
            47 300 ₸
          </div>
          <MiniSparkline color="#fff" />
        </div>
      </div>

      {/* 2 stat tiles */}
      <div style={{ padding: '0 8px', display: 'flex', gap: 6, marginBottom: 6 }}>
        {[
          { label: 'Заказов', value: '12' },
          { label: 'Чатов', value: '5' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              borderRadius: 10,
              padding: '8px 8px 6px',
              background: '#fff',
              border: `1px solid ${skin.tint}`,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: skin.accent, fontFamily: 'Unbounded, sans-serif' }}>{s.value}</div>
            <div style={{ fontSize: 7, color: '#888', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* AI tip */}
      <div
        style={{
          margin: '0 8px 8px',
          borderRadius: 10,
          padding: '8px 10px',
          background: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 10,
            padding: 1,
            background: `linear-gradient(135deg, ${skin.accent}, ${skin.second})`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            padding: '1px 5px',
            borderRadius: 5,
            background: `linear-gradient(135deg, ${skin.accent}, ${skin.second})`,
            marginBottom: 4,
          }}
        >
          <span style={{ fontSize: 6 }}>✦</span>
          <span style={{ fontSize: 6, fontWeight: 700, color: '#fff' }}>AI</span>
        </div>
        <div style={{ fontSize: 8, color: '#444', lineHeight: 1.4 }}>
          {skin.aiFeature} — главная функция для {skin.businessType.toLowerCase()}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: '0 8px 10px', display: 'flex', gap: 4 }}>
        {['Заказ', 'Склад', 'Поделиться'].map((a) => (
          <div
            key={a}
            style={{
              flex: 1,
              borderRadius: 8,
              padding: '6px 4px',
              background: '#fff',
              border: `1px solid ${skin.tint}`,
              textAlign: 'center',
              fontSize: 7,
              fontWeight: 600,
              color: skin.accent,
            }}
          >
            {a}
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div
        style={{
          borderTop: '1px solid rgba(0,0,0,0.06)',
          padding: '6px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          background: '#fff',
        }}
      >
        {['chat_bubble', 'receipt_long'].map((icon) => (
          <span key={icon} className="icon" style={{ fontSize: 12, color: '#CCC' }}>{icon}</span>
        ))}
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 4,
          }}
        >
          <span className="icon" style={{ fontSize: 10, color: '#fff' }}>auto_awesome</span>
        </div>
        {['inventory_2', 'home'].map((icon, i) => (
          <span key={icon} className="icon" style={{ fontSize: 12, color: i === 1 ? skin.accent : '#CCC' }}>{icon}</span>
        ))}
      </div>
    </div>
  );
}

export default function SkinsOverview() {
  const { setRootScreen, setSkinId } = useApp();

  return (
    <div
      style={{
        flex: 1,
        minHeight: '100dvh',
        background: '#E8E6E0',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 16, fontWeight: 800, color: '#1A1A1A' }}>
            6 скинов OrderIN
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Один дизайн — шесть бизнесов</div>
        </div>
        <button
          className="spring-btn"
          style={{
            padding: '7px 14px',
            borderRadius: 10,
            background: '#fff',
            fontSize: 12,
            fontWeight: 700,
            color: '#555',
            fontFamily: 'Manrope, sans-serif',
          }}
          onClick={() => setRootScreen('app')}
        >
          ← Назад
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto hide-scroll"
        style={{ padding: '0 16px 24px' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {skins.map((skin) => (
            <button
              key={skin.id}
              className="spring-btn text-left"
              style={{ display: 'block' }}
              onClick={() => {
                setSkinId(skin.id);
                setRootScreen('app');
              }}
            >
              <MiniHomeCard skin={skin} />
              <div style={{ marginTop: 6, paddingLeft: 2 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1A1A1A', fontFamily: 'Manrope, sans-serif' }}>{skin.name}</div>
                <div style={{ fontSize: 10, color: '#888', fontFamily: 'Manrope, sans-serif' }}>{skin.businessType}</div>
                <div className="flex items-center gap-3 mt-1">
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: skin.accent }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: skin.second }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: skin.tint, border: '1px solid #E0E0E0' }} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
