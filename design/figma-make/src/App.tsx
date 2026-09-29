import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Skin, skinMap, ownerBusinesses, ownerName } from './theme';
import OnboardingScreen from './screens/OnboardingScreen';
import TodayScreen from './screens/TodayScreen';
import ChatsScreen from './screens/ChatsScreen';
import OrdersScreen from './screens/OrdersScreen';
import AIScreen from './screens/AIScreen';
import StockScreen from './screens/StockScreen';
import SkinsOverview from './screens/SkinsOverview';
import BusinessSwitcher from './components/BusinessSwitcher';

export type RootScreen = 'onboarding' | 'app' | 'skins-overview';
export type AppTab = 'today' | 'chats' | 'orders' | 'ai' | 'stock';
export type SubScreen = 'chat-detail' | 'order-detail' | 'tryon' | null;

interface AppCtx {
  skin: Skin;
  skinId: string;
  setSkinId: (id: string) => void;
  rootScreen: RootScreen;
  setRootScreen: (s: RootScreen) => void;
  tab: AppTab;
  setTab: (t: AppTab) => void;
  subScreen: SubScreen;
  setSubScreen: (s: SubScreen) => void;
  subScreenData: Record<string, unknown>;
  setSubScreenData: (d: Record<string, unknown>) => void;
  showSwitcher: boolean;
  setShowSwitcher: (v: boolean) => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppCtx>(null as unknown as AppCtx);
export const useApp = () => useContext(AppContext);

function Toast({ msg }: { msg: string; skin: Skin }) {
  return (
    <div className="fixed inset-0 flex items-end justify-center pointer-events-none" style={{ zIndex: 9999 }}>
      <div className="mb-24 px-5 py-3 rounded-2xl bg-gray-900 text-white text-sm font-medium shadow-lg fade-in" style={{ fontFamily: 'Manrope, sans-serif' }}>
        {msg}
      </div>
    </div>
  );
}

const TABS: { id: AppTab; label: string; icon: string }[] = [
  { id: 'chats', label: 'Чаты', icon: 'chat_bubble' },
  { id: 'orders', label: 'Заказы', icon: 'receipt_long' },
  { id: 'ai', label: 'AI', icon: 'auto_awesome' },
  { id: 'stock', label: 'Склад', icon: 'inventory_2' },
  { id: 'today', label: 'Сегодня', icon: 'home' },
];

function BottomTabBar() {
  const { skin, tab, setTab, subScreen, setSubScreen } = useApp();

  const handleTab = (t: AppTab) => {
    setSubScreen(null);
    setTab(t);
  };

  if (subScreen) return null;

  return (
    <div
      className="flex-shrink-0"
      style={{
        background: '#fff',
        borderTop: '1px solid rgba(0,0,0,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-end justify-around px-2" style={{ height: 64 }}>
        {(['chats', 'orders'] as AppTab[]).map((t) => {
          const item = TABS.find((x) => x.id === t)!;
          const active = tab === t;
          return (
            <button
              key={t}
              className="flex flex-col items-center gap-0.5 flex-1 spring-btn"
              style={{ paddingBottom: 6, paddingTop: 8 }}
              onClick={() => handleTab(t)}
            >
              <span
                className="icon icon-sm"
                style={{
                  color: active ? skin.accent : '#B0AEAE',
                  fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {item.icon}
              </span>
              <span
                className="text-center"
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: active ? skin.accent : '#B0AEAE',
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Raised AI center button */}
        <button
          className="flex flex-col items-center justify-center spring-btn"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: `linear-gradient(140deg, ${skin.accent} 0%, ${skin.second} 100%)`,
            boxShadow: `0 4px 16px ${skin.accent}55`,
            marginBottom: 8,
            flexShrink: 0,
          }}
          onClick={() => handleTab('ai')}
        >
          <span className="icon icon-sm" style={{ color: '#fff' }}>
            auto_awesome
          </span>
        </button>

        {(['stock', 'today'] as AppTab[]).map((t) => {
          const item = TABS.find((x) => x.id === t)!;
          const active = tab === t;
          return (
            <button
              key={t}
              className="flex flex-col items-center gap-0.5 flex-1 spring-btn"
              style={{ paddingBottom: 6, paddingTop: 8 }}
              onClick={() => handleTab(t)}
            >
              <span
                className="icon icon-sm"
                style={{
                  color: active ? skin.accent : '#B0AEAE',
                  fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {item.icon}
              </span>
              <span
                className="text-center"
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: active ? skin.accent : '#B0AEAE',
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AppHeader({ title, subtitle, back }: { title?: string; subtitle?: string; back?: () => void }) {
  const { skin, setShowSwitcher, rootScreen, setRootScreen } = useApp();
  const bizCount = ownerBusinesses.filter((b) => b.skinId !== skin.id);
  const hasUnread = bizCount.some((b) => b.unread > 0);

  return (
    <div
      className="flex-shrink-0 flex items-center justify-between px-5"
      style={{
        paddingTop: `calc(env(safe-area-inset-top) + 16px)`,
        paddingBottom: 12,
        background: skin.bg,
      }}
    >
      <div className="flex items-center gap-3">
        {back && (
          <button onClick={back} className="spring-btn" style={{ color: skin.accent }}>
            <span className="icon">arrow_back</span>
          </button>
        )}
        <div>
          {title && (
            <div className="font-display" style={{ fontSize: 14, fontWeight: 700, color: skin.accent }}>
              {title}
            </div>
          )}
          {subtitle && (
            <div style={{ fontSize: 12, color: '#888', fontWeight: 500, marginTop: 1 }}>{subtitle}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {rootScreen === 'app' && (
          <button
            className="spring-btn"
            onClick={() => setRootScreen('skins-overview')}
            style={{ fontSize: 11, color: '#999', fontWeight: 600, paddingRight: 4 }}
          >
            Все скины
          </button>
        )}
        <button
          className="relative spring-btn"
          onClick={() => setShowSwitcher(true)}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: `2.5px solid ${skin.accent}`,
              background: skin.tint,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Unbounded, sans-serif',
              fontSize: 11,
              fontWeight: 700,
              color: skin.accent,
            }}
          >
            {skin.initials}
          </div>
          {hasUnread && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#EF4444',
                border: '2px solid #fff',
              }}
            />
          )}
        </button>
      </div>
    </div>
  );
}

function MainApp() {
  const { skin, tab, subScreen } = useApp();

  return (
    <div
      className="flex flex-col"
      style={{
        flex: 1,
        minHeight: 0,
        background: skin.bg,
        overflow: 'hidden',
      }}
    >
      {/* Screen content */}
      <div className="flex flex-col flex-1 min-h-0">
        {tab === 'today' && <TodayScreen />}
        {tab === 'chats' && <ChatsScreen />}
        {tab === 'orders' && <OrdersScreen />}
        {tab === 'ai' && <AIScreen />}
        {tab === 'stock' && <StockScreen />}
      </div>

      {/* Bottom tab bar */}
      {subScreen === null && <BottomTabBar />}
    </div>
  );
}

export default function App() {
  const [skinId, setSkinIdRaw] = useState('kofe');
  const [rootScreen, setRootScreen] = useState<RootScreen>('onboarding');
  const [tab, setTab] = useState<AppTab>('today');
  const [subScreen, setSubScreen] = useState<SubScreen>(null);
  const [subScreenData, setSubScreenData] = useState<Record<string, unknown>>({});
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const setSkinId = useCallback(
    (id: string) => {
      setSkinIdRaw(id);
      showToast(`Вы в ${skinMap[id]?.name}`);
    },
    [showToast]
  );

  const skin = skinMap[skinId] ?? skinMap['kofe'];

  const ctx: AppCtx = {
    skin,
    skinId,
    setSkinId,
    rootScreen,
    setRootScreen,
    tab,
    setTab,
    subScreen,
    setSubScreen,
    subScreenData,
    setSubScreenData,
    showSwitcher,
    setShowSwitcher,
    toast,
    showToast,
  };

  return (
    <AppContext.Provider value={ctx}>
      {/* Outer wrapper — fills the viewport with a neutral background */}
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: '#D0CFC8',
        }}
      >
        {/* App column — centered, 430px wide */}
        <div
          style={{
            width: '100%',
            maxWidth: 430,
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            background: skin.bg,
            boxShadow: '0 0 40px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}
        >
          {rootScreen === 'onboarding' && <OnboardingScreen />}
          {rootScreen === 'app' && <MainApp />}
          {rootScreen === 'skins-overview' && <SkinsOverview />}

          {showSwitcher && <BusinessSwitcher />}
          {toast && <Toast msg={toast} skin={skin} />}
        </div>
      </div>
    </AppContext.Provider>
  );
}
