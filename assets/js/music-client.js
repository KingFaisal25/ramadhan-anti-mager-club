/**
 * Background Music Client with Persistence
 * Ramadhan Anti Mager Club 🌙
 */
(function () {
    const STORAGE_KEY = 'ramc_music_pos';

    // 1. Create Audio Element if not exists
    let music = document.getElementById('bgMusic');
    if (!music) {
        music = document.createElement('audio');
        music.id = 'bgMusic';
        music.src = 'assets/audio/bg-music.mp4';
        music.loop = true;
        music.autoplay = true;
        music.style.display = 'none';
        document.body.appendChild(music);
    }

    // 2. Restore Position
    const savedPos = localStorage.getItem(STORAGE_KEY);
    if (savedPos) {
        music.currentTime = parseFloat(savedPos);
    }

    let isPlaying = false;

    const playMusic = () => {
        music.play().then(() => {
            isPlaying = true;
        }).catch(e => {
            isPlaying = false;
            console.log('Autoplay blocked. Waiting for interaction...');
        });
    };

    // 3. Periodic Position Save
    music.addEventListener('timeupdate', () => {
        if (music.currentTime > 0) {
            localStorage.setItem(STORAGE_KEY, music.currentTime);
        }
    });

    // Save on page change/refresh
    window.addEventListener('beforeunload', () => {
        localStorage.setItem(STORAGE_KEY, music.currentTime);
    });

    // 4. Try to play immediately
    window.addEventListener('DOMContentLoaded', playMusic);
    playMusic();

    // 5. Fallback: play on first user interaction
    const firstPlay = () => {
        if (!isPlaying) playMusic();
        document.removeEventListener('click', firstPlay);
        document.removeEventListener('touchstart', firstPlay);
    };

    document.addEventListener('click', firstPlay);
    document.addEventListener('touchstart', firstPlay);
})();
