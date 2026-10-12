# Cập nhật lịch thợ và giá tốt nghiệp — 12/10/2026

## Cài bản sửa

1. Trong Supabase → SQL Editor của website, chạy toàn bộ file `SUPABASE-PATCH-ACCOUNTS-CONFIRMATION.sql` có trong thư mục này. Bản vá bổ sung cột xác nhận, phiên bản lịch, hàm đọc lịch và hàm xác nhận có kiểm tra tài khoản. Có thể chạy lại; không xóa lịch hay thay bảng giá hiện có.
2. Đưa toàn bộ mã website trong thư mục này lên hosting, thay bản cũ. Các tệp JavaScript liên quan đã đổi mã phiên bản để tránh cache.
3. Admin kiểm tra tài khoản thợ đã liên kết đúng hồ sơ và hồ sơ đang hoạt động. Thợ đăng nhập lại → mở lịch được phân công → Xác nhận nhận lịch chụp. Admin bấm làm mới hoặc đợi lượt đồng bộ xác nhận.

Không chạy lại toàn bộ `supabase-setup.sql` trên dữ liệu đang sử dụng chỉ để cài bản sửa này. Nếu bản vá báo lỗi, giữ nguyên thông báo lỗi để kiểm tra trước khi làm tiếp.

## Đã sửa

- Chọn đúng phần tử giá trên ba thẻ gói tốt nghiệp; hiển thị giá admin của từng thợ thay vì giá tĩnh trong HTML.
- Đổi thợ bằng danh sách hoặc cửa sổ chọn nhanh đều cập nhật thẻ gói, giá nhóm, tổng tiền và tin nhắn.
- Giữ nguyên phụ thu 0đ và giá 0đ đã nhập trong admin, không tự thay bằng mức mặc định. Chỉ dùng giá mặc định khi trường dữ liệu chưa được thiết lập (null/không có).
- Công thức tốt nghiệp: giá gói của thợ + (số người − 1) × phụ thu/người của thợ. Phí di chuyển vẫn hiển thị riêng trong tin nhắn.
- Khi không tải được danh sách thợ, không hiển thị giá mẫu như giá đã đồng bộ.
- Phân biệt trạng thái studio “Đã chốt” với việc thợ đã nhận lịch: bộ lọc và bộ đếm “Chờ xác nhận” dựa vào xác nhận của thợ, gồm cả lịch bổ sung.
- Không gửi xác nhận thiếu phiên bản lịch, không báo thành công nếu máy chủ không trả thời gian xác nhận. Hiển thị hướng xử lý cụ thể khi thiếu bản vá, phiên đăng nhập hết hạn hoặc lịch đã thay đổi.
- Đồng bộ bản vá `SUPABASE-PATCH-PHOTOGRAPHER-PORTAL.sql` với bản xác nhận mới để tránh việc chạy lại bản cũ làm mất trường revision/confirmed_at trong dữ liệu lịch.

## Kiểm tra sau khi triển khai

- Trong Admin → hồ sơ thợ, lưu giá lễ, Pre-Grad, Pre-Grad nâng cao và phụ thu/người. Tải lại trang liên hệ, chọn đúng thợ rồi đối chiếu từng gói, tổng tiền và tin nhắn.
- Kiểm tra phụ thu 0đ; kiểm tra chuyển qua thợ có giá khác; kiểm tra số người từ 1 đến tối đa của từng gói.
- Thợ xác nhận một lịch booking và một lịch bổ sung. Tải lại trang, đối chiếu trạng thái trong admin.
- Admin thay đổi ngày/ca/thợ của lịch đã xác nhận: xác nhận cũ phải được xóa, thợ xem lại và xác nhận bản mới.

## Phạm vi kiểm thử

Đã chạy đạt `node tests/booking-schedule-unit.test.cjs`: 18 trường hợp gói/số người, chuyển thợ, giá/phụ thu 0đ và 6 tình huống xác nhận lịch (thành công, SQL cũ, thiếu hàm, lịch thay đổi, lỗi mạng, thiếu kết quả lưu). Đã chạy đạt bài kiểm thử thứ tự thợ có sẵn.

Có thêm bài kiểm thử trình duyệt `tests/booking-schedule.test.cjs` dùng Playwright/Chromium; chưa chạy được trong môi trường sửa vì không có Chromium và tải trình duyệt không thành công. Các bài kiểm thử dùng phản hồi Supabase giả lập, không đọc/ghi dữ liệu thật; SQL vẫn cần kiểm chứng sau khi cài trên hệ thống.

Bản sửa được thực hiện trên mã nguồn gửi kèm; chưa triển khai hosting hoặc thực thi SQL trên Supabase thật. Cần thực hiện bước cài bản vá trên để kích hoạt đầy đủ xác nhận lịch trong cơ sở dữ liệu đang dùng.
