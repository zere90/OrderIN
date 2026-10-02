import { useState } from 'react';
import { useApp, AppHeader } from '../App';
import { chatThreads, ChatThread, ownerName } from '../theme';

type Filter = 'all' | 'instagram' | 'whatsapp' | 'orders' | 'questions';

function ChatListScreen({ onOpen }: { onOpen: (t: ChatThread) => void }) {
  const { skin } = useApp();
  const [filter, setFilter] = useState<Filter>('all');

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'orders', label: 'Заказы' },
    { id: 'questions', label: 'Вопросы' },
  ];

  const filtered = chatThreads.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'instagram') return t.channel === 'instagram';
    if (filter === 'whatsapp') return t.channel === 'whatsapp';
    if (filter === 'orders') return t.hasOrder;
    if (filter === 'questions') return !t.hasOrder;
    return true;
  });

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <AppHeader title={`Чаты · ${skin.name}`} subtitle="Instagram + WhatsApp" />

      {/* Filter tabs */}
      <div
        className="flex gap-2 px-4 pb-3 overflow-x-auto hide-scroll flex-shrink-0"
        style={{ borderBottom: '1px solid #F0F0F0' }}
      >
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className="spring-btn flex-shrink-0"
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              background: filter === f.id ? skin.accent : skin.tint,
              color: filter === f.id ? '#fff' : skin.accent,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'Manrope, sans-serif',
            }}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto hide-scroll">
        {filtered.map((thread) => (
          <button
            key={thread.id}
            className="w-full spring-btn text-left"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              borderBottom: '1px solid #F8F8F8',
              background: thread.unread > 0 ? skin.tint + '55' : 'transparent',
            }}
            onClick={() => onOpen(thread)}
          >
            {/* Avatar */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: `linear-gradient(140deg, ${skin.accent}66, ${skin.second}66)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                color: skin.accent,
                flexShrink: 0,
                fontFamily: 'Unbounded, sans-serif',
                position: 'relative',
              }}
            >
              {thread.avatar}
              {/* Channel badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: thread.channel === 'whatsapp' ? '#25D366' : '#E1306C',
                  border: '2px solid #fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="icon" style={{ fontSize: 9, color: '#fff' }}>
                  {thread.channel === 'whatsapp' ? 'chat' : 'photo_camera'}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{thread.name}</div>
                <div style={{ fontSize: 11, color: '#999', flexShrink: 0 }}>{thread.time}</div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  style={{
                    fontSize: 13,
                    color: '#777',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {thread.lastMessage}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {thread.hasOrder && (
                    <div
                      style={{
                        padding: '2px 6px',
                        borderRadius: 6,
                        background: skin.second + '44',
                        fontSize: 10,
                        fontWeight: 700,
                        color: skin.accent,
                      }}
                    >
                      Заказ
                    </div>
                  )}
                  {thread.unread > 0 && (
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: skin.accent,
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {thread.unread}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatDetailScreen({ thread, onBack }: { thread: ChatThread; onBack: () => void }) {
  const { skin, setTab, showToast } = useApp();
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [kaspiSent, setKaspiSent] = useState(false);
  const [input, setInput] = useState('');

  const total = thread.orderItems?.reduce((s, i) => s + i.price * i.qty, 0) ?? 0;

  const handleConfirm = () => {
    setOrderConfirmed(true);
    setTimeout(() => {
      setKaspiSent(true);
      showToast('Kaspi-ссылка отправлена!');
    }, 800);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: skin.bg }}>
      {/* Header */}
      <AppHeader title={thread.name} subtitle={thread.channel === 'whatsapp' ? 'WhatsApp' : 'Instagram'} back={onBack} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto hide-scroll" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {thread.messages.map((msg) => {
          const isOwner = msg.from === 'owner' || msg.from === 'bot';
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isOwner ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  maxWidth: '78%',
                  padding: '10px 14px',
                  borderRadius: isOwner ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isOwner
                    ? `linear-gradient(140deg, ${skin.accent}, ${skin.second})`
                    : '#fff',
                  color: isOwner ? '#fff' : '#1A1A1A',
                  fontSize: 14,
                  lineHeight: 1.5,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                {msg.from === 'bot' && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginBottom: 3, fontWeight: 600 }}>
                    ✦ Qazyna AI
                  </div>
                )}
                {msg.text}
                <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6, textAlign: 'right' }}>{msg.time}</div>
              </div>
            </div>
          );
        })}

        {/* AI Order Card */}
        {thread.orderItems && (
          <div
            style={{
              borderRadius: 20,
              background: '#fff',
              padding: 16,
              border: `1.5px solid transparent`,
              position: 'relative',
              marginTop: 8,
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
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
                <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>AI Заказ найден</span>
              </div>
            </div>

            {/* Order items */}
            {thread.orderItems?.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: i < (thread.orderItems?.length ?? 0) - 1 ? '1px solid #F5F5F5' : 'none',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>
                  {item.name}
                </div>
                <div className="flex items-center gap-3">
                  <div style={{ fontSize: 12, color: '#999' }}>×{item.qty}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: skin.accent }}>
                    {(item.price * item.qty).toLocaleString('ru-KZ')} ₸
                  </div>
                </div>
              </div>
            ))}

            {/* Meta */}
            <div style={{ display: 'flex', gap: 12, margin: '12px 0', flexWrap: 'wrap' }}>
              {thread.orderDate && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    color: '#777',
                  }}
                >
                  <span className="icon icon-sm" style={{ color: skin.second, fontSize: 14 }}>schedule</span>
                  {thread.orderDate}
                </div>
              )}
              {thread.orderAddress && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    color: '#777',
                  }}
                >
                  <span className="icon icon-sm" style={{ color: skin.second, fontSize: 14 }}>location_on</span>
                  {thread.orderAddress}
                </div>
              )}
            </div>

            {/* Total */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderTop: '1.5px solid #F0F0F0',
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: '#555' }}>Итого</span>
              <span className="font-display" style={{ fontSize: 18, fontWeight: 800, color: skin.accent }}>
                {total.toLocaleString('ru-KZ')} ₸
              </span>
            </div>

            {kaspiSent ? (
              <div
                style={{
                  padding: '12px',
                  borderRadius: 12,
                  background: '#F0FDF4',
                  border: '1.5px solid #86EFAC',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span className="icon icon-sm" style={{ color: '#22C55E' }}>check_circle</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>Ссылка отправлена!</div>
                  <div style={{ fontSize: 11, color: '#4ADE80' }}>Ожидаем оплату от {thread.name}</div>
                </div>
                <button
                  className="ml-auto spring-btn"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 10,
                    background: '#22C55E',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'Manrope, sans-serif',
                  }}
                  onClick={() => setTab('orders')}
                >
                  К заказу →
                </button>
              </div>
            ) : (
              <button
                className="w-full spring-btn"
                style={{
                  padding: '13px 0',
                  borderRadius: 12,
                  background: orderConfirmed
                    ? '#E0E0E0'
                    : `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: 'Manrope, sans-serif',
                }}
                onClick={handleConfirm}
                disabled={orderConfirmed}
              >
                {orderConfirmed ? 'Отправляем ссылку...' : 'Подтвердить и отправить Kaspi-ссылку'}
              </button>
            )}

            {/* AI reply chips */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {['Уточнить адрес', 'Изменить время', 'Добавить позицию'].map((chip) => (
                <button
                  key={chip}
                  className="spring-btn"
                  style={{
                    padding: '5px 10px',
                    borderRadius: 8,
                    background: skin.tint,
                    color: skin.accent,
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: 'Manrope, sans-serif',
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div
        style={{
          padding: '10px 16px',
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: '#fff',
          borderTop: '1px solid #F0F0F0',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
        }}
      >
        <div
          style={{
            flex: 1,
            background: skin.tint,
            borderRadius: 20,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder="Написать..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 14,
              fontFamily: 'Manrope, sans-serif',
              color: '#1A1A1A',
            }}
          />
        </div>
        <button
          className="spring-btn"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="icon icon-sm" style={{ color: '#fff' }}>send</span>
        </button>
      </div>
    </div>
  );
}

export default function ChatsScreen() {
  const [openThread, setOpenThread] = useState<ChatThread | null>(null);

  if (openThread) {
    return <ChatDetailScreen thread={openThread} onBack={() => setOpenThread(null)} />;
  }
  return <ChatListScreen onOpen={setOpenThread} />;
}
