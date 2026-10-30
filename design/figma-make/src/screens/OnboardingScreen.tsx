import { useState } from 'react';
import { useApp } from '../App';
import { skins } from '../theme';

const BUSINESS_QUESTIONS: Record<string, { q: string; opts: string[] }[]> = {
  kofe: [
    { q: 'Сколько позиций в вашем меню?', opts: ['До 10', '10–30', 'Больше 30'] },
    { q: 'Как вы принимаете заказы?', opts: ['WhatsApp', 'Instagram', 'Оба канала'] },
  ],
  aru: [
    { q: 'Сколько SKU в вашем ассортименте?', opts: ['До 20', '20–100', 'Больше 100'] },
    { q: 'Предлагаете ли примерку?', opts: ['Да, онлайн', 'Только офлайн', 'Нет'] },
  ],
  dala: [
    { q: 'Откуда поступают товары?', opts: ['Казахстан', 'Китай', 'Смешанно'] },
    { q: 'Частота поставок?', opts: ['Ежедневно', 'Еженедельно', 'Ежемесячно'] },
  ],
  nur: [
    { q: 'Сколько мастеров у вас в команде?', opts: ['Только я', '2–5', 'Больше 5'] },
    { q: 'Как клиенты записываются?', opts: ['WhatsApp', 'Instagram DM', 'Оба'] },
  ],
  tumar: [
    { q: 'Сколько коллекций в год вы выпускаете?', opts: ['1–2', '3–4', 'Постоянно'] },
    { q: 'Как вы управляете остатками?', opts: ['Excel', 'В голове', 'Нет системы'] },
  ],
  bake: [
    { q: 'Принимаете ли предзаказы?', opts: ['Да, всегда', 'Иногда', 'Нет'] },
    { q: 'Как продаёте выпечку?', opts: ['WhatsApp', 'Instagram', 'Оба'] },
  ],
};

const STEPS = ['welcome', 'phone', 'code', 'business', 'questions', 'connect', 'upload', 'ready'];

export default function OnboardingScreen() {
  const { setSkinId, setRootScreen, skinId, skin } = useApp();
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [selectedBiz, setSelectedBiz] = useState<string | null>(null);
  const [qAnswers, setQAnswers] = useState<Record<number, number>>({});
  const [uploadChoice, setUploadChoice] = useState<string | null>(null);

  const currentSkin = selectedBiz ? skins.find((s) => s.id === selectedBiz) : null;
  const questions = selectedBiz ? (BUSINESS_QUESTIONS[selectedBiz] ?? []) : [];

  const next = () => {
    if (step === 3 && selectedBiz) {
      setSkinId(selectedBiz);
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else setRootScreen('app');
  };

  const stepName = STEPS[step];

  return (
    <div
      className="flex flex-col"
      style={{
        flex: 1,
        minHeight: '100dvh',
        background: skin.bg,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Progress bar */}
      {step > 0 && step < STEPS.length - 1 && (
        <div style={{ height: 3, background: '#F0EEE8', position: 'relative' }}>
          <div
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${skin.accent}, ${skin.second})`,
              width: `${((step) / (STEPS.length - 2)) * 100}%`,
              transition: 'width 0.35s ease',
              borderRadius: '0 2px 2px 0',
            }}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto hide-scroll" style={{ padding: '28px 24px 24px' }}>
        {/* ── Welcome ── */}
        {stepName === 'welcome' && (
          <div className="flex flex-col items-center text-center fade-in" style={{ paddingTop: 48 }}>
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: 28,
                background: `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 28,
                boxShadow: `0 12px 32px ${skin.accent}44`,
              }}
            >
              <span className="icon icon-xl" style={{ color: '#fff' }}>storefront</span>
            </div>
            <div className="font-display" style={{ fontSize: 26, fontWeight: 800, color: skin.accent, lineHeight: 1.2, marginBottom: 12 }}>
              OrderIN
            </div>
            <div style={{ fontSize: 15, color: '#555', lineHeight: 1.6, marginBottom: 8 }}>
              AI-помощник для малого бизнеса в Казахстане
            </div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 48, lineHeight: 1.6 }}>
              Заказы из чатов → Kaspi-оплата → Умный склад
            </div>
            <div className="flex gap-3 w-full" style={{ marginTop: 'auto' }}>
              {['Войти', 'Зарегистрироваться'].map((label, i) => (
                <button
                  key={label}
                  className="flex-1 spring-btn"
                  style={{
                    padding: '14px 0',
                    borderRadius: 14,
                    background: i === 0 ? `linear-gradient(140deg, ${skin.accent}, ${skin.second})` : skin.tint,
                    color: i === 0 ? '#fff' : skin.accent,
                    fontWeight: 700,
                    fontSize: 14,
                    fontFamily: 'Manrope, sans-serif',
                  }}
                  onClick={next}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Phone ── */}
        {stepName === 'phone' && (
          <div className="fade-in">
            <button onClick={() => setStep(step - 1)} style={{ color: skin.accent, marginBottom: 24 }}>
              <span className="icon">arrow_back</span>
            </button>
            <div className="font-display" style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', marginBottom: 8 }}>
              Введите номер телефона
            </div>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 28 }}>
              Пришлём SMS-код для входа
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#fff',
                border: `1.5px solid ${skin.accent}44`,
                borderRadius: 14,
                padding: '14px 16px',
                marginBottom: 24,
              }}
            >
              <span style={{ fontSize: 16 }}>🇰🇿</span>
              <span style={{ fontWeight: 700, color: '#1A1A1A' }}>+7</span>
              <input
                type="tel"
                placeholder="700 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: 16,
                  fontFamily: 'Manrope, sans-serif',
                  color: '#1A1A1A',
                  background: 'transparent',
                }}
              />
            </div>
            <button
              className="w-full spring-btn"
              style={{
                padding: '15px 0',
                borderRadius: 14,
                background: `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                fontFamily: 'Manrope, sans-serif',
              }}
              onClick={next}
            >
              Получить код
            </button>
          </div>
        )}

        {/* ── Code ── */}
        {stepName === 'code' && (
          <div className="fade-in">
            <button onClick={() => setStep(step - 1)} style={{ color: skin.accent, marginBottom: 24 }}>
              <span className="icon">arrow_back</span>
            </button>
            <div className="font-display" style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', marginBottom: 8 }}>
              Введите код из SMS
            </div>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 28 }}>
              Отправили на +7 {phone || '700 000 0000'}
            </div>
            <div className="flex gap-3 justify-center" style={{ marginBottom: 32 }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 56,
                    height: 60,
                    borderRadius: 14,
                    border: `2px solid ${i < code.length ? skin.accent : '#E0E0E0'}`,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    fontWeight: 800,
                    fontFamily: 'Unbounded, sans-serif',
                    color: skin.accent,
                  }}
                >
                  {code[i] || ''}
                </div>
              ))}
            </div>
            <input
              type="number"
              maxLength={4}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.slice(0, 4));
                if (e.target.value.length === 4) setTimeout(next, 300);
              }}
              style={{
                position: 'absolute',
                opacity: 0,
                pointerEvents: 'none',
              }}
              autoFocus
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((k, i) => (
                <button
                  key={i}
                  className="spring-btn"
                  style={{
                    height: 56,
                    borderRadius: 14,
                    background: k === null ? 'transparent' : k === 'del' ? skin.tint : '#fff',
                    border: k === null ? 'none' : `1.5px solid ${skin.tint}`,
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: 'Manrope, sans-serif',
                    color: k === 'del' ? skin.accent : '#1A1A1A',
                    visibility: k === null ? 'hidden' : 'visible',
                  }}
                  onClick={() => {
                    if (k === null) return;
                    if (k === 'del') {
                      setCode(code.slice(0, -1));
                    } else if (code.length < 4) {
                      const newCode = code + k;
                      setCode(newCode);
                      if (newCode.length === 4) setTimeout(next, 300);
                    }
                  }}
                >
                  {k === 'del' ? '⌫' : k}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Business type ── */}
        {stepName === 'business' && (
          <div className="fade-in">
            <div className="font-display" style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', marginBottom: 6, lineHeight: 1.3 }}>
              Какой у вас бизнес?
            </div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
              Настроим OrderIN под ваши задачи
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {skins.map((s) => {
                const selected = selectedBiz === s.id;
                return (
                  <button
                    key={s.id}
                    className="spring-btn text-left"
                    style={{
                      padding: '16px 14px',
                      borderRadius: 20,
                      border: `2px solid ${selected ? s.accent : 'transparent'}`,
                      background: selected
                        ? `linear-gradient(140deg, ${s.tint}, #fff)`
                        : '#fff',
                      boxShadow: selected ? `0 4px 16px ${s.accent}22` : '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                    onClick={() => setSelectedBiz(s.id)}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: `linear-gradient(140deg, ${s.accent}, ${s.second})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10,
                      }}
                    >
                      <span className="icon icon-sm" style={{ color: '#fff' }}>{s.icon}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 2 }}>{s.businessType}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', lineHeight: 1.2 }}>{s.name}</div>
                    <div
                      style={{
                        display: 'inline-block',
                        marginTop: 6,
                        padding: '2px 7px',
                        borderRadius: 6,
                        background: s.tint,
                        fontSize: 10,
                        color: s.accent,
                        fontWeight: 600,
                      }}
                    >
                      {s.aiFeature}
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              className="w-full spring-btn"
              style={{
                padding: '15px 0',
                borderRadius: 14,
                background: selectedBiz
                  ? `linear-gradient(140deg, ${currentSkin?.accent}, ${currentSkin?.second})`
                  : '#E0E0E0',
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                fontFamily: 'Manrope, sans-serif',
                opacity: selectedBiz ? 1 : 0.6,
              }}
              disabled={!selectedBiz}
              onClick={next}
            >
              Продолжить
            </button>
          </div>
        )}

        {/* ── Questions ── */}
        {stepName === 'questions' && currentSkin && (
          <div className="fade-in">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 8,
                background: currentSkin.tint,
                marginBottom: 20,
              }}
            >
              <span className="icon icon-sm" style={{ color: currentSkin.accent }}>{currentSkin.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: currentSkin.accent }}>{currentSkin.name}</span>
            </div>
            <div className="font-display" style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', marginBottom: 24, lineHeight: 1.3 }}>
              Расскажите о бизнесе
            </div>
            {questions.map((q, qi) => (
              <div key={qi} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 10 }}>{q.q}</div>
                <div className="flex flex-col gap-2">
                  {q.opts.map((opt, oi) => (
                    <button
                      key={oi}
                      className="spring-btn text-left"
                      style={{
                        padding: '12px 16px',
                        borderRadius: 12,
                        border: `1.5px solid ${qAnswers[qi] === oi ? currentSkin.accent : '#E8E8E8'}`,
                        background: qAnswers[qi] === oi ? currentSkin.tint : '#fff',
                        fontSize: 14,
                        fontWeight: 500,
                        color: qAnswers[qi] === oi ? currentSkin.accent : '#555',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                      onClick={() => setQAnswers({ ...qAnswers, [qi]: oi })}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          border: `2px solid ${qAnswers[qi] === oi ? currentSkin.accent : '#D0D0D0'}`,
                          background: qAnswers[qi] === oi ? currentSkin.accent : 'transparent',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {qAnswers[qi] === oi && (
                          <span className="icon" style={{ fontSize: 11, color: '#fff' }}>check</span>
                        )}
                      </div>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              className="w-full spring-btn"
              style={{
                padding: '15px 0',
                borderRadius: 14,
                background: `linear-gradient(140deg, ${currentSkin.accent}, ${currentSkin.second})`,
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                fontFamily: 'Manrope, sans-serif',
              }}
              onClick={next}
            >
              Далее
            </button>
          </div>
        )}

        {/* ── Connect ── */}
        {stepName === 'connect' && (
          <div className="fade-in">
            <div className="font-display" style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', marginBottom: 6 }}>
              Подключите каналы
            </div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
              OrderIN будет принимать заказы из чатов автоматически
            </div>
            {[
              { label: 'Instagram', icon: 'photo_camera', color: '#E1306C', sub: 'Direct-сообщения' },
              { label: 'WhatsApp', icon: 'chat', color: '#25D366', sub: 'Бизнес-аккаунт' },
              { label: 'Kaspi Pay', icon: 'payments', color: '#F04E23', sub: 'Ссылки на оплату' },
            ].map((ch) => (
              <div
                key={ch.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 16,
                  background: '#fff',
                  marginBottom: 10,
                  border: '1.5px solid #F0F0F0',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: ch.color + '18',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span className="icon" style={{ color: ch.color }}>{ch.icon}</span>
                </div>
                <div className="flex-1">
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{ch.label}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{ch.sub}</div>
                </div>
                <button
                  className="spring-btn"
                  style={{
                    padding: '6px 14px',
                    borderRadius: 10,
                    background: skin.tint,
                    color: skin.accent,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'Manrope, sans-serif',
                  }}
                >
                  Войти
                </button>
              </div>
            ))}
            <button
              className="w-full spring-btn"
              style={{
                padding: '15px 0',
                borderRadius: 14,
                background: `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                marginTop: 16,
                fontFamily: 'Manrope, sans-serif',
              }}
              onClick={next}
            >
              Продолжить
            </button>
          </div>
        )}

        {/* ── Upload ── */}
        {stepName === 'upload' && (
          <div className="fade-in">
            <div className="font-display" style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', marginBottom: 6 }}>
              Загрузите {skin.stockLabel.toLowerCase()}
            </div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
              OrderIN добавит их на склад автоматически
            </div>
            {[
              { label: 'Сфотографировать накладную', icon: 'photo_camera', sub: 'AI распознает и добавит товары' },
              { label: 'Загрузить Excel', icon: 'table_view', sub: 'CSV или XLSX файл' },
              { label: 'Добавить вручную', icon: 'edit', sub: 'Добавить каждый товар по одному' },
            ].map((opt) => (
              <button
                key={opt.label}
                className="w-full spring-btn text-left"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 16,
                  background: uploadChoice === opt.label ? skin.tint : '#fff',
                  marginBottom: 10,
                  border: `1.5px solid ${uploadChoice === opt.label ? skin.accent : '#F0F0F0'}`,
                }}
                onClick={() => setUploadChoice(opt.label)}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: uploadChoice === opt.label
                      ? `linear-gradient(140deg, ${skin.accent}, ${skin.second})`
                      : skin.tint,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span className="icon" style={{ color: uploadChoice === opt.label ? '#fff' : skin.accent }}>{opt.icon}</span>
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
                padding: '15px 0',
                borderRadius: 14,
                background: `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                marginTop: 16,
                fontFamily: 'Manrope, sans-serif',
              }}
              onClick={next}
            >
              Продолжить
            </button>
          </div>
        )}

        {/* ── Ready ── */}
        {stepName === 'ready' && (
          <div className="flex flex-col items-center text-center fade-in" style={{ paddingTop: 40 }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 32,
                background: `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 28,
                boxShadow: `0 12px 36px ${skin.accent}44`,
              }}
            >
              <span className="icon icon-xl" style={{ color: '#fff' }}>check_circle</span>
            </div>
            <div className="font-display" style={{ fontSize: 22, fontWeight: 800, color: skin.accent, marginBottom: 12 }}>
              OrderIN готов!
            </div>
            <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 8 }}>
              Настроена под <strong>{skin.name}</strong>
            </div>
            <div style={{ fontSize: 13, color: '#888', lineHeight: 1.7, marginBottom: 48 }}>
              Принимаем заказы из WhatsApp и Instagram.{'\n'}
              Kaspi-ссылки отправляются автоматически.{'\n'}
              Склад обновляется в реальном времени.
            </div>
            <button
              className="w-full spring-btn"
              style={{
                padding: '16px 0',
                borderRadius: 14,
                background: `linear-gradient(140deg, ${skin.accent}, ${skin.second})`,
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                fontFamily: 'Manrope, sans-serif',
                boxShadow: `0 6px 20px ${skin.accent}44`,
              }}
              onClick={() => setRootScreen('app')}
            >
              Начать работу →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
