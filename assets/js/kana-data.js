"use strict";

window.AOKISHI_KANA_GROUPS = [
  {
    label: "清音",
    folder: "seion",
    rows: [
      ["あ", "い", "う", "え", "お"],
      ["か", "き", "く", "け", "こ"],
      ["さ", "し", "す", "せ", "そ"],
      ["た", "ち", "つ", "て", "と"],
      ["な", "に", "ぬ", "ね", "の"],
      ["は", "ひ", "ふ", "へ", "ほ"],
      ["ま", "み", "む", "め", "も"],
      ["や", "", "ゆ", "", "よ"],
      ["ら", "り", "る", "れ", "ろ"],
      ["わ", "", "を", "", "ん"]
    ]
  },
  {
    label: "濁音",
    folder: "dakuon",
    rows: [
      ["が", "ぎ", "ぐ", "げ", "ご"],
      ["ざ", "じ", "ず", "ぜ", "ぞ"],
      ["だ", "ぢ", "づ", "で", "ど"],
      ["ば", "び", "ぶ", "べ", "ぼ"]
    ]
  },
  {
    label: "半濁音",
    folder: "handakuon",
    rows: [["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"]]
  },
  {
    label: "小文字・記号",
    folder: "small",
    rows: [
      ["ぁ", "ぃ", "ぅ", "ぇ", "ぉ"],
      ["ゃ", "ゅ", "ょ", "っ", "ー"],
      ["", "", "", "、", "。"]
    ]
  }
];

window.AOKISHI_KANA_AUDIO = {
  "あ": "audio/kana/seion/a.mp3",
  "い": "audio/kana/seion/i.mp3",
  "う": "audio/kana/seion/u.mp3",
  "え": "audio/kana/seion/e.mp3",
  "お": "audio/kana/seion/o.mp3",
  "か": "audio/kana/seion/ka.mp3",
  "き": "audio/kana/seion/ki.mp3",
  "く": "audio/kana/seion/ku.mp3",
  "け": "audio/kana/seion/ke.mp3",
  "こ": "audio/kana/seion/ko.mp3",
  "さ": "audio/kana/seion/sa.mp3",
  "し": "audio/kana/seion/shi.mp3",
  "す": "audio/kana/seion/su.mp3",
  "せ": "audio/kana/seion/se.mp3",
  "そ": "audio/kana/seion/so.mp3",
  "た": "audio/kana/seion/ta.mp3",
  "ち": "audio/kana/seion/chi.mp3",
  "つ": "audio/kana/seion/tsu.mp3",
  "て": "audio/kana/seion/te.mp3",
  "と": "audio/kana/seion/to.mp3",
  "な": "audio/kana/seion/na.mp3",
  "に": "audio/kana/seion/ni.mp3",
  "ぬ": "audio/kana/seion/nu.mp3",
  "ね": "audio/kana/seion/ne.mp3",
  "の": "audio/kana/seion/no.mp3",
  "は": "audio/kana/seion/ha.mp3",
  "ひ": "audio/kana/seion/hi.mp3",
  "ふ": "audio/kana/seion/fu.mp3",
  "へ": "audio/kana/seion/he.mp3",
  "ほ": "audio/kana/seion/ho.mp3",
  "ま": "audio/kana/seion/ma.mp3",
  "み": "audio/kana/seion/mi.mp3",
  "む": "audio/kana/seion/mu.mp3",
  "め": "audio/kana/seion/me.mp3",
  "も": "audio/kana/seion/mo.mp3",
  "や": "audio/kana/seion/ya.mp3",
  "ゆ": "audio/kana/seion/yu.mp3",
  "よ": "audio/kana/seion/yo.mp3",
  "ら": "audio/kana/seion/ra.mp3",
  "り": "audio/kana/seion/ri.mp3",
  "る": "audio/kana/seion/ru.mp3",
  "れ": "audio/kana/seion/re.mp3",
  "ろ": "audio/kana/seion/ro.mp3",
  "わ": "audio/kana/seion/wa.mp3",
  "を": "audio/kana/seion/wo.mp3",
  "ん": "audio/kana/seion/n.mp3",

  "が": "audio/kana/dakuon/ga.mp3",
  "ぎ": "audio/kana/dakuon/gi.mp3",
  "ぐ": "audio/kana/dakuon/gu.mp3",
  "げ": "audio/kana/dakuon/ge.mp3",
  "ご": "audio/kana/dakuon/go.mp3",
  "ざ": "audio/kana/dakuon/za.mp3",
  "じ": "audio/kana/dakuon/zi.mp3",
  "ず": "audio/kana/dakuon/zu.mp3",
  "ぜ": "audio/kana/dakuon/ze.mp3",
  "ぞ": "audio/kana/dakuon/zo.mp3",
  "だ": "audio/kana/dakuon/da.mp3",
  "ぢ": "audio/kana/dakuon/di.mp3",
  "づ": "audio/kana/dakuon/du.mp3",
  "で": "audio/kana/dakuon/de.mp3",
  "ど": "audio/kana/dakuon/do.mp3",
  "ば": "audio/kana/dakuon/ba.mp3",
  "び": "audio/kana/dakuon/bi.mp3",
  "ぶ": "audio/kana/dakuon/bu.mp3",
  "べ": "audio/kana/dakuon/be.mp3",
  "ぼ": "audio/kana/dakuon/bo.mp3",

  "ぱ": "audio/kana/handakuon/pa.mp3",
  "ぴ": "audio/kana/handakuon/pi.mp3",
  "ぷ": "audio/kana/handakuon/pu.mp3",
  "ぺ": "audio/kana/handakuon/pe.mp3",
  "ぽ": "audio/kana/handakuon/po.mp3",

  "ぁ": "audio/kana/small/small-a.mp3",
  "ぃ": "audio/kana/small/small-i.mp3",
  "ぅ": "audio/kana/small/small-u.mp3",
  "ぇ": "audio/kana/small/small-e.mp3",
  "ぉ": "audio/kana/small/small-o.mp3",
  "ゃ": "audio/kana/small/small-ya.mp3",
  "ゅ": "audio/kana/small/small-yu.mp3",
  "ょ": "audio/kana/small/small-yo.mp3",
  "っ": "",
  "ー": "",
  "、": "",
  "。": ""
};
