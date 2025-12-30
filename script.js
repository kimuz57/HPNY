// ตัวแปรเก็บผลต่างเวลา (Offset) ระหว่าง Server กับเครื่องเรา
let timeOffset = 0; 

// 1. ฟังก์ชันดึงเวลาจาก Server (ใช้ API โซนเวลา Asia/Bangkok)
async function syncTimeWithServer() {
    try {
        // ดึงเวลาจาก WorldTimeAPI
        const response = await fetch('https://worldtimeapi.org/api/timezone/Asia/Bangkok');
        const data = await response.json();
        
        // แปลงเวลาจาก Server เป็น Timestamp
        const serverTime = new Date(data.datetime).getTime();
        const localTime = new Date().getTime();
        
        // คำนวณผลต่าง: ถ้าค่าเป็นบวกแสดงว่า Server นำหน้า, ถ้าลบแสดงว่า Server ช้ากว่า
        timeOffset = serverTime - localTime;
        
        console.log("Sync สำเร็จ! ผลต่างเวลา: " + timeOffset + " ms");
        
    } catch (error) {
        console.warn("ไม่สามารถดึงเวลาจาก Server ได้ (จะใช้เวลาเครื่องแทน):", error);
        timeOffset = 0; // ถ้าดึงไม่ได้ ให้ใช้เวลาเครื่องปกติ (Offset = 0)
    }
}

// เรียกใช้ฟังก์ชัน Sync เวลาทันทีที่โหลดหน้าเว็บ
syncTimeWithServer();


// 2. ตั้งค่าปีถัดไป (คำนวณจากเวลาปัจจุบันของเครื่องไปก่อน แล้วค่อยปรับตอน Sync เสร็จ)
const currentYear = new Date().getFullYear();
const nextYear = currentYear + 1;
document.getElementById('next-year').innerText = nextYear;
document.getElementById('current-year-display').innerText = nextYear;

const newYearTime = new Date(`January 1, ${nextYear} 00:00:00`).getTime();
// ตั้งเวลาเป้าหมายเป็น "เวลาปัจจุบัน + 5000 มิลลิวินาที (5 วินาที)"
//const newYearTime = new Date().getTime() + 5000;

// 3. ฟังก์ชันนับถอยหลัง
const countdownInterval = setInterval(updateCountdown, 1000);

function updateCountdown() {
    // เวลาปัจจุบัน = เวลาเครื่อง + ผลต่างที่ Sync มาจาก Server
    const now = new Date().getTime() + timeOffset;
    
    const gap = newYearTime - now;

    // คำนวณเวลา
    const second = 1000;
    const minute = second * 60;
    const hour = minute * 60;
    const day = hour * 24;

    const d = Math.floor(gap / day);
    const h = Math.floor((gap % day) / hour);
    const m = Math.floor((gap % hour) / minute);
    const s = Math.floor((gap % minute) / second);

    // อัปเดตตัวเลขในหน้าเว็บ
    document.getElementById('days').innerText = d < 10 ? '0' + d : d;
    document.getElementById('hours').innerText = h < 10 ? '0' + h : h;
    document.getElementById('minutes').innerText = m < 10 ? '0' + m : m;
    document.getElementById('seconds').innerText = s < 10 ? '0' + s : s;

    // เมื่อถึงเวลาปีใหม่ (gap < 0)
    if (gap <= 0) {
        clearInterval(countdownInterval);
        startCelebration();
    }
}


// 4. ฟังก์ชันเริ่มงานฉลอง
function startCelebration() {
    document.getElementById('countdown-container').style.display = 'none';
    document.getElementById('newyear-message').style.display = 'flex';
    loopFireworks(); 
}


// --- ระบบพลุ (Fireworks Logic) ---
const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');
let fireworks = [];
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function random(min, max) { return Math.random() * (max - min) + min; }

class Firework {
    constructor() {
        this.x = random(canvas.width * 0.1, canvas.width * 0.9);
        this.y = canvas.height;
        this.targetY = random(canvas.height * 0.1, canvas.height * 0.4);
        this.speed = random(3, 6);
        this.radius = 3;
        this.color = `hsl(${random(0, 360)}, 100%, 50%)`;
    }
    update() {
        this.y -= this.speed;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.speed = random(1, 5);
        this.angle = random(0, Math.PI * 2);
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.gravity = 0.05;
        this.friction = 0.95;
        this.alpha = 1;
        this.color = color;
    }
    update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.01;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

function loopFireworks() {
    requestAnimationFrame(loopFireworks);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (random(0, 1) < 0.05) {
        fireworks.push(new Firework());
    }

    fireworks.forEach((fw, index) => {
        fw.update();
        fw.draw();
        if (fw.y <= fw.targetY) {
            for (let i = 0; i < 50; i++) {
                particles.push(new Particle(fw.x, fw.y, fw.color));
            }
            fireworks.splice(index, 1);
        }
    });

    particles.forEach((p, index) => {
        p.update();
        p.draw();
        if (p.alpha <= 0) particles.splice(index, 1);
    });
}