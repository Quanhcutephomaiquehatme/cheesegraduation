# Sửa đồng bộ danh sách thợ — 02/10/2026

Trang chính và trang tất cả thợ lấy danh sách trực tiếp từ bảng photographers, cùng nguồn dữ liệu với admin. Chỉ hồ sơ có active = true được hiển thị. Thợ đã xóa hoặc tắt hiển thị không còn trong danh sách công khai.

Đã bỏ 12 hồ sơ mẫu cố định trong trang chính; loại bỏ hồ sơ thừa khỏi DOM thay vì chỉ ẩn; cập nhật bộ đếm, dữ liệu lọc và thứ tự mặc định sau khi tải dữ liệu. Danh sách rỗng hoặc lỗi kết nối không dùng thợ mẫu thay thế. Trang liên hệ cũng không giữ danh sách mẫu khi dữ liệu trả về rỗng.

## Áp dụng

1. Giải nén và tải toàn bộ nội dung thư mục cheesegrad_modern lên hosting hiện tại để thay bản cũ. Giữ nguyên config.js đang kết nối với Supabase của bạn nếu trên hosting có cấu hình khác.
2. Không cần chạy thêm SQL hay triển khai lại Edge Function cho bản sửa này.
3. Sau khi thay đổi thợ trong admin, tải lại trang chính để lấy danh sách mới. Bản sửa này không dùng cập nhật realtime khi trang đang mở.
4. Thợ tắt “hiển thị” trong admin sẽ không xuất hiện công khai; vì vậy số thợ công khai bằng số thợ đang bật, không phải tổng số bao gồm thợ đã tắt.

## Kiểm tra

Đã kiểm tra cú pháp tất cả JavaScript và chạy kiểm thử logic với dữ liệu giả lập: có thợ, không có thợ, thợ tắt hiển thị, slug trùng, lỗi tải dữ liệu và thiếu cấu hình. Chưa kiểm tra trên Supabase/hosting thực tế; môi trường sửa không có trình duyệt để chạy kiểm thử giao diện.

## Mới: chọn thợ ưu tiên hiển thị

Trong Admin → Quản lý photographer, mỗi thợ có:
- **Lên đầu**: đưa thợ lên vị trí đầu tiên.
- **↑ Lên / ↓ Xuống**: chuyển một vị trí.
- **Vị trí**: thứ tự trong toàn bộ danh sách, bao gồm thợ đang ẩn.

Các nút tự lưu thứ tự vào trường sort_order sẵn có. Không cần SQL mới. Đợi thông báo “Đã lưu thứ tự”, sau đó tải lại trang chính hoặc trang thợ. Thợ đang ẩn vẫn bị loại khỏi danh sách công khai. Nếu khách chọn sắp xếp theo tên/giá/đánh giá, lựa chọn đó được ưu tiên; chọn “Thứ tự mặc định” để trở lại thứ tự do admin đặt.

Khi mạng hoặc quyền ghi bị lỗi giữa chừng, hệ thống báo chưa lưu đầy đủ và tải lại thứ tự đang có; bạn có thể thử lại. Chế độ demo chỉ lưu cục bộ, không cập nhật website thật.

Đã kiểm thử logic đổi thứ tự, vị trí đầu/cuối, thứ tự trùng, thứ tự bằng 0, thợ ẩn, dữ liệu gửi lưu và lỗi quyền ghi. Chạy lại kiểm thử bằng `node tests/photographer-order.test.cjs`.
