# Báo cáo tổng kết dự án: PDF Smart Tools

Dự án **PDF Smart Tools** đã hoàn thành việc xây dựng và nâng cấp giao diện, tính năng để trở thành một công cụ web chuyên nghiệp giúp chèn Header công ty vào PDF và tạo bản Tóm tắt hồ sơ ứng viên (CV Summary) hoàn toàn offline.

---

## 1. Các thành phần chính của ứng dụng

### 1.1. Công cụ chèn Header (Header Adder)
- **Cơ chế co nhỏ trang (Shrink Content)**: Để tránh tình trạng ảnh Header đè lên nội dung văn bản ở đầu trang, chúng tôi đã phát triển logic co nhỏ trang tự động:
  1. Sử dụng `destPdfDoc.embedPdf(...)` để nhúng các trang từ tài liệu gốc.
  2. Tạo các trang mới có cùng kích thước với trang gốc.
  3. Tính toán không gian cần dành cho ảnh Header dựa trên tỷ lệ ảnh (`aspectRatio`), kích thước thu nhỏ được chọn (`scale`), và khoảng cách lề trên (`topMargin`).
  4. Tính toán hệ số co nhỏ `scaleFactor` để vẽ trang gốc thu nhỏ cân đối và dịch chuyển nó xuống sát đáy trang (`CropBox`), đảm bảo căn giữa theo chiều ngang.
  5. Vẽ Header đè lên khoảng trống phía trên cùng của trang.
- **Tùy biến linh hoạt**: Người dùng có thể chỉnh căn lề (Trái/Giữa/Phải), tỉ lệ kích thước (Scale), khoảng cách lề trên, và có thể bật/tắt chèn ở trang đầu/trang cuối tài liệu.

### 1.2. Công cụ tóm tắt hồ sơ ứng viên (CV Summary)
- **Tạo bảng tóm tắt**: Tạo ra một trang mới ở đầu tài liệu PDF (Trang 1) chứa bảng thông tin ứng viên (Candidate Summary).
- **Cấu trúc bảng**:
  - Gồm 6 trường thông tin chính: *Name, Position Applied, Profile Summary, Top Skills, English, Notice Period*.
  - Các ô nhãn cột bên trái sử dụng màu xanh đặc trưng `#42B0D5`.
  - Toàn bộ văn bản và tiêu đề trong bảng được căn lề trái để dễ theo dõi và tạo cảm giác trang trọng.
  - Các thông tin từ form được tự động xuống dòng (`wrapText`) dựa trên chiều rộng cột để không bị tràn khung.
- **Kết hợp CV**: Trang 1 là Bảng tóm tắt, bắt đầu từ Trang 2 trở đi là các trang CV gốc của ứng viên được tự động chèn ảnh Header công ty lên đầu trang (có co nhỏ nội dung tương tự tab 1).

### 1.3. Nhãn hiệu & Giao diện cao cấp
- Giao diện web được thiết kế theo phong cách hiện đại với nền tối, hiệu ứng **Glassmorphism** (kính mờ), và các vùng sáng màu gradient có hoạt họa di chuyển nhẹ nhàng.
- Ở góc trên bên trái màn hình, logo thương hiệu được tích hợp cùng dòng chữ bản quyền `"Developed by Thang Pham"`.

---

## 2. Hướng dẫn chạy thử và kiểm tra cục bộ

### Bước 1: Khởi động máy chủ cục bộ
Chạy lệnh sau trong thư mục dự án để khởi động máy chủ thử nghiệm:
```bash
npm run dev
```
Màn hình sẽ tự động mở hoặc bạn có thể truy cập qua địa chỉ: [http://localhost:5000](http://localhost:5000).

### Bước 2: Kiểm thử tính năng Header Adder
1. Chọn tab **Header Adder**.
2. Kéo thả hoặc click chọn 1 file PDF và 1 file ảnh Header PNG.
3. Thay đổi các tùy chọn trên thanh trượt và quan sát sự co giãn trực tiếp của nội dung trên khung xem trước A4 bên phải.
4. Click **Chèn Header & Tải PDF** để tải file kết quả về máy.

### Bước 3: Kiểm thử tính năng CV Summary
1. Chọn tab **CV Summary**.
2. Chọn file CV PDF và file Header PNG.
3. Nhập các thông tin ứng viên vào form. Quan sát bảng xem trước cập nhật trực tiếp dữ liệu theo thời gian thực (Live Preview).
4. Click **Generate CV Report PDF** để tải báo cáo hoàn chỉnh về máy.
5. Mở file PDF kết quả để kiểm tra xem trang 1 có phải bảng tóm tắt màu `#42B0D5` căn lề trái hay không, và các trang tiếp theo có chứa CV gốc kèm Header công ty hay không.
