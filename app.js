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
const progressFill = document.getElementById("progressFill");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");

// Mobile progress
const progressBar2 = document.getElementById("progressBar2");
const progressFill2 = document.getElementById("progressFill2");
const currentTimeEl2 = document.getElementById("currentTime2");
const durationEl2 = document.getElementById("duration2");

// Volume
const volume = document.getElementById("volume");
const volFill = document.getElementById("volFill");
const volLabel = document.getElementById("volLabel");
const volIcon = document.getElementById("volIcon");

const cover = document.getElementById("cover");
const vinyl = document.getElementById("vinyl");

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
const API_KEY = "sb_publishable_pJJGRJ_JOQH4d7LCCrK_Tg_Ze68ZYN0";



async function loadMusicList() {
  try {
    const prefix = "a1"; // 👈 folder của bạn

    const res = await fetch(
      "https://byxkiqvhhzckguxltrta.supabase.co/storage/v1/object/list/music",
      {
        method: "POST",
        headers: {
          "apikey": API_KEY,
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prefix: prefix,
          limit: 100
        })
      }
    );

    const data = await res.json();
    console.log("DATA:", data);

    // ❌ nếu API lỗi
    if (!Array.isArray(data)) {
      console.error("API lỗi:", data);
      return;
    }

    // ❌ nếu không có file
    if (data.length === 0) {
      console.warn("Không có file trong folder:", prefix);
      return;
    }

    // ✅ build playlist đúng URL
    playlist = data
  .filter(file => file.name.endsWith(".mp3")) // ✅ chỉ lấy mp3
  .map(file => {
    const url = `https://byxkiqvhhzckguxltrta.supabase.co/storage/v1/object/public/music/a1/${encodeURIComponent(file.name)}`;

    return {
      name: file.name.replace(".mp3", ""),
      file: url
    };
  });

    // ✅ load bài đầu tiên
    currentIndex = 0;
    loadSong(currentIndex);
    renderPlaylist();

  } catch (err) {
    console.error("Lỗi loadMusicList:", err);
  }
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

// ===== PROGRESS FILL (GPU-composited, no repaint) =====
function setProgressPct(pct) {
  const pctStr = pct.toFixed(2) + "%";
  progressFill.style.width = pctStr;
  progressFill2.style.width = pctStr;
}

// ===== VOLUME UI =====
function updateVolUI(val) {
  const pct = Math.round(val * 100);
  volFill.style.width = pct + "%";
  volLabel.textContent = pct + "%";

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
  const mobileContainer = document.getElementById("mobilePlaylistContainer");
  playlistContainer.innerHTML = "";
  if (mobileContainer) mobileContainer.innerHTML = "";
  playlist.forEach((song, index) => {
    const makeItem = (isMobile) => {
      const div = document.createElement("div");
      div.className = `song-item ${index === currentIndex ? "playing" : ""}`;
      div.innerHTML = `🎵 ${song.name}`;
      div.onclick = () => {
        loadSong(index, true);
        audio.play();
        if (isMobile) switchTab("nowplaying");
      };
      return div;
    };
    playlistContainer.appendChild(makeItem(false));
    if (mobileContainer) mobileContainer.appendChild(makeItem(true));
  });
}

function updateActiveSong() {
  // Update desktop sidebar
  playlistContainer.querySelectorAll(".song-item").forEach((el, i) => {
    el.classList.toggle("playing", i === currentIndex);
  });
  // Update mobile playlist
  const mobileContainer = document.getElementById("mobilePlaylistContainer");
  if (mobileContainer) {
    mobileContainer.querySelectorAll(".song-item").forEach((el, i) => {
      el.classList.toggle("playing", i === currentIndex);
    });
    const activeEl = mobileContainer.querySelector(".playing");
    if (activeEl) activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
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

audio.onended = () => {
  if (repeatMode === 2) { audio.currentTime = 0; audio.play(); }
  else if (repeatMode === 1) { nextSong(); }
  else {
    isPlaying = false;
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    vinyl.classList.remove("playing");
    cover.classList.remove("playing");
  }
};

// ===== PROGRESS UPDATE =====
audio.ontimeupdate = () => {
  if (isNaN(audio.duration)) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  const timeStr = formatTime(audio.currentTime);

  // Update range inputs (for thumb position)
  progressBar.value = pct;
  progressBar2.value = pct;

  // Update time labels
  currentTimeEl.textContent = timeStr;
  currentTimeEl2.textContent = timeStr;

  // Update fill divs — width change = GPU composite, no repaint
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

// ===== MOBILE TABS =====
function switchTab(tab) {
  const nowPlaying = document.getElementById("tabNowPlaying");
  const playlist = document.getElementById("tabPlaylist");
  const btnNow = document.getElementById("tabBtnNowPlaying");
  const btnPl = document.getElementById("tabBtnPlaylist");

  if (tab === "nowplaying") {
    nowPlaying.classList.remove("hidden");
    playlist.classList.remove("active");
    btnNow.classList.add("active");
    btnPl.classList.remove("active");
  } else {
    nowPlaying.classList.add("hidden");
    playlist.classList.add("active");
    btnNow.classList.remove("active");
    btnPl.classList.add("active");
  }
}