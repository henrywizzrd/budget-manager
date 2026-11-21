import { Category } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'an', name: 'Ăn uống', nameEn: 'Food', short: 'AU', icon: 'rice', color: '#E8772E', fg: '#9A4A0B', bg: '#FFF1E6', type: 'expense', limit: 4_000_000 },
  { id: 'cf', name: 'Cà phê & đồ uống', nameEn: 'Coffee & drinks', short: 'CF', icon: 'coffee', color: '#E8772E', fg: '#6B4423', bg: '#F3ECE4', type: 'expense', limit: 600_000 },
  { id: 'dc', name: 'Di chuyển', nameEn: 'Transport', short: 'DC', icon: 'bike', color: '#2F7FD6', fg: '#1F4FD1', bg: '#E6F0FF', type: 'expense', limit: 1_000_000 },
  { id: 'ms', name: 'Mua sắm', nameEn: 'Shopping', short: 'MS', icon: 'clothes', color: '#8B5E3C', fg: '#A3266B', bg: '#FCE8F2', type: 'expense', limit: 1_500_000 },
  { id: 'hd', name: 'Hóa đơn', nameEn: 'Bills', short: 'HĐ', icon: 'rent', color: '#5C6B7A', fg: '#5A5F0B', bg: '#F4F5DC', type: 'expense', limit: 3_000_000 },
  { id: 'ht', name: 'Học tập', nameEn: 'Study', short: 'HT', icon: 'book', color: '#6D5BD0', fg: '#5B32B8', bg: '#F0EAFB', type: 'expense', limit: 800_000 },
  { id: 'gt', name: 'Giải trí', nameEn: 'Fun', short: 'GT', icon: 'movie', color: '#D6336C', fg: '#0B6E8A', bg: '#E2F4F8', type: 'expense', limit: 700_000 },
  { id: 'tt', name: 'Thể thao', nameEn: 'Sports', short: 'TT', icon: 'badminton', color: '#0F9D8F', fg: '#0F9D8F', bg: '#E2F6F4', type: 'expense', limit: 300_000 },
  { id: 'sk', name: 'Sức khỏe', nameEn: 'Health', short: 'SK', icon: 'medicine', color: '#E03131', fg: '#B42318', bg: '#FDECEA', type: 'expense', limit: 300_000 },
  { id: 'xh', name: 'Quà & xã hội', nameEn: 'Gifts & social', short: 'XH', icon: 'gift', color: '#A61E4D', fg: '#A61E4D', bg: '#FBE7EE', type: 'expense', limit: 0 },
  { id: 'dk', name: 'Gói đăng ký', nameEn: 'Subscriptions', short: 'ĐK', icon: 'sub_app', color: '#3B5BDB', fg: '#3B5BDB', bg: '#E8EDFD', type: 'expense', limit: 0 },
  { id: 'kh', name: 'Khác', nameEn: 'Other', short: 'KH', icon: 'other', color: '#6B7378', fg: '#4A4F57', bg: '#ECEEF1', type: 'expense', limit: 0 },
  { id: 'tn', name: 'Thu nhập', nameEn: 'Income', short: 'TN', icon: 'salary', color: '#2B8A3E', fg: '#0E6B58', bg: '#E3F3EE', type: 'income', limit: 0 },
];

/**
 * Keywords per category, written WITHOUT diacritics (input is folded before matching).
 * Longer / more specific phrases win over shorter ones.
 */
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  cf: [
    'ca phe', 'cafe', 'caphe', 'cf', 'coffee', 'highlands', 'highland', 'phuc long', 'starbucks', 'katinat',
    'cong ca phe', 'tra sua', 'tra chanh', 'tra dao', 'sinh to', 'nuoc ep', 'nuoc ngot', 'matcha', 'bac xiu', 'tra da',
    'nuoc mia', 'tocotoco', 'gong cha', 'trung nguyen', 'the coffee house',
    'tea', 'milk tea', 'boba', 'latte', 'drink', 'drinks', 'juice', 'soda',
  ],
  an: [
    'an', 'an sang', 'an trua', 'an toi', 'pho', 'bun', 'bun bo', 'com', 'com tam', 'banh mi', 'banh', 'mi', 'lau',
    'nuong', 'ga', 'pizza', 'kfc', 'lotteria', 'jollibee', 'mcdonald', 'do an', 'grabfood', 'shopeefood',
    'baemin', 'nhau', 'bia', 'hu tieu', 'chao', 'xoi', 'snack', 'oc', 'hai san', 'sushi', 'buffet',
    'an vat', 'trai cay', 'di cho', 'rau', 'thit', 'ca', 'trung', 'banh trang', 'che', 'kem',
    'lunch', 'dinner', 'breakfast', 'food', 'meal', 'bread', 'rice', 'noodles', 'groceries', 'snacks', 'eat',
  ],
  dc: [
    'grab', 'grabbike', 'grabcar', 'be', 'xanh sm', 'gojek', 'xang', 'do xang', 'taxi', 'xe om', 'gui xe',
    've xe', 'bus', 'xe buyt', 'metro', 'parking', 've may bay', 'may bay', 'tau', 'sua xe', 'rua xe', 'thay nhot',
    'cau duong', 'phi duong',
    'fuel', 'gas', 'petrol', 'train', 'flight', 'ride', 'uber',
  ],
  ms: [
    'mua', 'quan ao', 'ao', 'giay', 'dep', 'shopee', 'lazada', 'tiki', 'tiktok shop', 'my pham', 'tui',
    'dong ho', 'tai nghe', 'phu kien', 'sieu thi', 'bach hoa xanh', 'winmart', 'coopmart', 'uniqlo', 'do dung',
    'clothes', 'shoes', 'shopping', 'makeup', 'haircut', 'cat toc',
  ],
  hd: [
    'tien dien', 'dien', 'tien nuoc', 'internet', 'wifi', 'mang', 'cuoc dien thoai', 'nap dien thoai', 'nap the',
    'nap', 'tien nha', 'thue nha', 'tien phong', '4g', '5g', 'phi', 'bao hiem',
    'rent', 'electricity', 'water bill', 'phone bill', 'top up',
  ],
  ht: [
    'sach', 'hoc', 'khoa hoc', 'hoc phi', 'vo', 'but', 'in an', 'photo', 'udemy', 'coursera', 'ielts', 'toeic',
    'giao trinh', 'tai lieu', 'thi',
    'book', 'books', 'tuition', 'course', 'printing', 'stationery',
  ],
  gt: [
    'phim', 'cgv', 'lotte cinema', 'galaxy', 'game', 'karaoke',
    'du lich', 'concert', 'steam', 'bida', 'bowling', 'choi', 'nhac', 'show', 'party',
    'movie', 'cinema', 'games', 'travel', 'trip',
  ],
  tt: [
    'cau long', 'san cau long', 'bong da', 'san bong', 'da banh', 'bong chuyen', 'tennis', 'pickleball', 'boi loi',
    'badminton', 'football', 'soccer', 'volleyball', 'sport', 'sports', 'gym',
  ],
  xh: [
    'qua', 'qua sinh nhat', 'sinh nhat', 'dam cuoi', 'mung cuoi', 'dam hieu', 'tu thien', 'phong bi',
    'gift', 'gifts', 'wedding', 'birthday', 'donation',
  ],
  dk: [
    'netflix', 'spotify', 'youtube premium', 'apple music', 'icloud', 'google one', 'claude', 'chatgpt', 'gemini',
    'subscription', 'goi dang ky',
  ],
  sk: [
    'thuoc', 'kham', 'benh vien', 'phong kham', 'nha khoa', 'rang', 'vitamin', 'kham benh', 'xet nghiem',
    'yoga', 'medicine', 'doctor', 'pharmacy', 'dentist',
  ],
  tn: [
    'luong', 'thuong', 'nhan luong', 'thu nhap', 'duoc cho', 'me cho', 'bo cho', 'ban duoc', 'hoan tien',
    'li xi', 'lixi', 'freelance', 'tro cap', 'hoc bong', 'tien lai', 'nhan tien', 'duoc tra', 'lam them',
    'salary', 'income', 'bonus', 'refund', 'scholarship', 'paycheck', 'got paid', 'allowance',
  ],
};
