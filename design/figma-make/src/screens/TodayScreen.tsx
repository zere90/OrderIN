import { useApp, AppHeader } from '../App';
import { revenueData, ownerName } from '../theme';

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 140;
  const H = 40;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H * 0.8 - H * 0.1;
    return `${x},${y}`;
  });
  const linePath = `M ${pts.join(' L ')}`;
  const areaPath = `M 0,${H} L ${pts.join(' L ')} L ${W},${H} Z`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sg)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last dot */}
      <circle
        cx={(6 / (data.length - 1)) * W}
        cy={H - ((data[6] - min) / range) * H * 0.8 - H * 0.1}
        r="4"
        fill={color}
      />
    </svg>
  );
}

export default function TodayScreen() {
  const { skin, setTab, setSubScreen } = useApp();

  const today = revenueData[6];
  const yesterday = revenueData[5];
  const diff = today - yesterday;
  const diffPct = Math.round((diff / yesterday) * 100);
  const isUp = diff >= 0;

  const fmtMoney = (n: number) =>
    n.toLocaleString('ru-KZ').replace(/,/g, ' ') + ' ₸';

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <AppHeader
        title={`Сәлем, ${ownerName} · ${skin.name}`}
        subtitle={new Date().toLocaleDateString('ru-KZ', { weekday: 'long', day: 'numeric', month: 'long' })}
      />

      <div className="flex-1 overflow-y-auto hide-scroll" style={{ padding: '12px 16px 24px' }}>
        {/* ── Hero revenue card ── */}
        <div
          style={{
            borderRadius: 24,
            overflow: 'hidden',
            position: 'relative',
            padding: '24px 22px 20px',
            marginBottom: 12,
            background: `
              radial-gradient(ellipse at 15% 65%, ${skin.accent}EE 0%, transparent 55%),
              radial-gradient(ellipse at 85% 15%, ${skin.second}CC 0%, transparent 50%),
              ${skin.accent}
            `,
          }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 4, letterSpacing: 0.5 }}>
              ВЫРУЧКА СЕГОДНЯ
            </div>
            <div className="font-display" style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 2 }}>
              {fmtMoney(today)}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 18 }}>
              {isUp ? '↑' : '↓'} {Math.abs(diffPct)}% vs вчера · {fmtMoney(Math.abs(diff))}
            </div>

            <Sparkline data={revenueData} color="rgba(255,255,255,0.9)" />

            <div className="flex gap-1 mt-3">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d, i) => (
                <div
                  key={d}
                  style={{
                    fontSize: 9,
                    color: i === 6 ? '#fff' : 'rgba(255,255,255,0.5)',
                    fontWeight: i === 6 ? 700 : 400,
                    flex: 1,
                    textAlign: 'center',
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 2 stat tiles ── */}
        <div className="flex gap-3 mb-3">
          {[
            { label: 'Заказов', value: '12', icon: 'receipt_long', sub: '+3 сегодня' },
            { label: 'Новых чатов', value: '5', icon: 'chat_bubble', sub: '2 непрочитаны' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                borderRadius: 20,
                padding: '16px 14px',
                background: '#fff',
                border: `1.5px solid ${skin.tint}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="icon icon-sm" style={{ color: skin.second }}>{stat.icon}</span>
                <div
                  style={{
                    fontSize: 9,
                    color: skin.accent,
                    background: skin.tint,
                    borderRadius: 6,
                    padding: '2px 6px',
                    fontWeight: 600,
                  }}
                >
                  {stat.sub}
                </div>
              </div>
              <div className="font-display" style={{ fontSize: 26, fontWeight: 800, color: skin.accent }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── AI Tip card ── */}
        <div
          style={{
            borderRadius: 20,
            padding: 18,
            marginBottom: 12,
            background: '#fff',
            border: `1.5px solid transparent`,
            backgroundClip: 'padding-box',
            position: 'relative',
          }}
        >
          {/* Gradient border */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 20,
              padding: 1.5,
              background: `linear-gradient(135deg, ${skin.accent}, ${skin.second})`,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 8,
                background: `linear-gradient(135deg, ${skin.accent}, ${skin.second})`,
              }}
            >
              <span style={{ fontSize: 10 }}>✦</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>AI</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1A1A' }}>Совет дня</span>
          </div>
          <div style={{ fontSize: 14, color: '#333', lineHeight: 1.55, marginBottom: 12 }}>
            Ваш пик заказов в 10:00–12:00. Предложите скидку в 16:00–18:00 — это может увеличить выручку на{' '}
            <strong style={{ color: skin.accent }}>18%</strong>.
          </div>
          <button
            className="spring-btn"
            style={{
              padding: '9px 16px',
              borderRadius: 10,
              background: `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'Manrope, sans-serif',
            }}
            onClick={() => setTab('ai')}
          >
            {skin.aiFeature} →
          </button>
        </div>

        {/* ── Quick actions row ── */}
        <div style={{ fontSize: 11, color: '#999', fontWeight: 600, marginBottom: 10, letterSpacing: 0.3 }}>
          БЫСТРЫЕ ДЕЙСТВИЯ
        </div>
        <div className="flex gap-3">
          {[
            { label: 'Новый заказ', icon: 'add_shopping_cart', action: () => setTab('orders') },
            { label: 'Склад', icon: 'inventory_2', action: () => setTab('stock') },
            { label: 'Поделиться', icon: 'share', action: () => {} },
          ].map((a) => (
            <button
              key={a.label}
              className="flex-1 spring-btn"
              style={{
                padding: '14px 8px',
                borderRadius: 16,
                background: '#fff',
                border: `1.5px solid ${skin.tint}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
              onClick={a.action}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: skin.tint,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="icon icon-sm" style={{ color: skin.accent }}>{a.icon}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#444', textAlign: 'center' }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
