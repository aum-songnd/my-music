// ===== DOM =====
const audio = document.getElementById("audio");
const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const repeatBtn = document.getElementById("repeatBtn");
const shuffleBtn = document.getElementById("shuffleBtn");

const songTitle = document.getElementById("songTitle");
const vinylTitle = document.getElementById("vinylTitle");
const playlistContainer = document.getElementById("playlistContainer");

// Desktop progress
const progressBar = document.getElementById("progressBar");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");

// Mobile progress
const progressBar2 = document.getElementById("progressBar2");
const currentTimeEl2 = document.getElementById("currentTime2");
const durationEl2 = document.getElementById("duration2");

const volume = document.getElementById("volume");
const volLabel = document.getElementById("volLabel");
const volIcon = document.getElementById("volIcon");
const cover = document.getElementById("cover");
const vinyl = document.getElementById("vinyl");

const root = document.documentElement;

// ===== STATE =====
let playlist = [];
let currentIndex = 0;
let isPlaying = false;

let repeatMode = Number(localStorage.getItem("repeatMode")) || 0;
let isShuffle = localStorage.getItem("shuffle") === "true";
let playedHistory = [];

// ===== INIT =====
window.onload = () => {
  loadMusicList();

  const savedVolume = localStorage.getItem("volume");
  volume.value = savedVolume ?? 0.7;
  audio.volume = volume.value;
  updateVolUI(volume.value);

  currentIndex = Number(localStorage.getItem("currentIndex")) || 0;

  updateRepeatUI();
  updateShuffleUI();
};

// ===== LOAD PLAYLIST =====
async function loadMusicList() {
  const res = await fetch("music/playlist.json");
  playlist = await res.json();
  loadSong(currentIndex);
  renderPlaylist();
}

// ===== LOAD SONG =====
function loadSong(index, resetTime = true) {
  const song = playlist[index];
  if (!song) return;

  const imgSrc = song.image || "img/meme.webp";

  audio.src = song.file;
  songTitle.textContent = song.name;
  vinylTitle.textContent = song.name;
  cover.src = imgSrc;
  vinyl.style.backgroundImage = `url('${imgSrc}')`;

  currentIndex = index;
  localStorage.setItem("currentIndex", index);

  progressBar.value = 0;
  progressBar2.value = 0;
  currentTimeEl.textContent = "0:00";
  currentTimeEl2.textContent = "0:00";
  setProgressPct(0);

  audio.onloadedmetadata = () => {
    durationEl.textContent = formatTime(audio.duration);
    durationEl2.textContent = formatTime(audio.duration);
    if (resetTime) audio.currentTime = 0;
  };

  updateActiveSong();
}

// ===== CSS VAR HELPERS =====
function setProgressPct(pct) {
  root.style.setProperty("--progress-pct", pct.toFixed(2) + "%");
}

function updateVolUI(val) {
  const pct = Math.round(val * 100);
  root.style.setProperty("--volume-pct", pct + "%");
  volLabel.textContent = pct + "%";

  // Update icon based on level
  if (pct === 0) {
    volIcon.className = "fa-solid fa-volume-xmark";
  } else if (pct < 40) {
    volIcon.className = "fa-solid fa-volume-low";
  } else {
    volIcon.className = "fa-solid fa-volume-high";
  }
}

// ===== PLAY / PAUSE =====
function togglePlay() {
  isPlaying ? audio.pause() : audio.play();
}

// ===== NEXT =====
function nextSong() {
  if (isShuffle) {
    playedHistory.push(currentIndex);
    let newIndex;
    do { newIndex = Math.floor(Math.random() * playlist.length); }
    while (playedHistory.includes(newIndex));
    if (playedHistory.length >= playlist.length) playedHistory = [];
    currentIndex = newIndex;
  } else {
    currentIndex = (currentIndex + 1) % playlist.length;
  }
  loadSong(currentIndex, true);
  audio.play();
}

// ===== PREV =====
function prevSong() {
  if (isShuffle && playedHistory.length > 0) {
    currentIndex = playedHistory.pop();
  } else {
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  }
  loadSong(currentIndex, true);
  audio.play();
}

// ===== PLAYLIST UI =====
function renderPlaylist() {
  playlistContainer.innerHTML = "";
  playlist.forEach((song, index) => {
    const div = document.createElement("div");
    div.className = `song-item ${index === currentIndex ? "playing" : ""}`;
    div.innerHTML = `🎵 ${song.name}`;
    div.onclick = () => { loadSong(index, true); audio.play(); };
    playlistContainer.appendChild(div);
  });
}

function updateActiveSong() {
  document.querySelectorAll(".song-item").forEach((el, i) => {
    el.classList.toggle("playing", i === currentIndex);
  });
}

// ===== FORMAT TIME =====
function formatTime(t) {
  if (!t || isNaN(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s < 10 ? "0" + s : s}`;
}

// ===== EVENTS =====
playBtn.onclick = togglePlay;
nextBtn.onclick = nextSong;
prevBtn.onclick = prevSong;

// ===== REPEAT =====
repeatBtn.onclick = () => {
  repeatMode = (repeatMode + 1) % 3;
  localStorage.setItem("repeatMode", repeatMode);
  updateRepeatUI();
};

const repeatOneEl = document.querySelector(".repeat-one");
function updateRepeatUI() {
  if (repeatMode === 0) { repeatBtn.style.color = "white"; repeatOneEl.style.display = "none"; }
  else if (repeatMode === 1) { repeatBtn.style.color = "#1db954"; repeatOneEl.style.display = "none"; }
  else { repeatBtn.style.color = "#1db954"; repeatOneEl.style.display = "block"; }
}

// ===== SHUFFLE =====
shuffleBtn.onclick = () => {
  isShuffle = !isShuffle;
  localStorage.setItem("shuffle", isShuffle);
  updateShuffleUI();
};
function updateShuffleUI() { shuffleBtn.style.color = isShuffle ? "#1db954" : "white"; }

// ===== AUDIO EVENTS =====
audio.onplay = () => {
  isPlaying = true;
  playBtn.textContent = "⏸";
  vinyl.classList.add("playing");
  cover.classList.add("playing");
};

audio.onpause = () => {
  isPlaying = false;
  playBtn.textContent = "▶";
  vinyl.classList.remove("playing");
  cover.classList.remove("playing");
};

audio.onended = () => {
  if (repeatMode === 2) { audio.currentTime = 0; audio.play(); }
  else if (repeatMode === 1) { nextSong(); }
  else {
    isPlaying = false;
    playBtn.textContent = "▶";
    vinyl.classList.remove("playing");
    cover.classList.remove("playing");
  }
};

// ===== PROGRESS =====
audio.ontimeupdate = () => {
  if (isNaN(audio.duration)) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  const timeStr = formatTime(audio.currentTime);

  progressBar.value = pct;
  progressBar2.value = pct;
  currentTimeEl.textContent = timeStr;
  currentTimeEl2.textContent = timeStr;
  setProgressPct(pct);

  localStorage.setItem("time_" + currentIndex, audio.currentTime);
};

// ===== SEEK =====
progressBar.oninput = () => {
  const pct = Number(progressBar.value);
  audio.currentTime = (pct / 100) * audio.duration;
  setProgressPct(pct);
  progressBar2.value = pct;
};
progressBar2.oninput = () => {
  const pct = Number(progressBar2.value);
  audio.currentTime = (pct / 100) * audio.duration;
  setProgressPct(pct);
  progressBar.value = pct;
};

// ===== VOLUME =====
volume.oninput = (e) => {
  const val = Number(e.target.value);
  audio.volume = val;
  localStorage.setItem("volume", val);
  updateVolUI(val);
};