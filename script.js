// --- NEXUS PRIME: OPTIMIZED AUDIO ENGINE ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx;

try {
    ctx = new AudioContext();
} catch (e) {
    console.log("Audio not supported");
}

const masterGain = ctx ? ctx.createGain() : null;
if(masterGain) {
    masterGain.gain.value = 0.5;
    masterGain.connect(ctx.destination);
}

// --- SYNTHESIZER ---
const synth = {
    playTone: (freq, type, duration, vol = 1, slideTo = null) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain); gain.connect(masterGain);
        osc.start(); osc.stop(ctx.currentTime + duration);
    },
    playStartup: () => {
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator(); const gain1 = ctx.createGain();
        osc1.type = 'sawtooth'; osc1.frequency.setValueAtTime(40, now);
        osc1.frequency.exponentialRampToValueAtTime(600, now + 2.0);
        gain1.gain.setValueAtTime(0, now); gain1.gain.linearRampToValueAtTime(0.4, now + 0.2); gain1.gain.linearRampToValueAtTime(0, now + 2.0);
        osc1.connect(gain1); gain1.connect(masterGain); osc1.start(); osc1.stop(now + 2.0);
    },
    playImpact: () => {
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
        gain.gain.setValueAtTime(0.8, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc.connect(gain); gain.connect(masterGain); osc.start(); osc.stop(now + 0.8);
    },
    createNoiseBuffer: () => {
        if (!ctx) return null;
        const bufferSize = ctx.sampleRate * 2; 
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        return buffer;
    }
};

const noiseBuffer = synth.createNoiseBuffer();

const sfx = {
    startup: () => synth.playStartup(),
    data_stream: () => { const freq = 1200 + Math.random() * 800; synth.playTone(freq, 'square', 0.03, 0.05); },
    boot_complete: () => {
        synth.playImpact();
        setTimeout(() => synth.playTone(440, 'triangle', 0.5, 0.2), 100);
        setTimeout(() => synth.playTone(554, 'triangle', 0.5, 0.2), 150);
        setTimeout(() => synth.playTone(659, 'triangle', 0.8, 0.2), 200);
    },
    glitch_exit: () => { synth.playTone(100, 'sawtooth', 0.1, 0.2); },
    hover: () => synth.playTone(1800, 'sine', 0.03, 0.04),
    click: () => { synth.playTone(100, 'square', 0.1, 0.2); synth.playTone(1200, 'sine', 0.05, 0.05); },
    back: () => synth.playTone(400, 'sawtooth', 0.15, 0.1, 100),
    denied: () => {
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.15);
        gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain); gain.connect(masterGain); osc.start(); osc.stop(now + 0.3);
    },
    lock: () => synth.playTone(150, 'sawtooth', 0.4, 0.3, 50),
    swoosh: () => synth.playTone(200, 'sine', 0.2, 0.1, 500)
};

let ambienceOsc = null;
function startAmbience() {
    if (ambienceOsc || !ctx || !noiseBuffer) return;
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer; src.loop = true;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 60;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 5);
    src.connect(filter); filter.connect(gain); gain.connect(masterGain);
    src.start(); ambienceOsc = src;
}

// --- APP LOGIC ---
const defaultCourses = [
    { id: 101, title: "VALORANT: RADIANT PROTOCOL", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070", description: "Pro-level strategies separated into specialized sectors.", subCourses: [ { id: 's101_1', title: "SECTOR 1: MECHANICS", image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070", modules: [ { id: 'v1a', title: "Crosshair Placement", url: "https://www.youtube.com/watch?v=HiL6hbwj_qM", duration: "10:00" }, { id: 'v1b', title: "Movement Guide", url: "https://www.youtube.com/watch?v=0t-A41qBGf8", duration: "12:00" } ] } ] },
    { id: 102, title: "OVERWATCH 2: QUICK DEPLOY", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071", description: "Rapid deployment guides for Genji and Support roles.", subCourses: [], modules: [ { id: 'ov1', title: "Genji Mechanics", url: "https://www.youtube.com/watch?v=G8kHjHl0nKk", duration: "05:00" }, { id: 'ov2', title: "Support Positioning", url: "https://www.youtube.com/watch?v=yY1XQp5a5_I", duration: "07:00" } ] }
];

let courses = []; let activeCourse = null; let activeSubCourse = null; let activeVideo = null; let modalMode = 'direct';
const ADMIN_PIN = "1337"; let isAdminMode = false;

// Elements
const homeView = document.getElementById('home-view');
const subCourseView = document.getElementById('sub-course-view');
const classroomView = document.getElementById('classroom-view');
const courseContainer = document.getElementById('course-list-container');
const subCourseContainer = document.getElementById('sub-course-container');
const playlistContainer = document.getElementById('playlist-container');
const playerContainer = document.getElementById('youtube-player');
const modal = document.getElementById('modal-overlay');
const notesArea = document.getElementById('user-notes');

function init() {
    try {
        const stored = localStorage.getItem('nexusUltCoursesV2');
        courses = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(defaultCourses));
    } catch (e) {
        courses = JSON.parse(JSON.stringify(defaultCourses));
    }
    renderHome();
    setupInteraction();
}

function setupInteraction() {
    document.body.addEventListener('mouseenter', (e) => {
        if (e.target.closest('button') || e.target.closest('.course-card') || e.target.closest('.video-item')) sfx.hover();
    }, true);
}

function saveData() { localStorage.setItem('nexusUltCoursesV2', JSON.stringify(courses)); }

function renderHome() {
    homeView.classList.remove('hidden'); subCourseView.classList.add('hidden'); classroomView.classList.add('hidden');
    courseContainer.innerHTML = '';
    courses.forEach(course => {
        const isFolder = course.subCourses && course.subCourses.length > 0;
        const badgeHtml = isFolder ? `<div class="badge multi"><i class="ri-folder-open-line"></i> MULTI-SECTOR</div>` : `<div class="badge single"><i class="ri-movie-line"></i> DIRECT LINK</div>`;
        const btnText = isFolder ? "ACCESS SECTORS" : "START MISSION";
        const card = document.createElement('div'); card.className = 'course-card';
        card.innerHTML = `
            <div class="delete-btn-pos"><button class="btn-icon-only" onclick="deleteCourse(${course.id}, event)"><i class="ri-delete-bin-5-line"></i></button></div>
            <div class="course-img-wrapper"><img src="${course.image}" class="course-img" onerror="this.src='https://via.placeholder.com/300'"><div class="course-overlay"></div>${badgeHtml}</div>
            <div class="course-info"><div class="course-title">${course.title}</div><div class="course-desc">${course.description}</div><button class="btn full-width" onclick="clickMainCourse(${course.id}); sfx.click()"><i class="ri-play-circle-fill"></i> ${btnText}</button></div>
        `;
        courseContainer.appendChild(card);
    });
}

window.clickMainCourse = (id) => {
    activeCourse = courses.find(c => c.id === id); if(!activeCourse) return;
    if (activeCourse.subCourses && activeCourse.subCourses.length > 0) renderSubView(activeCourse);
    else { activeSubCourse = null; openClassroom(activeCourse.modules, activeCourse.title); }
}

function renderSubView(parentCourse) {
    sfx.swoosh(); 
    homeView.classList.add('hidden'); 
    subCourseView.classList.remove('hidden'); 
    classroomView.classList.add('hidden');
    
    document.getElementById('parent-course-title').innerText = parentCourse.title;
    subCourseContainer.innerHTML = '';
    
    parentCourse.subCourses.forEach(sub => {
        const card = document.createElement('div'); 
        card.className = 'course-card';
        
        // 1. Badge: Kita tambahkan badge agar visualnya konsisten dengan Home
        const badgeHtml = `<div class="badge single"><i class="ri-hard-drive-2-line"></i> SECTOR DATA</div>`;
        
        // 2. Deskripsi: Kita format "Data Files" agar masuk ke style .course-desc
        const descHtml = `<i class="ri-database-2-line" style="color:var(--secondary); margin-right:5px;"></i> ${sub.modules.length} Data Files Encrypted`;

        // 3. Struktur HTML disamakan persis dengan renderHome
        card.innerHTML = `
            <div class="course-img-wrapper"> 
                <img src="${sub.image}" class="course-img" onerror="this.src='https://via.placeholder.com/300'">
                <div class="course-overlay"></div>
                ${badgeHtml}
            </div>
            
            <div class="course-info">
                <div class="course-title">${sub.title}</div>
                
                <div class="course-desc" style="display:flex; align-items:center;">
                    ${descHtml}
                </div>
                
                <button class="btn full-width" onclick="clickSubCourse('${sub.id}'); sfx.click()">
                    <i class="ri-play-circle-fill"></i> START MISSION
                </button>
            </div>
        `;
        subCourseContainer.appendChild(card);
    });
}
window.clickSubCourse = (subId) => { activeSubCourse = activeCourse.subCourses.find(s => s.id === subId); openClassroom(activeSubCourse.modules, activeCourse.title + " // " + activeSubCourse.title); }

function openClassroom(modules, contextTitle) {
    sfx.swoosh(); subCourseView.classList.add('hidden'); homeView.classList.add('hidden'); classroomView.classList.remove('hidden');
    document.getElementById('active-context-title').innerText = contextTitle; renderPlaylist(modules);
    if (modules && modules.length > 0) playVideo(modules[0]); else playerContainer.innerHTML = '<div style="color:var(--danger); display:flex; justify-content:center; align-items:center; height:100%;">NO SIGNAL</div>';
}

function renderPlaylist(modules) {
    playlistContainer.innerHTML = ''; if(!modules) return;
    modules.forEach((mod, idx) => {
        const subPrefix = activeSubCourse ? activeSubCourse.id : 'direct'; const storageKey = `done_${activeCourse.id}_${subPrefix}_${mod.id}`;
        const isChecked = localStorage.getItem(storageKey) === 'true' ? 'checked' : '';
        const item = document.createElement('div'); item.className = 'video-item'; item.id = `vid-${mod.id}`;
        item.innerHTML = `<div class="idx-number">${idx+1 < 10 ? '0'+(idx+1) : idx+1}</div><label class="check-container" onclick="event.stopPropagation()"><input type="checkbox" class="check-input" ${isChecked} onchange="toggleDone('${storageKey}');"><span class="checkmark"></span></label><div class="v-item-content" onclick="playVideoByObjId('${mod.id}'); sfx.click()"><div class="v-item-title">${mod.title}</div><div class="v-item-meta"><i class="ri-time-line"></i> ${mod.duration}</div></div>`;
        playlistContainer.appendChild(item);
    });
}
window.playVideoByObjId = (vidId) => { const currentList = activeSubCourse ? activeSubCourse.modules : activeCourse.modules; const mod = currentList.find(m => m.id === vidId); playVideo(mod); }

function playVideo(module) {
    activeVideo = module; document.getElementById('active-video-title').innerText = module.title; sfx.data_stream();
    document.querySelectorAll('.video-item').forEach(el => el.classList.remove('active'));
    const el = document.getElementById(`vid-${module.id}`); if(el) el.classList.add('active');
    const videoId = getYoutubeID(module.url);
    playerContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&theme=dark&rel=0" frameborder="0" allowfullscreen allow="autoplay"></iframe>`;
    loadNotesForActiveVideo();
}
function loadNotesForActiveVideo() { if(!activeVideo) return; const noteKey = `notes_v_${activeVideo.id}`; notesArea.value = localStorage.getItem(noteKey) || ''; notesArea.dataset.key = noteKey; }

let lastTypeTime = 0;
notesArea.addEventListener('input', (e) => {
    const now = Date.now(); if (now - lastTypeTime > 60) { sfx.data_stream(); lastTypeTime = now; }
    const key = e.target.dataset.key; if(key) { localStorage.setItem(key, e.target.value); document.getElementById('save-status').innerText = "SAVING..."; clearTimeout(notesArea.to); notesArea.to = setTimeout(() => { document.getElementById('save-status').innerText = "LOG SECURED"; sfx.click(); }, 1000); }
});
function getYoutubeID(url) { const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/); return (match && match[2].length === 11) ? match[2] : null; }
window.toggleDone = (key) => { sfx.boot_complete(); const current = localStorage.getItem(key) === 'true'; localStorage.setItem(key, !current); };

window.goBackToHome = () => { sfx.back(); activeCourse = null; activeSubCourse = null; activeVideo = null; renderHome(); };
window.goBackFromClassroom = () => { sfx.back(); playerContainer.innerHTML = ''; activeVideo = null; if (activeSubCourse) renderSubView(activeCourse); else goBackToHome(); };

// --- MODAL & SECURITY ---
window.openModal = () => { if (!isAdminMode) { sfx.denied(); setTimeout(()=>sfx.denied(),200); alert("ACCESS DENIED"); return; } sfx.swoosh(); document.getElementById('new-title').value = ''; document.getElementById('video-inputs-container').innerHTML = ''; setMode('direct'); addVideoRow('video-inputs-container'); modal.classList.add('open'); };
window.closeModal = () => { sfx.back(); modal.classList.remove('open'); };
window.setMode = (mode) => { sfx.click(); modalMode = mode; const d = document.getElementById('form-direct-area'); const s = document.getElementById('form-sector-area'); if(mode==='direct'){d.classList.remove('hidden');s.classList.add('hidden');}else{d.classList.add('hidden');s.classList.remove('hidden');} };
window.addVideoRow = (cId) => { sfx.click(); const d = document.createElement('div'); d.className='v-row'; d.innerHTML=`<input type="text" class="v-title" placeholder="Title"><input type="text" class="v-url" placeholder="URL"><input type="text" class="v-dur" placeholder="10:00" style="width:70px"><button class="btn-icon-only" onclick="this.parentElement.remove();sfx.back()"><i class="ri-close-line"></i></button>`; document.getElementById(cId).appendChild(d); };
window.addSectorBlock = () => { sfx.click(); const c = document.getElementById('sector-inputs-container'); const id = 'sec_'+Date.now(); const b = document.createElement('div'); b.className='sector-block'; b.innerHTML=`<div class="sector-header-row"><input type="text" class="sector-input sector-title-val" placeholder="Sector Name"><button class="btn-delete-sector" onclick="this.closest('.sector-block').remove();sfx.back()"><i class="ri-delete-bin-2-line"></i></button></div><div class="sector-video-list" id="vlist_${id}"></div><button class="btn-add-vid-small" onclick="addVideoRow('vlist_${id}')">+ Add Video</button>`; c.appendChild(b); addVideoRow(`vlist_${id}`); };
window.saveNewCourse = () => { sfx.boot_complete(); closeModal(); renderHome(); }; 
window.deleteCourse = (id,e) => { e.stopPropagation(); sfx.denied(); if(confirm("Confirm Delete?")) { courses = courses.filter(c => c.id !== id); saveData(); renderHome(); } };

window.requestOverride = () => {
    if (isAdminMode) {
        isAdminMode = false;
        document.body.classList.remove('admin-mode');
        document.getElementById('admin-btn').innerHTML = '<i class="ri-shield-keyhole-line"></i> PROTOCOL: OVERRIDE';
        sfx.lock(); 
    } else {
        document.getElementById('pin-input').value = '';
        document.getElementById('pin-modal').classList.add('open');
        sfx.swoosh();
    }
}
window.closePinModal = () => { sfx.back(); document.getElementById('pin-modal').classList.remove('open'); }
window.addPin = (num) => { sfx.data_stream(); const input = document.getElementById('pin-input'); if (input.value.length < 4) input.value += num; }
window.clearPin = () => { sfx.back(); document.getElementById('pin-input').value = ''; }
window.submitPin = () => {
    const input = document.getElementById('pin-input').value;
    if (input === ADMIN_PIN) {
        sfx.boot_complete(); isAdminMode = true;
        document.body.classList.add('admin-mode');
        document.getElementById('admin-btn').innerHTML = '<i class="ri-lock-unlock-line"></i> LOCK SYSTEM';
        closePinModal();
    } else {
        sfx.denied(); setTimeout(()=>sfx.denied(), 200);
        document.querySelector('.pin-content').style.animation = 'shake 0.3s';
        setTimeout(() => document.querySelector('.pin-content').style.animation = '', 300);
        document.getElementById('pin-input').value = '';
    }
}
const styleSheet = document.createElement("style"); styleSheet.innerText = `@keyframes shake { 0% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } 100% { transform: translateX(0); } }`; document.head.appendChild(styleSheet);

// --- STARTUP ---
function startExperience() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
    
    // Explicitly un-hide
    document.getElementById('terminal-log').classList.remove('hidden');
    document.getElementById('bar-wrapper').classList.remove('hidden');
    document.getElementById('start-prompt').style.display = 'none';

    runBootSequence();
}

function runBootSequence() {
    const overlay = document.getElementById('boot-overlay');
    const bar = document.getElementById('boot-bar');
    const log = document.getElementById('terminal-log');
    
    const steps = ["CONNECTING...", "LOADING ASSETS...", "BYPASSING SECURITY...", "ESTABLISHING UPLINK...", "DECRYPTING...", "ACCESS GRANTED."];
    let stepIndex = 0; let progress = 0;

    sfx.startup();

    const bootInterval = setInterval(() => {
        progress += Math.random() * 5; 
        if(progress > 100) progress = 100;
        bar.style.width = progress + "%";

        if (progress > 20 && stepIndex === 0) { log.innerText = "> " + steps[1]; stepIndex++; sfx.data_stream(); }
        if (progress > 40 && stepIndex === 1) { log.innerText = "> " + steps[2]; stepIndex++; sfx.data_stream(); }
        if (progress > 60 && stepIndex === 2) { log.innerText = "> " + steps[3]; stepIndex++; sfx.data_stream(); }
        if (progress > 80 && stepIndex === 3) { log.innerText = "> " + steps[4]; stepIndex++; sfx.data_stream(); }
        
        if (progress >= 100) {
            clearInterval(bootInterval);
            log.innerText = "> " + steps[5]; log.style.color = "#00ff00";
            sfx.boot_complete();
            setTimeout(() => {
                overlay.classList.add('glitch-out'); sfx.glitch_exit();
                setTimeout(() => { overlay.classList.add('boot-complete'); overlay.classList.remove('glitch-out'); startAmbience(); }, 400);
            }, 600);
        }
    }, 100);
}

// Init Trigger
document.getElementById('boot-overlay').addEventListener('click', startExperience, {once:true});

// Particles (Performance Optimized: Only render visible)
const canvas = document.getElementById('particle-canvas');
if (canvas) {
    const ctxCanvas = canvas.getContext('2d');
    let particles = []; let w, h;
    function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
    class P { constructor(){this.x=Math.random()*w;this.y=Math.random()*h;this.vx=(Math.random()-.5)*.5;this.vy=(Math.random()-.5)*.5;this.s=Math.random()*2;this.a=Math.random()*.5;} update(){this.x+=this.vx;this.y+=this.vy;if(this.x<0||this.x>w)this.vx*=-1;if(this.y<0||this.y>h)this.vy*=-1;} draw(){ctxCanvas.beginPath();ctxCanvas.arc(this.x,this.y,this.s,0,7);ctxCanvas.fillStyle=`rgba(138,43,226,${this.a})`;ctxCanvas.fill();} }
    function loop() { ctxCanvas.clearRect(0,0,w,h); particles.forEach(p=>{p.update();p.draw();}); requestAnimationFrame(loop); }
    window.addEventListener('resize', resize); resize(); for(let i=0;i<50;i++)particles.push(new P()); loop();
}

init();
