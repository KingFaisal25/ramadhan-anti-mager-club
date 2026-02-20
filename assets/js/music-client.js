/**
 * Background Music Client
 * Ramadhan Anti Mager Club 🌙
 */
(function () {
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

    let isPlaying = false;

    const playMusic = () => {
        // Attempt to play
        music.play().then(() => {
            isPlaying = true;
        }).catch(e => {
            isPlaying = false;
            console.log('Autoplay blocked. Waiting for interaction...');
        });
    };

    // 2. Try to play immediately
    window.addEventListener('DOMContentLoaded', playMusic);
    playMusic();

    // 3. Fallback: play on first user interaction
    const firstPlay = () => {
        if (!isPlaying) playMusic();
        document.removeEventListener('click', firstPlay);
        document.removeEventListener('touchstart', firstPlay);
    };

    document.addEventListener('click', firstPlay);
    document.addEventListener('touchstart', firstPlay);

    // 4. Persistence handling (Optional: resume from last time if possible)
    // Note: Standard MPA will always restart the track. 
    // We could use localStorage.setItem('music_pos', music.currentTime) if needed.
})();
