# TÀI LIỆU CẤU TRÚC PHẦN MỀM JPT HELPDESK & PROJECT MANAGEMENT
**Phiên bản chốt:** v4.0  
**Ngày cập nhật:** 03/08/2026  
**Đơn vị phát triển:** JPROTECH COMPANY  

---

## 1. TỔNG QUAN HỆ THỐNG
**JPT Helpdesk Application** là hệ thống quản lý tổng thể cho doanh nghiệp bao gồm các phân hệ: Quản lý dự án, Quản lý yêu cầu hỗ trợ (Helpdesk Tickets), Quản lý hợp đồng & khách hàng, Lịch trình bảo trì, Quản lý nhân sự và Cổng giao tiếp khách hàng (Customer Portal).

### Môi trường & Công nghệ sử dụng (Tech Stack)
* **Frontend Framework:** Next.js 16.2.6 (App Router, Turbopack)
* **UI Library & Rendering:** React 19, Tailwind CSS v4, Lucide Icons, Recharts
* **Backend & Database:** Supabase PostgreSQL (Realtime, RLS policies) + LocalStorage Hydration Layer
* **Deployment:** Vercel Production Environment (`https://jpt-helpdesk-app.vercel.app`)

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN (DIRECTORY STRUCTURE)

```
jpt-helpdesk-app/
├── app/                        # Next.js App Router Pages & API Routes
│   ├── api/                    # System & Migration API endpoints
│   │   ├── setup-nhan-su/
│   │   └── system/backup/
│   ├── contacts/               # Danh bạ liên hệ
│   ├── contracts/              # Quản lý Hợp đồng
│   ├── customers/              # Quản lý Khách hàng
│   ├── dashboard/              # Tổng quan báo cáo & KPIs
│   ├── login/                  # Đăng nhập hệ thống
│   ├── maintenance/            # Lịch trình & timeline Bảo trì
│   ├── nhan-su/                # Quản lý Nhân sự
│   ├── portal/                 # Cổng tiếp nhận yêu cầu từ Khách hàng (Customer Portal)
│   ├── projects/               # Quản lý Dự án
│   │   └── [id]/               # Trang Chi tiết Dự án (Header, Kế hoạch, Gantt, Milestones, SOW)
│   ├── requests/               # Yêu cầu hỗ trợ (Internal Requests)
│   ├── settings/               # Cấu hình hệ thống
│   ├── sla/                    # Cam kết chất lượng dịch vụ (SLA)
│   ├── system/                 # Quản lý tài khoản & Nhóm người dùng
│   ├── tickets/                # Quản lý Ticket Helpdesk
│   │   ├── [id]/               # Chi tiết ticket & luồng xử lý
│   │   └── create/             # Tạo ticket mới
│   └── users/                  # Danh sách người dùng
├── components/                 # Các UI Components tái sử dụng
│   ├── contact/ & contacts/    # Bảng & modal liên hệ
│   ├── contracts/              # Bảng & form hợp đồng
│   ├── customer/               # Quản lý thông tin khách hàng
│   ├── layout/                 # MainLayout, Header, Navigation Sidebar
│   ├── nhan-su/                # Bảng & modal nhân sự
│   ├── portal/                 # Components cổng khách hàng
│   └── ui/                     # Common UI Primitives (Button, Modal, Input...)
├── lib/                        # Business Logic, Data Operations & Supabase Client
│   ├── auth-operations.ts      # Xử lý xác thực & phân quyền
│   ├── contact-operations.ts   # Thao tác dữ liệu Liên hệ
│   ├── contract-operations.ts  # Thao tác dữ liệu Hợp đồng
│   ├── customer-operations.ts  # Thao tác dữ liệu Khách hàng
│   ├── dashboard-operations.ts # Tính toán chỉ số Dashboard
│   ├── nhan-su-operations.ts   # Thao tác dữ liệu Nhân sự
│   ├── project-operations.ts   # Xử lý Kế hoạch, Phase, Task, Gantt dự án
│   ├── ticket-operations.ts    # Luồng xử lý ticket & phản hồi
│   ├── supabase.ts             # Khởi tạo Supabase client
│   └── utils.ts                # Helper utilities (cn, formatting)
└── public/                     # Static Assets (Images, Logos)
```

---

## 3. CÁC ĐẶC TÍNH VÀ NÂNG CẤP NỔI BẬT TẠI PHIÊN BẢN 4.0 (VERSION 4.0 FEATURES)

### 3.1. Phân hệ Quản lý Dự án (Project Management) - Trọng tâm v4.0
1. **Thiết kế Bố cục Header Tối ưu:**
   - Đưa Tiến độ tổng thể lên cùng hàng tiêu đề dự án.
   - Hiển thị Chủ nhiệm dự án (PM), Thời gian thực hiện, Mã dự án và Tên khách hàng ở hàng trên cùng gọn gàng.
   - Tên dự án nổi bật, tăng nhận diện thị giác.
2. **Quản lý Kế hoạch Công việc (Project Plan):**
   - Hỗ trợ công việc phân cấp: **Giai đoạn (Phase / Main Task)** và **Công việc con (Sub-task)**.
   - **Tự động tính toán chỉ số Phase theo vị trí:**
     - **% Hoàn thành Phase:** Tính bằng trung bình % hoàn thành của các task con trong phase.
     - **Người thực hiện Phase:** Tự động tổng hợp danh sách nhân sự duy nhất (unique list) từ tất cả các task con.
     - **Thời gian bắt đầu Phase:** Lấy ngày bắt đầu sớm nhất từ các task con.
     - **Thời gian kết thúc Phase:** Lấy ngày kết thúc muộn nhất từ các task con.
     - **Thời gian kết thúc thực tế Phase:** Tự động cập nhật bằng ngày kết thúc thực tế muộn nhất khi **TẤT CẢ** các task con trong phase đều ở trạng thái `Completed`.
3. **Phân công Nhân sự Linh hoạt:**
   - Hỗ trợ chọn **nhiều người thực hiện** cho mỗi công việc từ Bảng Nhân sự hệ thống + nhập tay mở rộng.
   - Giao diện chọn nhân sự dạng tag pill trực quan và dropdown chọn nhanh.
4. **Kéo thả sắp xếp Task (Drag & Drop):**
   - Hỗ trợ kéo thả đổi vị trí công việc trực tiếp trên bảng chỉnh sửa kế hoạch thay cho nút mũi tên di chuyển.
5. **Biểu đồ Gantt trực quan thế hệ mới (Gantt Chart Redesign):**
   - Bố cục 3 cột chuyên nghiệp: `[Tên công việc]` | `[Tiến độ % + Thanh Bar 2 màu]` | `[Grid Lịch Ngày & Tháng]`.
   - Grid thời gian hiển thị chính xác theo từng ngày (số ngày + thứ T2-CN), tự động highlight **ngày hiện tại (Today)**.
   - Màu sắc Gantt bar đa dạng phân biệt theo từng giai đoạn dự án.

### 3.2. Các Phân hệ Phụ trợ
* **Helpdesk & Tickets:** Quản lý quy trình xử lý sự cố, phân loại ưu tiên, tính toán SLA tự động.
* **Hợp đồng & Khách hàng:** Quản lý thông tin doanh nghiệp, đại diện liên hệ, giá trị hợp đồng & trạng thái hiệu lực.
* **Bảo trì (Maintenance):** Timeline lịch bảo trì định kỳ, hiển thị trực quan các mốc bảo trì thiết bị/dịch vụ.
* **Cổng Khách hàng (Portal):** Giao diện độc lập cho khách hàng tự gửi yêu cầu hỗ trợ và theo dõi tiến độ xử lý.

---

## 4. ĐIỂM KỸ THUẬT VÀ QUY TRÌNH DỮ LIỆU (DATA INTEGRITY & ARCHITECTURE)
* **Lưu trữ đa tầng (Hybrid Storage Layer):** Ưu tiên dữ liệu Supabase kết hợp đồng bộ LocalStorage client-side giúp truy xuất tức thì và chống gián đoạn khi mất kết nối.
* **Tuân thủ strict Rules of Hooks:** Toàn bộ React custom state & hooks được quản lý tập trung ở đầu component scope, tránh triệt để lỗi render hook không đồng nhất.
* **Tính tương thích TypeScript:** Tất cả interface (`ProjectTask`, `Project`, `Staff`, `Ticket`...) đều định nghĩa rõ ràng kiểu dữ liệu và thuộc tính mở rộng.

---

## 5. XÁC NHẬN MỐC PHIÊN BẢN (RESTORE POINT)
* **Version:** `v4.0.0`
* **Git Tag:** `v4.0`
* **Trạng thái Deployment:** Hoạt động ổn định trên Vercel Production (`https://jpt-helpdesk-app.vercel.app`)
