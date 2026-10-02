import { useApp } from '../App';
import { skinMap, ownerBusinesses, skins } from '../theme';

export default function BusinessSwitcher() {
  const { skin, skinId, setSkinId, setShowSwitcher, setRootScreen } = useApp();

  const handleSelect = (id: string) => {
    if (id !== skinId) {
      setSkinId(id);
      setRootScreen('app');
    }
    setShowSwitcher(false);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="absolute inset-0 sheet-overlay"
        style={{ background: 'rgba(0,0,0,0.45)', zIndex: 100 }}
        onClick={() => setShowSwitcher(false)}
      />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 slide-up"
        style={{
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          zIndex: 101,
          paddingBottom: 'env(safe-area-inset-bottom)',
          maxHeight: '85dvh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E0E0E0' }} />
        </div>

        <div style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 8 }}>
          <div className="font-display" style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>
            Мои бизнесы
          </div>
        </div>

        <div className="overflow-y-auto hide-scroll flex-1" style={{ padding: '0 12px' }}>
          {ownerBusinesses.map((biz) => {
            const s = skinMap[biz.skinId];
            const isActive = biz.skinId === skinId;
            return (
              <button
                key={biz.skinId}
                className="w-full spring-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 10px',
                  borderRadius: 16,
                  background: isActive ? s.tint : 'transparent',
                  marginBottom: 4,
                }}
                onClick={() => handleSelect(biz.skinId)}
              >
                {/* Color stripe */}
                <div
                  style={{
                    width: 4,
                    height: 40,
                    borderRadius: 2,
                    background: `linear-gradient(180deg, ${s.accent}, ${s.second})`,
                    flexShrink: 0,
                  }}
                />

                {/* Logo */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: s.tint,
                    border: `2px solid ${s.accent}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Unbounded, sans-serif',
                    fontSize: 11,
                    fontWeight: 700,
                    color: s.accent,
                    flexShrink: 0,
                  }}
                >
                  {s.initials}
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{s.businessType}</div>
                </div>

                {/* Revenue + unread */}
                <div className="text-right flex-shrink-0">
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.accent }}>{biz.revenue}</div>
                  {biz.unread > 0 && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#EF4444',
                        color: '#fff',
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '1px 6px',
                        marginTop: 2,
                      }}
                    >
                      {biz.unread} новых
                    </div>
                  )}
                </div>

                {isActive && (
                  <span className="icon icon-sm" style={{ color: s.accent, flexShrink: 0 }}>
                    check_circle
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #F0F0F0' }}>
          <button
            className="w-full spring-btn flex items-center gap-3"
            style={{
              padding: '12px 16px',
              borderRadius: 14,
              background: skin.tint,
              marginBottom: 8,
            }}
            onClick={() => {
              setShowSwitcher(false);
              setRootScreen('onboarding');
            }}
          >
            <span className="icon icon-sm" style={{ color: skin.accent }}>add_business</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: skin.accent }}>+ Добавить бизнес</span>
          </button>
          <button
            className="w-full spring-btn flex items-center gap-3"
            style={{ padding: '12px 16px', borderRadius: 14 }}
            onClick={() => setShowSwitcher(false)}
          >
            <span className="icon icon-sm" style={{ color: '#888' }}>manage_accounts</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#555' }}>Профиль и настройки</span>
          </button>
        </div>
      </div>
    </>
  );
}
