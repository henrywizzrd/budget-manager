# MYX: quản lý tiền cho sinh viên

App quản lý tiền viết bằng **Expo SDK 58 (React Native) + TypeScript**, song ngữ Việt / Anh, dữ liệu lưu trên máy.
Câu hỏi trung tâm của app: **"Hôm nay mình còn tiêu được bao nhiêu?"**

## Tính năng (bản thử nghiệm)

| Màn hình | Có gì |
|---|---|
| **Dock** | Thanh tab kính mờ (Trang chủ · Lịch sử · Trợ lý) + nút + tròn + chip "Hôm nay còn…" kèm ghi chú. Chạm để chuyển tab; ấn giữ rồi kéo để kính lúp chạy theo tay; cuộn xuống thì dock thu gọn. Cử chỉ và thông số lấy từ dock của app ZYX |
| **Trang chủ** | Số tiền tiêu được hôm nay (tính theo số dư, hóa đơn/gói/trả góp sắp đến hạn, tiền để dành và ngày nhận tiền), chế độ cứu nguy khi thiếu tiền, mẫu chi một chạm, biểu đồ cột tuần/tháng + đường chi mỗi ngày, sắp đến hạn, gợi ý |
| **Thêm giao dịch** | Gõ câu tiếng Việt hoặc tiếng Anh ("trưa bún bò 50k, xăng 80k", "lunch 50k, bus 7k"), chọn ví; MYX nhớ danh mục bạn sửa |
| **Lịch sử** | Nhóm theo ngày, tìm không dấu, lọc thu/chi, xóa |
| **Trợ lý** | "Mua … được không?", soát gói đăng ký, đặt hạn mức, tạo mục tiêu, ghi giao dịch: mọi thay đổi cần bấm Xác nhận. Offline miễn phí, Gemini nếu dán key |
| **Ngân sách** | Hạn mức theo danh mục, mục tiêu + quỹ khẩn cấp có chuỗi ngày, chia hũ khi nhận tiền |
| **Hóa đơn & nợ** | Hóa đơn định kỳ, gói đăng ký (nhắc trước 1/3/7 ngày, gửi thử thông báo), nợ và trả góp |
| **Cài đặt** | Ngôn ngữ, sáng/tối, 6 theme, ẩn số tiền, khóa app (Face ID / vân tay), ngày nhận tiền, ví, tổng kết ngày/tuần, mẫu chi, recap tháng (chia sẻ ảnh), xuất CSV, Pro (giao diện), key Gemini |

Chưa có trong bản này: tài khoản và đồng bộ cloud (Supabase), mua Pro thật, widget. Xem kế hoạch ở `specs/001-myx-v1/`.

## Cài bản thử

Push commit có `[build]` trong lời nhắn → GitHub Actions tạo bản Release (APK cho Android, IPA chưa ký cho iPhone: ký và cài bằng ESign / Sideloadly).

## Phát triển

```bash
npm install
npx expo start          # chạy dev (cần development build vì có module native)
npx tsc --noEmit        # kiểm tra kiểu
npm test                # test bộ tách câu và công thức tính tiền
node scripts/gen-icons.mjs   # tạo lại dữ liệu icon từ design/icons/icons.json
```

Thiết kế: bản mẫu HTML ở `design/prototype/index.html`, bộ icon ở `design/icons/` (60 icon từ Phosphor Icons, MIT).
