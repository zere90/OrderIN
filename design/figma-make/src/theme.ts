export interface Skin {
  id: string;
  name: string;
  businessType: string;
  accent: string;
  second: string;
  tint: string;
  bg: string;
  stockLabel: string;
  aiFeature: string;
  icon: string;
  initials: string;
}

export const skins: Skin[] = [
  {
    id: 'kofe',
    name: 'Kofe Tau',
    businessType: 'Кофейня',
    accent: '#4A2C1D',
    second: '#E39A55',
    tint: '#F6ECE2',
    bg: '#FBF7F2',
    stockLabel: 'Меню и ингредиенты',
    aiFeature: 'Выгодные комбо',
    icon: 'coffee',
    initials: 'KT',
  },
  {
    id: 'aru',
    name: 'Aru Style',
    businessType: 'Одежда',
    accent: '#1E1B22',
    second: '#F0A6BE',
    tint: '#F7EEF1',
    bg: '#FBF8F9',
    stockLabel: 'Товары, размеры, цвета',
    aiFeature: 'Онлайн-примерка',
    icon: 'checkroom',
    initials: 'AS',
  },
  {
    id: 'dala',
    name: 'Dala Market',
    businessType: 'Магазин',
    accent: '#4E7D5E',
    second: '#BCD9A8',
    tint: '#EDF5EA',
    bg: '#F9FBF7',
    stockLabel: 'Товары и поставки',
    aiFeature: 'Распознавание накладной',
    icon: 'storefront',
    initials: 'DM',
  },
  {
    id: 'nur',
    name: 'Nur Beauty',
    businessType: 'Студия красоты',
    accent: '#6D5A96',
    second: '#F2C1AA',
    tint: '#F1EEF8',
    bg: '#FAF9FC',
    stockLabel: 'Услуги и материалы',
    aiFeature: 'Материалы и записи',
    icon: 'spa',
    initials: 'NB',
  },
  {
    id: 'tumar',
    name: 'Tumar',
    businessType: 'Маленький бренд',
    accent: '#46639A',
    second: '#B5CDEE',
    tint: '#EDF2FA',
    bg: '#F8FAFD',
    stockLabel: 'Коллекции и варианты',
    aiFeature: 'Импорт из Excel',
    icon: 'style',
    initials: 'TU',
  },
  {
    id: 'bake',
    name: 'Bake by Aziza',
    businessType: 'Выпечка на дому',
    accent: '#B9313A',
    second: '#FFC978',
    tint: '#FCEEEA',
    bg: '#FDF8F5',
    stockLabel: 'Изделия и продукты',
    aiFeature: 'Заказ из чата',
    icon: 'cake',
    initials: 'BA',
  },
];

export const skinMap: Record<string, Skin> = Object.fromEntries(skins.map(s => [s.id, s]));

export const ownerName = 'Aziza';

export const ownerBusinesses = [
  { skinId: 'kofe', revenue: '47 300 ₸', unread: 3 },
  { skinId: 'aru', revenue: '89 500 ₸', unread: 0 },
  { skinId: 'bake', revenue: '23 100 ₸', unread: 1 },
];

export interface ChatMessage {
  id: string;
  from: 'customer' | 'bot' | 'owner';
  text: string;
  time: string;
  channel?: 'instagram' | 'whatsapp';
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface ChatThread {
  id: string;
  name: string;
  avatar: string;
  channel: 'instagram' | 'whatsapp';
  lastMessage: string;
  time: string;
  unread: number;
  hasOrder: boolean;
  messages: ChatMessage[];
  orderItems?: OrderItem[];
  orderAddress?: string;
  orderDate?: string;
}

export const chatThreads: ChatThread[] = [
  {
    id: 'c1',
    name: 'Дана Сейткали',
    avatar: 'DS',
    channel: 'whatsapp',
    lastMessage: 'Мне нужно 2 латте и круассан 🙏',
    time: '10:42',
    unread: 2,
    hasOrder: true,
    messages: [
      { id: 'm1', from: 'customer', text: 'Сәлем! Менің сұрағым бар', time: '10:38' },
      { id: 'm2', from: 'customer', text: 'Мне нужно 2 латте и 1 круассан, можно доставку?', time: '10:40' },
      { id: 'm3', from: 'bot', text: 'Привет, Дана! Конечно, оформляю заказ для вас 😊', time: '10:41' },
      { id: 'm4', from: 'customer', text: 'Мне нужно 2 латте и круассан 🙏', time: '10:42' },
    ],
    orderItems: [
      { name: 'Латте', qty: 2, price: 950 },
      { name: 'Круассан', qty: 1, price: 400 },
    ],
    orderAddress: 'ул. Абая 12, кв. 34',
    orderDate: 'Сегодня, 11:30',
  },
  {
    id: 'c2',
    name: 'Aisha_kz',
    avatar: 'AK',
    channel: 'instagram',
    lastMessage: 'А есть размер M в розовом?',
    time: '10:15',
    unread: 1,
    hasOrder: false,
    messages: [
      { id: 'm1', from: 'customer', text: 'Привет! Увидела у вас платье на фото', time: '10:10' },
      { id: 'm2', from: 'customer', text: 'А есть размер M в розовом?', time: '10:15' },
    ],
  },
  {
    id: 'c3',
    name: 'Мади Ержанов',
    avatar: 'МЕ',
    channel: 'whatsapp',
    lastMessage: 'Спасибо за быструю доставку!',
    time: 'Вчера',
    unread: 0,
    hasOrder: false,
    messages: [
      { id: 'm1', from: 'customer', text: 'Спасибо за быструю доставку!', time: 'Вчера' },
      { id: 'm2', from: 'owner', text: 'Пожалуйста! Ждём вас снова 🙏', time: 'Вчера' },
    ],
  },
  {
    id: 'c4',
    name: 'Saltanat_beauty',
    avatar: 'SB',
    channel: 'instagram',
    lastMessage: 'Запишите меня на маникюр в пятницу',
    time: 'Вчера',
    unread: 0,
    hasOrder: true,
    messages: [
      { id: 'm1', from: 'customer', text: 'Запишите меня на маникюр в пятницу', time: 'Вчера' },
    ],
    orderItems: [
      { name: 'Маникюр + гель-лак', qty: 1, price: 4500 },
    ],
    orderDate: 'Пятница, 14:00',
  },
];

export const stockItems = [
  { id: 's1', name: 'Кофе Эфиопия', icon: 'coffee', qty: 2.5, unit: 'кг', price: 8500, low: true },
  { id: 's2', name: 'Молоко', icon: 'water_drop', qty: 12, unit: 'л', price: 350, low: false },
  { id: 's3', name: 'Круассан', icon: 'bakery_dining', qty: 8, unit: 'шт', price: 400, low: true },
  { id: 's4', name: 'Сироп карамель', icon: 'local_drink', qty: 3, unit: 'бут', price: 1200, low: false },
  { id: 's5', name: 'Американо', icon: 'coffee', qty: 0, unit: 'порц', price: 650, low: true },
];

export const revenueData = [41200, 38700, 52100, 47300, 61800, 44500, 47300];
