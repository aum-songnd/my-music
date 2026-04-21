// ===== DOM =====
const audio = document.getElementById("audio");
const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const repeatBtn = document.getElementById("repeatBtn");
const shuffleBtn = document.getElementById("shuffleBtn");

const songTitle = document.getElementById("songTitle");
const playlistContainer = document.getElementById("playlistContainer");

const progressBar = document.getElementById("progressBar");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");

const volume = document.getElementById("volume");
const cover = document.getElementById("cover");
const vinyl = document.getElementById("vinyl");

// ===== STATE =====
let playlist = [];
let currentIndex = 0;
let isPlaying = false;

let repeatMode = Number(localStorage.getItem("repeatMode")) || 0; // 0 off | 1 all | 2 one
let isShuffle = localStorage.getItem("shuffle") === "true";

let playedHistory = [];

// ===== INIT =====
window.onload = () => {
  loadMusicList();

  // volume
  const savedVolume = localStorage.getItem("volume");
  volume.value = savedVolume ?? 0.7;
  audio.volume = volume.value;

  // song index
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

  audio.src = song.file;
  songTitle.textContent = song.name;
  cover.src = song.image;

  currentIndex = index;
  localStorage.setItem("currentIndex", index);

  progressBar.value = 0;
  currentTimeEl.textContent = "0:00";

  audio.onloadedmetadata = () => {
    durationEl.textContent = formatTime(audio.duration);

    // chỉ reset khi chuyển bài
    if (resetTime) {
      audio.currentTime = 0;
    }
  };

  updateActiveSong();
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
    do {
      newIndex = Math.floor(Math.random() * playlist.length);
    } while (playedHistory.includes(newIndex));

    if (playedHistory.length >= playlist.length) {
      playedHistory = [];
    }

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
    currentIndex =
      (currentIndex - 1 + playlist.length) % playlist.length;
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

    div.onclick = () => {
      loadSong(index, true);
      audio.play();
    };

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
  if (repeatMode === 0) {
    repeatBtn.style.color = "white";
    repeatOneEl.style.display = "none";
  } 
  else if (repeatMode === 1) {
    repeatBtn.style.color = "#1db954";
    repeatOneEl.style.display = "none";
  } 
  else {
    repeatBtn.style.color = "#1db954";
    repeatOneEl.style.display = "block";
  }
}

// ===== SHUFFLE =====
shuffleBtn.onclick = () => {
  isShuffle = !isShuffle;
  localStorage.setItem("shuffle", isShuffle);
  updateShuffleUI();
};

function updateShuffleUI() {
  shuffleBtn.style.color = isShuffle ? "#1db954" : "white";
}

// ===== AUDIO EVENTS =====
audio.onplay = () => {
  isPlaying = true;
  playBtn.textContent = "⏸";
  vinyl.classList.add("playing");
};

audio.onpause = () => {
  isPlaying = false;
  playBtn.textContent = "▶";
  vinyl.classList.remove("playing");
};

// ===== 🔥 FIX LOGIC REPEAT =====
audio.onended = () => {
  if (repeatMode === 2) {
    audio.currentTime = 0;
    audio.play();
  } 
  else if (repeatMode === 1) {
    nextSong();
  } 
  else {
    // mode 0 → dừng hẳn
    isPlaying = false;
    playBtn.textContent = "▶";
    vinyl.classList.remove("playing");
  }
};

// ===== PROGRESS =====
audio.ontimeupdate = () => {
  if (isNaN(audio.duration)) return;

  progressBar.value = (audio.currentTime / audio.duration) * 100;
  currentTimeEl.textContent = formatTime(audio.currentTime);

  const timeKey = "time_" + currentIndex;
  localStorage.setItem(timeKey, audio.currentTime);
};

// ===== SEEK =====
progressBar.oninput = () => {
  audio.currentTime = (progressBar.value / 100) * audio.duration;
};

// ===== VOLUME =====
volume.oninput = (e) => {
  audio.volume = e.target.value;
  localStorage.setItem("volume", e.target.value);
};