# AI MẤT DẦN QUYỀN NÓI

## Tổng quan ý tưởng

Đây là nền tảng học tập thông minh sử dụng AI nhưng không khuyến khích người học phụ thuộc vào AI. Hệ thống sẽ đo mức sử dụng AI của mỗi học sinh và điều chỉnh mức hỗ trợ theo thời gian.

Nguyên tắc cốt lõi:

AI càng bị lạm dụng thì càng giảm mức hỗ trợ.
AI càng được dùng đúng cách thì càng tăng chất lượng hỗ trợ.

Tagline:

AI không phục vụ sự lười biếng.

---

## Vấn đề cần giải quyết

Hiện nay nhiều học sinh dùng AI để:

- Xin đáp án trực tiếp
  n- Sao chép lời giải mà không hiểu quá trình
- Hỏi liên tục trước khi tự suy nghĩ
- Dần mất khả năng tư duy độc lập

Hầu hết các công cụ AI hiện tại đều tối ưu để chiều người dùng, trả lời càng nhanh càng tốt. Điều đó tạo ra sự lệ thuộc.

Nền tảng này đi theo hướng ngược lại:

Dùng AI để xây dựng tư duy, không phải thay thế tư duy.

---

## Core Mechanism: Brain Fuel System

Mỗi người dùng có một lượng điểm hỗ trợ AI gọi là Brain Fuel.

Ví dụ:

- 1000 điểm mỗi ngày
- Hoặc tích lũy theo tuần / tháng
- Có thể nâng cấp theo tiến độ học tập

Brain Fuel đại diện cho mức hỗ trợ AI mà học sinh có thể sử dụng.

---

## Cách tiêu hao Brain Fuel

Mỗi hành động dùng AI sẽ tốn điểm khác nhau.

### Mức tiêu hao ví dụ

- Hỏi gợi ý ngắn: 30 điểm
- Xin hướng giải: 60 điểm
- Xin giải thích chi tiết: 120 điểm
- Xin full lời giải: 200 điểm
- Phân tích nhiều bài cùng lúc: 300 điểm

Điểm có thể tính dựa trên token API thực tế.

Công thức gợi ý:

Brain Fuel Cost = Prompt Tokens + Completion Tokens x hệ số hỗ trợ

---

## Mức hỗ trợ AI thay đổi theo Brain Fuel

### Khi Brain Fuel cao

AI hỗ trợ tốt:

- Giải thích sâu
- Cho ví dụ
- Chia nhỏ bước giải
- Đề xuất tài liệu phù hợp

### Khi Brain Fuel thấp

AI giảm hỗ trợ:

- Chỉ đưa gợi ý ngắn
- Hỏi ngược lại người học
- Yêu cầu trình bày cách nghĩ trước
- Không cho đáp án trực tiếp

### Khi cạn Brain Fuel

AI chuyển sang chế độ rèn luyện:

- Chỉ hỏi Socratic questions
- Bắt người dùng tự làm trước
- Mở lại hỗ trợ khi có nỗ lực thật

---

## Cách hồi Brain Fuel

Người học có thể lấy lại điểm bằng hành động tích cực.

### Ví dụ

- Nộp bài trước rồi mới hỏi AI: +80
- Tự giải đúng liên tiếp 3 câu: +100
- Viết giải thích reasoning rõ ràng: +120
- Hoàn thành buổi học không dùng AI: +150
- Sửa sai sau feedback: +70

Thông điệp:

Tự học tạo ra năng lượng.

---

## Hệ thống đánh giá người học

### Dependence Score

Đo mức phụ thuộc AI dựa trên:

- Tần suất hỏi
- Tỷ lệ xin đáp án trực tiếp
- Số token tiêu thụ
- Có thử làm trước hay không
- Thời gian tự suy nghĩ trước khi hỏi

### Independence Score

Đo năng lực học chủ động:

- Tự giải bài
  n- Sửa lỗi sau gợi ý
- Hoàn thành quiz không trợ giúp
- Tiến bộ theo thời gian

---

## Ví dụ 2 người dùng để demo

### User A

- Hỏi liên tục xin đáp án
- Tiêu hao 900 Brain Fuel trong 1 giờ
- Dependence Score: 88%
- AI mode: Restricted

AI chỉ trả lời:

"Bạn đã thử cách nào trước chưa?"

### User B

- Tự làm trước rồi hỏi khi bí
- Chỉ dùng 250 Brain Fuel
- Independence Score: 82%
- AI mode: Premium Guidance

AI trả lời chi tiết và chất lượng hơn.

---

## Dashboard giáo viên

Giáo viên có thể xem:

- Học sinh nào lệ thuộc AI cao
- Học sinh nào đang tiến bộ tư duy
- Môn nào bị lạm dụng AI nhiều nhất
- Nhóm học sinh cần hỗ trợ sớm
- Xu hướng Brain Fuel của cả lớp

---

## Điểm khác biệt so với LMS thông thường

LMS truyền thống:

- Đưa nội dung
- Chấm điểm
- Theo dõi tiến độ

AI chatbot thông thường:

- Trả lời nhanh
- Cho đáp án dễ dàng

Nền tảng này:

- Điều tiết hành vi học tập
- Giảm lệ thuộc AI
- Tạo động lực tự suy nghĩ
- Dạy cách dùng AI đúng lúc

---

## Kỹ thuật triển khai nhanh trong hackathon

## Frontend

- React / Next.js
- Progress bar Brain Fuel
- Dashboard học sinh và giáo viên
- Chat UI với AI

## Backend

- Node.js hoặc FastAPI
- Lưu usage history
- Scoring engine
- Recommendation engine

## AI Layer

- OpenAI / Gemini / Ollama
- Đọc token usage từ API
- Prompt routing theo Brain Fuel level

## Database

- PostgreSQL / Firebase

---

## Prompt Logic ví dụ

### Người dùng còn nhiều Brain Fuel

Hãy giải thích chi tiết, đưa ví dụ và gợi ý từng bước.

### Người dùng Brain Fuel thấp

Không đưa đáp án trực tiếp. Hãy hỏi ngược lại để người học tự nghĩ.

### Người dùng hết Brain Fuel

Chỉ dùng phương pháp Socratic. Mỗi lần chỉ hỏi 1 câu ngắn.

---

## Pitch với giám khảo

Trong thời đại AI, vấn đề không còn là thiếu câu trả lời.
Vấn đề là con người mất khả năng tự đặt câu hỏi.

Chúng tôi tạo ra nền tảng nơi AI không nuông chiều sự lười biếng, mà huấn luyện tư duy độc lập.

---

## Tên sản phẩm gợi ý

- ThinkFuel
  n- MindMeter
- BrainForge
- EarnYourHint
- ThinkFirst AI

---

## MVP trong 5 tiếng nên làm

1. Login giả lập 2 user
2. Chat với AI
3. Thanh Brain Fuel giảm theo usage
4. AI phản hồi khác nhau theo Fuel level
5. Dashboard so sánh User A và User B
6. Slide pitch cuối cùng

---

## Mở rộng tương lai

- Tích hợp LMS trường học
- Xếp hạng tư duy toàn trường
- AI coach cá nhân hóa
- Phân tích phong cách học tập
- Chứng chỉ dùng AI có trách nhiệm
