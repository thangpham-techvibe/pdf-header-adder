# Kế hoạch triển khai: PDF Smart Tools (Header Adder & CV Summary)

Dự án này nâng cấp ứng dụng web đơn giản thành bộ công cụ xử lý PDF chuyên nghiệp, hoạt động hoàn toàn ở phía client (offline) sử dụng thư viện `pdf-lib`.

---

## 1. Các tính năng chính

### Tab 1: Header Adder (Chèn Header vào PDF)
- **Mô tả**: Tự động chèn ảnh Header công ty dạng PNG lên đầu các trang PDF gốc.
- **Các cấu hình**:
  - Căn lề ngang của Header: Trái, Giữa, Phải.
  - Kích thước Header (Scale): Tùy chỉnh từ 5% đến 100%.
  - Khoảng cách lề trên (Top Margin): Từ 0px đến 150px.
  - Tùy chọn **Co nhỏ nội dung gốc (Shrink Content)**: Tự động co tỷ lệ trang gốc và đẩy xuống dưới để dành không gian cho Header mà không bị đè lên chữ.
  - Tùy chọn bỏ qua trang đầu (Trang bìa) hoặc trang cuối.
- **Xem trước trực quan**: Giao diện mô phỏng trang A4 hiển thị trực tiếp ảnh Header và mô phỏng co nhỏ nội dung khi thay đổi cấu hình.

### Tab 2: CV Summary (Tóm tắt hồ sơ ứng viên)
- **Mô tả**: Cho phép nhà tuyển dụng tải lên CV của ứng viên và ảnh Header công ty để tạo một báo cáo CV hoàn chỉnh.
- **Cấu trúc PDF đầu ra**:
  - **Trang 1**: Bảng tóm tắt thông tin ứng viên (Candidate Summary) sử dụng tông màu chủ đạo `#42B0D5`, các nhãn và nội dung được căn lề trái chuyên nghiệp.
  - **Trang 2+**: CV gốc của ứng viên được tự động chèn ảnh Header công ty lên đầu mỗi trang (co nhỏ nội dung gốc tương tự Tab 1).
- **Form điền thông tin tóm tắt (Có thể chỉnh sửa)**:
  - Name (Họ tên ứng viên)
  - Position Applied (Vị trí ứng tuyển)
  - Profile Summary (Tóm tắt hồ sơ)
  - Top Skills (Kỹ năng nổi bật)
  - English (Trình độ tiếng Anh)
  - Notice Period (Thời gian thông báo nghỉ việc)
- **Bảng xem trước trực tiếp (Live Preview)**: Hiển thị bảng tóm tắt ứng viên cập nhật thời gian thực khi người dùng gõ vào form.

---

## 2. Thiết kế và Nhãn hiệu (Branding)
- Giao diện hiện đại sử dụng hiệu ứng **Glassmorphism** (kính mờ) trên nền tối sang trọng với hiệu ứng ánh sáng gradient trôi nổi.
- **Logo thương hiệu**: Logo công ty nằm ở góc trên bên trái của trang web.
- **Tên nhà phát triển**: Dưới logo hiển thị dòng chữ thương hiệu `"Developed by Thang Pham"`.
- **Màu sắc chủ đạo**: Tông màu xanh `#42B0D5` được áp dụng cho bảng tóm tắt và nút bấm của phần CV Summary.

---

## 3. Cấu trúc các file thay đổi

### [index.html](file:///g:/Antigravity_home/PDF%20to%20header/index.html)
- Tích hợp hệ thống Tab Navigation để chuyển đổi giữa "Header Adder" và "CV Summary".
- Bổ sung Logo và dòng chữ "Developed by Thang Pham".
- Thiết lập layout lưới cho Form và Bảng xem trước trực tiếp trong tab CV Summary.
- Liên kết thư viện `pdf-lib` và `lucide-icons` qua CDN.

### [styles.css](file:///g:/Antigravity_home/PDF%20to%20header/styles.css)
- Thiết lập biến màu sắc (CSS variables) và nền tối hiện đại.
- Thêm hiệu ứng co nhỏ nội dung trực quan trên A4 preview (`.a4-sheet.shrink-active .a4-mock-content`).
- Định dạng bảng tóm tắt ứng viên với lề trái và tông màu `#42B0D5`.

### [app.js](file:///g:/Antigravity_home/PDF%20to%20header/app.js)
- Thêm logic xử lý kéo thả (Drag and Drop) và sửa lỗi tải file (phải chọn lần thứ 2 mới nhận).
- Logic đồng bộ Live Preview khi người dùng nhập dữ liệu form.
- Sử dụng hàm `destDoc.embedPdf(...)` để nhúng trang và `drawPage` với tỉ lệ co nhỏ `scaleFactor` nhằm dịch chuyển trang PDF gốc xuống phía dưới khi bật **Shrink Content**.
- Logic tạo trang Summary chuyên nghiệp và ghép nối với các trang CV gốc có chèn Header để xuất ra file PDF hoàn chỉnh.
