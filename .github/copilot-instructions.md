# Copilot Instructions

## Project Overview

Đây là project tạo một app giúp tôi học tiếng Nhật bằng cách trả lời các câu hỏi trắc nghiệm tiếng Nhật. Có phần giải thích chi tiết cho từ vựng và ngữ pháp trong câu hỏi. Thực ra nó là một quyển sách nhưng khi học bằng một quyển sách thì rất khó để tra cứu và tiện lợi, nên tôi muốn nó ở dạng app để dễ dàng tra cứu và sử dụng hơn.

- Mục đích cuối cùng là có một app trắc nghiệm để tôi học tiếng Nhật.
- App có tính năng học và quản lý tiến độ học tiếng Nhật của tôi. Chỉ cần đánh dấu lại tiến trình câu mà tôi đã học ví dụ như những câu hay sai, những câu đã học, random toàn bộ, randome theo level, randome theo các câu đánh sao,... những tính năng khá giống với Quizzlet nhưng nó sẽ được thiết kế để phục vụ cho việc học tiếng Nhật của tôi. Đăng nhập thì đăng nhập với tên đăng nhập và mật khẩu đơn giản, không cần xác thực qua email hay xác thực 2 yếu tố gì cả, chỉ cần có tài khoản để lưu trữ tiến độ học tập của tôi thôi. Vì quy mô app hiện tại chỉ 1-2 người học thôi nên chỉ cần thế là đủ đăng ký một tài khoản và đăng nhập là được, không cần xác thực qua email hay xác thực 2 yếu tố gì cả.
- Có tính năng học theo từng skill ví dụ:
  - MOJI: thì cho phép tập viết hán tự bằng cách sử dụng thư viện https://hanziwriter.org/ để tập viết hán tự, có cả animation để hiển thị cách viết hán tự đó nữa. Giống Duolingo tập viết hán tự vậy. Tôi sẽ thực hiện viết nó bằng Ipad hoặc là bằng chuột trên máy tính của mình, nên cần có cả 2 cách để tập viết hán tự đó. Có animation để hiển thị cách viết hán tự đó nữa.
  - GOI: thì tập trung vào từ vựng
  - BUNPO: thì tập trung vào ngữ pháp
- Nhưng tất nhiên cơ bản nhất nó vẫn đi theo data ở trong các file `data/sample/` json có nghĩa là các câu hỏi trắc nghiệm có 4 đáp án và một một đáp án đúng trả lời xong thì có phần giải thích. Có hỗ trợ furigana tắt bật, và lưu lại tiến trình học.

CHỐT LẠI QUAN TRỌNG NHẤT ĐÂY LÀ MỘT APP: Trắc nghiệm tiếng Nhật với các câu hỏi trắc nghiệm có 4 đáp án và một đáp án đúng, có phần giải thích chi tiết cho từ vựng và ngữ pháp trong câu hỏi, có hỗ trợ furigana tắt bật, và lưu lại tiến trình học. Có hỗ trợ học chữ Hán,.... Thực ra tất cả data trên tôi đã lấy từ một quyển sách và chuyển nó một vài câu đầu của 4 quyển sách thành các file JSON trong `data/sample/` rồi để bạn thảm khảo và hiểu được data hiện có hãy tạo ra một app học siêu đỉnh để giải quyết nỗi đau của tôi.

Nối đau đó là khi học với sách bất tiện và mỗi khi làm phải đánh dấu lại quá trính học, tôi muốn tạo ra một app mà cho phép tôi import data bằng file json hoặc data json import file hoặc điền vào text-area. tôi sẽ tạo ra các file JSON đó bằng cách chụp hình các trang sách và dùng OCR hoặc AI để chuyển nó thành các file JSON rồi import vào app để học. Nên cần có tính năng import data bằng file json hoặc data json import file hoặc điền vào text-area (đây là tính năng quan trọng nhất.) Sau khi import thì data sẽ lưu vào SQLite để quản lý và sử dụng trong app đồng thời để sử dụng sau này thì cũng sẽ được lưu vào folder data/imported/ dưới dạng file JSON để sau này có thể tham khảo lại nếu cần thiết và tái sử dụng sau này tránh trường hợp data bị mất khi sử dụng với SQLite.

## Môi trường phát triển
- [ ] Tôi sử dụng wsl trên Windows, và đôi khi cũng dùng macbook.

### Language & Framework
- [ ] Primary language (TypeScript, tailwindcss)
- [ ] Framework or runtime (Next.js)
- [ ] DB (SQLite)

### Project Structure
- [ ] Chỗ này chứa data sample (`data/sample/`) cái này rất quan trọng khi tạo app cần phải đọc toàn bộ các JSON này để thiết kế app sao cho chuẩn chỉnh sao cho sử dụng được hết được nội dung JSON đó phục vụ trong app. Đó chính là các data model để bạn tham khảo và tạo app.

### Japanese-Learning Domain Notes
- Đây là app giúp tôi học tiếng Nhật bằng cách trả lời các câu hỏi trắc nghiệm tiếng Nhật. Có phần giải thích chi tiết cho từ vựng và ngữ pháp trong câu hỏi.
- Khi tôi hỏi bằng Tiếng Việt thì trả lời bằng tiếng Việt, khi tôi hỏi bằng Tiếng Anh thì trả lời bằng tiếng Anh.
