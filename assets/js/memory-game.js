"use strict";

const memoryGames = window.AOKISHI_MEMORY_GAMES || {};
const params = new URLSearchParams(window.location.search);
const requestedGameId = params.get("game") || "laugh";
const gameId = Object.prototype.hasOwnProperty.call(memoryGames, requestedGameId) ? requestedGameId : "laugh";
const game = memoryGames[gameId];

const memoryTitle = document.getElementById("memoryTitle");
const memorySubtitle = document.getElementById("memorySubtitle");
const memoryGrid = document.getElementById("memoryGrid");
const memoryBackBtn = document.getElementById("memoryBackBtn");
const memoryComplete = document.getElementById("memoryComplete");
const memoryMoves = document.getElementById("memoryMoves");
const memoryTimer = document.getElementById("memoryTimer");
const siteTitle = document.querySelector(".site-title");

let selectedCards = [];
let lockBoard = false;
let previewAudio = null;
let moves = 0;
let startedAt = 0;
let timerId = 0;
let finished = false;

function shuffle(items) {
  const copied = items.slice();
  for (let index = copied.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copied[index], copied[randomIndex]] = [copied[randomIndex], copied[index]];
  }
  return copied;
}

function createDeck(items) {
  const pairs = items.flatMap((item) => [
    { ...item, cardId: `${item.id}-a` },
    { ...item, cardId: `${item.id}-b` }
  ]);
  return shuffle(pairs);
}

function formatElapsed(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateMoves() {
  if (memoryMoves) memoryMoves.textContent = String(moves);
}

function updateTimer() {
  if (!memoryTimer) return;
  const elapsedSeconds = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
  memoryTimer.textContent = formatElapsed(elapsedSeconds);
}

function startTimerOnce() {
  if (startedAt || finished) return;
  startedAt = Date.now();
  updateTimer();
  timerId = window.setInterval(updateTimer, 1000);
}

function stopTimer() {
  if (timerId) {
    window.clearInterval(timerId);
    timerId = 0;
  }
  updateTimer();
}

function playMemoryAudio(audioPath) {
  if (!audioPath) return;

  try {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    }

    previewAudio = new Audio(audioPath);
    const playPromise = previewAudio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((error) => console.warn(`音声を再生できませんでした: ${audioPath}`, error));
    }
  } catch (error) {
    console.warn(`音声を再生できませんでした: ${audioPath}`, error);
  }
}

function triggerLogoBurst() {
  if (!siteTitle) return;
  siteTitle.classList.remove("is-logo-burst");
  void siteTitle.offsetWidth;
  siteTitle.classList.add("is-logo-burst");
  window.setTimeout(() => siteTitle.classList.remove("is-logo-burst"), 1050);
}

function updateCompleteState() {
  const remaining = memoryGrid.querySelectorAll(".memory-tile:not(.is-matched)").length;
  const isComplete = remaining === 0;
  memoryComplete.hidden = !isComplete;

  if (isComplete && !finished) {
    finished = true;
    stopTimer();
    const timeText = memoryTimer?.textContent || "00:00";
    memoryComplete.textContent = `クリア！手数 ${moves} / 時間 ${timeText}`;
    memoryComplete.classList.remove("is-logo-complete");
    void memoryComplete.offsetWidth;
    memoryComplete.classList.add("is-logo-complete");
    triggerLogoBurst();
  }
}

function clearWrongPair(firstButton, secondButton) {
  window.setTimeout(() => {
    firstButton.classList.remove("is-selected");
    secondButton.classList.remove("is-selected");
    selectedCards = [];
    lockBoard = false;
  }, 720);
}

function hideMatchedPair(firstButton, secondButton) {
  window.setTimeout(() => {
    firstButton.classList.remove("is-selected");
    secondButton.classList.remove("is-selected");
    firstButton.classList.add("is-matched");
    secondButton.classList.add("is-matched");
    firstButton.disabled = true;
    secondButton.disabled = true;
    selectedCards = [];
    lockBoard = false;
    updateCompleteState();
  }, 420);
}

function handleTileClick(button) {
  if (lockBoard || button.classList.contains("is-matched") || button.classList.contains("is-selected")) return;

  startTimerOnce();
  playMemoryAudio(button.dataset.audioPath || "");
  button.classList.add("is-selected");
  selectedCards.push(button);

  if (selectedCards.length < 2) return;

  moves += 1;
  updateMoves();
  lockBoard = true;
  const [firstButton, secondButton] = selectedCards;
  const isMatch = firstButton.dataset.matchId === secondButton.dataset.matchId;

  if (isMatch) {
    hideMatchedPair(firstButton, secondButton);
  } else {
    clearWrongPair(firstButton, secondButton);
  }
}

function renderDeck() {
  const deck = createDeck(game.items || []);
  memoryGrid.innerHTML = deck.map((card, index) => `
    <button class="memory-tile" type="button" data-match-id="${card.id}" data-audio-path="${card.audioPath}" aria-label="音符ボタン ${index + 1}">
      <span class="memory-note" aria-hidden="true">♪</span>
    </button>
  `).join("");
}

function attachEvents() {
  memoryGrid.addEventListener("click", (event) => {
    const button = event.target.closest(".memory-tile");
    if (!button) return;
    handleTileClick(button);
  });

  memoryBackBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

memoryTitle.textContent = game.title || "神経衰弱";
memorySubtitle.textContent = game.subtitle || "同じ音声を探してください";
memoryBackBtn.textContent = game.backLabel || "前画面に戻る";
renderDeck();
attachEvents();
updateMoves();
updateTimer();
updateCompleteState();
