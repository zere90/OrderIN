import { useState } from 'react';
import { useApp, AppHeader } from '../App';

function AICard({ children, skin }: { children: React.ReactNode; skin: ReturnType<typeof useApp>['skin'] }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        padding: 18,
        marginBottom: 12,
        position: 'relative',
        border: '1.5px solid transparent',
      }}
    >
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
      {children}
    </div>
  );
}

function AILabel({ skin }: { skin: ReturnType<typeof useApp>['skin'] }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 8,
        background: `linear-gradient(135deg, ${skin.accent}, ${skin.second})`,
        marginBottom: 10,
      }}
    >
      <span style={{ fontSize: 10 }}>✦</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>AI</span>
    </div>
  );
}

function GrowthTips({ skin }: { skin: ReturnType<typeof useApp>['skin'] }) {
  const tips = [
    { title: 'Акция в 15:00–17:00', reason: 'В это время заказов на 40% меньше', action: 'Создать акцию', icon: 'local_offer', impact: '+18% выручка' },
    { title: 'Комбо «Завтрак»', reason: 'Покупатели часто берут кофе + выпечку', action: 'Создать комбо', icon: 'breakfast_dining', impact: '+12% средний чек' },
    { title: 'Напомнить постоянным клиентам', reason: '7 клиентов не заказывали >2 недель', action: 'Отправить рассылку', icon: 'campaign', impact: '7 клиентов' },
  ];
  return (
    <div>
      {tips.map((tip) => (
        <AICard key={tip.title} skin={skin}>
          <div className="flex items-start gap-3">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: skin.tint,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span className="icon icon-sm" style={{ color: skin.accent }}>{tip.icon}</span>
            </div>
            <div className="flex-1">
              <AILabel skin={skin} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>{tip.title}</div>
              <div style={{ fontSize: 12, color: '#777', marginBottom: 10, lineHeight: 1.5 }}>{tip.reason}</div>
              <div className="flex items-center gap-8">
                <button
                  className="spring-btn"
                  style={{
                    padding: '7px 14px',
                    borderRadius: 10,
                    background: `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'Manrope, sans-serif',
                  }}
                >
                  {tip.action}
                </button>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: skin.second,
                    background: skin.tint,
                    padding: '4px 8px',
                    borderRadius: 8,
                  }}
                >
                  {tip.impact}
                </div>
              </div>
            </div>
          </div>
        </AICard>
      ))}
    </div>
  );
}

function CombosFeature({ skin }: { skin: ReturnType<typeof useApp>['skin'] }) {
  const [added, setAdded] = useState<string[]>([]);
  const combos = [
    { name: 'Латте + Круассан', original: 2300, combo: 1890, margin: 62, time: 'Утро 8–11', icon: 'coffee' },
    { name: 'Американо + Маффин', original: 1600, combo: 1350, margin: 58, time: 'День 12–15', icon: 'bakery_dining' },
    { name: 'Капучино × 2 + Тирамису', original: 3400, combo: 2800, margin: 55, time: 'Вечер 17–20', icon: 'local_cafe' },
  ];
  return (
    <div>
      {combos.map((c) => (
        <AICard key={c.name} skin={skin}>
          <AILabel skin={skin} />
          <div className="flex items-center gap-3 mb-3">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span className="icon" style={{ color: '#fff' }}>{c.icon}</span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{c.name}</div>
              <div style={{ fontSize: 12, color: '#888' }}>
                <s style={{ opacity: 0.5 }}>{c.original.toLocaleString('ru-KZ')} ₸</s>
                {' → '}
                <strong style={{ color: skin.accent }}>{c.combo.toLocaleString('ru-KZ')} ₸</strong>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mb-3">
            {[
              { label: `Маржа ${c.margin}%`, icon: 'trending_up' },
              { label: c.time, icon: 'schedule' },
            ].map((tag) => (
              <div
                key={tag.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  borderRadius: 8,
                  background: skin.tint,
                  fontSize: 11,
                  fontWeight: 600,
                  color: skin.accent,
                }}
              >
                <span className="icon icon-sm" style={{ fontSize: 12 }}>{tag.icon}</span>
                {tag.label}
              </div>
            ))}
          </div>
          <button
            className="w-full spring-btn"
            style={{
              padding: '10px 0',
              borderRadius: 12,
              background: added.includes(c.name) ? skin.tint : `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
              color: added.includes(c.name) ? skin.accent : '#fff',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'Manrope, sans-serif',
            }}
            onClick={() => setAdded([...added, c.name])}
          >
            {added.includes(c.name) ? '✓ Добавлено в меню' : 'Добавить в меню'}
          </button>
        </AICard>
      ))}
    </div>
  );
}

function InvoiceFeature({ skin }: { skin: ReturnType<typeof useApp>['skin'] }) {
  const [step, setStep] = useState<'camera' | 'processing' | 'result'>('camera');
  const items = [
    { name: 'Кофе Эфиопия, 1 кг', qty: '5 кг', price: '8 500 ₸', confidence: 98 },
    { name: 'Молоко, 1 л', qty: '20 л', price: '350 ₸', confidence: 95 },
    { name: 'Круассан', qty: '24 шт', price: '400 ₸', confidence: 72 },
    { name: 'Сироп ваниль???', qty: '2 бут', price: '1 200 ₸', confidence: 41 },
  ];
  return (
    <AICard skin={skin}>
      <AILabel skin={skin} />
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>Распознать накладную</div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
        Сфотографируйте бумажную накладную — AI добавит товары на склад
      </div>
      {step === 'camera' && (
        <>
          <div
            style={{
              borderRadius: 16,
              height: 140,
              background: '#1A1A1A',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 12,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 16,
                border: `2px solid ${skin.second}`,
                borderRadius: 10,
                opacity: 0.6,
              }}
            />
            <span className="icon icon-lg" style={{ color: '#fff' }}>photo_camera</span>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Наведите на накладную</div>
          </div>
          <button
            className="w-full spring-btn"
            style={{
              padding: '12px 0',
              borderRadius: 12,
              background: `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'Manrope, sans-serif',
            }}
            onClick={() => { setStep('processing'); setTimeout(() => setStep('result'), 1800); }}
          >
            Сфотографировать
          </button>
        </>
      )}
      {step === 'processing' && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              animation: 'spin 1s linear infinite',
            }}
          >
            <span className="icon" style={{ color: '#fff' }}>sync</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#444' }}>Распознаём накладную...</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>AI обрабатывает изображение</div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {step === 'result' && (
        <>
          <div style={{ marginBottom: 12 }}>
            {items.map((item) => (
              <div
                key={item.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 10,
                  marginBottom: 6,
                  background: item.confidence < 70 ? '#FEF3C7' : skin.tint,
                  border: `1px solid ${item.confidence < 70 ? '#FDE68A' : 'transparent'}`,
                }}
              >
                <span
                  className="icon icon-sm"
                  style={{ color: item.confidence < 70 ? '#F59E0B' : skin.accent, flexShrink: 0 }}
                >
                  {item.confidence < 70 ? 'warning' : 'check_circle'}
                </span>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#888' }}>{item.qty} · {item.price}</div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: item.confidence < 70 ? '#F59E0B' : skin.second,
                    flexShrink: 0,
                  }}
                >
                  {item.confidence}%
                </div>
              </div>
            ))}
          </div>
          <button
            className="w-full spring-btn"
            style={{
              padding: '12px 0',
              borderRadius: 12,
              background: `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'Manrope, sans-serif',
            }}
            onClick={() => setStep('camera')}
          >
            Добавить на склад (4 товара)
          </button>
        </>
      )}
    </AICard>
  );
}

function ExcelFeature({ skin }: { skin: ReturnType<typeof useApp>['skin'] }) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const changes = [
    { name: 'Платье Summer Rose M', change: '+12', type: 'add' },
    { name: 'Джинсы Slim L', change: '-3', type: 'remove' },
    { name: 'Блузка White S', change: '+8', type: 'add' },
    { name: 'Юбка Midi XS', change: 'НОВЫЙ', type: 'new' },
  ];
  return (
    <AICard skin={skin}>
      <AILabel skin={skin} />
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>Импорт из Excel</div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
        Загрузите остатки — AI сопоставит колонки и обновит склад
      </div>
      {step === 'upload' && (
        <button
          className="w-full spring-btn"
          style={{
            padding: '24px 0',
            borderRadius: 14,
            border: `2px dashed ${skin.accent}44`,
            background: skin.tint,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}
          onClick={() => { setStep('mapping'); setTimeout(() => setStep('preview'), 1200); }}
        >
          <span className="icon icon-lg" style={{ color: skin.accent }}>upload_file</span>
          <div style={{ fontSize: 13, fontWeight: 700, color: skin.accent }}>Загрузить Excel / CSV</div>
          <div style={{ fontSize: 11, color: '#888' }}>Нажмите для выбора файла</div>
        </button>
      )}
      {step === 'mapping' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>AI сопоставляет колонки...</div>
          <div style={{ fontSize: 12, color: '#888' }}>Название → name, Кол-во → qty, Цена → price</div>
        </div>
      )}
      {step === 'preview' && (
        <>
          <div style={{ marginBottom: 12 }}>
            {changes.map((c) => (
              <div
                key={c.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #F5F5F5',
                }}
              >
                <div style={{ fontSize: 13, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>
                  {c.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: c.type === 'remove' ? '#EF4444' : c.type === 'new' ? skin.second : '#10B981',
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: c.type === 'remove' ? '#FEE2E2' : c.type === 'new' ? skin.tint : '#D1FAE5',
                    flexShrink: 0,
                  }}
                >
                  {c.change}
                </div>
              </div>
            ))}
          </div>
          <button
            className="w-full spring-btn"
            style={{
              padding: '12px 0',
              borderRadius: 12,
              background: `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'Manrope, sans-serif',
            }}
            onClick={() => setStep('upload')}
          >
            Применить изменения
          </button>
        </>
      )}
    </AICard>
  );
}

function TryonFeature({ skin }: { skin: ReturnType<typeof useApp>['skin'] }) {
  return (
    <AICard skin={skin}>
      <AILabel skin={skin} />
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>Онлайн-примерка</div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
        Клиент вводит параметры → AI подбирает размер. Отправьте ссылку в WhatsApp/Instagram.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Запросов', value: '47', icon: 'straighten' },
          { label: 'Точность', value: '94%', icon: 'verified' },
          { label: 'Конверсия', value: '38%', icon: 'shopping_bag' },
          { label: 'Возвраты', value: '-12%', icon: 'undo' },
        ].map((s) => (
          <div key={s.label} style={{ padding: '12px', borderRadius: 14, background: skin.tint }}>
            <span className="icon icon-sm" style={{ color: skin.accent }}>{s.icon}</span>
            <div className="font-display" style={{ fontSize: 20, fontWeight: 800, color: skin.accent, marginTop: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#777', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <button
        className="w-full spring-btn"
        style={{
          padding: '12px 0',
          borderRadius: 12,
          background: `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: 'Manrope, sans-serif',
        }}
      >
        Скопировать ссылку для клиента
      </button>
    </AICard>
  );
}

function BeautyFeature({ skin }: { skin: ReturnType<typeof useApp>['skin'] }) {
  const materials = [
    { name: 'Гель-лак #27', used: 12, unit: 'мл', forecast: 18, low: true },
    { name: 'Акрил прозрачный', used: 8, unit: 'г', forecast: 10, low: false },
    { name: 'Маска для лица', used: 6, unit: 'шт', forecast: 9, low: true },
  ];
  return (
    <AICard skin={skin}>
      <AILabel skin={skin} />
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>Материалы и записи</div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
        AI прогнозирует расход материалов на основе записей следующей недели
      </div>
      {materials.map((m) => (
        <div
          key={m.name}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px',
            borderRadius: 12,
            background: m.low ? '#FEF3C7' : skin.tint,
            marginBottom: 8,
          }}
        >
          <span className="icon icon-sm" style={{ color: m.low ? '#F59E0B' : skin.accent }}>
            {m.low ? 'warning' : 'inventory_2'}
          </span>
          <div className="flex-1">
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{m.name}</div>
            <div style={{ fontSize: 11, color: '#777' }}>
              Использовано: {m.used}{m.unit} · Прогноз: {m.forecast}{m.unit}
            </div>
          </div>
          {m.low && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', flexShrink: 0 }}>Заказать</span>
          )}
        </div>
      ))}
    </AICard>
  );
}

function OrderFromChatFeature({ skin }: { skin: ReturnType<typeof useApp>['skin'] }) {
  return (
    <AICard skin={skin}>
      <AILabel skin={skin} />
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>Заказ из чата</div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
        AI автоматически распознаёт заказы в WhatsApp и Instagram и создаёт их в системе
      </div>
      <div className="flex flex-col gap-3">
        {[
          { msg: 'Мне 2 эклера и медовик', result: 'Эклер ×2 + Медовик ×1 · 3 200 ₸', time: '14:23' },
          { msg: 'Возьму ассорти из 10 штук', result: 'Ассорти мини ×10 · 4 500 ₸', time: '13:45' },
        ].map((ex) => (
          <div
            key={ex.msg}
            style={{ borderRadius: 14, background: skin.tint, padding: '12px 14px' }}
          >
            <div style={{ fontSize: 12, color: '#777', marginBottom: 4 }}>
              <span style={{ color: '#25D366', fontWeight: 700 }}>WA</span> · {ex.time}
            </div>
            <div style={{ fontSize: 13, fontStyle: 'italic', color: '#444', marginBottom: 8 }}>
              «{ex.msg}»
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 10,
                background: '#fff',
              }}
            >
              <span className="icon icon-sm" style={{ color: skin.accent, fontSize: 14 }}>check_circle</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: skin.accent }}>{ex.result}</span>
            </div>
          </div>
        ))}
      </div>
    </AICard>
  );
}

const FEATURE_COMPONENTS: Record<string, React.ComponentType<{ skin: ReturnType<typeof useApp>['skin'] }>> = {
  'Выгодные комбо': CombosFeature,
  'Распознавание накладной': InvoiceFeature,
  'Импорт из Excel': ExcelFeature,
  'Онлайн-примерка': TryonFeature,
  'Материалы и записи': BeautyFeature,
  'Заказ из чата': OrderFromChatFeature,
};

export default function AIScreen() {
  const { skin } = useApp();
  const MainFeature = FEATURE_COMPONENTS[skin.aiFeature] ?? GrowthTips;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <AppHeader title={`AI · ${skin.name}`} subtitle={skin.aiFeature} />

      <div className="flex-1 overflow-y-auto hide-scroll" style={{ padding: '12px 16px 24px' }}>
        {/* Primary AI feature for this business type */}
        <MainFeature skin={skin} />

        {/* Growth tips always shown */}
        <div style={{ fontSize: 11, color: '#999', fontWeight: 700, letterSpacing: 0.4, marginBottom: 10, marginTop: 4 }}>
          СОВЕТЫ ДЛЯ РОСТА
        </div>
        <GrowthTips skin={skin} />
      </div>
    </div>
  );
}
