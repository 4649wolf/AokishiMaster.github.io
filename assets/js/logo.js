"use strict";

(() => {
  const titles = document.querySelectorAll(".site-title");

  function createChars(text, startIndex) {
    return Array.from(text).map((char, index) => {
      const span = document.createElement("span");
      span.className = "logo-char";
      span.style.setProperty("--char-index", String(startIndex + index));
      span.setAttribute("aria-hidden", "true");
      span.textContent = char;
      return span;
    });
  }

  titles.forEach((title) => {
    const jpText = title.dataset.titleJp || "青騎士さんスイッチ";
    const enText = title.dataset.titleEn || "MASTER";
    const jp = document.createElement("span");
    const en = document.createElement("span");
    jp.className = "title-jp";
    en.className = "title-master";
    jp.setAttribute("aria-hidden", "true");
    en.setAttribute("aria-hidden", "true");
    createChars(jpText, 0).forEach((char) => jp.appendChild(char));
    createChars(enText, Array.from(jpText).length).forEach((char) => en.appendChild(char));
    title.textContent = "";
    title.append(jp, en);
  });
})();
