import { Category } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'an', name: 'Ăn uống', short: 'AU', fg: '#9A4A0B', bg: '#FFF1E6', type: 'expense', limit: 4_000_000 },
  { id: 'cf', name: 'Cà phê & đồ uống', short: 'CF', fg: '#6B4423', bg: '#F3ECE4', type: 'expense', limit: 600_000 },
  { id: 'dc', name: 'Di chuyển', short: 'DC', fg: '#1F4FD1', bg: '#E6F0FF', type: 'expense', limit: 1_000_000 },
  { id: 'ms', name: 'Mua sắm', short: 'MS', fg: '#A3266B', bg: '#FCE8F2', type: 'expense', limit: 1_500_000 },
  { id: 'hd', name: 'Hóa đơn', short: 'HĐ', fg: '#5A5F0B', bg: '#F4F5DC', type: 'expense', limit: 3_000_000 },
  { id: 'ht', name: 'Học tập', short: 'HT', fg: '#5B32B8', bg: '#F0EAFB', type: 'expense', limit: 800_000 },
  { id: 'gt', name: 'Giải trí', short: 'GT', fg: '#0B6E8A', bg: '#E2F4F8', type: 'expense', limit: 700_000 },
  { id: 'sk', name: 'Sức khỏe', short: 'SK', fg: '#B42318', bg: '#FDECEA', type: 'expense', limit: 300_000 },
  { id: 'kh', name: 'Khác', short: 'KH', fg: '#4A4F57', bg: '#ECEEF1', type: 'expense', limit: 0 },
  { id: 'tn', name: 'Thu nhập', short: 'TN', fg: '#0E6B58', bg: '#E3F3EE', type: 'income', limit: 0 },
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
  ],
  an: [
    'an', 'an sang', 'an trua', 'an toi', 'pho', 'bun', 'bun bo', 'com', 'com tam', 'banh mi', 'banh', 'mi', 'lau',
    'nuong', 'ga', 'pizza', 'kfc', 'lotteria', 'jollibee', 'mcdonald', 'do an', 'grabfood', 'shopeefood',
    'baemin', 'nhau', 'bia', 'hu tieu', 'chao', 'xoi', 'snack', 'oc', 'hai san', 'sushi', 'buffet',
    'an vat', 'trai cay', 'di cho', 'rau', 'thit', 'ca', 'trung', 'banh trang', 'che', 'kem',
  ],
  dc: [
    'grab', 'grabbike', 'grabcar', 'be', 'xanh sm', 'gojek', 'xang', 'do xang', 'taxi', 'xe om', 'gui xe',
    've xe', 'bus', 'xe buyt', 'metro', 'parking', 've may bay', 'may bay', 'tau', 'sua xe', 'rua xe', 'thay nhot',
    'cau duong', 'phi duong',
  ],
  ms: [
    'mua', 'quan ao', 'ao', 'giay', 'dep', 'shopee', 'lazada', 'tiki', 'tiktok shop', 'my pham', 'tui',
    'dong ho', 'tai nghe', 'phu kien', 'sieu thi', 'bach hoa xanh', 'winmart', 'coopmart', 'uniqlo', 'do dung',
  ],
  hd: [
    'tien dien', 'dien', 'tien nuoc', 'internet', 'wifi', 'mang', 'cuoc dien thoai', 'nap dien thoai', 'nap the',
    'nap', 'tien nha', 'thue nha', 'tien phong', '4g', '5g', 'icloud', 'google one', 'phi', 'bao hiem',
  ],
  ht: [
    'sach', 'hoc', 'khoa hoc', 'hoc phi', 'vo', 'but', 'in an', 'photo', 'udemy', 'coursera', 'ielts', 'toeic',
    'giao trinh', 'tai lieu', 'thi',
  ],
  gt: [
    'phim', 'cgv', 'lotte cinema', 'galaxy', 'game', 'netflix', 'spotify', 'youtube premium', 'karaoke',
    'du lich', 'concert', 'steam', 'bida', 'bowling', 'choi', 'nhac', 'show', 'party',
  ],
  sk: [
    'thuoc', 'kham', 'benh vien', 'phong kham', 'gym', 'nha khoa', 'rang', 'vitamin', 'kham benh', 'xet nghiem',
    'yoga', 'boi',
  ],
  tn: [
    'luong', 'thuong', 'nhan luong', 'thu nhap', 'duoc cho', 'me cho', 'bo cho', 'ban duoc', 'hoan tien',
    'li xi', 'lixi', 'freelance', 'tro cap', 'hoc bong', 'tien lai', 'nhan tien', 'duoc tra',
  ],
};
