Đây là prompt tôi dùng để tạo app này mỗi lần tôi hỏi sẽ thực hiện update thêm vào đây và sử dụng ------ để ngăn cách dữa các prompt cũ và câu tôi muốn hỏi sẽ nằm cuối cùng sau ------ cuối cùng hãy follow và trả lời cho chuẩn xác.

------

Giờ hãy tạo giúp tôi 1 app từ a-z cho app của tôi thật đỉnh cao nhất có thể. Đầu tiên hãy phân tích thật sâu các yêu cầu của tôi trong copilot-instructions.md và tạo app cho thật đỉnh.

Sau khi tạo app xong thì phải tạo ra một bản markdown hướng dẫn để tôi tạo một Agent trên ứng dụng Gemini chat AI để mỗi khi tôi nhập vào hình như tôi import thì sẽ ra được data json như data/sample/Input.json rồi tôi dùng nó import vào app này và có được các câu hỏi mới vì tổng hết 4 quyển sách có tầm 2000 câu hỏi nên tôi sẽ import dần dần nên việc hướng dẫn chi tiết để lấy được data rất quan trọng nhé.

Rồi giờ hãy thực hiện tạo app từ a-z nhé.

------

Hãy thực hiện sửa lại như sau:

1. Phần MOJI:
  - Khi hiển thị giải thích chi tiết từ Hán tự thì sẽ có luôn phần hiển hị hanzwrite với kích thưởng nhỏ ngang bằng chữ bên cạnh để click vào xem thì popup nó to lên và cho phép tập viết.
  - Phần MOJI data sample đang có vấn đề trong câu hỏi đang không xác định được từ nào là từ đang muốn hỏi. Vì vậy trong phần sample thì phải có thêm một trường kiểu content.questionWithRedHighlight và có đánh dấu cụ thể từ nào là từ đang muốn hỏi bằng thẻ <span style="color: red;">từ đỏ</span> để khi hiển thị thì từ đỏ sẽ được tô đậm và người dùng có thể dễ dàng nhận biết được từ nào là từ đang muốn hỏi.

2. Sửa lại các file sample:
- Bổ sung thêm phần phần phát âm IPA cho câu các câu Dịch nghĩa tiếng Anh khi bật tắt furigana tiếng nhật thì sẽ bật tắt furigana còn tiếng anh thì sẽ bật tắt IPA. (tất nhiên cũng sẽ lưu 2 câu tiếng anh 1 câu origin và một câu có thêm IPA bằng thẻ ruby để khi hiển thị thì có thể bật tắt IPA được). Hiện tại tôi thấy furigana cho các chữ lớn thì ok nhưng furigana cho các chữ nhỏ cũng cũng cỡ với furigana cho các chữ lớn nên khi hiển thị chữ nhỏ thì furigana sẽ rất to và không đẹp mắt nên tôi muốn có thể chỉnh sửa size của furigana cho các chữ nhỏ để nó nhỏ hơn và phù hợp với chữ nhỏ hơn. Nên khi chỉnh furigana thì phải tách biệt furigana cho các thẻ ví dụ như H1, H2, H3,... tuy nhiên  như vậy thì quá nhiều cái phải chỉnh nên chỉ cần chỉnh size của furigana cho các chữ nhỏ và chữ to hoặc một chữ đang sử dụng trong câu hỏi thôi, ví dụ hiện tại là phần câu hỏi chữ lỡn và phần giải thích chữ nhỏ nên sẽ tách biết ra phần size furigana cho câu hỏi và phần size furigana cho giải thích để tôi có thể chỉnh sửa size của furigana cho phần câu hỏi và giải thích một cách riêng biệt với nhau.


3. Sửa về mặt UI/UX/APP:
- Phần hiển thị furigana cho phép chỉnh sửa sửa size thông qua một setting ở một nút bong bóng ở góc trên cùng bên phải. Khi click vào nút đó sẽ hiển thị ra một popup cho phép chỉnh sửa size của furigana, Dark mode, kích chỡ chữ, font chữ, màu chữ,.... Màu như giờ là ok rồi nó sẽ là màu mặc định mỗi khi tôi nhấn reset lại setting nó sẽ trở lại như bây giờ. Quang trọng nhất là cho phép tôi chỉnh size của furigana để nhó có thể nhỏ hơn phù hợp với mạn hình hiện tại của tôi.

Về mặt logic:
Logic ôn tập hay tiến độ học cái này rất quan trọng vì nó giúp tôi biết được mình đang ở đâu trong quá trình học và các câu nào mình đã nắm chắc và các câu nào mình vẫn chưa nắm chắc để tập trung vào những câu mình chưa nắm chắc. Vì vậy logic ôn tập sẽ rất quan trọng và phải được thiết kế một cách chi tiết và hợp lý nhất có thể. Logic ôn tập sẽ dựa trên cơ sở như sau:
- Các câu nào bị sai thì phải đúng 3 lần liên tiếp tiếp theo mới được cho là câu đã được ôn tập đúng. Ôn tập sẽ chia làm các loại:
- Câu đánh dấu sao
- Câu nắm chắc là các câu đã đúng 3 lần liên tiếp trọng số là +3
- Câu đang học là các câu đã đúng 1 hoặc 2 lần liên tiếp (+1, +2)
- Câu chưa học là các câu chưa học lần nào thì trọng số là 0
- Câu hay sai là các câu đã trả lời sai dù chỉ một lần thì sẽ bị đánh trọng số là -1. Có nghĩa là phải 4 lần tiếp theo đúng mới được liệt vào các câu nắm chắc. Nếu một câu nào đó đã đú 2 lần tức là +2 mà lần thứ 3 trả lời sai cũng sẽ thành -1.

- À tương tự các từ kanji cũng vậy cũng cần phải được ôn tập với logic tương tự như vậy để tôi biết được từ nào mình đã nắm chắc và từ nào mình vẫn chưa nắm chắc để tập trung vào những từ mình chưa nắm chắc.

Hay có thể tách riêng 3 phần ôn tập cho 3 skill: MOJI, GOI, BUNPOU để tôi có thể dễ dàng theo dõi được mình đang ở đâu trong quá trình học và tập trung vào những phần mình chưa nắm chắc. Mỗi cái đều quản lý theo tiên độ riêng.

Và một cái cái chế độ Chung thì sẽ ôn chung cho cả 3 skill.

4. Run app test thì tôi muốn run luôn trên host để các máy trên cùng wifi có thể truy cập được thông qua 192.168.x.x:3456 chứ không chỉ localhost nữa để tôi có thể test trên điện thoại luôn xem có ổn không. Port gốc của app là 3456.

5. Mỗi lần update sample và imput sample thì cũng sửa GEMINI_AGENT_GUIDE.md để phù hợp với app luôn nhé. Vì trong thực tế quan trọng nhất vẫn là cần để import data được vào app một cách dễ dàng và chính xác nhất nên hướng dẫn import data vào app sẽ rất quan trọng nên hãy update hướng dẫn trong GEMINI_AGENT_GUIDE.md một cách chi tiết và dễ hiểu nhất có thể nhé.

Hãy sửa lại hoàn chỉnh app của tôi nhé. Sao cho app đỉnh của job hơn nữa.

---------

Sửa lại Security một chút nhé:
tạm thời thì sẽ khóa chức năng đăng ký mà thay vào đó chỉ có admin mới có quyền tạo tại khoản tại một trang tạo tài khoản. Còn tài khoản admin thì sẽ sẽ được lưu trong .env tên đăng nhập và pass admin sẽ được lưu trong .env luôn. Tài khoản admin cũng giống như tài khoản bình thường nhưng có thêm nút import data (còn tài khoản thường thì ko được import), tài khoản admin thì sẽ có thể thêm tài khoản thường cho các người dùng khác. Người dùng thì nếu là có người dùng thường và người dùng cộng tác viên thì có quyền import nhưng ko có quyền thêm user.

À khi vào tính năng quiz thì khi vào một câu hỏi mới thì luôn off furigana và khi trả lời xong phần Giải thích chi tiết được hiển thị thì sẽ auto bật furigana. (Tất hiên nút furigana thì vẫn sử dụng như bình thường)
Nhưng mà để thuẩn tiện cho việc học thì khi chuyển sang câu mới đang trả lời thì furigana sẽ tự động tắt đi để khi đọc nếu cần thì phải bấm nút bật lại. Còn khi trả lời câu hỏi rồi phần giải thích hiển thị rồi thì furigana sẽ tự động bật lại để có thể đọc giải thích dễ dàng hơn.

thêm tính năng phím tắt, phần setting cho phép bật tắt chức năng phím tắt.
Chọn đáp án bằng số 1,2,3,4 và dấu space để hiển thị furigana.

Tất nhiên các phần setting vẫn sẽ được lưu trong localStorage để phù hợp với từng thiết bị của tôi.