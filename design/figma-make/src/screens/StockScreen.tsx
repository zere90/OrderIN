import { useState } from 'react';
import { useApp, AppHeader } from '../App';
import { stockItems } from '../theme';

const HISTORY = [
  { date: 'Сегодня 10:30', item: 'Кофе Эфиопия', change: '+5 кг', source: 'Накладная (фото)', icon: 'photo_camera' },
  { date: 'Вчера 15:00', item: 'Молоко', change: '-8 л', source: 'Продажи', icon: 'shopping_cart' },
  { date: 'Вчера 11:00', item: 'Круассан', change: '+24 шт', source: 'Excel-импорт', icon: 'table_view' },
  { date: '28 сент', item: 'Американо', change: '-12 порц', source: 'Продажи', icon: 'shopping_cart' },
];

function UpdateSheet({ onClose, skin }: { onClose: () => void; skin: ReturnType<typeof useApp>['skin'] }) {
  const [selected, setSelected] = useState<string | null>(null);

  const opts = [
    { label: 'Сфотографировать накладную', icon: 'photo_camera', sub: 'AI распознает и обновит склад' },
    { label: 'Загрузить Excel', icon: 'upload_file', sub: 'CSV или XLSX файл' },
    { label: 'Вручную', icon: 'edit', sub: 'Добавить или изменить позиции' },
  ];

  return (
    <>
      <div className="absolute inset-0 sheet-overlay" style={{ background: 'rgba(0,0,0,0.45)', zIndex: 100 }} onClick={onClose} />
      <div
        className="absolute bottom-0 left-0 right-0 slide-up"
        style={{
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          zIndex: 101,
          padding: '0 20px 32px',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex justify-center pt-3 pb-4">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E0E0E0' }} />
        </div>
        <div className="font-display" style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', marginBottom: 16 }}>
          Обновить склад
        </div>
        {opts.map((opt) => (
          <button
            key={opt.label}
            className="w-full spring-btn text-left"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              borderRadius: 16,
              background: selected === opt.label ? skin.tint : '#F8F8F8',
              marginBottom: 8,
              border: `1.5px solid ${selected === opt.label ? skin.accent : 'transparent'}`,
            }}
            onClick={() => setSelected(opt.label)}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: selected === opt.label
                  ? `linear-gradient(140deg, ${skin.accent}, ${skin.second})`
                  : skin.tint,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="icon" style={{ color: selected === opt.label ? '#fff' : skin.accent }}>{opt.icon}</span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{opt.label}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{opt.sub}</div>
            </div>
          </button>
        ))}
        <button
          className="w-full spring-btn"
          style={{
            padding: '14px 0',
            borderRadius: 14,
            background: selected
              ? `linear-gradient(140deg, ${skin.accent}, ${skin.second})`
              : '#E0E0E0',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            fontFamily: 'Manrope, sans-serif',
            marginTop: 8,
            opacity: selected ? 1 : 0.6,
          }}
          disabled={!selected}
          onClick={onClose}
        >
          Продолжить
        </button>
      </div>
    </>
  );
}

export default function StockScreen() {
  const { skin } = useApp();
  const [showUpdate, setShowUpdate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = stockItems.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const lowCount = stockItems.filter((i) => i.low).length;

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ position: 'relative' }}>
      <AppHeader title={skin.stockLabel} subtitle={`${skin.name} · ${stockItems.length} позиций`} />

      <div className="flex-1 overflow-y-auto hide-scroll" style={{ padding: '0 16px 24px' }}>
        {/* Low stock warning */}
        {lowCount > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 14,
              background: '#FEF3C7',
              border: '1.5px solid #FDE68A',
              marginBottom: 12,
            }}
          >
            <span className="icon icon-sm" style={{ color: '#F59E0B' }}>warning</span>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#92400E' }}>
              {lowCount} позиции заканчиваются
            </div>
            <button
              style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', fontFamily: 'Manrope, sans-serif' }}
              onClick={() => setShowUpdate(true)}
            >
              Пополнить
            </button>
          </div>
        )}

        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#fff',
            borderRadius: 14,
            padding: '10px 14px',
            marginBottom: 12,
            border: `1.5px solid ${skin.tint}`,
          }}
        >
          <span className="icon icon-sm" style={{ color: '#999' }}>search</span>
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 14,
              fontFamily: 'Manrope, sans-serif',
              color: '#1A1A1A',
              background: 'transparent',
            }}
          />
        </div>

        {/* Stock items */}
        {filtered.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              borderRadius: 18,
              background: '#fff',
              marginBottom: 8,
              border: `1.5px solid ${item.low ? '#FDE68A' : '#F0F0F0'}`,
            }}
          >
            {/* Thumbnail */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: `linear-gradient(140deg, ${skin.accent}33, ${skin.second}55)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span className="icon" style={{ color: skin.accent }}>{item.icon}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>{item.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 12, color: '#888' }}>
                  {item.price.toLocaleString('ru-KZ')} ₸ / {item.unit}
                </div>
                {item.low && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      padding: '1px 6px',
                      borderRadius: 6,
                      background: '#FEF3C7',
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#F59E0B',
                    }}
                  >
                    <span className="icon" style={{ fontSize: 10 }}>warning</span>
                    Мало
                  </div>
                )}
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <div
                className="font-display"
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: item.qty === 0 ? '#EF4444' : item.low ? '#F59E0B' : skin.accent,
                }}
              >
                {item.qty}
              </div>
              <div style={{ fontSize: 11, color: '#999' }}>{item.unit}</div>
            </div>
          </div>
        ))}

        {/* History */}
        <button
          className="w-full spring-btn"
          style={{
            padding: '12px 0',
            borderRadius: 14,
            background: skin.tint,
            color: skin.accent,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'Manrope, sans-serif',
            marginTop: 8,
            marginBottom: 16,
          }}
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? 'Скрыть историю' : 'История изменений'}
        </button>

        {showHistory && (
          <div className="fade-in">
            {HISTORY.map((h, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 0',
                  borderBottom: i < HISTORY.length - 1 ? '1px solid #F0F0F0' : 'none',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: skin.tint,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span className="icon icon-sm" style={{ color: skin.accent, fontSize: 14 }}>{h.icon}</span>
                </div>
                <div className="flex-1">
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{h.item}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{h.date} · {h.source}</div>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: h.change.startsWith('+') ? '#10B981' : '#EF4444',
                    flexShrink: 0,
                  }}
                >
                  {h.change}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky update button */}
      <div
        style={{
          padding: '12px 16px',
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: skin.bg,
          borderTop: '1px solid #F0F0F0',
          flexShrink: 0,
        }}
      >
        <button
          className="w-full spring-btn"
          style={{
            padding: '14px 0',
            borderRadius: 14,
            background: `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            fontFamily: 'Manrope, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          onClick={() => setShowUpdate(true)}
        >
          <span className="icon icon-sm" style={{ color: '#fff' }}>add</span>
          Обновить склад
        </button>
      </div>

      {showUpdate && <UpdateSheet onClose={() => setShowUpdate(false)} skin={skin} />}
    </div>
  );
}
