const playlist = [
    { title: "Testify", file: "music/Testify.mp3" },
    { title: "Song Title 2", file: "music/song2.mp3" },
    { title: "Song Title 3", file: "music/song3.mp3" }
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
    audio.play();
    updateMiniPlayer();
    updatePlaylistUI();
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
    mpTime.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration || 0)}`;
};

document.getElementById("playPauseBtn").onclick = () => {
    if (audio.paused) audio.play();
    else audio.pause();
};

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

audio.onpause = () => {
    document.querySelectorAll(".bar").forEach(b => b.style.animationPlayState = "paused");
};

audio.onplay = () => {
    document.querySelectorAll(".bar").forEach(b => b.style.animationPlayState = "running");
};

function animateBars() {
    requestAnimationFrame(animateBars);

    analyser.getByteFrequencyData(dataArray);

    const bars = document.querySelectorAll(".bar");

    for (let i = 0; i < bars.length; i++) {
        let value = dataArray[i * 2];  

        let height = (value / 255) * 30 + 5;

        bars[i].style.height = height + "px";
    }
}

loadPlaylist();
updateMiniPlayer();
animateBars();