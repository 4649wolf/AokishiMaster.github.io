"use strict";

const emptyMessage = "俺に喋らせたいことはあるか？";

const kanaGroups = window.AOKISHI_KANA_GROUPS || [];
const kanaAudio = window.AOKISHI_KANA_AUDIO || {};
const wordItems = window.AOKISHI_WORDS || window.AOKISHI_WORD_CATEGORIES?.[0]?.words || [];
const inputBuffer = window.AOKISHI_INPUT_BUFFER;
const audioPlayer = window.AOKISHI_AUDIO_PLAYER;

const UI_SOUND_PATHS = {
  default: "audio/words/random/an1.mp3",
  edit: "audio/words/single/unyon.mp3"
};

const memoryEntryItems = [
  {
    label: "神経衰弱01",
    lines: ["神経衰弱01"],
    href: "memory.html?game=laugh"
  },
  {
    label: "神経衰弱02",
    lines: ["神経衰弱02"],
    href: "memory.html?game=anoo"
  }
];

const kanaGroupsEl = document.getElementById("kanaGroups");
const wordButtonsEl = document.getElementById("wordButtons");
const inputDisplay = document.getElementById("inputDisplay");
const inputText = document.getElementById("inputText");
const deleteBtn = document.getElementById("deleteBtn");
const clearBtn = document.getElementById("clearBtn");
const speakBtn = document.getElementById("speakBtn");
const siteTitle = document.querySelector(".site-title");

let feedbackAudio = null;
let resizeFrameId = 0;
let toastTimerId = 0;
const FAVORITES_STORAGE_KEY = "AOKISHI_FAVORITE_PHRASES_V1";
const MAX_FAVORITES = 40;

const favoriteAddBtn = document.getElementById("favoriteAddBtn");
const favoriteListBtn = document.getElementById("favoriteListBtn");
const favoriteModal = document.getElementById("favoriteModal");
const favoriteListEl = document.getElementById("favoriteList");
const favoriteEmptyEl = document.getElementById("favoriteEmpty");
const favoriteCloseBtn = document.getElementById("favoriteCloseBtn");
const favoriteClearBtn = document.getElementById("favoriteClearBtn");
const toastEl = document.getElementById("toast");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderKanaGroups() {
  kanaGroupsEl.innerHTML = kanaGroups.map((group) => {
    const cells = group.rows.flat().map((text) => {
      if (!text) return '<span class="kana-placeholder" aria-hidden="true"></span>';
      const audioPath = kanaAudio[text] || "";
      return `<button class="kana-btn" type="button" data-input-type="kana" data-value="${escapeHtml(text)}" data-audio-path="${escapeHtml(audioPath)}" aria-label="${escapeHtml(text)}">${escapeHtml(text)}</button>`;
    }).join("");

    return `
      <div class="kana-group">
        <div class="kana-label">${escapeHtml(group.label)}</div>
        <div class="kana-grid">${cells}</div>
      </div>
    `;
  }).join("");
}

function normalizeWord(word) {
  if (typeof word === "string") {
    return { label: word, audioPath: "", audioPaths: [], lines: [] };
  }
  const audioPaths = Array.isArray(word.audioPaths) ? word.audioPaths.filter(Boolean) : [];
  return {
    label: word.label || "",
    audioPath: word.audioPath || "",
    audioPaths,
    randomGroupId: word.groupId || word.randomGroupId || word.baseLabel || word.label || "word",
    lines: Array.isArray(word.lines) ? word.lines.filter(Boolean) : []
  };
}

function renderButtonLines(label, lines = []) {
  const displayLines = lines.length > 0 ? lines : [label];
  return displayLines.map((line) => `<span class="btn-line">${escapeHtml(line)}</span>`).join("");
}

function renderWordButton(rawWord) {
  const word = normalizeWord(rawWord);
  const hasMultiple = word.audioPaths.length > 1;
  const hasBreaks = word.lines.length > 1;
  const longClass = word.label.length >= 12 || word.lines.some((line) => line.length >= 10) ? " is-long" : "";
  const breakClass = hasBreaks ? " has-breaks" : "";
  const multiClass = hasMultiple ? " is-random" : "";
  const audioPathsAttr = hasMultiple ? ` data-audio-paths="${escapeHtml(word.audioPaths.join("|"))}" data-random-group-id="${escapeHtml(word.randomGroupId)}"` : "";

  return `<button class="word-btn${longClass}${breakClass}${multiClass}" type="button" data-input-type="word" data-value="${escapeHtml(word.label)}" data-audio-path="${escapeHtml(word.audioPath)}"${audioPathsAttr} title="${escapeHtml(word.label)}" aria-label="${escapeHtml(word.label)}">${renderButtonLines(word.label, word.lines)}</button>`;
}

function renderMemoryEntryButton(item) {
  return `<button class="word-btn memory-entry-btn has-breaks" type="button" data-ui-sound="none" data-game-href="${escapeHtml(item.href)}" title="${escapeHtml(item.label)}" aria-label="${escapeHtml(item.label)}">${renderButtonLines(item.label, item.lines)}</button>`;
}

function renderWordButtons() {
  const wordButtons = wordItems.map(renderWordButton).join("");
  const gameButtons = memoryEntryItems.map(renderMemoryEntryButton).join("");
  wordButtonsEl.innerHTML = `${wordButtons}${gameButtons}`;
}

function playUiSound(audioPath) {
  if (!audioPath) return;

  try {
    if (feedbackAudio) {
      feedbackAudio.pause();
      feedbackAudio.currentTime = 0;
    }

    feedbackAudio = new Audio(audioPath);
    feedbackAudio.volume = 0.82;
    const playPromise = feedbackAudio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((error) => console.warn(`クリック音を再生できませんでした: ${audioPath}`, error));
    }
  } catch (error) {
    console.warn(`クリック音を再生できませんでした: ${audioPath}`, error);
  }
}

function getButtonFeedbackSound(button) {
  if (!button || button.dataset.uiSound === "none") return "";
  if (button === speakBtn) return "";
  if (button === deleteBtn || button === clearBtn) return UI_SOUND_PATHS.edit;
  return UI_SOUND_PATHS.default;
}

function syncWordPanelHeight() {
  const kanaPanel = kanaGroupsEl?.closest(".panel");
  const wordPanel = wordButtonsEl?.closest(".panel");
  if (!kanaPanel || !wordPanel || !wordButtonsEl || !kanaGroupsEl) return;

  const wordStyles = window.getComputedStyle(wordPanel);
  const kanaStyles = window.getComputedStyle(kanaPanel);
  const wordPaddingTop = Number.parseFloat(wordStyles.paddingTop) || 0;
  const wordPaddingBottom = Number.parseFloat(wordStyles.paddingBottom) || 0;
  const wordBorderTop = Number.parseFloat(wordStyles.borderTopWidth) || 0;
  const wordBorderBottom = Number.parseFloat(wordStyles.borderBottomWidth) || 0;
  const kanaPaddingTop = Number.parseFloat(kanaStyles.paddingTop) || 0;
  const kanaPaddingBottom = Number.parseFloat(kanaStyles.paddingBottom) || 0;
  const kanaBorderTop = Number.parseFloat(kanaStyles.borderTopWidth) || 0;
  const kanaBorderBottom = Number.parseFloat(kanaStyles.borderBottomWidth) || 0;

  const naturalKanaContentHeight = Math.ceil(kanaGroupsEl.getBoundingClientRect().height || kanaGroupsEl.scrollHeight || 0);
  const targetPanelHeight = Math.max(
    240,
    naturalKanaContentHeight + kanaPaddingTop + kanaPaddingBottom + kanaBorderTop + kanaBorderBottom
  );
  const targetListHeight = Math.max(
    220,
    targetPanelHeight - wordPaddingTop - wordPaddingBottom - wordBorderTop - wordBorderBottom
  );

  wordPanel.style.height = `${targetPanelHeight}px`;
  wordPanel.style.minHeight = `${targetPanelHeight}px`;
  wordPanel.style.maxHeight = `${targetPanelHeight}px`;
  wordButtonsEl.style.height = `${targetListHeight}px`;
  wordButtonsEl.style.maxHeight = `${targetListHeight}px`;
}

function scheduleWordPanelHeightSync() {
  if (resizeFrameId) window.cancelAnimationFrame(resizeFrameId);
  resizeFrameId = window.requestAnimationFrame(() => {
    resizeFrameId = 0;
    syncWordPanelHeight();
  });
}

function updateInputDisplay() {
  const text = inputBuffer.getText();
  const isEmpty = text.length === 0;

  inputText.value = text;
  inputText.placeholder = isEmpty ? emptyMessage : "";
  inputDisplay.classList.toggle("is-empty", isEmpty);
  inputDisplay.title = text || emptyMessage;

  window.requestAnimationFrame(() => {
    if (isEmpty) {
      inputText.scrollLeft = 0;
      return;
    }

    const end = inputText.value.length;
    try {
      inputText.setSelectionRange(end, end);
    } catch (error) {

    }
    inputText.scrollLeft = inputText.scrollWidth;
  });
}

function readFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item === "object" && Array.isArray(item.tokens));
  } catch (error) {
    console.warn("お気に入りを読み込めませんでした。", error);
    return [];
  }
}

function writeFavorites(favorites) {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites.slice(0, MAX_FAVORITES)));
    return true;
  } catch (error) {
    console.warn("お気に入りを保存できませんでした。", error);
    return false;
  }
}

function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.hidden = false;
  toastEl.classList.add("is-visible");
  if (toastTimerId) window.clearTimeout(toastTimerId);
  toastTimerId = window.setTimeout(() => {
    toastEl.classList.remove("is-visible");
    window.setTimeout(() => { toastEl.hidden = true; }, 180);
  }, 1800);
}

function getFavoriteSummary(item) {
  const count = Array.isArray(item.tokens) ? item.tokens.length : 0;
  const createdAt = item.createdAt ? new Date(item.createdAt) : null;
  const dateText = createdAt && !Number.isNaN(createdAt.getTime())
    ? createdAt.toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "保存済み";
  return `${count}音 / ${dateText}`;
}

function addFavoriteFromInput() {
  const tokens = inputBuffer.getTokens();
  const text = inputBuffer.getText();

  if (tokens.length === 0 || !text) {
    showToast("保存する文章がありません。");
    return;
  }

  const favorites = readFavorites();
  const withoutSameText = favorites.filter((item) => item.text !== text);
  const favorite = {
    id: `fav_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    text,
    tokens,
    createdAt: new Date().toISOString()
  };

  if (writeFavorites([favorite, ...withoutSameText])) {
    renderFavorites();
    showToast(withoutSameText.length === favorites.length ? "お気に入りに追加しました。" : "同じ文章を上書き保存しました。");
  } else {
    showToast("保存に失敗しました。ブラウザの保存容量を確認してください。");
  }
}

function renderFavorites() {
  if (!favoriteListEl || !favoriteEmptyEl) return;
  const favorites = readFavorites();
  favoriteEmptyEl.hidden = favorites.length > 0;
  favoriteClearBtn.hidden = favorites.length === 0;

  favoriteListEl.innerHTML = favorites.map((item) => `
    <article class="favorite-item" data-favorite-id="${escapeHtml(item.id)}">
      <button class="favorite-item-main" type="button" data-ui-sound="none" data-favorite-action="speak" title="${escapeHtml(item.text)}">
        <strong>${escapeHtml(item.text)}</strong>
        <span>${escapeHtml(getFavoriteSummary(item))}</span>
      </button>
      <div class="favorite-item-actions">
        <button class="control-btn favorite-mini-btn favorite-speak-btn" type="button" data-ui-sound="none" data-favorite-action="speak">発声</button>
        <button class="control-btn favorite-mini-btn favorite-load-btn" type="button" data-favorite-action="load">読込</button>
        <button class="control-btn favorite-mini-btn favorite-delete-btn" type="button" data-favorite-action="delete">削除</button>
      </div>
    </article>
  `).join("");

  attachPressFeedback(favoriteListEl);
}

function openFavorites() {
  renderFavorites();
  favoriteModal.hidden = false;
  document.body.classList.add("is-favorite-open");
  window.setTimeout(() => favoriteCloseBtn?.focus(), 0);
}

function closeFavorites() {
  favoriteModal.hidden = true;
  document.body.classList.remove("is-favorite-open");
}

function findFavoriteById(id) {
  return readFavorites().find((item) => item.id === id) || null;
}

async function speakFavorite(item, button = null) {
  if (!item || !Array.isArray(item.tokens)) return;
  const isMainButton = button?.classList?.contains("favorite-item-main");
  const originalText = button?.textContent;

  if (button) {
    button.disabled = true;
    button.classList.add("is-speaking");
    if (!isMainButton) button.textContent = "準備中";
  }

  try {
    await audioPlayer.speakTokens(item.tokens);
  } finally {
    if (button) {
      button.disabled = false;
      button.classList.remove("is-speaking");
      if (!isMainButton) button.textContent = originalText;
    }
  }
}

function loadFavorite(item) {
  if (!item || !Array.isArray(item.tokens)) return;
  inputBuffer.setTokens(item.tokens);
  updateInputDisplay();
  closeFavorites();
  showToast("お気に入りを入力欄に読み込みました。");
}

function deleteFavorite(id) {
  const favorites = readFavorites().filter((item) => item.id !== id);
  writeFavorites(favorites);
  renderFavorites();
  showToast("お気に入りを削除しました。");
}

function clearFavorites() {
  if (!window.confirm("お気に入りをすべて削除しますか？")) return;
  writeFavorites([]);
  renderFavorites();
  showToast("お気に入りを全削除しました。");
}

function triggerLogoBurst() {
  if (!siteTitle) return;
  siteTitle.classList.remove("is-logo-burst");
  void siteTitle.offsetWidth;
  siteTitle.classList.add("is-logo-burst");
  window.setTimeout(() => siteTitle.classList.remove("is-logo-burst"), 1050);
}

function flashSpeak() {
  inputDisplay.classList.remove("speak-flash");
  void inputDisplay.offsetWidth;
  inputDisplay.classList.add("speak-flash");
  window.setTimeout(() => inputDisplay.classList.remove("speak-flash"), 420);
}

function attachPressFeedback(root = document) {
  root.querySelectorAll("button").forEach((button) => {
    if (button.dataset.pressFeedbackAttached === "true") return;
    button.dataset.pressFeedbackAttached = "true";
    button.addEventListener("pointerdown", () => button.classList.add("is-pressed"));
    ["pointerup", "pointerleave", "pointercancel", "blur"].forEach((eventName) => {
      button.addEventListener(eventName, () => button.classList.remove("is-pressed"));
    });
  });
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  const soundPath = getButtonFeedbackSound(button);
  if (soundPath) playUiSound(soundPath);
}, { capture: true });

document.addEventListener("click", (event) => {
  const gameButton = event.target.closest("[data-game-href]");
  if (!gameButton) return;
  window.location.href = gameButton.dataset.gameHref;
});

document.addEventListener("click", (event) => {
  const inputButton = event.target.closest("[data-input-type]");
  if (!inputButton) return;

  const type = inputButton.dataset.inputType;
  const value = inputButton.dataset.value || inputButton.textContent.trim();
  const audioPath = inputButton.dataset.audioPath || "";

  if (type === "kana") inputBuffer.pushKana(value, audioPath);
  if (type === "word") {
    const audioPaths = (inputButton.dataset.audioPaths || "").split("|").filter(Boolean);
    inputBuffer.pushWord(value, audioPath, {
      audioPaths,
      randomGroupId: inputButton.dataset.randomGroupId || value
    });
  }
  updateInputDisplay();
});

deleteBtn.addEventListener("click", () => {
  inputBuffer.deleteLast();
  updateInputDisplay();
});

clearBtn.addEventListener("click", () => {
  inputBuffer.clearAll();
  updateInputDisplay();
});

favoriteAddBtn.addEventListener("click", addFavoriteFromInput);
favoriteListBtn.addEventListener("click", openFavorites);
favoriteCloseBtn.addEventListener("click", closeFavorites);
favoriteClearBtn.addEventListener("click", clearFavorites);
favoriteModal.addEventListener("click", (event) => {
  if (event.target.closest("[data-favorite-close]")) closeFavorites();
});

favoriteListEl.addEventListener("click", async (event) => {
  const actionButton = event.target.closest("[data-favorite-action]");
  if (!actionButton) return;

  const itemEl = actionButton.closest("[data-favorite-id]");
  const item = findFavoriteById(itemEl?.dataset.favoriteId || "");
  const action = actionButton.dataset.favoriteAction;

  if (action === "speak") await speakFavorite(item, actionButton);
  if (action === "load") loadFavorite(item);
  if (action === "delete") deleteFavorite(item?.id || "");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !favoriteModal.hidden) closeFavorites();
});

speakBtn.addEventListener("click", async () => {
  const originalText = speakBtn.textContent;
  speakBtn.disabled = true;
  speakBtn.textContent = "準備中...";

  try {
    flashSpeak();
    triggerLogoBurst();
    await audioPlayer.speakTokens(inputBuffer.getTokens());
  } finally {
    speakBtn.disabled = false;
    speakBtn.textContent = originalText;
  }
});

inputText.addEventListener("keydown", (event) => event.preventDefault());
inputText.addEventListener("paste", (event) => event.preventDefault());
window.addEventListener("resize", scheduleWordPanelHeightSync);
window.addEventListener("orientationchange", scheduleWordPanelHeightSync);

renderKanaGroups();
renderWordButtons();
attachPressFeedback();
updateInputDisplay();
scheduleWordPanelHeightSync();

if ("ResizeObserver" in window && kanaGroupsEl) {
  const resizeObserver = new ResizeObserver(scheduleWordPanelHeightSync);
  resizeObserver.observe(kanaGroupsEl);
}
