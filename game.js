let canvas, ctx;
let gameRunning = false;
let gamePaused = false;
let countdownActive = false;
let score = 0;
let coins = 0;
let sessionCoins = 0;
let bestScore = 0;
let playerName = 'Игрок';
let musicEnabled = true;
let ysdk = null;
let lastAdTime = 0;
let continueUsed = false;
let adsRemoved = false;

let ball = {
    x: 0, y: 0, radius: 20, vx: 0, vy: 0, color: '#00ffff', trail: [],
    shield: false, jetpack: false, superJump: false, magnet: false,
    shieldTime: 0, jetpackTime: 0, superJumpTime: 0, magnetTime: 0
};

let platforms = [];
let particles = [];
let coins_items = [];
let powerups = [];
let obstacles = [];

let gameSpeed = 3;
let jumpPower = -12;
let gravity = 0.4;
let currentColor = '#00ffff';
let moveSpeed = 8;
let difficulty = 1;
let keys = { left: false, right: false };

// Изображение шара
let ballImage = null;
let ballImageLoaded = false;

const colorThemes = [
    { id: 'cyan', name: 'Неоновый Циан', color: '#00ffff', price: 0, owned: true },
    { id: 'magenta', name: 'Неоновый Магента', color: '#ff00ff', price: 100, owned: false },
    { id: 'lime', name: 'Неоновый Лайм', color: '#00ff00', price: 200, owned: false },
    { id: 'orange', name: 'Неоновый Оранж', color: '#ff8000', price: 300, owned: false },
    { id: 'red', name: 'Огненный Красный', color: '#ff0040', price: 400, owned: false },
    { id: 'purple', name: 'Космический Фиолет', color: '#8000ff', price: 500, owned: false },
    { id: 'gold', name: 'Золотой', color: '#ffd700', price: 600, owned: false },
    { id: 'ice', name: 'Ледяной', color: '#80ffff', price: 700, owned: false },
    { id: 'fire', name: 'Пламя', color: '#ff4500', price: 800, owned: false },
    { id: 'rainbow', name: 'Радуга', color: 'rainbow', price: 1000, owned: false }
];

let selectedTheme = 'cyan';
let rainbowOffset = 0;
let leaderboard = [];

let bgMusic = null;
let audioContext = null;
let currentRank = 0;
let rankUpdateInterval = null;

window.addEventListener('DOMContentLoaded', () => {
    try {
        bgMusic = document.getElementById('bg-music');
        if (bgMusic) {
            bgMusic.volume = 0.3;
            bgMusic.loop = true;
            bgMusic.addEventListener('error', () => {
                console.log('Музыка не загрузилась, играем без неё');
            });
        }
    } catch(e) {
        console.log('Ошибка инициализации музыки:', e);
    }
    
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {
        console.log('AudioContext не поддерживается:', e);
    }
    
    // Загрузка изображения шара
    ballImage = new Image();
    ballImage.src = 'baby.png';
    ballImage.onload = () => {
        console.log('Изображение шара загружено');
        ballImageLoaded = true;
    };
    ballImage.onerror = () => {
        console.log('Не удалось загрузить baby.png');
        ballImageLoaded = false;
    };
});

function playSound(type) {
    if (!audioContext) return;
    if (audioContext.state === 'suspended') audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
        case 'jump':
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'bounce':
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.08);
            gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
            oscillator.type = 'square';
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.08);
            break;
        case 'coin':
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1600, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
        case 'click':
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.05);
            break;
        case 'hover':
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.05);
            break;
        case 'powerup':
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
        case 'gameover':
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            break;
        case 'hit':
            oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.type = 'sawtooth';
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'countdown':
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'go':
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.type = 'square';
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
    }
}

function showNeonModal(title, message, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'neon-modal-overlay';
    overlay.innerHTML = `
        <div class="neon-modal">
            <h3>${title}</h3>
            <p>${message}</p>
            <button id="neon-modal-close">OK</button>
        </div>
    `;
    document.body.appendChild(overlay);
    
    document.getElementById('neon-modal-close').addEventListener('click', () => {
        overlay.remove();
        if (callback) callback();
    });
}

YaGames.init().then(sdk => {
    ysdk = sdk;
    if (ysdk && ysdk.adv) ysdk.adv.loadBannerAdv();
    loadProgress();
}).catch(err => console.log('SDK не загружен', err));

function showInterstitialAd() {
    if (adsRemoved) {
        console.log('Реклама отключена пользователем');
        return;
    }
    
    if (!ysdk || !ysdk.adv) return;
    const now = Date.now();
    if (now - lastAdTime > 240000) {
        ysdk.adv.showFullscreenAdv({
            callbacks: {
                onClose: (wasShown) => { if (wasShown) lastAdTime = Date.now(); },
                onError: (e) => console.log('Ошибка рекламы', e)
            }
        });
    }
}

function buyRemoveAds() {
    if (!ysdk || !ysdk.payments) {
        showNeonModal('⚠️ ОШИБКА', 'Платежи временно недоступны');
        return;
    }
    
    ysdk.payments.purchase('remove_ads').then(() => {
        adsRemoved = true;
        saveProgress();
        showNeonModal('УСПЕХ!', 'Реклама отключена навсегда!\nСпасибо за поддержку! ');
        renderShopItems();
    }).catch(err => {
        console.log('Ошибка покупки:', err);
        if (err.code !== 'ERR_ALREADY_OWNED') {
            showNeonModal('❌ ОШИБКА', 'Не удалось совершить покупку. Попробуйте позже.');
        } else {
            adsRemoved = true;
            showNeonModal('УСПЕХ!', 'Реклама уже отключена!');
        }
    });
}

function buyCoinsPackage(packageId, amount) {
    if (!ysdk || !ysdk.payments) {
        showNeonModal('️ ОШИБКА', 'Платежи временно недоступны');
        return;
    }
    
    ysdk.payments.purchase(packageId).then(() => {
        coins += amount;
        saveProgress();
        updateMenuStats();
        renderShopItems();
        showNeonModal('УСПЕХ!', `Получено ${amount} монет! `);
        playSound('coin');
    }).catch(err => {
        console.log('Ошибка покупки:', err);
        showNeonModal('❌ ОШИБКА', 'Не удалось совершить покупку. Попробуйте позже.');
    });
}

function showRewardedAdForCoins() {
    if (!ysdk || !ysdk.adv) { 
        showNeonModal('️ ОШИБКА', 'Реклама временно недоступна');
        return; 
    }
    ysdk.adv.showRewardedVideo({
        callbacks: {
            onOpen: () => { gamePaused = true; },
            onRewarded: () => {
                coins += sessionCoins;
                sessionCoins = 0;
                playSound('coin');
                updateUI();
                updateMenuStats();
                showNeonModal('🎉 МОНЕТЫ УДВОЕНЫ!', `Теперь у вас: ${coins} монет`);
            },
            onClose: () => { gamePaused = false; },
            onError: (e) => { 
                console.log('Ошибка', e); 
                gamePaused = false; 
                showNeonModal('️ ОШИБКА', 'Не удалось загрузить рекламу');
            }
        }
    });
}

function showRewardedAdForContinue() {
    if (continueUsed) {
        showNeonModal('⚠️ ЛИМИТ', 'Вы уже использовали продолжение в этой игре!');
        return;
    }
    if (!ysdk || !ysdk.adv) { 
        showNeonModal('⚠️ ОШИБКА', 'Реклама временно недоступна');
        return; 
    }
    
    const continueBtn = document.getElementById('watch-ad-continue-btn');
    if (continueBtn) {
        continueBtn.style.display = 'none';
        continueBtn.disabled = true;
    }
    
    ysdk.adv.showRewardedVideo({
        callbacks: {
            onOpen: () => { gamePaused = true; },
            onRewarded: () => {
                continueUsed = true;
                showScreen('game-screen');
                gameRunning = true;
                gamePaused = false;
                ball.y = canvas.height - 150;
                ball.vy = jumpPower;
                ball.x = canvas.width / 2;
                playSound('jump');
                if (musicEnabled && bgMusic) bgMusic.play().catch(() => {});
                gameLoop();
            },
            onClose: () => { 
                gamePaused = false; 
                if (!gameRunning && !continueUsed) {
                    showScreen('game-over');
                    const btn = document.getElementById('watch-ad-continue-btn');
                    if (btn) btn.style.display = 'block';
                }
            },
            onError: (e) => { 
                console.log('Ошибка', e); 
                gamePaused = false; 
                showScreen('game-over');
                const btn = document.getElementById('watch-ad-continue-btn');
                if (btn) btn.style.display = 'block';
            }
        }
    });
}

function init() {
    console.log('Инициализация игры...');
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const allButtons = document.querySelectorAll('button.neon-btn, .pause-btn');
    allButtons.forEach(btn => {
        btn.addEventListener('mouseenter', () => playSound('hover'));
    });
    
    // Кнопка ИГРАТЬ
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', () => { 
            console.log('Кнопка ИГРАТЬ нажата');
            playSound('click'); 
            startCountdown(); 
        });
    } else {
        console.error('Кнопка play-btn не найдена!');
    }
    
    document.getElementById('shop-btn').addEventListener('click', () => { playSound('click'); openShop(); });
    document.getElementById('shop-back').addEventListener('click', () => { playSound('click'); showScreen('main-menu'); if (musicEnabled && bgMusic) bgMusic.play().catch(() => {}); });
    document.getElementById('retry-btn').addEventListener('click', () => { playSound('click'); startCountdown(); });
    document.getElementById('watch-ad-btn').addEventListener('click', () => { playSound('click'); showRewardedAdForCoins(); });
    document.getElementById('watch-ad-continue-btn')?.addEventListener('click', () => { playSound('click'); showRewardedAdForContinue(); });
    document.getElementById('menu-btn').addEventListener('click', () => { playSound('click'); showScreen('main-menu'); if (musicEnabled && bgMusic) bgMusic.play().catch(() => {}); showInterstitialAd(); });
    document.getElementById('resume-btn').addEventListener('click', () => { playSound('click'); resumeGame(); });
    document.getElementById('quit-btn').addEventListener('click', () => { playSound('click'); showScreen('main-menu'); gamePaused = false; gameRunning = false; if (bgMusic) bgMusic.pause(); if (musicEnabled && bgMusic) bgMusic.play().catch(() => {}); });
    document.getElementById('leaderboard-btn').addEventListener('click', () => { playSound('click'); showGlobalLeaderboard(); });
    
    document.getElementById('music-toggle-btn').addEventListener('click', () => {
        playSound('click');
        musicEnabled = !musicEnabled;
        const btn = document.getElementById('music-toggle-btn');
        btn.textContent = musicEnabled ? '🎵 МУЗЫКА: ВКЛ' : '🔇 МУЗЫКА: ВЫКЛ';
        if (musicEnabled) { if (bgMusic) bgMusic.play().catch(() => {}); } else { if (bgMusic) bgMusic.pause(); }
        saveProgress();
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') {
            if (gameRunning && !gamePaused) pauseGame();
            else if (gamePaused) resumeGame();
            return;
        }
        if (countdownActive || !gameRunning || gamePaused) return;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    });

    let touchActive = false;
    canvas.addEventListener('touchstart', (e) => {
        if (!gameRunning || gamePaused || countdownActive) return;
        e.preventDefault();
        touchActive = true;
        const clientX = e.touches[0].clientX;
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        if (x < canvas.width / 2) { keys.left = true; keys.right = false; }
        else { keys.right = true; keys.left = false; }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        if (!touchActive || !gameRunning) return;
        e.preventDefault();
        const clientX = e.touches[0].clientX;
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        if (x < canvas.width / 2) { keys.left = true; keys.right = false; }
        else { keys.right = true; keys.left = false; }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        touchActive = false;
        keys.left = false;
        keys.right = false;
    });
    
    updateMenuStats();
    drawMenuBackground();
    
    if (musicEnabled && bgMusic) {
        document.addEventListener('click', () => { bgMusic.play().catch(() => {}); }, { once: true });
    }
    
    console.log('Инициализация завершена');
}

function resizeCanvas() {
    const wrapper = document.getElementById('game-wrapper');
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function startCountdown() {
    console.log('Запуск обратного отсчёта');
    if (bgMusic) bgMusic.pause();
    showScreen('game-screen');
    score = 0; sessionCoins = 0; difficulty = 1; gameSpeed = 3;
    ball.x = canvas.width / 2; ball.y = canvas.height - 150;
    ball.vx = 0; ball.vy = 0; ball.trail = [];
    ball.shield = false; ball.jetpack = false; ball.superJump = false; ball.magnet = false;
    ball.shieldTime = 0; ball.jetpackTime = 0; ball.superJumpTime = 0; ball.magnetTime = 0;
    platforms = []; coins_items = []; powerups = []; obstacles = []; particles = [];
    continueUsed = false;
    
    const continueBtn = document.getElementById('watch-ad-continue-btn');
    if (continueBtn) {
        continueBtn.style.display = 'block';
        continueBtn.disabled = false;
    }
    
    platforms.push({ x: canvas.width / 2 - 75, y: canvas.height - 100, width: 150, height: 20, type: 'normal', moveDir: 1, moveSpeed: 2, broken: false });
    for (let i = 0; i < 15; i++) generatePlatform(canvas.height - 100 - (i + 1) * 80);
    
    countdownActive = true; gameRunning = false; keys.left = false; keys.right = false;
    const countdownScreen = document.getElementById('countdown-screen');
    const countdownNumber = document.getElementById('countdown-number');
    const countdownText = document.getElementById('countdown-text');
    countdownScreen.classList.remove('hidden');
    
    let count = 3;
    countdownNumber.textContent = count; countdownNumber.classList.remove('go'); countdownText.textContent = 'ГОТОВЬСЬ!';
    countdownNumber.style.animation = 'none'; setTimeout(() => countdownNumber.style.animation = '', 10);
    playSound('countdown');
    
    const countInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownNumber.textContent = count; countdownNumber.classList.remove('go'); countdownText.textContent = 'ГОТОВЬСЬ!';
            countdownNumber.style.animation = 'none'; setTimeout(() => countdownNumber.style.animation = '', 10);
            playSound('countdown');
        } else if (count === 0) {
            countdownNumber.textContent = 'GO!'; countdownNumber.classList.add('go'); countdownText.textContent = 'ВПЕРЁД!';
            countdownNumber.style.animation = 'none'; setTimeout(() => countdownNumber.style.animation = '', 10);
            playSound('go');
        } else {
            clearInterval(countInterval); countdownScreen.classList.add('hidden'); countdownActive = false; startGame();
        }
    }, 1000);
}

function startGame() {
    console.log('Начало игры');
    gameRunning = true; 
    ball.vy = jumpPower; 
    playSound('jump'); 
    updateUI(); 
    if (musicEnabled && bgMusic) {
        bgMusic.currentTime = 0;
        bgMusic.play().catch(() => {});
    }
    gameLoop();
    
    if (ysdk) {
        updateRanking();
        rankUpdateInterval = setInterval(updateRanking, 10000);
    }
}

function drawMenuBackground() {
    if (document.getElementById('main-menu').classList.contains('active')) {
        ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < 50; i++) {
            const x = (Math.sin(Date.now() * 0.001 + i) * 0.5 + 0.5) * canvas.width;
            const y = (Math.cos(Date.now() * 0.0008 + i * 0.5) * 0.5 + 0.5) * canvas.height;
            const size = Math.sin(Date.now() * 0.002 + i) * 2 + 2;
            ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 255, ${0.3 + Math.sin(Date.now() * 0.003 + i) * 0.2})`; ctx.fill();
        }
        requestAnimationFrame(drawMenuBackground);
    }
}

function generatePlatform(y) {
    const screenWidth = canvas.width;
    let minWidth, maxWidth;
    
    if (screenWidth < 500) {
        minWidth = screenWidth * 0.15;
        maxWidth = screenWidth * 0.25;
    } else {
        minWidth = Math.max(40, 70 - difficulty * 2);
        maxWidth = Math.max(60, 100 - difficulty * 2);
    }
    
    const width = Math.random() * (maxWidth - minWidth) + minWidth;
    let x;
    
    if (platforms.length > 0) {
        const lastPlat = platforms[platforms.length - 1];
        let maxDist = screenWidth < 500 ? screenWidth * 0.35 : Math.min(180, 130 + difficulty * 10);
        const minDist = screenWidth < 500 ? screenWidth * 0.15 : 60 + difficulty * 5;
        
        let newX = lastPlat.x + (Math.random() - 0.5) * maxDist * 2;
        const distance = Math.abs(newX - lastPlat.x);
        if (distance < minDist) {
            newX = lastPlat.x + (newX > lastPlat.x ? minDist : -minDist);
        }
        x = Math.max(10, Math.min(canvas.width - width - 10, newX));
    } else { 
        x = Math.random() * (canvas.width - width); 
    }
    
    let type = 'normal';
    const rand = Math.random();
    const breakingChance = Math.min(0.35, 0.1 + (difficulty - 1) * 0.04);
    const movingChance = Math.min(0.25, 0.05 + (difficulty - 1) * 0.03);
    
    if (rand < movingChance && difficulty >= 2) type = 'moving';
    else if (rand < movingChance + breakingChance && difficulty >= 2) type = 'breaking';
    
    const platHeight = screenWidth < 500 ? 12 : 15;
    platforms.push({ x, y, width, height: platHeight, type, moveDir: 1, moveSpeed: 1.5 + difficulty * 0.3, broken: false });
    
    const powerupChance = Math.min(0.12, 0.06 + (difficulty - 1) * 0.006);
    if (Math.random() < powerupChance && difficulty >= 2) {
        const powerupTypes = ['shield', 'jetpack', 'superjump', 'magnet'];
        powerups.push({ x: x + width / 2, y: y - 50, width: 30, height: 30, type: powerupTypes[Math.floor(Math.random() * powerupTypes.length)], collected: false });
    }
    
    const spikeChance = Math.min(0.25, 0.08 + (difficulty - 1) * 0.03);
    if (Math.random() < spikeChance && difficulty >= 2 && type === 'normal') {
        obstacles.push({ x: x + width / 2, y: y - 15, width: 18, height: 15, type: 'spike' });
    }
    
    if (Math.random() < 0.25) {
        coins_items.push({ x: x + width / 2, y: y - 40, radius: 12, collected: false, bobOffset: Math.random() * Math.PI * 2 });
    }
}

function jump() {
    let onPlatform = false;
    platforms.forEach(plat => {
        if (!plat.broken && ball.vy >= 0 && ball.y + ball.radius >= plat.y && ball.y + ball.radius <= plat.y + plat.height + 15 && ball.x >= plat.x - ball.radius && ball.x <= plat.x + plat.width + ball.radius) {
            onPlatform = true;
        }
    });
    if (onPlatform) {
        const power = ball.superJump ? jumpPower * 1.5 : jumpPower;
        ball.vy = power;
        playSound('bounce');
        createParticles(ball.x, ball.y + ball.radius, currentColor, 8);
    }
}

function update() {
    if (!gameRunning || gamePaused) return;
    if (keys.left) ball.vx = -moveSpeed;
    else if (keys.right) ball.vx = moveSpeed;
    else ball.vx *= 0.85;
    
    ball.x += ball.vx;
    if (ball.x < -ball.radius) ball.x = canvas.width + ball.radius;
    if (ball.x > canvas.width + ball.radius) ball.x = -ball.radius;
    
    if (ball.jetpack && ball.vy < 0) ball.vy -= 0.3;
    if (ball.magnet) {
        coins_items.forEach(coin => {
            if (coin.collected) return;
            const dx = ball.x - coin.x, dy = ball.y - coin.y, dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) { coin.x += dx * 0.05; coin.y += dy * 0.05; }
        });
    }
    
    ball.vy += gravity; ball.y += ball.vy;
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 10) ball.trail.shift();
    
    if (ball.vy > 0) {
        platforms.forEach(plat => {
            const prevY = ball.y - ball.vy;
            const wasAbovePlatform = prevY + ball.radius <= plat.y + 5;
            
            if (!plat.broken && wasAbovePlatform && ball.y + ball.radius >= plat.y && ball.y + ball.radius <= plat.y + plat.height + 15 && ball.x >= plat.x - ball.radius && ball.x <= plat.x + plat.width + ball.radius) {
                if (plat.type === 'breaking') { 
                    plat.broken = true; 
                    createParticles(plat.x + plat.width/2, plat.y, '#ff8000', 15); 
                    playSound('hit');
                    return; 
                }
                const power = ball.superJump ? jumpPower * 1.5 : jumpPower;
                ball.vy = power; 
                ball.y = plat.y - ball.radius;
                playSound('bounce');
                createParticles(ball.x, ball.y + ball.radius, currentColor, 8);
            }
        });
    }
    
    platforms.forEach(plat => {
        if (plat.type === 'moving' && !plat.broken) {
            plat.x += plat.moveSpeed * plat.moveDir;
            if (plat.x <= 0 || plat.x + plat.width >= canvas.width) plat.moveDir *= -1;
        }
    });
    
    obstacles.forEach(obs => {
        if (ball.x > obs.x - obs.width/2 - ball.radius && ball.x < obs.x + obs.width/2 + ball.radius && ball.y > obs.y - obs.height/2 - ball.radius && ball.y < obs.y + obs.height/2 + ball.radius) {
            if (ball.shield) { 
                ball.shield = false; ball.shieldTime = 0; 
                playSound('hit'); createParticles(ball.x, ball.y, '#ff0000', 20); 
            } else { 
                ball.vy = jumpPower * 1.5;
                playSound('hit'); createParticles(ball.x, ball.y, '#ff0000', 20); 
            }
        }
    });

    if (ball.y < canvas.height / 2) {
        const diff = canvas.height / 2 - ball.y;
        ball.y = canvas.height / 2;
        platforms.forEach(p => p.y += diff); 
        coins_items.forEach(c => c.y += diff);
        powerups.forEach(p => p.y += diff); 
        particles.forEach(p => p.y += diff); 
        obstacles.forEach(o => o.y += diff);
        
        const pointsEarned = Math.floor(diff / 10);
        if (pointsEarned > 0) {
            score += pointsEarned;
            updateUI();
        }
        
        const newDifficulty = 1 + Math.floor(score / 500);
        if (newDifficulty > difficulty) { 
            difficulty = newDifficulty; 
            gameSpeed += 0.5; 
        }
    }
    
    platforms = platforms.filter(plat => plat.y < canvas.height + 100 && !plat.broken);
    obstacles = obstacles.filter(obs => obs.y < canvas.height + 100);
    const highestPlatform = platforms.length > 0 ? Math.min(...platforms.map(p => p.y)) : canvas.height;
    while (highestPlatform > 150) { generatePlatform(highestPlatform - 80 - Math.random() * 30); break; }
    
    coins_items = coins_items.filter(coin => {
        if (coin.collected) return false;
        coin.bobOffset += 0.1;
        const dx = ball.x - coin.x, dy = ball.y - coin.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ball.radius + coin.radius) {
            coin.collected = true; sessionCoins += 1; playSound('coin'); createParticles(coin.x, coin.y, '#ffd700', 10); updateUI(); return false;
        }
        return coin.y < canvas.height + 100;
    });
    
    powerups = powerups.filter(pup => {
        if (pup.collected) return false;
        const dx = ball.x - pup.x, dy = ball.y - pup.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ball.radius + pup.width/2) {
            pup.collected = true; activatePowerup(pup.type); playSound('powerup'); createParticles(pup.x, pup.y, '#00ff00', 15); return false;
        }
        return pup.y < canvas.height + 100;
    });
    
    particles = particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life--; return p.life > 0; });
    
    if (ball.shield) { ball.shieldTime--; if (ball.shieldTime <= 0) ball.shield = false; }
    if (ball.jetpack) { ball.jetpackTime--; if (ball.jetpackTime <= 0) ball.jetpack = false; }
    if (ball.superJump) { ball.superJumpTime--; if (ball.superJumpTime <= 0) ball.superJump = false; }
    if (ball.magnet) { ball.magnetTime--; if (ball.magnetTime <= 0) ball.magnet = false; }
    
    if (ball.y > canvas.height + 100 && !ball.shield) gameOver();
}

function activatePowerup(type) {
    switch(type) {
        case 'shield': ball.shield = true; ball.shieldTime = 300; break;
        case 'jetpack': ball.jetpack = true; ball.jetpackTime = 300; break;
        case 'superjump': ball.superJump = true; ball.superJumpTime = 300; break;
        case 'magnet': ball.magnet = true; ball.magnetTime = 300; break;
    }
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) particles.push({ x, y, vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12, life: 30 + Math.random() * 20, color, size: Math.random() * 5 + 2 });
}

function draw() {
    ctx.fillStyle = 'rgba(10, 10, 26, 0.3)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!gameRunning) return;
    
    if (selectedTheme === 'rainbow') { 
        rainbowOffset += 0.05; 
        currentColor = `hsl(${(rainbowOffset * 50) % 360}, 100%, 50%)`; 
    } else if (selectedTheme === 'fire') {
        rainbowOffset += 0.02;
        const fireHue = (rainbowOffset * 20) % 40;
        currentColor = `hsl(${fireHue}, 100%, 50%)`;
    } else { 
        currentColor = colorThemes.find(t => t.id === selectedTheme)?.color || '#00ffff'; 
    }
    
    ball.trail.forEach((pos, i) => {
        const alpha = i / ball.trail.length * 0.5, size = ball.radius * (i / ball.trail.length);
        ctx.beginPath(); ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        ctx.fillStyle = currentColor + Math.floor(alpha * 255).toString(16).padStart(2, '0'); ctx.fill();
    });
    
    platforms.forEach(plat => {
        if (plat.broken) return;
        let gradient = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.height);
        if (plat.type === 'normal') { gradient.addColorStop(0, '#00ccff'); gradient.addColorStop(1, '#0066cc'); } 
        else if (plat.type === 'moving') { gradient.addColorStop(0, '#ff00ff'); gradient.addColorStop(1, '#9900cc'); } 
        else if (plat.type === 'breaking') { gradient.addColorStop(0, '#ff8800'); gradient.addColorStop(1, '#cc4400'); }
        
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 12;
        ctx.shadowColor = gradient;
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(plat.x, plat.y, plat.width, 4);
        if (plat.type === 'breaking') {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(plat.x + 10, plat.y + 8, 5, 3);
            ctx.fillRect(plat.x + plat.width - 20, plat.y + 12, 5, 3);
        }
    });
    
    obstacles.forEach(obs => {
        ctx.fillStyle = '#ff0040'; ctx.shadowBlur = 10; ctx.shadowColor = '#ff0040';
        ctx.beginPath(); ctx.moveTo(obs.x - obs.width/2, obs.y + obs.height/2);
        ctx.lineTo(obs.x, obs.y - obs.height/2); ctx.lineTo(obs.x + obs.width/2, obs.y + obs.height/2);
        ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
    });

    powerups.forEach(pup => {
        if (pup.collected) return;
        let color, icon;
        switch(pup.type) { case 'shield': color = '#00ffff'; icon = '🛡️'; break; case 'jetpack': color = '#ff8000'; icon = '🚀'; break; case 'superjump': color = '#00ff00'; icon = '⬆️'; break; case 'magnet': color = '#ff00ff'; icon = '🧲'; break; }
        ctx.beginPath(); ctx.arc(pup.x, pup.y, pup.width/2, 0, Math.PI * 2); ctx.fillStyle = color; ctx.shadowBlur = 15; ctx.shadowColor = color; ctx.fill(); ctx.shadowBlur = 0;
        ctx.font = '16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(icon, pup.x, pup.y);
    });
    
    coins_items.forEach(coin => {
        if (coin.collected) return;
        const bobY = Math.sin(coin.bobOffset) * 5;
        ctx.beginPath(); ctx.arc(coin.x, coin.y + bobY, coin.radius, 0, Math.PI * 2); ctx.fillStyle = '#ffd700'; ctx.shadowBlur = 15; ctx.shadowColor = '#ffd700'; ctx.fill(); ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(coin.x - 3, coin.y + bobY - 3, 4, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
    });
    
    particles.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.globalAlpha = p.life / 50; ctx.fill(); ctx.globalAlpha = 1; });
    
    if (ball.shield) { ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius + 8, 0, Math.PI * 2); ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + Math.sin(Date.now() * 0.01) * 0.3})`; ctx.lineWidth = 3; ctx.stroke(); }
    
    // Отрисовка неоновго шара (изображение)
    if (ballImageLoaded && ballImage) {
        const imgSize = ball.radius * 5.5;
        ctx.drawImage(ballImage, ball.x - imgSize/2, ball.y - imgSize/2, imgSize, imgSize);
    }
}

function gameLoop() { update(); draw(); if (gameRunning) requestAnimationFrame(gameLoop); }
function pauseGame() { gamePaused = true; if (bgMusic) bgMusic.pause(); showScreen('pause-menu'); }
function resumeGame() { gamePaused = false; showScreen('game-screen'); if (musicEnabled && bgMusic) bgMusic.play().catch(() => {}); gameLoop(); }

function submitToLeaderboard(score) {
    if (!ysdk) return;
    ysdk.getLeaderboards().then(lb => {
        return lb.setLeaderboardScore('globalscore', score);
    }).then(() => console.log('Рекорд отправлен:', score))
      .catch(err => console.log('Ошибка отправки рекорда:', err));
}

function gameOver() {
    hideRanking();
    gameRunning = false; 
    coins += sessionCoins; 
    playSound('gameover'); 
    if (bgMusic) bgMusic.pause();
    
    const isNewBest = score > bestScore; 
    if (isNewBest) bestScore = score;
    
    if (score > 0) submitToLeaderboard(score);
    
    document.getElementById('final-score').textContent = score; 
    document.getElementById('final-coins').textContent = sessionCoins;
    
    const bestResult = document.getElementById('best-result');
    if (isNewBest) { bestResult.style.display = 'flex'; document.getElementById('best-score').textContent = bestScore; } 
    else { bestResult.style.display = 'none'; }
    
    showInterstitialAd();
    showScreen('game-over'); 
    saveProgress(); 
    updateMenuStats();
}

function showGlobalLeaderboard() {
    if (!ysdk) { showNeonModal('⚠️ ОШИБКА', 'Yandex SDK не загружен'); return; }
    playSound('click');
    
    const modal = document.createElement('div');
    modal.id = 'global-lb-modal';
    modal.className = 'screen active';
    modal.innerHTML = `
        <h2 style="font-size: 32px; color: #ffd700; margin-bottom: 20px; text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);"> ГЛОБАЛЬНЫЙ РЕЙТИНГ</h2>
        <div id="global-lb-list" style="width: 100%; max-width: 500px; margin-bottom: 20px;">
            <div style="text-align: center; color: #fff; padding: 40px;"><div style="font-size: 40px; margin-bottom: 20px;"></div>Загрузка...</div>
        </div>
        <button class="neon-btn" id="close-global-lb">ЗАКРЫТЬ</button>
    `;
    document.getElementById('game-wrapper').appendChild(modal);
    
    ysdk.getLeaderboards().then(lb => lb.getLeaderboardEntries('globalscore', { limit: 15, offset: 0 }))
    .then(entries => {
        return ysdk.getLeaderboards().then(lb => {
            return lb.getLeaderboardPlayerEntry('globalscore').then(personalEntry => {
                displayGlobalLeaderboard(entries, personalEntry);
            }).catch(() => displayGlobalLeaderboard(entries, null));
        });
    }).catch(err => {
        console.log('Ошибка загрузки:', err);
        document.getElementById('global-lb-list').innerHTML = `<div style="text-align: center; color: #ff0040; padding: 40px;"><div style="font-size: 40px; margin-bottom: 20px;">❌</div>Не удалось загрузить рейтинг<br><small>Попробуйте позже</small></div>`;
    });
    
    document.getElementById('close-global-lb').addEventListener('click', () => modal.remove());
}

function displayGlobalLeaderboard(entries, personalEntry) {
    const list = document.getElementById('global-lb-list');
    if (!entries || entries.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: #888; padding: 40px;"><div style="font-size: 40px; margin-bottom: 20px;">📊</div>Пока нет записей<br><small>Стань первым!</small></div>`;
        return;
    }
    
    let html = '';
    const medals = ['', '🥈', ''];
    
    entries.forEach((entry, index) => {
        const isYou = entry.player && entry.player.name === playerName;
        const medal = index < 3 ? medals[index] : `#${index + 1}`;
        const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
        const playerName_display = entry.player ? entry.player.name : 'Аноним';
        html += `<div class="leaderboard-item ${rankClass} ${isYou ? 'you' : ''}"><span class="lb-rank">${medal}</span><span class="lb-name">${playerName_display}</span><span class="lb-score">${entry.score}</span></div>`;
    });
    
    if (personalEntry && personalEntry.rank > 15) {
        html += `<div style="border-top: 3px dashed #ffd700; margin: 20px 0;"></div>
        <div class="leaderboard-item you" style="border: 3px solid #00ffff; box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);">
            <span class="lb-rank" style="color: #00ffff;">#${personalEntry.rank}</span>
            <span class="lb-name" style="color: #00ffff; font-weight: 700;">ТЫ</span>
            <span class="lb-score">${personalEntry.score}</span>
        </div>`;
    } else if (!personalEntry || personalEntry.rank === 0) {
        html += `<div style="border-top: 3px dashed #888; margin: 20px 0;"></div>
        <div style="text-align: center; color: #888; padding: 20px; font-size: 16px;"><div style="font-size: 40px; margin-bottom: 10px;">🎮</div>У тебя пока нет рекорда<br><small style="color: #ffd700;">Сыграй и попади в рейтинг!</small></div>`;
    }
    list.innerHTML = html;
}

function updateRanking() {
    if (!ysdk || !gameRunning) return;
    ysdk.getLeaderboards().then(lb => lb.getLeaderboardPlayerEntry('globalscore'))
    .then(entry => {
        if (entry && entry.rank > 0) { currentRank = entry.rank; displayRanking(entry); }
    }).catch(err => console.log('Ошибка обновления рейтинга:', err));
}

function displayRanking(entry) {
    const rankingDisplay = document.getElementById('ranking-display');
    const playerNameSpan = document.getElementById('ranking-player-name');
    const positionSpan = document.getElementById('ranking-position');
    if (!rankingDisplay || !playerNameSpan || !positionSpan) return;
    rankingDisplay.style.display = 'block';
    playerNameSpan.textContent = playerName;
    positionSpan.textContent = `#${entry.rank}`;
}

function hideRanking() {
    const rankingDisplay = document.getElementById('ranking-display');
    if (rankingDisplay) rankingDisplay.style.display = 'none';
    if (rankUpdateInterval) { clearInterval(rankUpdateInterval); rankUpdateInterval = null; }
}

function openShop() { showScreen('shop-screen'); renderShopItems(); }

function renderShopItems() {
    const container = document.getElementById('shop-items');
    container.innerHTML = '';
    
    const shopWrapper = document.createElement('div');
    
    const themesColumn = document.createElement('div');
    
    colorThemes.forEach(theme => {
        const item = document.createElement('div');
        item.className = 'shop-item';
        if (theme.owned) item.classList.add('owned');
        if (theme.id === selectedTheme) item.classList.add('selected');
        
        item.addEventListener('mouseenter', () => playSound('hover'));
        
        let colorDisplay = theme.id === 'rainbow' ? 
            'background: linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;' : 
            `color: ${theme.color}`;
        
        let actionHtml = '';
        if (theme.owned) {
            actionHtml = theme.id === selectedTheme ? '<span class="selected-label">ВЫБРАНО</span>' : `<button class="select-btn" onclick="selectTheme('${theme.id}')">ВЫБРАТЬ</button>`;
        } else {
            const canAfford = coins >= theme.price;
            actionHtml = `<span class="price-label">${theme.price}</span><button class="buy-btn" ${!canAfford ? 'disabled' : ''} onclick="buyTheme('${theme.id}')">КУПИТЬ</button>`;
        }
        
        item.innerHTML = `
            <div class="shop-item-info">
                <div class="shop-item-name">${theme.name}</div>
                <div class="shop-item-desc" style="${colorDisplay}; font-size: 16px; font-weight: bold;">● Цвет шара</div>
            </div>
            <div class="shop-item-action">${actionHtml}</div>`;
        themesColumn.appendChild(item);
    });
    
    const premiumColumn = document.createElement('div');
    
    const removeAdsItem = document.createElement('div');
    removeAdsItem.className = 'shop-item premium-item';
    removeAdsItem.addEventListener('mouseenter', () => playSound('hover'));
    removeAdsItem.innerHTML = `
        <div class="shop-item-info">
            <div class="shop-item-name" style="color: #ff00ff;">🚫 Удалить рекламу</div>
            <div class="shop-item-desc" style="color: #888; font-size: 13px;">Никакой рекламы навсегда!</div>
        </div>
        <div class="shop-item-action">
            ${adsRemoved ? '<span class="owned-label" style="color: #00ff00; font-weight: 700;">✅ КУПЛЕНО</span>' : '<button class="buy-premium-btn" onclick="buyRemoveAds()">149₽</button>'}
        </div>`;
    premiumColumn.appendChild(removeAdsItem);
    
    const coinsHeader = document.createElement('div');
    coinsHeader.className = 'coins-header';
    coinsHeader.addEventListener('mouseenter', () => playSound('hover'));
    coinsHeader.textContent = '💰 КУПИТЬ МОНЕТЫ';
    premiumColumn.appendChild(coinsHeader);
    
    const coinPackages = [
        { amount: 100, priceRub: 49, id: 'coins_100' },
        { amount: 200, priceRub: 89, id: 'coins_200' },
        { amount: 300, priceRub: 129, id: 'coins_300' },
        { amount: 400, priceRub: 159, id: 'coins_400' },
        { amount: 500, priceRub: 199, id: 'coins_500' }
    ];
    
    coinPackages.forEach(pkg => {
        const coinItem = document.createElement('div');
        coinItem.className = 'shop-item premium-item coin-package';
        coinItem.addEventListener('mouseenter', () => playSound('hover'));
        coinItem.innerHTML = `
            <div class="shop-item-info">
                <div class="shop-item-name" style="color: #ffd700;">${pkg.amount} монет</div>
                <div class="shop-item-desc" style="color: #888; font-size: 12px;">Быстрая покупка</div>
            </div>
            <div class="shop-item-action">
                <button class="buy-premium-btn" onclick="buyCoinsPackage('${pkg.id}', ${pkg.amount})">${pkg.priceRub}₽</button>
            </div>`;
        premiumColumn.appendChild(coinItem);
    });
    
    shopWrapper.appendChild(themesColumn);
    shopWrapper.appendChild(premiumColumn);
    container.appendChild(shopWrapper);
}

window.buyTheme = function(id) { 
    playSound('click'); 
    const theme = colorThemes.find(t => t.id === id); 
    if (theme && coins >= theme.price && !theme.owned) { 
        coins -= theme.price; 
        theme.owned = true; 
        selectedTheme = id; 
        playSound('coin'); 
        saveProgress(); 
        updateMenuStats(); 
        renderShopItems(); 
    } 
};

window.selectTheme = function(id) { 
    playSound('click'); 
    const theme = colorThemes.find(t => t.id === id); 
    if (theme && theme.owned) { 
        selectedTheme = id; 
        saveProgress(); 
        renderShopItems(); 
    } 
};

function updateUI() { 
    document.getElementById('current-score').textContent = score; 
    document.getElementById('game-coins').textContent = sessionCoins; 
}

function updateMenuStats() { 
    document.getElementById('menu-coins').textContent = coins; 
    document.getElementById('menu-best').textContent = bestScore; 
    document.getElementById('shop-balance').textContent = coins; 
}

function saveProgress() {
    if (!ysdk) return;
    ysdk.getPlayer().then(player => { 
        player.setData({ 
            coins, bestScore, playerName, selectedTheme, 
            ownedThemes: colorThemes.filter(t => t.owned).map(t => t.id), 
            leaderboard, musicEnabled, adsRemoved 
        }); 
    }).catch(err => console.log('Не удалось сохранить', err));
}

function loadProgress() {
    if (!ysdk) return;
    ysdk.getPlayer().then(player => {
        player.getData(['coins', 'bestScore', 'playerName', 'selectedTheme', 'ownedThemes', 'leaderboard', 'musicEnabled', 'adsRemoved']).then(data => {
            if (data.coins) coins = data.coins; 
            if (data.bestScore) bestScore = data.bestScore; 
            if (data.playerName) playerName = sanitizeName(data.playerName);
            if (data.selectedTheme) selectedTheme = data.selectedTheme;
            if (data.ownedThemes) data.ownedThemes.forEach(id => { 
                const theme = colorThemes.find(t => t.id === id); 
                if (theme) theme.owned = true; 
            });
            if (data.leaderboard) leaderboard = data.leaderboard;
            if (data.musicEnabled !== undefined) { 
                musicEnabled = data.musicEnabled; 
                const btn = document.getElementById('music-toggle-btn'); 
                if(btn) btn.textContent = musicEnabled ? '🎵 МУЗЫКА: ВКЛ' : '🔇 МУЗЫКА: ВЫКЛ'; 
            }
            if (data.adsRemoved !== undefined) adsRemoved = data.adsRemoved;
            updateMenuStats();
        });
    }).catch(err => console.log('Не удалось загрузить', err));
}

function sanitizeName(name) {
    name = name.trim();
    name = name.replace(/<[^>]*>/g, '');
    name = name.replace(/javascript:/gi, '');
    name = name.replace(/on\w+\s*=/gi, '');
    name = name.replace(/[<>{}[\]\\|;'"`]/g, '');
    name = name.replace(/[^a-zA-Zа-яА-ЯёЁ0-9 _-]/g, '');
    name = name.replace(/\s+/g, ' ');
    name = name.substring(0, 15);
    if (containsBannedWords(name) || name.length < 2 || /^[\s.]+$/.test(name)) return 'Игрок';
    return name;
}

function containsBannedWords(text) {
    const lowerText = text.toLowerCase();
    const bannedWords = ['блядь', 'бля', 'блять', 'блят', 'блядина', 'блядство', 'сука', 'сучка', 'сучонок', 'сучий', 'пиздец', 'пизда', 'пиздатый', 'заебал', 'заебись', 'хуй', 'хуёвый', 'хуята', 'хуесос', 'ебать', 'ебало', 'еблан', 'ебучий', 'ебанутый', 'мудак', 'мудило', 'мудозвон', 'уёбок', 'уебан', 'уебище', 'говно', 'говнюк', 'говнище', 'дерьмо', 'долбоёб', 'долбаёб', 'мразь', 'мразота', 'подлец', 'тварь', 'тварина', 'ублюдок', 'выродок', 'придурок', 'придурошный', 'кретин', 'дебил', 'даун', 'идиот', 'имбецил', 'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn', 'hell', 'dick', 'pussy', 'cock', 'motherfucker', 'ass', 'fucker', 'лох', 'лошок', 'лошара', 'чмо', 'чмырь', 'гандон', 'презерватив', 'сволочь', 'гавно', 'срань', 'задрот', 'дрочила', 'аутист', 'шизик'];
    for (let word of bannedWords) { if (lowerText.includes(word)) return true; }
    return false;
}

function askPlayerName() {
    const savedName = localStorage.getItem('neonJumpPlayerName');
    if (savedName) {
        const validatedName = sanitizeName(savedName);
        playerName = validatedName;
        if (validatedName === 'Игрок') { localStorage.removeItem('neonJumpPlayerName'); askPlayerName(); }
    } else { 
        const name = prompt('Введите ваше имя для таблицы рекордов\n\nПравила:\n• От 2 до 15 символов\n• Только буквы, цифры, пробел, - _\n• Без мата и оскорблений\n• Без спецсимволов (< > / \\ и т.д.)', 'Игрок');
        if (name && name.trim()) { 
            playerName = sanitizeName(name);
            localStorage.setItem('neonJumpPlayerName', playerName); 
        } else { playerName = 'Игрок'; }
    }
}

window.onload = () => { askPlayerName(); init(); };