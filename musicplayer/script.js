const audio = new Audio();
let currentTrackIndex = 0;

// Rastgele kapak seçilebilecek resimler
const coverImages = ['images/jesse-pinkman-jesse.gif','images/monkey-music-monkey.gif','images/dante-dance.gif','images/patrick-bateman-american-psycho.gif','images/jetstream-sam-metal-gear-rising.gif'
];

// Yerleşik müzik listesi
const playlist = [
    {
      name: "Assassin's Creed 2 OST - Ezio's Family (Track 03)",
      url: "mp3/assassins-creed-2-ezios-family.mp3",
      artist: "Jesper Kyd"
    },
    {
      name: "Silver - Wham Bam Shang-A-Lang",
      url: "mp3/silver-wham-bam-shang-a-lang.mp3",
      artist: "Silver"
    },
    {
      name: "Want To Be Free",
      url: "mp3/want-to-be-free.mp3",
      artist: "Sea Power" 
    },
    {
      name: "Slowdive - Everyone Knows",
      url: "mp3/slowdive-everyone-knows.mp3",
      artist: "Slowdive"
    },
    {
      name: "Whirling-In-Rags, 8 AM",
      url: "mp3/whirling-in-rags-8-am.mp3",
      artist: "British Sea Power" 
    },
    {
      name: "End of Small Sanctuary",
      url: "mp3/end-of-small-sanctuary.mp3",
      artist: "Akira Yamaoka"
    },
    {
      name: "Slowdive - Sugar For The Pill (Official Video)",
      url: "mp3/slowdive-sugar-for-the-pill.mp3",
      artist: "Slowdive"
    },
    {
      name: "Gwyn, Lord of Cinder",
      url: "mp3/gwyn-lord-of-cinder.mp3",
      artist: "Motoi Sakuraba" 
    },
    {
      name: "Slowdive - Painting Lost",
      url: "mp3/slowdive-painting-lost.mp3",
      artist: "Slowdive"
    },
    {
      name: "Low Roar - Bones (feat. Jófríður Ákadóttir)",
      url: "mp3/low-roar-bones.mp3",
      artist: "Low Roar"
    },
    {
      name: "Slowdive - Sleep",
      url: "mp3/slowdive-sleep.mp3",
      artist: "Slowdive"
    },
    {
      name: "Regal Ancestor Spirit",
      url: "mp3/regal-ancestor-spirit.mp3",
      artist: "Yuka Kitamura" 
    },
    {
      name: "Woodkid - To The Wonders (from THE BEACH)",
      url: "mp3/woodkid-to-the-wonders.mp3",
      artist: "Woodkid"
    },
    {
      name: "Burn, Baby, Burn",
      url: "mp3/burn-baby-burn.mp3",
      artist: "Sea Power" 
    }
];

const shuffleBtn = document.getElementById('shuffleBtn');
const prevBtn = document.getElementById('prevBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const nextBtn = document.getElementById('nextBtn');
const repeatBtn = document.getElementById('repeatBtn');
const currentTrack = document.getElementById('currentTrack');
const artistInfo = document.getElementById('artistInfo');
const albumArt = document.getElementById('albumArt');
const progressBar = document.getElementById('progressBar');
const currentTime = document.getElementById('currentTime');
const duration = document.getElementById('duration');
const playlistElement = document.getElementById('playlist');
const volumeBar = document.getElementById('volumeBar');
const volumeLevel = document.getElementById('volumeLevel');

// Shuffle ve Repeat durumları
let isShuffleOn = false;
let isRepeatOn = false;

// Sayfa yüklendiğinde
window.addEventListener('load', () => {
  renderPlaylist();
  playTrack(0);
  playPauseBtn.src = "images/play.png";
});

// Kontrol tuşları
playPauseBtn.addEventListener('click', togglePlayPause);
prevBtn.addEventListener('click', playPreviousTrack);
nextBtn.addEventListener('click', playNextTrack);
shuffleBtn.addEventListener('click', toggleShuffle);
repeatBtn.addEventListener('click', toggleRepeat);

// Ses kontrolü (tıklama ve sürükleme)
function updateVolume(e) {
  const rect = volumeBar.getBoundingClientRect();
  let pos = (e.clientX - rect.left) / rect.width;
  pos = Math.min(Math.max(pos, 0), 1); // 0 ile 1 arasında sınırla
  audio.volume = pos;
  volumeLevel.style.width = `${pos * 100}%`;
}

volumeBar.addEventListener('click', updateVolume);

// Sürüklenebilir ses çubuğu
volumeBar.addEventListener('mousedown', (e) => {
  updateVolume(e);
  const onMouseMove = (e) => {
    updateVolume(e);
  };
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', () => {
    document.removeEventListener('mousemove', onMouseMove);
  }, { once: true });
});

// Oynat/Duraklat fonksiyonu
function togglePlayPause() {
  if (audio.paused) {
    audio.play();
    playPauseBtn.src = "images/pause.png";
  } else {
    audio.pause();
    playPauseBtn.src = "images/play.png";
  }
}

// Zaman güncellemeleri
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('loadedmetadata', updateDuration);
audio.addEventListener('ended', () => {
  if (isRepeatOn) {
    playTrack(currentTrackIndex);
  } else {
    playNextTrack();
  }
});

// Önceki şarkı
function playPreviousTrack() {
  if (isShuffleOn) {
    // Rastgele şarkı seçimi
    currentTrackIndex = Math.floor(Math.random() * playlist.length);
  } else {
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
  }
  playTrack(currentTrackIndex);
}

// Sonraki şarkı
function playNextTrack() {
  if (isShuffleOn) {
    // Rastgele şarkı seçimi
    currentTrackIndex = Math.floor(Math.random() * playlist.length);
  } else {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
  }
  playTrack(currentTrackIndex);
}

// Şarkı çal
function playTrack(index) {
  currentTrackIndex = index;
  const track = playlist[currentTrackIndex];
  audio.src = track.url;
  audio.play();
  currentTrack.textContent = track.name;
  artistInfo.textContent = track.artist;
  // Rastgele kapak seçimi
  const randomCover = coverImages[Math.floor(Math.random() * coverImages.length)];
  albumArt.style.backgroundImage = `url('${randomCover}')`;
  playPauseBtn.src = "images/pause.png";
  renderPlaylist();
}

// Playlist gösterimi
function renderPlaylist() {
  playlistElement.innerHTML = '';
  playlist.forEach((track, index) => {
    const div = document.createElement('div');
    div.className = `playlist-item ${index === currentTrackIndex ? 'playing' : ''}`;
    div.textContent = track.name;
    div.addEventListener('click', () => playTrack(index));
    playlistElement.appendChild(div);
  });
}


function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}


function updateProgress() {
  if (!isNaN(audio.duration)) {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${progress}%`;
    currentTime.textContent = formatTime(audio.currentTime);
  }
}


function updateDuration() {
  if (!isNaN(audio.duration)) {
    duration.textContent = formatTime(audio.duration);
  }
}


document.querySelector('.progress-container').addEventListener('click', (e) => {
  const rect = e.target.getBoundingClientRect();
  const pos = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pos * audio.duration;
});


function toggleShuffle() {
  isShuffleOn = !isShuffleOn;
  shuffleBtn.src = isShuffleOn ? "images/shuffle-active.png" : "images/shuffle.png";
}


function toggleRepeat() {
  isRepeatOn = !isRepeatOn;
  repeatBtn.src = isRepeatOn ? "images/repeat-active.png" : "images/repeat.png";
}
const muteBtn = document.getElementById('muteBtn');
let isMuted = false;

muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  audio.muted = isMuted;
  muteBtn.src = isMuted ? "images/mute.png" : "images/volume.png";
});

const openWindowBtn = document.getElementById('openWindowBtn');

openWindowBtn.addEventListener('click', () => {
  window.open(
    'https://open.spotify.com/playlist/66PbY1xxH1C4aaIoQgi3aL?si=57b49d6cb7d7471a',  
    '_blank',
    'width=600,height=400'
  );
});
