"use strict";

window.AOKISHI_AUDIO_PLAYER = (() => {
  const kanaAudio = window.AOKISHI_KANA_AUDIO || {};
  const PAUSE_MS = { "っ": 120, "、": 280, "。": 520 };
  const SMALL_KANA = new Set(["ぁ", "ぃ", "ぅ", "ぇ", "ぉ", "ゃ", "ゅ", "ょ"]);
  const KANA_OVERLAP_MS = 4;
  const SMALL_KANA_OVERLAP_MS = 42;
  const VOWEL_AUDIO = {
    a: kanaAudio["あ"] || "audio/kana/seion/a.mp3",
    i: kanaAudio["い"] || "audio/kana/seion/i.mp3",
    u: kanaAudio["う"] || "audio/kana/seion/u.mp3",
    e: kanaAudio["え"] || "audio/kana/seion/e.mp3",
    o: kanaAudio["お"] || "audio/kana/seion/o.mp3"
  };
  const KANA_TO_VOWEL = {
    "あ": "a", "ぁ": "a", "か": "a", "が": "a", "さ": "a", "ざ": "a", "た": "a", "だ": "a", "な": "a", "は": "a", "ば": "a", "ぱ": "a", "ま": "a", "や": "a", "ゃ": "a", "ら": "a", "わ": "a",
    "い": "i", "ぃ": "i", "き": "i", "ぎ": "i", "し": "i", "じ": "i", "ち": "i", "ぢ": "i", "に": "i", "ひ": "i", "び": "i", "ぴ": "i", "み": "i", "り": "i",
    "う": "u", "ぅ": "u", "く": "u", "ぐ": "u", "す": "u", "ず": "u", "つ": "u", "づ": "u", "ぬ": "u", "ふ": "u", "ぶ": "u", "ぷ": "u", "む": "u", "ゆ": "u", "ゅ": "u", "る": "u",
    "え": "e", "ぇ": "e", "け": "e", "げ": "e", "せ": "e", "ぜ": "e", "て": "e", "で": "e", "ね": "e", "へ": "e", "べ": "e", "ぺ": "e", "め": "e", "れ": "e",
    "お": "o", "ぉ": "o", "こ": "o", "ご": "o", "そ": "o", "ぞ": "o", "と": "o", "ど": "o", "の": "o", "ほ": "o", "ぼ": "o", "ぽ": "o", "も": "o", "よ": "o", "ょ": "o", "ろ": "o", "を": "o"
  };

  let audioContext = null;
  let currentSource = null;
  const decodedBufferCache = new Map();
  const lastRandomAudioByGroupId = new Map();

  function getAudioContext() {
    if (audioContext) return audioContext;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
    return audioContext;
  }

  async function resumeAudioContext() {
    const context = getAudioContext();
    if (!context) return null;
    if (context.state === "suspended") await context.resume();
    return context;
  }

  function stopCurrentPlayback() {
    if (!currentSource) return;
    try {
      currentSource.stop();
    } catch (error) {}
    currentSource = null;
  }

  function decodeAudioData(context, arrayBuffer) {
    return new Promise((resolve, reject) => {
      const result = context.decodeAudioData(arrayBuffer.slice(0), resolve, reject);
      if (result && typeof result.then === "function") result.then(resolve).catch(reject);
    });
  }

  async function loadAudioBuffer(src) {
    if (!src) return null;
    const context = getAudioContext();
    if (!context) return null;
    if (decodedBufferCache.has(src)) return decodedBufferCache.get(src);
    const bufferPromise = fetch(src, { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => decodeAudioData(context, arrayBuffer))
      .catch((error) => {
        console.warn(`音声ファイルを読み込めませんでした: ${src}`, error);
        return null;
      });
    decodedBufferCache.set(src, bufferPromise);
    return bufferPromise;
  }

  function createSilentBuffer(durationMs) {
    const context = getAudioContext();
    if (!context) return null;
    const length = Math.max(1, Math.round(context.sampleRate * durationMs / 1000));
    return context.createBuffer(1, length, context.sampleRate);
  }

  function getVowelAudioPath(label) {
    const vowel = KANA_TO_VOWEL[label];
    return vowel ? VOWEL_AUDIO[vowel] : "";
  }

  function chooseRandomAudioPath(audioPaths, groupId = "default") {
    const candidates = Array.isArray(audioPaths) ? audioPaths.filter(Boolean) : [];
    if (candidates.length === 0) return "";
    if (candidates.length === 1) return candidates[0];
    const previousPath = lastRandomAudioByGroupId.get(groupId);
    const available = candidates.filter((audioPath) => audioPath !== previousPath);
    const pool = available.length > 0 ? available : candidates;
    const selectedPath = pool[Math.floor(Math.random() * pool.length)];
    lastRandomAudioByGroupId.set(groupId, selectedPath);
    return selectedPath;
  }

  function msToFrames(ms) {
    const context = getAudioContext();
    return context ? Math.max(0, Math.round(context.sampleRate * ms / 1000)) : 0;
  }

  async function pushAudioSegment(segments, audioPath, token, type) {
    const audioBuffer = await loadAudioBuffer(audioPath);
    if (!audioBuffer) return;
    segments.push({
      buffer: audioBuffer,
      allowOverlap: token?.type === "kana" || type === "long-vowel",
      isSmallKana: SMALL_KANA.has(token?.label || ""),
      type: type || token?.type || "audio"
    });
  }

  async function createSegments(tokens) {
    const segments = [];
    let lastVowelAudioPath = "";
    for (const token of tokens) {
      const label = token?.label || "";
      if (Object.prototype.hasOwnProperty.call(PAUSE_MS, label)) {
        const pauseBuffer = createSilentBuffer(PAUSE_MS[label]);
        if (pauseBuffer) segments.push({ buffer: pauseBuffer, allowOverlap: false, isSmallKana: false, type: "pause" });
        continue;
      }
      if (label === "ー") {
        if (lastVowelAudioPath) await pushAudioSegment(segments, lastVowelAudioPath, token, "long-vowel");
        continue;
      }
      const selectedAudioPath = Array.isArray(token?.audioPaths) && token.audioPaths.length > 0
        ? chooseRandomAudioPath(token.audioPaths, token.randomGroupId || label)
        : token?.audioPath;
      if (selectedAudioPath) await pushAudioSegment(segments, selectedAudioPath, token, token?.type || "audio");
      const nextVowelAudioPath = getVowelAudioPath(label);
      if (nextVowelAudioPath) lastVowelAudioPath = nextVowelAudioPath;
    }
    return segments;
  }

  function canOverlap(previousSegment, currentSegment) {
    return Boolean(previousSegment?.allowOverlap && currentSegment?.allowOverlap);
  }

  function buildPlacementPlan(segments) {
    const placements = [];
    let cursor = 0;
    segments.forEach((segment, index) => {
      const previousPlacement = placements[index - 1];
      let overlapFrames = 0;
      if (previousPlacement && canOverlap(previousPlacement.segment, segment)) {
        const overlapMs = segment.isSmallKana ? SMALL_KANA_OVERLAP_MS : KANA_OVERLAP_MS;
        overlapFrames = Math.min(
          msToFrames(overlapMs),
          Math.floor(previousPlacement.segment.buffer.length * 0.32),
          Math.floor(segment.buffer.length * 0.32)
        );
      }
      const startFrame = Math.max(0, cursor - overlapFrames);
      if (previousPlacement && overlapFrames > 0) previousPlacement.fadeOutFrames = Math.max(previousPlacement.fadeOutFrames, overlapFrames);
      placements.push({ segment, startFrame, fadeInFrames: overlapFrames, fadeOutFrames: 0 });
      cursor = Math.max(cursor, startFrame + segment.buffer.length);
    });
    return { placements, totalLength: Math.max(1, cursor) };
  }

  function mergeSegments(segments) {
    const context = getAudioContext();
    if (!context || segments.length === 0) return null;
    const { placements, totalLength } = buildPlacementPlan(segments);
    const channelCount = Math.max(...segments.map((segment) => segment.buffer.numberOfChannels), 1);
    const outputBuffer = context.createBuffer(channelCount, totalLength, context.sampleRate);
    placements.forEach((placement) => {
      const { segment, startFrame, fadeInFrames, fadeOutFrames } = placement;
      const inputBuffer = segment.buffer;
      for (let channel = 0; channel < channelCount; channel += 1) {
        const sourceData = inputBuffer.getChannelData(Math.min(channel, inputBuffer.numberOfChannels - 1));
        const outputData = outputBuffer.getChannelData(channel);
        for (let frame = 0; frame < inputBuffer.length; frame += 1) {
          const outputFrame = startFrame + frame;
          if (outputFrame >= outputData.length) break;
          let gain = 1;
          if (fadeInFrames > 0 && frame < fadeInFrames) gain *= frame / fadeInFrames;
          if (fadeOutFrames > 0 && frame >= inputBuffer.length - fadeOutFrames) gain *= Math.max(0, (inputBuffer.length - frame) / fadeOutFrames);
          outputData[outputFrame] += sourceData[frame] * gain;
        }
      }
    });
    return outputBuffer;
  }

  async function playBuffer(buffer) {
    const context = await resumeAudioContext();
    if (!context || !buffer) return false;
    stopCurrentPlayback();
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    currentSource = source;
    return new Promise((resolve) => {
      source.addEventListener("ended", () => {
        if (currentSource === source) currentSource = null;
        resolve(true);
      }, { once: true });
      source.start(0);
    });
  }

  async function speakTokens(tokens) {
    if (!Array.isArray(tokens) || tokens.length === 0) return false;
    const context = await resumeAudioContext();
    if (!context) {
      console.warn("このブラウザはWeb Audio APIに対応していないため、発声できません。");
      return false;
    }
    const segments = await createSegments(tokens);
    if (segments.length === 0) return false;
    return playBuffer(mergeSegments(segments));
  }

  return { speakTokens, stopCurrentPlayback };
})();
