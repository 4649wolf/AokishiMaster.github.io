"use strict";

window.AOKISHI_INPUT_BUFFER = (() => {
  const tokens = [];

  function pushKana(value, audioPath = "") {
    tokens.push({ type: "kana", label: value, display: value, audioPath });
  }

  function pushWord(value, audioPath = "", options = {}) {
    const token = { type: "word", label: value, display: `<${value}>`, audioPath };
    if (Array.isArray(options.audioPaths) && options.audioPaths.length > 0) {
      token.audioPaths = options.audioPaths.slice();
      token.randomGroupId = options.randomGroupId || value;
    }
    tokens.push(token);
  }

  function deleteLast() {
    tokens.pop();
  }

  function clearAll() {
    tokens.length = 0;
  }

  function getText() {
    return tokens.map((token) => token.display).join("");
  }

  function cloneToken(token) {
    const cloned = { ...token };
    if (Array.isArray(token.audioPaths)) cloned.audioPaths = token.audioPaths.slice();
    return cloned;
  }

  function getTokens() {
    return tokens.map(cloneToken);
  }

  function setTokens(nextTokens) {
    tokens.length = 0;
    if (!Array.isArray(nextTokens)) return;
    nextTokens.forEach((token) => {
      if (!token || typeof token !== "object") return;
      const label = String(token.label || "");
      if (!label) return;
      const type = token.type === "word" ? "word" : "kana";
      const display = typeof token.display === "string" ? token.display : (type === "word" ? `<${label}>` : label);
      const audioPath = typeof token.audioPath === "string" ? token.audioPath : "";
      const cloned = { type, label, display, audioPath };
      if (Array.isArray(token.audioPaths)) cloned.audioPaths = token.audioPaths.filter(Boolean).slice();
      if (typeof token.randomGroupId === "string") cloned.randomGroupId = token.randomGroupId;
      tokens.push(cloned);
    });
  }

  return { pushKana, pushWord, deleteLast, clearAll, getText, getTokens, setTokens };
})();
