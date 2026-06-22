// --- DOM Elements ---
const startBtn = document.getElementById('start-mic-btn');
const instructionsWrapper = document.getElementById('instructions-wrapper');
const cakeContainer = document.getElementById('cake-container');
const ambientLight = document.getElementById('ambient-light');
const flame = document.getElementById('flame');
const glow = document.getElementById('glow');
const blowText = document.getElementById('blow-text');

const darkRoom = document.getElementById('dark-room');
const brightRoom = document.getElementById('bright-room');
const birthdayCard = document.getElementById('birthday-card');

// --- Audio API Setup for Blowing Detection ---
let audioContext;
let analyser;
let microphone;
let isBlowing = false;
let candleOut = false;

async function startMicAndShowCake() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        
        microphone.connect(analyser);
        analyser.fftSize = 256;
        
        // Hide instructions, show cake
        instructionsWrapper.classList.add('fade-out');
        
        setTimeout(() => {
            cakeContainer.classList.remove('hidden');
            setTimeout(() => {
                cakeContainer.classList.add('show');
                ambientLight.classList.add('on');
                // Start listening to mic
                listenToMic();
            }, 100);
        }, 1000);

    } catch (err) {
        console.error("Microphone access denied or not available.", err);
        alert("Please allow microphone access to blow out the candle! (Or use a supported browser).");
    }
}

startBtn.addEventListener('click', startMicAndShowCake);

function listenToMic() {
    if (candleOut) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function detectBlow() {
        if (candleOut) return;
        
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        let average = sum / bufferLength;

        // Threshold for blowing 
        if (average > 55) {
            isBlowing = true;
            document.querySelectorAll('.flame').forEach(f => f.classList.add('blowing'));
            
            if (!blowText.innerText.includes("harder")) {
                 blowText.innerText = "blow a lil harder!";
            }
            
            if (average > 75) {
                extinguishCandle();
            }
        } else {
            isBlowing = false;
            document.querySelectorAll('.flame').forEach(f => f.classList.remove('blowing'));
        }

        requestAnimationFrame(detectBlow);
    }
    
    detectBlow();
}

function extinguishCandle() {
    candleOut = true;
    document.querySelectorAll('.flame').forEach(f => f.classList.add('out'));
    blowText.style.display = 'none'; // Hide text immediately
    
    // Stop microphone stream to save resources
    if (microphone && microphone.mediaStream) {
        microphone.mediaStream.getTracks().forEach(track => track.stop());
    }

    // Wait a moment in the dark, then transition to Bright Room
    setTimeout(() => {
        darkRoom.classList.remove('active');
        brightRoom.classList.add('active');
        
        // Fire confetti!
        setTimeout(() => {
            startConfetti();
        }, 500);

    }, 2000); // 2 seconds of dramatic darkness
}

// --- Confetti Canvas Logic ---
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let width, height;

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let confetti = [];
const colors = ['#d4af37', '#ffd700', '#1c2833', '#ffffff', '#8b0000']; // Premium colors

class ConfettiParticle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height - height; // Start above screen
        this.size = Math.random() * 10 + 5;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.speedY = Math.random() * 3 + 2;
        this.speedX = Math.random() * 4 - 2;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
    }
    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
        
        if (this.y > height) {
            this.y = -20;
            this.x = Math.random() * width;
        }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.fillStyle = this.color;
        // Draw slightly elongated rectangles for premium confetti look
        ctx.fillRect(-this.size/2, -this.size, this.size, this.size * 2);
        ctx.restore();
    }
}

function startConfetti() {
    for (let i = 0; i < 150; i++) {
        confetti.push(new ConfettiParticle());
    }
    animateConfetti();
}

function animateConfetti() {
    ctx.clearRect(0, 0, width, height);
    confetti.forEach(c => {
        c.update();
        c.draw();
    });
    requestAnimationFrame(animateConfetti);
}

// --- 3D Card Interaction ---
const revealInst = document.getElementById('reveal-inst');

function openCard() {
    birthdayCard.classList.add('open');
    if(revealInst) revealInst.style.opacity = '0';
}

birthdayCard.addEventListener('click', openCard);

// Swipe Support for Mobile
let touchStartX = 0;
let touchEndX = 0;

birthdayCard.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
});

birthdayCard.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    // If swiped left (reading direction to open a book) or just a general swipe
    if (Math.abs(touchEndX - touchStartX) > 40) {
        openCard();
    }
}
