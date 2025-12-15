const playlist = [
  { title: "Testify", file: "music/Testify.mp3" },
  { title: "Grievous Lady", file: "music/GrievousLady.mp3" },
  { title: "FNAF 1 Song(by TLT)", file: "music/FNAF1Song.mp3" }
];

let currentIndex = 0;

const audio = new Audio(playlist[currentIndex].file);
audio.crossOrigin = "anonymous";

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const source = audioCtx.createMediaElementSource(audio);
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 32;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

source.connect(analyser);
analyser.connect(audioCtx.destination);

const playlistDiv = document.getElementById("playlist");
const mpTitle = document.getElementById("mp-title");
const mpTime = document.getElementById("mp-time");
const playPauseBtn = document.getElementById("playPauseBtn");

// Sends now-playing info to parent so global bar appears with title
function notifyNowPlaying() {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: "music-now-playing", 
      title: playlist[currentIndex].title
    }, "*");
  }
}

// Sends formatted time string to parent for global bar
function notifyTimeUpdate(textTime) {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: "music-time-update", 
      textTime
    }, "*");
  }
}

// Sends EXACT frequency data to parent for identical bar animation
function notifyFrequencyData() {
  if (window.parent && window.parent !== window) {
    analyser.getByteFrequencyData(dataArray);
    window.parent.postMessage({
      type: "music-frequency-data", 
      dataArray: Array.from(dataArray)
    }, "*");
  }
}

function loadPlaylist() {
  playlistDiv.innerHTML = "";
  playlist.forEach((track, index) => {
    const item = document.createElement("div");
    item.classList.add("track-item");
    item.innerHTML = `<h3>${track.title}</h3>`;
    item.onclick = () => playTrack(index);
    if (index === currentIndex) item.classList.add("playing");
    playlistDiv.appendChild(item);
  });
}

function playTrack(index) {
  currentIndex = index;
  audio.src = playlist[index].file;
  audio.load();
  audio.play();
  updateMiniPlayer();
  updatePlaylistUI();
  notifyNowPlaying();
}

function updatePlaylistUI() {
  document.querySelectorAll(".track-item").forEach((el, i) => {
    el.classList.toggle("playing", i === currentIndex);
  });
}

function updateMiniPlayer() {
  mpTitle.textContent = playlist[currentIndex].title;
}

function formatTime(sec) {
  let m = Math.floor(sec / 60);
  let s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

audio.ontimeupdate = () => {
  const text = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration || 0)}`;
  mpTime.textContent = text;
  notifyTimeUpdate(text);
};

playPauseBtn.onclick = async () => {
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }
  if (audio.paused) {
    audio.play();
    notifyNowPlaying();
  } else {
    audio.pause();
  }
};

// Connect LOCAL music page buttons
document.getElementById("nextBtn").onclick = () => {
  currentIndex = (currentIndex + 1) % playlist.length;
  playTrack(currentIndex);
};

document.getElementById("prevBtn").onclick = () => {
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  playTrack(currentIndex);
};

audio.onended = () => {
  currentIndex = (currentIndex + 1) % playlist.length;
  playTrack(currentIndex);
};

// IDENTICAL ANIMATION LOOP - local bars + sends data to global bars
function animateBars() {
  requestAnimationFrame(animateBars);
  
  analyser.getByteFrequencyData(dataArray);
  
  // LOCAL bars in music.html - ORIGINAL exact logic
  const localBars = document.querySelectorAll(".bar");
  for (let i = 0; i < localBars.length; i++) {
    let value = dataArray[i * 2];
    let height = (value / 255) * 30 + 5;
    localBars[i].style.height = height + "px";
  }
  
  // Send EXACT SAME DATA to parent for global bars
  notifyFrequencyData();
}

// Listen for control commands from global mini player
window.addEventListener("message", function(event) {
  if (event.source !== window.parent) return;
  
  const data = event.data;
  if (!data || data.type !== "music-command") return;

  if (data.command === "prev") {
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    playTrack(currentIndex);
  }
  if (data.command === "next") {
    currentIndex = (currentIndex + 1) % playlist.length;
    playTrack(currentIndex);
  }
  if (data.command === "toggle-play") {
    if (audio.paused) {
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      audio.play();
      notifyNowPlaying();
    } else {
      audio.pause();
    }
  }
});

loadPlaylist();
updateMiniPlayer();
animateBars();
