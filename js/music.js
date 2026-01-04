/* Playlists */

const playlists = {
  rhythm: [
    { title: "Testify", file: "music/Testify.mp3" },
    { title: "Grievous Lady", file: "music/GrievousLady.mp3" },
    { title: "Tempestissmo", file: "music/Tempestissimo.mp3" }
  ],
  games: [
    { title: "Game OST 1", file: "music/game1.mp3" }
  ],
  fan: [
    { title: "FNAF 1 Song (by TLT)", file: "music/FNAF1Song.mp3" }
  ],
  anime: [],
  other: []
};

/* State */

let playlist = [];
let currentIndex = 0;

/* Audio Setup */

const audio = new Audio();
audio.crossOrigin = "anonymous";

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const source = audioCtx.createMediaElementSource(audio);
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 32;

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

source.connect(analyser);
analyser.connect(audioCtx.destination);

/* DOM Elements */

const playlistDiv = document.getElementById("playlist");
const mpTitle = document.getElementById("mp-title");
const mpTime = document.getElementById("mp-time");
const playPauseBtn = document.getElementById("playPauseBtn");
const playlistSelect = document.getElementById("music-playlist");

/* Reveal Trigger */
function triggerReveal(element) {
  if (!element) return;

  element.classList.remove("active");
  void element.offsetWidth;
  element.classList.add("active");
}

/* Parent Communication */

function notifyNowPlaying() {
  window.parent?.postMessage({
    type: "music-now-playing",
    title: playlist[currentIndex]?.title || ""
  }, "*");
}

function notifyTimeUpdate(textTime) {
  window.parent?.postMessage({
    type: "music-time-update",
    textTime
  }, "*");
}

function notifyFrequencyData() {
  analyser.getByteFrequencyData(dataArray);
  window.parent?.postMessage({
    type: "music-frequency-data",
    dataArray: Array.from(dataArray)
  }, "*");
}

/* Playlist UI */

function loadPlaylist() {
  playlistDiv.innerHTML = "";

  playlist.forEach((track, index) => {
    const item = document.createElement("div");
    item.className = "track-item reveal";
    item.innerHTML = `<h3>${track.title}</h3>`;
    item.onclick = () => playTrack(index);

    playlistDiv.appendChild(item);

    requestAnimationFrame(() => {
      item.classList.add("active");
    });
  });
}

function updatePlaylistUI() {
  document.querySelectorAll(".track-item").forEach((el, i) => {
    el.classList.toggle("playing", i === currentIndex);
  });
}

/* Playback */

async function playTrack(index) {
  currentIndex = index;

  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  audio.src = playlist[index].file;
  await audio.play();

  mpTitle.textContent = playlist[index].title;
  updatePlaylistUI();
  notifyNowPlaying();
}

/* Time */

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

audio.ontimeupdate = () => {
  const text = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration || 0)}`;
  mpTime.textContent = text;
  notifyTimeUpdate(text);
};

/* Controls */

playlistSelect.onchange = () => {
  playlist = playlists[playlistSelect.value] || [];
  currentIndex = 0;

  audio.pause();
  audio.src = "";
  mpTitle.textContent = "";
  mpTime.textContent = "00:00 / 00:00";

  loadPlaylist();

  const playlistEl = document.getElementById("playlist");
  triggerReveal(playlistEl);
};

playPauseBtn.onclick = async () => {
  if (!playlist.length) return;
  if (audioCtx.state === "suspended") await audioCtx.resume();
  audio.paused ? audio.play() : audio.pause();
};

document.getElementById("nextBtn").onclick = () => {
  playTrack((currentIndex + 1) % playlist.length);
};

document.getElementById("prevBtn").onclick = () => {
  playTrack((currentIndex - 1 + playlist.length) % playlist.length);
};

audio.onended = () => {
  playTrack((currentIndex + 1) % playlist.length);
};

/*Wave Animation */

function animateBars() {
  requestAnimationFrame(animateBars);
  analyser.getByteFrequencyData(dataArray);

  document.querySelectorAll(".bar").forEach((bar, i) => {
    bar.style.height = (dataArray[i * 2] / 255) * 30 + 5 + "px";
  });

  notifyFrequencyData();
}

animateBars();
