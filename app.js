// ===================== CONFIG =====================
const API_KEY = "sb_publishable_pJJGRJ_JOQH4d7LCCrK_Tg_Ze68ZYN0";
const SUPABASE_URL = "https://byxkiqvhhzckguxltrta.supabase.co";

// ===================== DOM =====================
const audio = document.getElementById("audio");

const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const repeatBtn = document.getElementById("repeatBtn");
const shuffleBtn = document.getElementById("shuffleBtn");

const songTitle = document.getElementById("songTitle");
const vinylTitle = document.getElementById("vinylTitle");

const playlistContainer = document.getElementById("playlistContainer");
const mobilePlaylistContainer = document.getElementById("mobilePlaylistContainer");

const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");

const progressBar2 = document.getElementById("progressBar2");
const progressFill2 = document.getElementById("progressFill2");
const currentTimeEl2 = document.getElementById("currentTime2");
const durationEl2 = document.getElementById("duration2");

const volume = document.getElementById("volume");
const volFill = document.getElementById("volFill");
const volLabel = document.getElementById("volLabel");
const volIcon = document.getElementById("volIcon");

const cover = document.getElementById("cover");
const vinyl = document.getElementById("vinyl");

// ===================== STATE =====================
let folders = [];
let playlist = [];
let currentIndex = 0;
let isPlaying = false;

let repeatMode = Number(localStorage.getItem("repeatMode")) || 0;
// 0 = no repeat
// 1 = repeat all
// 2 = repeat one

let isShuffle = localStorage.getItem("shuffle") === "true";
let playedHistory = [];

// ===================== INIT =====================
window.onload = () => {
  loadFolders();

  const savedVolume = localStorage.getItem("volume");
  volume.value = savedVolume ?? 0.7;
  audio.volume = volume.value;
  updateVolUI(volume.value);

  updateRepeatUI();
  updateShuffleUI();
};

// ===================== LOAD FOLDERS =====================
async function loadFolders() {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/music`, {
    method: "POST",
    headers: {
      apikey: API_KEY,
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prefix: "", limit: 100 })
  });

  const data = await res.json();
  folders = data.filter(i => i.id === null);

  renderFolders();
}

// ===================== RENDER FOLDERS =====================
function renderFolders() {
  playlistContainer.innerHTML = "";
  mobilePlaylistContainer.innerHTML = "";

  folders.forEach(folder => {

    const makeFolder = (isMobile) => {
      const div = document.createElement("div");
      div.className = "folder-item";
      div.innerHTML = `📁 ${folder.name}`;
      div.onclick = () => toggleFolder(folder.name, div, isMobile);
      return div;
    };

    playlistContainer.appendChild(makeFolder(false));
    mobilePlaylistContainer.appendChild(makeFolder(true));
  });
}

// ===================== TOGGLE FOLDER =====================
async function toggleFolder(prefix, folderEl, isMobile = false) {

  // toggle close
  if (folderEl.nextElementSibling?.classList?.contains("song-list")) {
    folderEl.nextElementSibling.remove();
    return;
  }

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/music`, {
    method: "POST",
    headers: {
      apikey: API_KEY,
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prefix, limit: 100 })
  });

  const data = await res.json();
  const songs = data.filter(f => f.name.endsWith(".mp3"));

  const list = document.createElement("div");
  list.className = "song-list";

  songs.forEach((file, index) => {

    const item = document.createElement("div");
    item.className = "song-item";
    item.innerHTML = `🎵 ${file.name.replace(".mp3","")}`;

    item.onclick = () => {

      playlist = songs.map(f => ({
        name: f.name.replace(".mp3", ""),
        file: `${SUPABASE_URL}/storage/v1/object/public/music/${prefix}/${encodeURIComponent(f.name)}`
      }));

      currentIndex = index;
      loadSong(currentIndex);
      audio.play();

      if (isMobile) switchTab("nowplaying");
    };

    list.appendChild(item);
  });

  const target = isMobile ? mobilePlaylistContainer : playlistContainer;
  target.appendChild(list);
}

// ===================== LOAD SONG =====================
function loadSong(index) {
  const song = playlist[index];
  if (!song) return;

  audio.src = song.file;

  songTitle.textContent = song.name;
  vinylTitle.textContent = song.name;

  currentIndex = index;

  progressBar.value = 0;
  progressBar2.value = 0;

  currentTimeEl.textContent = "0:00";
  currentTimeEl2.textContent = "0:00";

  audio.onloadedmetadata = () => {
    durationEl.textContent = formatTime(audio.duration);
    durationEl2.textContent = formatTime(audio.duration);
  };

  updateActiveSong();
}

// ===================== PLAY =====================
function togglePlay() {
  isPlaying ? audio.pause() : audio.play();
}

playBtn.onclick = togglePlay;

// ===================== NEXT =====================
function nextSong() {

  if (isShuffle) {
    playedHistory.push(currentIndex);

    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * playlist.length);
    } while (playedHistory.includes(newIndex) && playedHistory.length < playlist.length);

    if (playedHistory.length >= playlist.length) playedHistory = [];

    currentIndex = newIndex;

  } else {
    currentIndex++;

    if (currentIndex >= playlist.length) {
      if (repeatMode === 1) currentIndex = 0;
      else return audio.pause();
    }
  }

  loadSong(currentIndex);
  audio.play();
}

// ===================== PREV =====================
function prevSong() {

  if (isShuffle && playedHistory.length > 0) {
    currentIndex = playedHistory.pop();
  } else {
    currentIndex--;

    if (currentIndex < 0) {
      if (repeatMode === 1) currentIndex = playlist.length - 1;
      else currentIndex = 0;
    }
  }

  loadSong(currentIndex);
  audio.play();
}

nextBtn.onclick = nextSong;
prevBtn.onclick = prevSong;

// ===================== END SONG =====================
audio.onended = () => {

  if (repeatMode === 2) {
    audio.currentTime = 0;
    audio.play();
    return;
  }

  if (currentIndex < playlist.length - 1) {
    nextSong();
  } else if (repeatMode === 1) {
    currentIndex = 0;
    loadSong(currentIndex);
    audio.play();
  }
};

// ===================== PROGRESS =====================
audio.ontimeupdate = () => {
  if (!audio.duration) return;

  const pct = (audio.currentTime / audio.duration) * 100;

  progressBar.value = pct;
  progressBar2.value = pct;

  progressFill.style.width = pct + "%";
  progressFill2.style.width = pct + "%";

  currentTimeEl.textContent = formatTime(audio.currentTime);
  currentTimeEl2.textContent = formatTime(audio.currentTime);
};

// ===================== SEEK =====================
progressBar.oninput = () => {
  audio.currentTime = (progressBar.value / 100) * audio.duration;
};

progressBar2.oninput = () => {
  audio.currentTime = (progressBar2.value / 100) * audio.duration;
};

// ===================== VOLUME =====================
volume.oninput = (e) => {
  audio.volume = e.target.value;
  localStorage.setItem("volume", e.target.value);
  updateVolUI(e.target.value);
};

function updateVolUI(val) {
  const pct = val * 100;
  volFill.style.width = pct + "%";
  volLabel.textContent = Math.round(pct) + "%";
}

// ===================== AUDIO UI =====================
audio.onplay = () => {
  isPlaying = true;
  playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  vinyl.classList.add("playing");
  cover.classList.add("playing");
};

audio.onpause = () => {
  isPlaying = false;
  playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  vinyl.classList.remove("playing");
  cover.classList.remove("playing");
};

// ===================== REPEAT / SHUFFLE =====================
repeatBtn.onclick = () => {
  repeatMode = (repeatMode + 1) % 3;
  localStorage.setItem("repeatMode", repeatMode);
  updateRepeatUI();
};

shuffleBtn.onclick = () => {
  isShuffle = !isShuffle;
  localStorage.setItem("shuffle", isShuffle);
  updateShuffleUI();
};

function updateRepeatUI() {

  const badge = document.querySelector(".repeat-one");

  if (repeatMode === 0) {
    repeatBtn.style.color = "white";
    badge.style.display = "none";
  }

  else if (repeatMode === 1) {
    repeatBtn.style.color = "#1db954";
    badge.style.display = "none";
  }

  else if (repeatMode === 2) {
    repeatBtn.style.color = "#1db954";
    badge.style.display = "flex";
  }
}

function updateShuffleUI() {
  shuffleBtn.style.color = isShuffle ? "#1db954" : "white";
}

// ===================== FORMAT =====================
function formatTime(t) {
  if (!t || isNaN(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

// ===================== ACTIVE UI =====================
function updateActiveSong() {
  document.querySelectorAll(".song-item").forEach((el, i) => {
    el.classList.toggle("playing", i === currentIndex);
  });
}

function switchTab(tab) {

  const nowPlaying = document.getElementById("tabNowPlaying");
  const playlistTab = document.getElementById("tabPlaylist");

  const btnNow = document.getElementById("tabBtnNowPlaying");
  const btnPl = document.getElementById("tabBtnPlaylist");

  if (tab === "playlist") {

    nowPlaying.classList.add("hidden");
    playlistTab.classList.remove("hidden");
    playlistTab.classList.add("active");

    btnNow.classList.remove("active");
    btnPl.classList.add("active");
  }

  else {

    nowPlaying.classList.remove("hidden");
    playlistTab.classList.add("hidden");
    playlistTab.classList.remove("active");

    btnNow.classList.add("active");
    btnPl.classList.remove("active");
  }
}