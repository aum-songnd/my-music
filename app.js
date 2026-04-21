// ===== DOM =====
const audio = document.getElementById("audio");
const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const songTitle = document.getElementById("songTitle");
const playlistContainer = document.getElementById("playlistContainer");

const progressBar = document.getElementById("progressBar");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");

const volume = document.getElementById("volume");

// ===== STATE =====
let playlist = [];
let currentIndex = 0;
let isPlaying = false;

// ===== INIT =====
window.onload = () => {
  loadMusicList();
};

// ===== LOAD PLAYLIST =====
async function loadMusicList() {
  try {
    const res = await fetch("music/playlist.json");
    playlist = await res.json();

    if (!playlist.length) return;

    loadSong(0);
    renderPlaylist();
  } catch (err) {
    console.error(err);
    songTitle.textContent = "❌ Không load được playlist";
  }
}

// ===== LOAD SONG =====
function loadSong(index) {
  const song = playlist[index];
  if (!song) return;

  audio.src = song.file;
  songTitle.textContent = song.name;

  currentIndex = index;
  updateActiveSong();
}

// ===== PLAY / PAUSE =====
function togglePlay() {
  if (!playlist.length) return;

  if (isPlaying) {
    audio.pause();
  } else {
    audio.play().catch(() => alert("Không phát được nhạc"));
  }
}

// ===== UPDATE UI PLAY =====
function updatePlayUI() {
  playBtn.textContent = isPlaying ? "⏸" : "▶";
}

// ===== NEXT / PREV =====
function nextSong() {
  currentIndex = (currentIndex + 1) % playlist.length;
  loadSong(currentIndex);
  audio.play();
}

function prevSong() {
  currentIndex =
    (currentIndex - 1 + playlist.length) % playlist.length;
  loadSong(currentIndex);
  audio.play();
}

// ===== RENDER PLAYLIST =====
function renderPlaylist() {
  playlistContainer.innerHTML = "";

  playlist.forEach((song, index) => {
    const div = document.createElement("div");
    div.className = `song-item ${
      index === currentIndex ? "playing" : ""
    }`;

    div.innerHTML = `🎵 <span>${song.name}</span>`;

    div.onclick = () => {
      loadSong(index);
      audio.play();
    };

    playlistContainer.appendChild(div);
  });
}

// ===== ACTIVE SONG UI =====
function updateActiveSong() {
  const items = document.querySelectorAll(".song-item");

  items.forEach((item, index) => {
    item.classList.toggle("playing", index === currentIndex);
  });
}

// ===== TIME FORMAT =====
function formatTime(time) {
  if (!time || isNaN(time)) return "0:00";
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m}:${s < 10 ? "0" + s : s}`;
}

// ===== EVENTS =====

// play/pause
playBtn.onclick = togglePlay;

// next / prev
nextBtn.onclick = nextSong;
prevBtn.onclick = prevSong;

// audio play
audio.onplay = () => {
  isPlaying = true;
  updatePlayUI();
};

// audio pause
audio.onpause = () => {
  isPlaying = false;
  updatePlayUI();
};

// auto next
audio.onended = nextSong;

// update progress
audio.ontimeupdate = () => {
  if (!audio.duration) return;

  const percent = (audio.currentTime / audio.duration) * 100;
  progressBar.value = percent;

  currentTimeEl.textContent = formatTime(audio.currentTime);
  durationEl.textContent = formatTime(audio.duration);
};

// seek
progressBar.oninput = () => {
  if (!audio.duration) return;
  audio.currentTime = (progressBar.value / 100) * audio.duration;
};

// volume
volume.oninput = (e) => {
  audio.volume = e.target.value;
};

// ===== OPTIONAL DEFAULT =====
volume.value = 0.7;
audio.volume = 0.7;