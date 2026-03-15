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

À một cái quan trọng là trên Menu chính sẽ cho chọn giữa 5 level: N4-N5, N3, N2, N1 và All để chuyển đổi giữa các level tổng thể vì việc học theo level là một trong những filter quan trọng nhất để học theo một lối có tổ chức hơn. Khi chọn một level thì sẽ chỉ hiển thị các câu hỏi thuộc level đó thôi để tập trung vào level mình đang học. Còn nếu chọn All thì sẽ hiển thị tất cả các câu hỏi từ tất cả các level để có thể ôn tập chung. (Hiện tại app thì đang là chế độ All vậy là ok rồi nhưng tôi muốn thêm tính năng này để có thể chọn được các level riêng biệt nếu muốn tập trung vào một level cụ thể nào đó). À cái nút này sẽ được hiển thị khá nổi bật và đẹp để tôi chọn nhé.

Tính năng import nếu để ở chế độ all để import thì trong json sẽ bắt buộc phải có trường book_level để khi import xong thì các câu hỏi sẽ được phần vào đúng level tương ứng nhưng mà đôi khi AI tạo ra data cũng có bị sai nên nếu sai format thì hãy báo lỗi để tránh data bị sai. Trường hợp import 2 câu có question.content.original giống nhau thì báo là câu này đã được import và không import nữa tránh việc lặp. (Còn các câu ví dụ hoặc câu liên quan thì lặp thoải mái tha hồ).

À tính năng học Kanji thì phải gộp nhất các từ trùng lặp và các ví dụ liên quan tới nó cũng sẽ đươc cộng dồn và khoogn trùng lặp. Tương tự tất cả các câu ví dụ thì đều cần có phần dịch tiếng việt và phần tiếng Anh tương ứng (tiếng Anh thì có hỗ trợ bật tắt IPA như đã nói ở trên).

Phần học MOJI thì with_red_highlight sẽ không có furigana nhé vì lúc đó nó đang hiển thị là câu hỏi mà. Còn phần with_ruby thì cũng sẽ bôi đỏ từ muốn hỏi nhưng mà có luôn furigana.

Phân Luyện viết kanji khi viết thì ngòi của đầu hiển thị khá nhỏ nên nhìn thấy hơi khó nhìn nên tôi muốn hiển thị cái ngòi to hơn chút sao to bằng chính nét viết luôn, à mà nếu chỉnh được độ rộng đầu ngòi viết thì quá tốt được thì thêm vào setting luôn.

À phần setting thì có phép tăng và giảm size tổng thể của toàn app vì trên ipad hay một số thiết bị khác tôi muốn up size tổng thể toàn bộ để phù hợp với kích thước màn hình nên hãy cũng thêm cái tính năng đó vào setting. Ngoài ra nếu có cái gì phù hợp với setting đó nữa thì cũng thêm vào luôn.

À cái bong bóng setting cho nó cho nó vào vị trí đăng xuất. Còn nút đăng xuất thì nếu ở chế độ mobile thì cho nó vào trong menu xổ xuống luôn để tránh bấm nhầm khi ở trên mobile.

Sửa lại Security một chút nhé:
tạm thời thì sẽ khóa chức năng đăng ký mà thay vào đó chỉ có admin mới có quyền tạo tại khoản tại một trang tạo tài khoản. Còn tài khoản admin thì sẽ sẽ được lưu trong .env tên đăng nhập và pass admin sẽ được lưu trong .env luôn. Tài khoản admin cũng giống như tài khoản bình thường nhưng có thêm nút import data (còn tài khoản thường thì ko được import), tài khoản admin thì sẽ có thể thêm tài khoản thường cho các người dùng khác. Người dùng thì nếu là có người dùng thường và người dùng cộng tác viên thì có quyền import nhưng ko có quyền thêm user.

À khi vào tính năng quiz thì khi vào một câu hỏi mới thì luôn off furigana và khi trả lời xong phần Giải thích chi tiết được hiển thị thì sẽ auto bật furigana. (Tất hiên nút furigana thì vẫn sử dụng như bình thường)
Nhưng mà để thuẩn tiện cho việc học thì khi chuyển sang câu mới đang trả lời thì furigana sẽ tự động tắt đi để khi đọc nếu cần thì phải bấm nút bật lại. Còn khi trả lời câu hỏi rồi phần giải thích hiển thị rồi thì furigana sẽ tự động bật lại để có thể đọc giải thích dễ dàng hơn.

thêm tính năng phím tắt, phần setting cho phép bật tắt chức năng phím tắt.
Chọn đáp án bằng số 1,2,3,4 và dấu space để hiển thị furigana.

Tất nhiên các phần setting vẫn sẽ được lưu trong localStorage để phù hợp với từng thiết bị của tôi.

OK nhớ là cũng hay update chi tiết vào GEMINI_AGENT_GUIDE.md trong prompt-gemini và update các file sample/...json cho phù hợp với những thay đổi mới nhé. Vì quan trọng nhất vẫn là hướng dẫn import data vào app một cách chi tiết và dễ hiểu nhất có thể nhé. Hãy cập nhật sao cho chuẩn xác chi tiết nhất nhé (hãy update thêm chứ đừng bỏ đi vì hiện tại các sample này đều khá chuẩn và chi tiết rồi nên hãy update thêm chứ đừng bỏ đi thứ gì nhé update sao cho phù hợp thôi).

OK hãy thực hiện update những thứ mà tôi nói ở trên.

------

ứng dụng này là bắt buộc login nếu không login thì không được vào xem app để bảo đảm bảo mật, với apply một số security cơ bản như: tránh burt force, hạn chế request liên tục từ ip nào đó kiểu rate limit,.... những nếu chưa đăng nhập thì ko có vào trang nào được hết vì việc lưu quá trình học tập được lưu theo từng user nên nếu chưa đăng nhập thì chưa sửa dụng được. Với đây là ứng dụng private nên tài khoản sẽ được admin tạo như tôi nói ở trên hãy fix lại giúp tôi.

------

ở account Admin thì màn hình user ngoài việc tạo thì có thểm tính năng CRUD user như thêm xóa khóa user, reset password,... để quản lý user dễ dàng hơn. Còn tài khoản bình thường thì chỉ được xem nhưng gì mình được xem ko liên quan gì tới admin.

chức năng chon theo level N4-N5, N3, N2, N1 và All thì ở mobile hãy để nó chung hàng với menu chứ đừng xuống hàng và để chó là select box để chọn. Tương tự ở desktop cũng vậy nó là select box để chọn chứ đừng có để nhiều nút như vậy ko tối ưu không gian. Đặc biệt hiện tại nó không hoạt động như tôi mong muốn. ở đây tôi muốn khi chuyển qua Một level nào đó thì số lượng tổng câu hỏi các kiểu phải chuyển theo tương ứng. Ví dụ all có 120 câu nhưng N2 chỉ có 30 câu thì khi ở level N2 số lượng tổng sẽ là 30. Kiểu như khi chuyển sang level khác thì sẽ không thấy được sự tồn tại của các level khác. trừ leval all thì nó là all rồi không nói nó sẽ là tổng hợp tất cả và giao điện như bây giờ. còn lại khi chuyển level thì nó sẽ là vùng riêng biệt chỉ là level đó thôi các tính toán quá trình học trạng thái học cũng được tính toán theo level đó. Khi chuyển sang all thì sẽ tính toán tiến độ theo all.

Bỏ nút đăng suất vào phần cuối của popup setting luôn chứ giờ nó hiển thị lung tung quá.

Phần deploy phần này quan trọng này:
- Giờ khi deploy lên thì không thể nào để mất data được nên để không mất data dữ liệu sẽ được lứu dưới dạng migation dạng JSON trong folder Migration để mỗi lần update sẽ export data vào migration trước sau đó khi update tính năng mới thì sẽ import data vào lại từ file json.. yên tâm đây là app nhỏ nên mọi thứ để trong json sẽ đều ổn. Tất nhiên tính năng lưu json đã import vẫn được giữ nguyên để tránh thất thoát giữ liệu, vì dữ liệu là vàng nên sẽ luôn lưu lại ở mọi trường hợp. Nhớ là data sẽ được backup dưới dạng json vào folder backup để phòng trường hợp cần thiết để khổi phục lại data nhé. tất nhiên là chỉ khi rảnh rỗi. Ý là backup bằng cách khi tôi ở tài khoản admin sẽ vào
- Việc deploy thì tôi sẽ đẩy nó lên trên một server trên ec2 của aws nên việc deploy mỗi lần update phải cực kỳ đơn giản bằng cách lần đầu tiên tôi sẽ chạy:
- first-deploy.sh để tôi deploy app của mình lên ec2 đó (trên ec2 đó tôi sẽ ko làm gì nhiều ngoài việc mở truy cập cho securiy group cho port 3456 và chạy file first-deploy.sh để deploy app lên đó thôi). Nên trong file first-deploy.sh thì sẽ có các lệnh cần thiết để deploy app lên ec2 một cách đơn giản nhất có thể. Bao gồm cả mở port trên máy ec2 linux đó để cho ko bị tưởng lửa vào vào port 3456 của app luôn nhé. làm sao để khi tôi chỉ cần chạy file first-deploy.sh là xong luôn, sau đó tôi sẽ truy cập vào app thông qua ec2-ip-public:3456 là được luôn nhé.
- Sau đó sẽ là những lần update code vì trong tương lai khi tôi sử dụng sẽ có những sai sót sẽ có những lúc tôi phải update lại code thì bạn hãy giúp tôi tạo file update-deploy.sh để tôi chỉ cần chạy file đó là xong luôn mỗi khi source code có thay đổi và tôi chỉ cần lên ec2 pull source mới nhất về và run update-deploy.sh là xong luôn nhé. Nên trong file update-deploy.sh thì sẽ có các lệnh cần thiết để deploy app lên ec2 một cách đơn giản nhất có thể. Việc deploy update thì sẽ không cần mở port hay gì nhiều như lần đầu tiên nên sẽ đơn giản hơn rất nhiều.

- data sample đang bị có nhiều chỗ lỗi khiễn cho data input vào vẫn có nhiều chỗ thiếu phần transalte tiếng Anh tương ứng lúc thì lại thiếu transalte tiếng việt, hãy bổ sung thêm sao cho sample chuẩn nhất vì sau này tôi sẽ dùng sample để tạo ra data input để import vào app nên sample phải chuẩn nhất có thể được. Nên hãy update lại sample cho chi tiết và chuẩn xác nhất có thể nhé.

- về font chứ thì thêm vài font chữ nữa cho macos, iphone, và một số font chứ phổ biến như Courier New, Times New Roman,.... để tôi có thể chọn được font chữ mà mình thích hơn nhé. Darkmode có một vài chỗ màu sắc khó nhìn nên hãy chỉnh lại darkmode màu mặc định ok hơn nhé Darkmode giờ khá ổn rồi những mà có một số chữ bị màu đậm trên nền tối rất khso đọc như cái tiêu đề H1 tìm và sửa những chỗ tương tự nếu có. Ngoài ra bổ sung thêm một select box các mode màu sắc để chọn ngoài Darkmode và light mode ra thì có thêm một vài mode màu sắc khác như: Dracula theme, Dark+... những cái mode theme phổ biến để chọn. Ngoài ta cho tùy chỉnh màu sắc sâu hơn nữa thì quá tốt ít nhất cho chọn màu sắc: câu hỏi, giải thích, furigana, background,.... để tôi có thể tùy chỉnh sâu hơn nữa màu sắc cho phù hợp với thiết bị và sở thích của tôi hơn nhé. Nên update thêm các tính năng tùy chỉnh màu sắc và theme màu sắc vào setting luôn nhé.

Khi tăng size tổng thể thì tôi thấy quá ok rồi tuy nhiên ở Menu và phần tiêu đề trong quiz chỗ mà có nút "quay lại", 
"điểm, "thanh tiến độ câu n/all.." thì đang bị to quá mức và hiển thị vỡ ở mobile nên hãy check lại toàn bộ cái chức năng tăng size này sao cho phù hợp nhé.

Tất nhiên trong lần này vẫn phải update thêm phần GEMINI_AGENT_GUIDE.md chi tiết hơn nữa chuẩn xác hơn nữa chính xác với hệ thống hiện tại để sao cho Agent Gemini có thể khi tôi import 2 bức hình hoặc một bản pdf 2 trang. Một hình/trang là câu hỏi một hình là câu trả lời thì output sẽ là một json như trong /data/sample/Input.json (hãy sửa lại Input.json nếu cần để sao input chuẩn xác vào hệ thống này chuẩn đét). Và ko giải thích gì thêm, vì tương lai tôi sẽ có 1 cái Agent chụp hình và auto chuyển đổi ra json sau đó import vào hệ thống nên cái fiel GEMINI_AGENT_GUIDE.md hướng dẫn chi tiết và chính xác tới từng bước để import data vào hệ thống là rất quan trọng nên hãy update chi tiết và chính xác hơn nữa nhé. Sửa lại data/sample/...json nếu cần thiết vì sau này các file này sẽ là các file Knowledge base để tôi import vào Agent trên gemeni nên các file này phải được update chi tiết và chính xác hơn nữa nhé.

Hãy thực hiện update toàn diện những yêu cầu trên cho tôi sẽ cố gắng lên mọi thứ sắp hoàn thành rồi đây gần như là lần yêu cầu cuối nên hãy làm chuẩn chỉnh nhất có thể nhé.