# Budget AI: app quản lý ngân sách có AI

App quản lý chi tiêu cá nhân viết bằng **Expo (React Native) + TypeScript**. Bạn ghi chi tiêu bằng một câu tiếng Việt bình thường, AI tách thành từng giao dịch, xếp danh mục, theo dõi hạn mức và trả lời câu hỏi về thói quen chi tiêu.

## Tính năng

| Màn hình | Có gì |
|---|---|
| **Trang chủ** | Số tiền còn được chi trong tháng, thu nhập, mức chi trung bình/ngày, thẻ *AI nhận xét*, giao dịch gần đây, top danh mục |
| **Thêm giao dịch (nút +)** | Gõ câu kiểu `trưa ăn bún bò 50k, chiều đổ xăng 80k, tối mua sách 120 nghìn` → AI tách ra 3 giao dịch, tự xếp danh mục và thời điểm. Có thêm chế độ nhập tay |
| **Ngân sách** | Vòng % đã dùng, dự báo cuối tháng, hạn mức từng danh mục (chạm để sửa), cảnh báo sắp vượt hoặc đã vượt, xem lại các tháng trước |
| **Trợ lý AI** | Hỏi kiểu “Tháng này tiêu cà phê bao nhiêu?”, “So sánh với tháng trước”, “Dự báo cuối tháng”, “Nên tiết kiệm ở đâu?” |
| **Cài đặt** | Tên, API key Gemini (tùy chọn), tạo dữ liệu mẫu 6 tuần, xóa dữ liệu |
| **Lịch sử** | Mọi giao dịch nhóm theo ngày, lọc thu/chi, chạm vào để xóa |

### AI hoạt động thế nào

- **Offline (mặc định, miễn phí):** `src/lib/parser.ts` là bộ tách câu tiếng Việt. Nó hiểu `k`, `nghìn`, `tr`, `triệu`, `củ`, `1tr5`, `50.000đ`, số không đơn vị (`cafe 35` = 35.000đ), các mốc thời gian (`trưa nay`, `hôm qua`…), khoản thu (`lương`, `mẹ cho`…), và gõ không dấu vẫn được. Trợ lý offline (`src/lib/assistant.ts`) trả lời theo ý định câu hỏi.
- **Gemini (tùy chọn):** vào **Cài đặt**, dán API key lấy miễn phí tại https://aistudio.google.com/app/apikey. Khi có key, việc tách câu và trợ lý sẽ dùng Gemini. Nếu Gemini lỗi, app tự quay về chế độ offline. Key chỉ lưu trên máy.

Dữ liệu được lưu trên máy bằng AsyncStorage, không cần server.

## Chạy thử trên iPhone (Expo Go)

Cần: **Node.js 20+** trên máy tính và app **Expo Go** trên iPhone (cài từ App Store).

```bash
git clone https://github.com/henrywizzrd/budget-manager.git
cd budget-manager
npm install
npx expo start
```

1. Terminal sẽ hiện mã QR.
2. Trên iPhone, mở **Camera** và quét QR, máy sẽ mở Expo Go (Android thì quét bằng chính Expo Go).
3. Điện thoại và máy tính phải dùng **cùng mạng Wi-Fi**. Nếu không kết nối được (Wi-Fi công ty hoặc trường hay chặn), chạy `npx expo start --tunnel`.
4. Lần đầu vào app, mở **Cài đặt → Tạo dữ liệu mẫu** để có số liệu test.

Chạy trên trình duyệt: `npx expo start --web` (hoặc nhấn `w` trong terminal).

> Expo Go trên App Store chỉ chạy được SDK mới nhất. Project này dùng **Expo SDK 58**. Nếu Expo Go báo lệch phiên bản, hãy cập nhật Expo Go.

## Lệnh hữu ích

```bash
npm start           # dev server
npm run web         # chạy bản web
npm run typecheck   # kiểm tra TypeScript
npm test            # test bộ tách câu tiếng Việt (scripts/test-parser.ts)
```

## Cấu trúc thư mục

```
src/
  app/                    # Expo Router: mỗi file là một màn hình
    _layout.tsx           # root: font, store, stack (modal "add", "history")
    (tabs)/_layout.tsx    # thanh tab dưới + nút + ở giữa
    (tabs)/index.tsx      # Trang chủ
    (tabs)/budget.tsx     # Ngân sách
    (tabs)/assistant.tsx  # Trợ lý AI
    (tabs)/settings.tsx   # Cài đặt
    add.tsx               # Thêm giao dịch (AI + nhập tay)
    history.tsx           # Tất cả giao dịch
  components/             # UI dùng chung (Txt, Card, Btn, Icon, Sheet, TxRow…)
  lib/
    parser.ts             # tách câu tiếng Việt → giao dịch (offline)
    categories.ts         # danh mục mặc định + từ khóa nhận diện
    insights.ts           # thống kê tháng, dự báo, nhận xét
    assistant.ts          # trợ lý offline
    gemini.ts             # gọi Gemini API (tùy chọn)
    store.tsx             # state + lưu AsyncStorage
    sample.ts             # dữ liệu mẫu
scripts/test-parser.ts    # test cho parser
```

## Hướng phát triển tiếp

- Quét hóa đơn bằng camera (OCR)
- Màn báo cáo biểu đồ theo tháng
- Backend và đồng bộ nhiều thiết bị (Node/NestJS + PostgreSQL)
- Build file cài đặt thật bằng EAS (`npx eas-cli build`)
