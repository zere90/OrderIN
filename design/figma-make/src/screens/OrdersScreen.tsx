import { useState } from 'react';
import { useApp, AppHeader } from '../App';

type OrderStatus = 'pending' | 'sent' | 'paid' | 'done';

interface Order {
  id: string;
  customer: string;
  channel: 'whatsapp' | 'instagram';
  items: string;
  total: number;
  date: string;
  status: OrderStatus;
}

const ORDERS: Order[] = [
  { id: 'o1', customer: 'Дана Сейткали', channel: 'whatsapp', items: 'Латте ×2, Круассан ×1', total: 2300, date: 'Сегодня, 10:42', status: 'sent' },
  { id: 'o2', customer: 'Aisha_kz', channel: 'instagram', items: 'Платье Summer Rose, M', total: 14500, date: 'Сегодня, 09:15', status: 'pending' },
  { id: 'o3', customer: 'Мади Ержанов', channel: 'whatsapp', items: 'Хлеб пшеничный ×3', total: 1800, date: 'Вчера, 18:30', status: 'paid' },
  { id: 'o4', customer: 'Saltanat_beauty', channel: 'instagram', items: 'Маникюр + гель-лак', total: 4500, date: 'Вчера, 14:00', status: 'done' },
  { id: 'o5', customer: 'Нурлан К.', channel: 'whatsapp', items: 'Капучино ×4, Торт', total: 5600, date: 'Вчера, 11:20', status: 'paid' },
];

type TabFilter = 'pending' | 'paid' | 'done';

const STATUS_MAP: Record<OrderStatus, { label: string; color: string; bg: string; step: number }> = {
  pending: { label: 'Ждёт оплаты', color: '#F59E0B', bg: '#FEF3C7', step: 1 },
  sent: { label: 'Ссылка отправлена', color: '#3B82F6', bg: '#DBEAFE', step: 2 },
  paid: { label: 'Оплачен', color: '#10B981', bg: '#D1FAE5', step: 3 },
  done: { label: 'Выдан', color: '#6B7280', bg: '#F3F4F6', step: 4 },
};

const TIMELINE = ['Заказ', 'Ссылка отправлена', 'Оплачено', 'Выдано'];

function OrderDetail({ order, onBack }: { order: Order; onBack: () => void }) {
  const { skin, showToast } = useApp();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const statusInfo = STATUS_MAP[status];
  const step = statusInfo.step;

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: skin.bg }}>
      <AppHeader title={`Заказ #${order.id.toUpperCase()}`} subtitle={order.date} back={onBack} />

      <div className="flex-1 overflow-y-auto hide-scroll" style={{ padding: '16px' }}>
        {/* Status badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 10,
            background: statusInfo.bg,
            marginBottom: 16,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusInfo.color }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: statusInfo.color }}>{statusInfo.label}</span>
        </div>

        {/* Timeline */}
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: 18,
            marginBottom: 12,
            border: '1.5px solid #F0F0F0',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#999', marginBottom: 14, letterSpacing: 0.4 }}>
            СТАТУС ЗАКАЗА
          </div>
          {TIMELINE.map((t, i) => {
            const done = i < step;
            const current = i === step - 1;
            return (
              <div key={t} className="flex items-start gap-3" style={{ marginBottom: i < TIMELINE.length - 1 ? 0 : 0 }}>
                <div className="flex flex-col items-center" style={{ width: 20, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: done
                        ? current
                          ? `linear-gradient(140deg, ${skin.accent}, ${skin.second})`
                          : skin.tint
                        : '#F0F0F0',
                      border: done ? `none` : '2px solid #E0E0E0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {done && (
                      <span className="icon" style={{ fontSize: 12, color: current ? '#fff' : skin.accent }}>
                        check
                      </span>
                    )}
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div
                      style={{
                        width: 2,
                        height: 20,
                        background: i < step - 1 ? skin.second + '88' : '#E8E8E8',
                        margin: '3px 0',
                      }}
                    />
                  )}
                </div>
                <div style={{ paddingTop: 1, paddingBottom: i < TIMELINE.length - 1 ? 16 : 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: done ? 700 : 500,
                      color: done ? (current ? skin.accent : '#333') : '#BBBBBB',
                    }}
                  >
                    {t}
                  </div>
                  {current && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{order.date}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order info */}
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: 18,
            marginBottom: 12,
            border: '1.5px solid #F0F0F0',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#999', marginBottom: 12, letterSpacing: 0.4 }}>ДЕТАЛИ</div>
          {[
            { label: 'Клиент', value: order.customer },
            { label: 'Канал', value: order.channel === 'whatsapp' ? 'WhatsApp' : 'Instagram' },
            { label: 'Товары', value: order.items },
            { label: 'Итого', value: `${order.total.toLocaleString('ru-KZ')} ₸` },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #F8F8F8',
                fontSize: 14,
              }}
            >
              <span style={{ color: '#888', fontWeight: 500 }}>{row.label}</span>
              <span style={{ fontWeight: 700, color: row.label === 'Итого' ? skin.accent : '#1A1A1A' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        {status !== 'done' && (
          <div className="flex flex-col gap-3">
            {status === 'pending' && (
              <button
                className="w-full spring-btn"
                style={{
                  padding: '14px 0',
                  borderRadius: 14,
                  background: `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: 'Manrope, sans-serif',
                }}
                onClick={() => { setStatus('sent'); showToast('Kaspi-ссылка отправлена!'); }}
              >
                Отправить Kaspi-ссылку
              </button>
            )}
            {status === 'sent' && (
              <button
                className="w-full spring-btn"
                style={{
                  padding: '14px 0',
                  borderRadius: 14,
                  background: '#10B981',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: 'Manrope, sans-serif',
                }}
                onClick={() => { setStatus('paid'); showToast('Оплата получена!'); }}
              >
                Отметить как оплаченный
              </button>
            )}
            {status === 'paid' && (
              <button
                className="w-full spring-btn"
                style={{
                  padding: '14px 0',
                  borderRadius: 14,
                  background: '#6B7280',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: 'Manrope, sans-serif',
                }}
                onClick={() => { setStatus('done'); showToast('Заказ выдан!'); }}
              >
                Отметить как выданный
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersScreen() {
  const { skin } = useApp();
  const [tab, setTab] = useState<TabFilter>('pending');
  const [openOrder, setOpenOrder] = useState<Order | null>(null);

  if (openOrder) {
    return <OrderDetail order={openOrder} onBack={() => setOpenOrder(null)} />;
  }

  const filtered = ORDERS.filter((o) => {
    if (tab === 'pending') return o.status === 'pending' || o.status === 'sent';
    if (tab === 'paid') return o.status === 'paid';
    if (tab === 'done') return o.status === 'done';
    return true;
  });

  const TABS: { id: TabFilter; label: string; count: number }[] = [
    { id: 'pending', label: 'Ждут оплаты', count: ORDERS.filter((o) => o.status === 'pending' || o.status === 'sent').length },
    { id: 'paid', label: 'Оплачены', count: ORDERS.filter((o) => o.status === 'paid').length },
    { id: 'done', label: 'Выполнены', count: ORDERS.filter((o) => o.status === 'done').length },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <AppHeader title="Заказы" subtitle={`${skin.name}`} />

      {/* Segmented control */}
      <div
        style={{
          padding: '0 16px 12px',
          display: 'flex',
          gap: 4,
          background: skin.bg,
          flexShrink: 0,
          borderBottom: '1px solid #F0F0F0',
        }}
      >
        <div
          style={{
            display: 'flex',
            background: skin.tint,
            borderRadius: 12,
            padding: 3,
            flex: 1,
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              className="spring-btn flex-1"
              style={{
                padding: '7px 4px',
                borderRadius: 9,
                background: tab === t.id ? '#fff' : 'transparent',
                fontSize: 11,
                fontWeight: 700,
                color: tab === t.id ? skin.accent : '#999',
                fontFamily: 'Manrope, sans-serif',
                boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  style={{
                    background: tab === t.id ? skin.accent : '#D0D0D0',
                    color: '#fff',
                    borderRadius: 10,
                    padding: '1px 5px',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scroll" style={{ padding: '12px 16px' }}>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center" style={{ paddingTop: 60 }}>
            <span className="icon icon-xl" style={{ color: '#D0D0D0', marginBottom: 12 }}>receipt_long</span>
            <div style={{ color: '#AAA', fontSize: 14 }}>Нет заказов</div>
          </div>
        )}
        {filtered.map((order) => {
          const s = STATUS_MAP[order.status];
          return (
            <button
              key={order.id}
              className="w-full spring-btn text-left"
              style={{
                background: '#fff',
                borderRadius: 18,
                padding: '14px 16px',
                marginBottom: 10,
                border: '1.5px solid #F0F0F0',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
              onClick={() => setOpenOrder(order)}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: s.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span className="icon icon-sm" style={{ color: s.color }}>receipt_long</span>
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{order.customer}</div>
                  <div className="font-display" style={{ fontSize: 13, fontWeight: 700, color: skin.accent }}>
                    {order.total.toLocaleString('ru-KZ')} ₸
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                  {order.items}
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: s.bg,
                  }}
                >
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: s.color }}>{s.label}</span>
                </div>
              </div>
              <span className="icon icon-sm" style={{ color: '#D0D0D0', flexShrink: 0 }}>chevron_right</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
