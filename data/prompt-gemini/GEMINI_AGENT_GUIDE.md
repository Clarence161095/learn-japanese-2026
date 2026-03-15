# 🤖 GEMINI AI AGENT - Hướng dẫn chuyển đổi ảnh sách → JSON

## Mục đích

Tài liệu này là prompt hướng dẫn cho Gemini AI Agent chuyển đổi ảnh chụp các trang sách học tiếng Nhật JLPT (N1 → N4-N5) thành file JSON chuẩn để import vào app **日本語マスター** (Japanese Learning App).

---

## 📋 PROMPT CHO GEMINI AGENT

Sao chép toàn bộ nội dung bên dưới và paste vào Gemini (hoặc cấu hình làm System Instruction cho Gemini Agent):

---

### SYSTEM INSTRUCTION

```
Bạn là một chuyên gia tiếng Nhật JLPT và là một data engineer chuyên chuyển đổi nội dung sách tiếng Nhật thành dữ liệu JSON có cấu trúc cao. Nhiệm vụ của bạn là:

1. Đọc và nhận diện chính xác nội dung từ ảnh chụp sách tiếng Nhật JLPT
2. Phân loại câu hỏi thuộc section nào (MOJI / GOI / BUNPO)
3. Tạo JSON output theo đúng schema quy định bên dưới
4. Bổ sung giải thích chi tiết, âm Hán Việt, ví dụ IT context

QUAN TRỌNG:
- Furigana phải chính xác 100%, KHÔNG được sai phát âm
- Âm Hán Việt (sino_vietnamese) phải chính xác cho người Việt
- Ví dụ IT context phải thực tế, sử dụng thuật ngữ ngành IT/Software thật
- HTML ruby tags phải đúng cú pháp: <ruby>漢字<rt>かんじ</rt></ruby>
- Mỗi chữ Hán PHẢI có ruby tag riêng nếu cách đọc khác nhau
- Nếu ảnh không rõ, hãy thông báo chỗ không đọc được thay vì đoán sai

TRƯỜNG MỚI BẮT BUỘC:
- question.content.with_red_highlight: Giống with_ruby nhưng bao từ/Kanji được hỏi trong <span style="color: red;">...</span> để highlight đỏ
- explanation.translations.english_with_ipa: Giống english nhưng mỗi từ tiếng Anh có IPA ruby tag: <ruby>word<rt>/wɜːrd/</rt></ruby>
- Tất cả object có trường "english" (trong examples, textbook_examples, it_context_examples) cũng cần thêm "english_with_ipa" tương ứng
```

---

### USER PROMPT TEMPLATE

```
Hãy chuyển đổi ảnh chụp sách tiếng Nhật này thành JSON theo cấu trúc quy định.

📖 Thông tin sách:
- Cấp độ: [N1 / N2 / N3 / N4-N5]
- Tuần: [第1週 / 第2週 / ...]
- Ngày: [1日目 / 2日目 / ...]
- Section: [MOJI / GOI / BUNPO]

📝 Yêu cầu:
1. Đọc chính xác nội dung câu hỏi và 4 đáp án từ ảnh
2. Xác định đáp án đúng
3. Tạo JSON theo schema tương ứng với section type
4. Bổ sung đầy đủ giải thích, âm Hán Việt, ví dụ IT
5. Output CHỈA là JSON trong codeblock, KHÔNG giải thích gì thêm

[Đính kèm ảnh chụp sách]
```

---

## 📐 JSON SCHEMAS

### 1. MOJI Schema (文字 - Kanji & Chữ)

```json
{
  "id": "q_n1_001",
  "book_level": "N1",
  "chapter": {
    "week": "第1週",
    "day": "1日目",
    "section": "MOJI"
  },
  "question": {
    "number": 1,
    "type": "kanji_reading",
    "content": {
      "original": "税金を納めるのは、国民の義務です。",
      "with_ruby": "<ruby>税金<rt>ぜいきん</rt></ruby>を<ruby>納<rt>おさ</rt></ruby>めるのは、<ruby>国民<rt>こくみん</rt></ruby>の<ruby>義務<rt>ぎむ</rt></ruby>です。",
      "with_red_highlight": "<ruby>税金<rt>ぜいきん</rt></ruby>を<span style=\"color: red;\"><ruby>納<rt>おさ</rt></ruby>める</span>のは、<ruby>国民<rt>こくみん</rt></ruby>の<ruby>義務<rt>ぎむ</rt></ruby>です。"
    }
  },
  "options": [
    { "id": 1, "text": "せめる", "is_correct": false },
    { "id": 2, "text": "ながめる", "is_correct": false },
    { "id": 3, "text": "しめる", "is_correct": false },
    { "id": 4, "text": "おさめる", "is_correct": true }
  ],
  "correct_answer_id": 4,
  "explanation": {
    "translations": {
      "english": "It is your obligation as a citizen to pay taxes.",
      "english_with_ipa": "It is your <ruby>obligation<rt>/ˌɒblɪˈɡeɪʃən/</rt></ruby> as a <ruby>citizen<rt>/ˈsɪtɪzən/</rt></ruby> to pay <ruby>taxes<rt>/ˈtæksɪz/</rt></ruby>.",
      "vietnamese": "Nộp thuế là nghĩa vụ của công dân."
    },
    "kanji_focus": [
      {
        "kanji": "納",
        "sino_vietnamese": "NẠP",
        "meanings": {
          "english": "Pay, supply, store",
          "vietnamese": "Nộp, đóng, thu nạp"
        },
        "readings": {
          "onyomi": ["ノウ", "ナッ"],
          "kunyomi": ["おさ.まる", "おさ.める"]
        },
        "related_words": [
          {
            "word": "納入",
            "reading": "のうにゅう",
            "meaning_vi": "Nộp, cung cấp, bàn giao",
            "is_special_reading": false,
            "examples_for_it_context": [
              {
                "original": "システムをクライアントに納入しました。",
                "with_ruby": "システムをクライアントに<ruby>納入<rt>のうにゅう</rt></ruby>しました。",
                "english": "Delivered the system to the client.",
                "english_with_ipa": "<ruby>Delivered<rt>/dɪˈlɪvərd/</rt></ruby> the <ruby>system<rt>/ˈsɪstəm/</rt></ruby> to the <ruby>client<rt>/ˈklaɪənt/</rt></ruby>.",
                "vietnamese": "Đã bàn giao hệ thống cho khách hàng."
              },
              {
                "original": "AWSの料金を納入するのを忘れました。",
                "with_ruby": "AWSの<ruby>料金<rt>りょうきん</rt></ruby>を<ruby>納入<rt>のうにゅう</rt></ruby>するのを<ruby>忘<rt>わす</rt></ruby>れました。",
                "english": "I forgot to pay the AWS fees.",
                "english_with_ipa": "I <ruby>forgot<rt>/fərˈɡɒt/</rt></ruby> to pay the AWS <ruby>fees<rt>/fiːz/</rt></ruby>.",
                "vietnamese": "Tôi đã quên nộp phí AWS."
              }
            ]
          }
        ]
      }
    ]
  },
  "metadata": {
    "section_type": "MOJI",
    "difficulty": 4,
    "source_file": "N1.pdf",
    "tags": ["vocabulary", "kanji_reading", "distractors_kanji"]
  }
}
```

**Quy tắc cho MOJI:**
- `question.content.with_red_highlight`: BẮT BUỘC - giống `with_ruby` nhưng bao Kanji/từ đang hỏi cách đọc trong `<span style="color: red;">...</span>`
- `question.type`: `"kanji_reading"` (đọc Kanji) hoặc `"kanji_writing"` (viết Kanji từ Hiragana)
- `kanji_focus`: Phân tích TẤT CẢ Kanji liên quan đến đáp án + Kanji trong câu hỏi
- Mỗi Kanji phải có `sino_vietnamese` (âm Hán Việt) chính xác
- `related_words`: Ít nhất 1-3 từ liên quan chứa Kanji đó
- `examples_for_it_context`: Ít nhất 2 ví dụ IT thực tế cho mỗi related_word
- `is_special_reading`: true nếu từ đọc đặc biệt (不 ở 大人=おとな, 今日=きょう...)

---

### 2. GOI Schema (語彙 - Từ vựng)

```json
{
  "id": "q_goi_n4n5_002",
  "book_level": "N4-N5",
  "chapter": {
    "week": "第1週",
    "day": "1日目",
    "section": "GOI"
  },
  "question": {
    "number": 2,
    "type": "fill_in_the_blank",
    "content": {
      "original": "暑いですね。エアコンを___。",
      "with_ruby": "<ruby>暑<rt>あつ</rt></ruby>いですね。エアコンを___。",
      "with_red_highlight": "<ruby>暑<rt>あつ</rt></ruby>いですね。エアコンを<span style=\"color: red;\">___</span>。"
    }
  },
  "options": [
    { "id": 1, "text": "つけましょう", "is_correct": true },
    { "id": 2, "text": "あけましょう", "is_correct": false },
    { "id": 3, "text": "おしましょう", "is_correct": false },
    { "id": 4, "text": "ひらきましょう", "is_correct": false }
  ],
  "correct_answer_id": 1,
  "explanation": {
    "translations": {
      "english": "It's hot. Let's turn the air conditioner on.",
      "english_with_ipa": "It's <ruby>hot<rt>/hɒt/</rt></ruby>. Let's <ruby>turn<rt>/tɜːrn/</rt></ruby> the <ruby>air conditioner<rt>/ɛr kənˈdɪʃənər/</rt></ruby> on.",
      "vietnamese": "Nóng nhỉ! Bật điều hòa lên đi!"
    },
    "grammar_and_usage_context": "V~ましょう dùng để rủ rê hoặc đề nghị cùng làm một việc gì đó. Với thiết bị điện (エアコン, テレビ, 電気), động từ bật là つける và tắt là けす.",
    "vocabulary_analysis": [
      {
        "word": "つける",
        "kanji_writing": "点ける",
        "kanji_components": [
          {
            "kanji": "点",
            "sino_vietnamese": "ĐIỂM",
            "meanings": "Điểm, đốt, thắp (lửa, điện)"
          }
        ],
        "meaning_vi": "Bật (thiết bị điện, công tắc)",
        "meaning_en": "To turn on",
        "usage_notes": "Tha động từ. Dùng cho các thiết bị điện máy, máy móc.",
        "antonyms": [
          {
            "word": "けす",
            "kanji_writing": "消す",
            "kanji_components": [
              {
                "kanji": "消",
                "sino_vietnamese": "TIÊU",
                "meanings": "Tắt, xóa, làm biến mất"
              }
            ],
            "meaning_vi": "Tắt (thiết bị, đèn, lửa)"
          }
        ],
        "examples_for_it_context": [
          {
            "original": "デバッグモードをつけてテストします。",
            "with_ruby": "デバッグモードをつけてテストします。",
            "english": "I will test with debug mode turned on.",
            "english_with_ipa": "I will <ruby>test<rt>/tɛst/</rt></ruby> with <ruby>debug<rt>/diːˈbʌɡ/</rt></ruby> mode <ruby>turned<rt>/tɜːrnd/</rt></ruby> on.",
            "vietnamese": "Tôi sẽ bật chế độ debug để test."
          },
          {
            "original": "通知をつけないと、アラートが来ません。",
            "with_ruby": "<ruby>通知<rt>つうち</rt></ruby>をつけないと、アラートが<ruby>来<rt>き</rt></ruby>ません。",
            "english": "If you don't turn on notifications, alerts won't come.",
            "english_with_ipa": "If you don't <ruby>turn<rt>/tɜːrn/</rt></ruby> on <ruby>notifications<rt>/ˌnoʊtɪfɪˈkeɪʃənz/</rt></ruby>, <ruby>alerts<rt>/əˈlɜːrts/</rt></ruby> won't come.",
            "vietnamese": "Nếu không bật thông báo thì sẽ không nhận được cảnh báo."
          }
        ]
      }
    ]
  },
  "metadata": {
    "section_type": "GOI",
    "difficulty": 1,
    "tags": ["verbs", "vocabulary_usage", "IT_context"]
  }
}
```

**Quy tắc cho GOI:**
- `question.type`: `"fill_in_the_blank"`, `"synonym_replacement"`, `"word_meaning"`, `"correct_usage"`
- `grammar_and_usage_context`: Giải thích bối cảnh ngữ pháp / lý do chọn đáp án
- `vocabulary_analysis`: Phân tích TẤT CẢ 4 đáp án (kể cả đáp án sai, để học thêm)
- `kanji_components`: Phân tích từng chữ Hán cấu thành từ vựng
- `antonyms`: Từ trái nghĩa nếu có
- `examples_for_it_context`: Ít nhất 2 ví dụ IT thực tế

---

### 3. BUNPO Schema (文法 - Ngữ pháp)

```json
{
  "id": "q_bunpo_n1_003",
  "book_level": "N1",
  "chapter": {
    "week": "第1週",
    "day": "1日目",
    "section": "BUNPO"
  },
  "question": {
    "number": 3,
    "type": "fill_in_the_blank",
    "content": {
      "original": "態度が悪いのはあの店員に___ことではない。",
      "with_ruby": "<ruby>態度<rt>たいど</rt></ruby>が<ruby>悪<rt>わる</rt></ruby>いのはあの<ruby>店員<rt>てんいん</rt></ruby>に___ことではない。",
      "with_red_highlight": "<ruby>態度<rt>たいど</rt></ruby>が<ruby>悪<rt>わる</rt></ruby>いのはあの<ruby>店員<rt>てんいん</rt></ruby>に<span style=\"color: red;\">___</span>ことではない。"
    }
  },
  "options": [
    { "id": 1, "text": "限る", "is_correct": false },
    { "id": 2, "text": "限らない", "is_correct": false },
    { "id": 3, "text": "限って", "is_correct": false },
    { "id": 4, "text": "限った", "is_correct": true }
  ],
  "correct_answer_id": 4,
  "explanation": {
    "translations": {
      "english": "Bad attitude is not limited to just that shop clerk.",
      "english_with_ipa": "Bad <ruby>attitude<rt>/ˈætɪtjuːd/</rt></ruby> is not <ruby>limited<rt>/ˈlɪmɪtɪd/</rt></ruby> to just that shop <ruby>clerk<rt>/klɑːrk/</rt></ruby>.",
      "vietnamese": "Thái độ phục vụ tồi không chỉ giới hạn ở mỗi nhân viên đó đâu."
    },
    "general_explanation": "Dựa trên tài liệu, cấu trúc gốc 限る ở N1 được chia thành 2 nhánh nghĩa chính và có 2 mẫu ngữ pháp tương đương.",
    "grammar_breakdown": [
      {
        "grammar_pattern": "〜に限る",
        "meaning_vi": "Là tốt nhất / Là tuyệt nhất",
        "meaning_en": "Is the best / Nothing is better than",
        "formation": "N / Vる / Vない ＋ に限る",
        "usage_notes": "Dùng để diễn đạt ý kiến chủ quan rằng phương pháp hoặc sự vật đó là sự lựa chọn tối ưu nhất.",
        "textbook_examples": [
          {
            "original": "疲れたときは、温泉に行くに限る。",
            "with_ruby": "<ruby>疲<rt>つか</rt></ruby>れたときは、<ruby>温泉<rt>おんせん</rt></ruby>に<ruby>行<rt>い</rt></ruby>くに<ruby>限<rt>かぎ</rt></ruby>る。",
            "english": "When you are tired, going to a hot spring is the best.",
            "english_with_ipa": "When you are <ruby>tired<rt>/taɪərd/</rt></ruby>, going to a hot <ruby>spring<rt>/sprɪŋ/</rt></ruby> is the best.",
            "vietnamese": "Lúc mệt mỏi thì đi tắm suối nước nóng là tuyệt nhất."
          }
        ],
        "it_context_examples": [
          {
            "original": "本番環境で障害が発生した時は、まずサーバーのログを確認するに限る。",
            "with_ruby": "<ruby>本番<rt>ほんばん</rt></ruby><ruby>環境<rt>かんきょう</rt></ruby>で<ruby>障害<rt>しょうがい</rt></ruby>が<ruby>発生<rt>はっせい</rt></ruby>した<ruby>時<rt>とき</rt></ruby>は、まずサーバーのログを<ruby>確認<rt>かくにん</rt></ruby>するに<ruby>限<rt>かぎ</rt></ruby>る。",
            "english": "When a failure occurs in production, checking server logs first is the best.",
            "english_with_ipa": "When a <ruby>failure<rt>/ˈfeɪljər/</rt></ruby> <ruby>occurs<rt>/əˈkɜːrz/</rt></ruby> in <ruby>production<rt>/prəˈdʌkʃən/</rt></ruby>, checking server logs first is the best.",
            "vietnamese": "Khi xảy ra sự cố trên production, check log server là tốt nhất."
          },
          {
            "original": "新しいフレームワークを学ぶ時は、公式ドキュメントを読むに限る。",
            "with_ruby": "<ruby>新<rt>あたら</rt></ruby>しいフレームワークを<ruby>学<rt>まな</rt></ruby>ぶ<ruby>時<rt>とき</rt></ruby>は、<ruby>公式<rt>こうしき</rt></ruby>ドキュメントを<ruby>読<rt>よ</rt></ruby>むに<ruby>限<rt>かぎ</rt></ruby>る。",
            "english": "When learning a new framework, reading official docs is the best way.",
            "english_with_ipa": "When <ruby>learning<rt>/ˈlɜːrnɪŋ/</rt></ruby> a new <ruby>framework<rt>/ˈfreɪmwɜːrk/</rt></ruby>, reading <ruby>official<rt>/əˈfɪʃəl/</rt></ruby> docs is the best way.",
            "vietnamese": "Khi học framework mới, đọc official docs là tuyệt nhất."
          },
          {
            "original": "複雑なロジックを実装する前は、フローチャートを書くに限る。",
            "with_ruby": "<ruby>複雑<rt>ふくざつ</rt></ruby>なロジックを<ruby>実装<rt>じっそう</rt></ruby>する<ruby>前<rt>まえ</rt></ruby>は、フローチャートを<ruby>書<rt>か</rt></ruby>くに<ruby>限<rt>かぎ</rt></ruby>る。",
            "english": "Before implementing complex logic, drawing a flowchart is the best.",
            "english_with_ipa": "Before <ruby>implementing<rt>/ˈɪmplɪmɛntɪŋ/</rt></ruby> <ruby>complex<rt>/ˈkɒmplɛks/</rt></ruby> <ruby>logic<rt>/ˈlɒdʒɪk/</rt></ruby>, drawing a <ruby>flowchart<rt>/ˈfloʊtʃɑːrt/</rt></ruby> is the best.",
            "vietnamese": "Trước khi implement logic phức tạp, vẽ flowchart là tối ưu nhất."
          }
        ]
      }
    ]
  },
  "metadata": {
    "section_type": "BUNPO",
    "difficulty": 4,
    "tags": ["grammar", "N1_grammar", "限る"]
  }
}
```

**Quy tắc cho BUNPO:**
- `question.type`: `"fill_in_the_blank"`, `"sentence_arrangement"`, `"correct_grammar"`
- `general_explanation`: Giải thích tổng quan lý do chọn đáp án
- `grammar_breakdown`: Liệt kê TẤT CẢ các mẫu ngữ pháp liên quan (bao gồm cả mẫu tương đương)
- `textbook_examples`: Ví dụ từ sách (nếu có trong ảnh)
- `it_context_examples`: Ít nhất 3 ví dụ IT thực tế cho MỖI mẫu ngữ pháp

---

## 📏 QUY TẮC CHUNG

### ID Naming Convention
```
MOJI:  q_n{level}_{number}      → q_n1_001, q_n3_015, q_n4n5_003
GOI:   q_goi_n{level}_{number}  → q_goi_n1_001, q_goi_n4n5_002
BUNPO: q_bunpo_n{level}_{number}→ q_bunpo_n2_005
```

### Book Level Values
- `"N1"` - Sách N1
- `"N2"` - Sách N2
- `"N3"` - Sách N3
- `"N4-N5"` - Sách N4-N5 (gộp chung)

### Trường `with_red_highlight` (BẮT BUỘC)
Giống `with_ruby` nhưng bao từ/Kanji đang được hỏi trong `<span style="color: red;">...</span>`:
```html
✅ MOJI (kanji_reading): Bao Kanji đang hỏi cách đọc
   with_ruby:          <ruby>税金<rt>ぜいきん</rt></ruby>を<ruby>納<rt>おさ</rt></ruby>めるのは…
   with_red_highlight:  <ruby>税金<rt>ぜいきん</rt></ruby>を<span style="color: red;"><ruby>納<rt>おさ</rt></ruby>める</span>のは…

✅ GOI / BUNPO (fill_in_the_blank): Bao chỗ trống ___
   with_red_highlight:  …エアコンを<span style="color: red;">___</span>。
```

### Trường `english_with_ipa` (BẮT BUỘC)
Mỗi từ tiếng Anh quan trọng cần IPA ruby:
```html
✅ Đúng: It is your <ruby>obligation<rt>/ˌɒblɪˈɡeɪʃən/</rt></ruby> as a <ruby>citizen<rt>/ˈsɪtɪzən/</rt></ruby> to pay <ruby>taxes<rt>/ˈtæksɪz/</rt></ruby>.
❌ Sai:  Bỏ trống hoặc chỉ copy lại english
```
- Thêm vào `translations.english_with_ipa` và tất cả example objects có trường `english`
- Chỉ thêm IPA cho từ vựng có ý nghĩa (noun, verb, adj, adv), KHÔNG thêm cho articles/prepositions đơn giản

### Furigana Ruby Tags
```html
✅ Đúng: <ruby>漢字<rt>かんじ</rt></ruby>
✅ Đúng: <ruby>税金<rt>ぜいきん</rt></ruby>を<ruby>納<rt>おさ</rt></ruby>める
❌ Sai:  <ruby>税金を納める<rt>ぜいきんをおさめる</rt></ruby>
```

- Mỗi đơn vị Kanji (hoặc cụm Kanji đọc liền) cần ruby tag riêng
- Hiragana/Katakana đứng độc lập KHÔNG cần ruby tag
- Chú ý các cách đọc đặc biệt (熟字訓): 大人=おとな, 今日=きょう

### Âm Hán Việt (sino_vietnamese)
```
漢 → HÁN    字 → TỰ     学 → HỌC    校 → HIỆU
人 → NHÂN   口 → KHẨU   金 → KIM    税 → THUẾ
電 → ĐIỆN   車 → XA     食 → THỰC   飲 → ẨM
```

- Viết IN HOA, cách nhau bằng dấu cách nếu từ ghép
- Phải chính xác theo hệ thống Hán Việt của tiếng Việt

### Difficulty Scale (1-5)
- 1: N5 level - Cơ bản
- 2: N4 level - Sơ cấp
- 3: N3 level - Trung cấp
- 4: N2 level - Cao cấp
- 5: N1 level - Cao cấp nhất

---

## 🔄 QUY TRÌNH SỬ DỤNG

### Bước 1: Chụp ảnh sách
- Chụp rõ nét, đủ sáng
- Bao gồm cả câu hỏi và đáp án
- Nếu có phần giải thích trong sách thì chụp luôn

### Bước 2: Gửi cho Gemini Agent
Sử dụng prompt template ở trên, điền đúng thông tin:
- Level (N1/N2/N3/N4-N5)
- Tuần & Ngày
- Section (MOJI/GOI/BUNPO)

### Bước 3: Review JSON output
Kiểm tra:
- [ ] Nội dung câu hỏi đúng với ảnh
- [ ] Đáp án đúng chính xác
- [ ] Furigana chính xác
- [ ] Âm Hán Việt đúng
- [ ] ID không trùng

### Bước 4: Import vào app
- Copy JSON output
- Vào app → Import Data
- Paste vào textarea hoặc upload file .json
- Nhấn Import

---

## 📦 BATCH IMPORT FORMAT

Khi import nhiều câu cùng lúc, sử dụng một trong các format sau:

**Format 1: Simple Array**
```json
[
  { "id": "q_n1_001", ... },
  { "id": "q_n1_002", ... },
  { "id": "q_n1_003", ... }
]
```

**Format 2: Grouped by Section**
```json
{
  "moji_data": [
    { "id": "q_n1_001", ... }
  ],
  "goi_data": [
    { "id": "q_goi_n1_001", ... }
  ],
  "bunpo_data": [
    { "id": "q_bunpo_n1_001", ... }
  ]
}
```

---

## 💡 TIPS CHO GEMINI AGENT

1. **Nhiều câu cùng lúc**: Chụp nhiều câu trong 1 ảnh → Gemini sẽ tạo array chứa nhiều câu
2. **Trang giải thích**: Nếu sách có trang giải thích riêng, chụp kèm để Gemini bổ sung vào `textbook_examples`
3. **Kiểm tra lại furigana**: Đây là phần hay sai nhất, luôn review kỹ
4. **Consistency**: Giữ ID numbering liên tục khi import nhiều lần

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **KHÔNG để furigana sai** - Đây là yếu tố cốt lõi, sai furigana = học sai
2. **KHÔNG bỏ qua Kanji nào** - Mọi Kanji trong câu hỏi & đáp án đều cần phân tích
3. **Ví dụ IT phải thực tế** - Dùng thuật ngữ thật (API, server, database, deploy...)
4. **Âm Hán Việt phải đúng** - Sai âm Hán Việt sẽ gây nhầm lẫn khi học
5. **Mỗi câu phải có đủ metadata** - section_type, difficulty, tags
6. **`with_red_highlight` BẮT BUỘC** - Mỗi câu MOJI phải highlight Kanji đang hỏi, GOI/BUNPO highlight chỗ trống
7. **`english_with_ipa` BẮT BUỘC** - Có ở translations VÀ tất cả examples, it_context_examples, textbook_examples
8. **Duplicate check** - App sẽ tự kiểm tra trùng lặp dựa trên `question.content.original` khi import. Nếu câu hỏi đã tồn tại sẽ bị bỏ qua

---
