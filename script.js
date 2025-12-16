// --- NEXUS PRIME: CORE SYSTEM V4.0 (ULTIMATE) ---
// Features: Universal Player, YT & Rumble Auto-Duration, Deep Nesting, Smart Edit UI

// --- 1. LOAD YOUTUBE API ---
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
let ytPlayer = null; 

// --- 2. AUDIO ENGINE ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx;
try { ctx = new AudioContext(); } catch (e) { console.log("Audio API Error"); }

const masterGain = ctx ? ctx.createGain() : null;
if(masterGain) {
    masterGain.gain.value = 0.5;
    masterGain.connect(ctx.destination);
}

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
    startup: () => { if(!ctx) return; const now=ctx.currentTime; const o=ctx.createOscillator(); const g=ctx.createGain(); o.type='sawtooth'; o.frequency.setValueAtTime(40,now); o.frequency.exponentialRampToValueAtTime(600,now+2); g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(0.4,now+0.2); g.gain.linearRampToValueAtTime(0,now+2); o.connect(g); g.connect(masterGain); o.start(); o.stop(now+2); },
    data_stream: () => { const freq = 1200 + Math.random() * 800; synth.playTone(freq, 'square', 0.03, 0.05); },
    boot_complete: () => { synth.playTone(440,'triangle',0.5,0.2); setTimeout(()=>synth.playTone(554,'triangle',0.5,0.2),100); setTimeout(()=>synth.playTone(659,'triangle',0.8,0.2),200); },
    hover: () => synth.playTone(1800, 'sine', 0.03, 0.04),
    click: () => { synth.playTone(100, 'square', 0.1, 0.2); synth.playTone(1200, 'sine', 0.05, 0.05); },
    back: () => synth.playTone(400, 'sawtooth', 0.15, 0.1, 100),
    denied: () => synth.playTone(120, 'sawtooth', 0.3, 0.3, 80),
    lock: () => synth.playTone(150, 'sawtooth', 0.4, 0.3, 50),
    swoosh: () => synth.playTone(200, 'sine', 0.2, 0.1, 500)
};

let ambienceOsc = null;
function startAmbience() {
    if (ambienceOsc || !ctx || !noiseBuffer) return;
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer; src.loop = true;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 60;
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 5);
    src.connect(filter); filter.connect(gain); gain.connect(masterGain); src.start(); ambienceOsc = src;
}

// --- 3. HELPER FUNCTIONS ---

function formatTime(seconds) {
    if(!seconds) return "00:00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const hDisplay = h < 10 ? "0"+h : h;
    const mDisplay = m < 10 ? "0"+m : m;
    const sDisplay = s < 10 ? "0"+s : s;
    return `${hDisplay}:${mDisplay}:${sDisplay}`;
}

function resolveVideoSource(url) {
    let cleanUrl = url.trim();
    if (cleanUrl.startsWith('<')) return cleanUrl; // Raw Iframe pass-through
    
    // Rumble Support (Auto-Add API)
    if (cleanUrl.includes('rumble.com')) {
        const separator = cleanUrl.includes('?') ? '&' : '?';
        return `<iframe src="${cleanUrl}${separator}api=1" frameborder="0" allowfullscreen allow="autoplay"></iframe>`;
    }

    // Vimeo Support
    if (cleanUrl.includes('vimeo.com')) {
        const vimeoId = cleanUrl.split('/').pop();
        if (!isNaN(vimeoId)) {
            return `<iframe src="https://player.vimeo.com/video/${vimeoId}?autoplay=1" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
        }
    }
    
    // Direct MP4
    if (cleanUrl.match(/\.(mp4|webm|ogg)$/i)) {
        return `<video controls autoplay name="media" style="width:100%; height:100%; background:black;"><source src="${cleanUrl}" type="video/mp4"></video>`;
    }
    
    // Generic Fallback
    return `<iframe src="${cleanUrl}" frameborder="0" allowfullscreen allow="autoplay"></iframe>`;
}

// --- 4. DATA & STATE ---
const defaultCourses = [
    { id: 101, title: "VALORANT: RADIANT PROTOCOL", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070", description: "Pro-level strategies separated into specialized sectors.", subCourses: [ { id: 's101_1', title: "SECTOR 1: MECHANICS", image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070", modules: [], subCourses: [ { id: 'sub_101_demo', title: "Aim Training", image: "", modules: [{id: 'v_demo_1', title: "Crosshair Placement", url: "https://www.youtube.com/watch?v=HiL6hbwj_qM", duration: "00:00:00"}] } ] } ] }
];

let courses = []; 
let activeCourse = null; 
let activeMainSector = null;
let activeSubCourse = null; 
let activeVideo = null; 
let modalMode = 'direct';
let editingCourseId = null;
const ADMIN_PIN = "1337"; 
let isAdminMode = false;

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
        const stored = localStorage.getItem('nexusUltCoursesV4');
        courses = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(defaultCourses));
    } catch (e) { courses = JSON.parse(JSON.stringify(defaultCourses)); }
    renderHome();
    setupInteraction();
}

function setupInteraction() {
    document.body.addEventListener('mouseenter', (e) => {
        if (e.target.closest('button') || e.target.closest('.course-card') || e.target.closest('.video-item')) sfx.hover();
    }, true);
    if(window.innerWidth < 900) window.scrollTo(0, 0);
}

function saveData() { localStorage.setItem('nexusUltCoursesV4', JSON.stringify(courses)); }

// --- 5. RENDER LOGIC ---

function renderHome() {
    homeView.classList.remove('hidden'); subCourseView.classList.add('hidden'); classroomView.classList.add('hidden');
    courseContainer.innerHTML = '';
    courses.forEach(course => {
        const isFolder = course.subCourses && course.subCourses.length > 0;
        const badgeHtml = isFolder ? `<div class="badge multi"><i class="ri-folder-open-line"></i> MULTI-SECTOR</div>` : `<div class="badge single"><i class="ri-movie-line"></i> DIRECT LINK</div>`;
        const btnText = isFolder ? "ACCESS SECTORS" : "START MISSION";
        
        const card = document.createElement('div'); card.className = 'course-card';
        card.innerHTML = `
            <div class="delete-btn-pos">
                <button class="btn-icon-only" onclick="deleteCourse(${course.id}, event)" title="Delete Operation"><i class="ri-delete-bin-5-line"></i></button>
            </div>
            <div class="course-img-wrapper"><img src="${course.image}" class="course-img" onerror="this.src='https://via.placeholder.com/300'"><div class="course-overlay"></div>${badgeHtml}</div>
            
            <div class="course-info">
                <div class="course-title">${course.title}</div>
                <div class="course-desc">${course.description}</div>
                
                <div style="margin-top:auto; width: 100%;">
                    <button class="btn full-width btn-start" onclick="clickMainCourse(${course.id}); sfx.click()">
                        <i class="ri-play-circle-fill"></i> ${btnText}
                    </button>
                    
                    <button class="btn full-width btn-edit-action" onclick="editCourse(${course.id}, event)">
                        <i class="ri-pencil-fill"></i> EDIT OPERATION
                    </button>
                </div>
            </div>
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
    homeView.classList.add('hidden'); subCourseView.classList.remove('hidden'); classroomView.classList.add('hidden');
    activeMainSector = null;
    
    document.getElementById('parent-course-title').innerText = parentCourse.title;
    document.querySelector('.subtitle-text').innerText = "SELECT SECTOR";
    
    const backBtn = document.querySelector('#sub-course-view .btn-outline');
    backBtn.setAttribute('onclick', 'goBackToHome()');
    backBtn.innerHTML = '<i class="ri-arrow-left-line"></i> Abort to Main Menu';

    subCourseContainer.innerHTML = '';
    
    parentCourse.subCourses.forEach(sub => {
        const isNested = sub.subCourses && sub.subCourses.length > 0;
        let totalVids = isNested ? sub.subCourses.reduce((acc, val) => acc + (val.modules?val.modules.length:0), 0) : (sub.modules ? sub.modules.length : 0);

        const badgeHtml = isNested 
            ? `<div class="badge multi" style="background:var(--secondary); color:black;"><i class="ri-node-tree"></i> NESTED SECTOR</div>` 
            : `<div class="badge single"><i class="ri-hard-drive-2-line"></i> DIRECT DATA</div>`;
            
        const card = document.createElement('div'); card.className = 'course-card';
        card.innerHTML = `
            <div class="course-img-wrapper"> 
                <img src="${sub.image || parentCourse.image}" class="course-img" onerror="this.src='https://via.placeholder.com/300'">
                <div class="course-overlay"></div>
                ${badgeHtml}
            </div>
            <div class="course-info">
                <div class="course-title">${sub.title}</div>
                <div class="course-desc"><i class="ri-database-2-line"></i> ${isNested ? sub.subCourses.length + " Sub-Sectors" : totalVids + " Videos"}</div>
                <button class="btn full-width" onclick="clickSubCourse('${sub.id}'); sfx.click()">
                    <i class="ri-play-circle-fill"></i> ACCESS UNIT
                </button>
            </div>
        `;
        subCourseContainer.appendChild(card);
    });
}

window.clickSubCourse = (subId) => { 
    const selectedSector = activeCourse.subCourses.find(s => s.id === subId);
    if (selectedSector && selectedSector.subCourses && selectedSector.subCourses.length > 0) {
        activeMainSector = selectedSector;
        renderDeepSectorView(selectedSector);
    } else {
        activeSubCourse = selectedSector; 
        openClassroom(activeSubCourse.modules, activeCourse.title + " // " + activeSubCourse.title); 
    }
};

function renderDeepSectorView(parentSector) {
    sfx.swoosh();
    document.getElementById('parent-course-title').innerText = parentSector.title;
    document.querySelector('.subtitle-text').innerText = "SELECT TACTICAL UNIT";
    
    const backBtn = document.querySelector('#sub-course-view .btn-outline');
    backBtn.setAttribute('onclick', 'backToMainSectors()');
    backBtn.innerHTML = '<i class="ri-arrow-up-line"></i> UP ONE LEVEL';

    subCourseContainer.innerHTML = '';

    parentSector.subCourses.forEach(sub => {
        const card = document.createElement('div'); 
        card.className = 'course-card';
        card.style.borderColor = 'var(--primary)'; 
        
        card.innerHTML = `
            <div class="course-img-wrapper" style="height:120px;"> 
                <img src="${sub.image || activeCourse.image}" class="course-img" style="filter: hue-rotate(45deg);" onerror="this.src='https://via.placeholder.com/300'">
                <div class="course-overlay"></div>
                <div class="badge single" style="background:var(--primary); color:white;"><i class="ri-file-list-3-line"></i> UNIT DATA</div>
            </div>
            <div class="course-info">
                <div class="course-title" style="font-size:1rem;">${sub.title}</div>
                <div class="course-desc"><i class="ri-film-line"></i> ${sub.modules.length} Intel Videos</div>
                <button class="btn full-width" onclick="clickDeepSub('${sub.id}'); sfx.click()">
                    <i class="ri-play-circle-line"></i> INITIATE
                </button>
            </div>
        `;
        subCourseContainer.appendChild(card);
    });
}

window.clickDeepSub = (deepId) => {
    activeSubCourse = activeMainSector.subCourses.find(s => s.id === deepId);
    if(activeSubCourse) {
        openClassroom(activeSubCourse.modules, activeMainSector.title + " // " + activeSubCourse.title);
    }
};

window.backToMainSectors = () => { sfx.back(); activeMainSector = null; renderSubView(activeCourse); };
window.goBackToHome = () => { sfx.back(); activeCourse = null; activeSubCourse = null; activeVideo = null; renderHome(); };
window.goBackFromClassroom = () => { sfx.back(); playerContainer.innerHTML = ''; activeVideo = null; 
    if (activeMainSector) { subCourseView.classList.remove('hidden'); classroomView.classList.add('hidden'); renderDeepSectorView(activeMainSector); } 
    else if (activeSubCourse) { renderSubView(activeCourse); } 
    else { goBackToHome(); }
};

// --- 6. PLAYER & PLAYLIST LOGIC ---

function openClassroom(modules, contextTitle) {
    sfx.swoosh(); subCourseView.classList.add('hidden'); homeView.classList.add('hidden'); classroomView.classList.remove('hidden');
    document.getElementById('active-context-title').innerText = contextTitle; renderPlaylist(modules);
    if (modules && modules.length > 0) playVideo(modules[0]); else playerContainer.innerHTML = '<div style="display:grid;place-items:center;height:100%;color:var(--danger)">NO SIGNAL</div>';
    if(window.innerWidth < 900) window.scrollTo({top: 0, behavior: 'smooth'});
}

function renderPlaylist(modules) {
    playlistContainer.innerHTML = ''; if(!modules) return;
    modules.forEach((mod, idx) => {
        const subPrefix = activeSubCourse ? activeSubCourse.id : 'direct'; const storageKey = `done_${activeCourse.id}_${subPrefix}_${mod.id}`;
        const isChecked = localStorage.getItem(storageKey) === 'true' ? 'checked' : '';
        const item = document.createElement('div'); item.className = 'video-item'; item.id = `vid-${mod.id}`;
        item.innerHTML = `
            <div class="idx-number">${idx+1 < 10 ? '0'+(idx+1) : idx+1}</div>
            <label class="check-container" onclick="event.stopPropagation()">
                <input type="checkbox" class="check-input" ${isChecked} onchange="toggleDone('${storageKey}');">
                <span class="checkmark"></span>
            </label>
            <div class="v-item-content" onclick="playVideoByObjId('${mod.id}'); sfx.click()">
                <div class="v-item-title">${mod.title}</div>
                <div class="v-item-meta"><i class="ri-time-line"></i> ${mod.duration}</div>
            </div>`;
        playlistContainer.appendChild(item);
    });
}
window.playVideoByObjId = (vidId) => { const currentList = activeSubCourse ? activeSubCourse.modules : activeCourse.modules; const mod = currentList.find(m => m.id === vidId); playVideo(mod); }

function playVideo(module) {
    activeVideo = module;
    document.getElementById('active-video-title').innerText = module.title;
    sfx.data_stream();
    
    document.querySelectorAll('.video-item').forEach(el => el.classList.remove('active'));
    const el = document.getElementById(`vid-${module.id}`);
    if(el) { el.classList.add('active'); el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }

    loadNotesForActiveVideo();

    // Smart Detect YouTube
    const ytReg = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const ytMatch = module.url.trim().match(ytReg);
    const youtubeID = (ytMatch && ytMatch[2].length === 11) ? ytMatch[2] : null;

    if (youtubeID) {
        // YOUTUBE MODE (API)
        playerContainer.innerHTML = '<div id="yt-player-slot"></div>';
        if(ytPlayer) { try { ytPlayer.destroy(); } catch(e){} }

        if (window.YT && window.YT.Player) {
            ytPlayer = new YT.Player('yt-player-slot', {
                height: '100%', width: '100%', videoId: youtubeID,
                playerVars: { 'autoplay': 1, 'theme': 'dark', 'rel': 0 },
                events: {
                    'onReady': (event) => {
                        // AUTO DURATION UPDATE (YOUTUBE)
                        const rawDuration = event.target.getDuration();
                        if(rawDuration > 0) updateDurationDatabase(module.id, rawDuration);
                    }
                }
            });
        }
    } else {
        // UNIVERSAL MODE (Rumble, Vimeo, etc)
        if(ytPlayer) { try { ytPlayer.destroy(); ytPlayer = null; } catch(e){} }
        playerContainer.innerHTML = resolveVideoSource(module.url);
    }
}

function updateDurationDatabase(moduleId, seconds) {
    const formatted = formatTime(seconds);
    if (activeVideo.duration === formatted) return;

    activeVideo.duration = formatted;
    
    // Recursive Update Logic
    const findAndUpdate = (list) => {
        for(let item of list) {
            if(item.modules) {
                const vid = item.modules.find(v => v.id === moduleId);
                if(vid) { vid.duration = formatted; return true; }
            }
            if(item.subCourses && findAndUpdate(item.subCourses)) return true;
        }
        return false;
    };
    findAndUpdate(courses);
    saveData();

    // Live UI Update
    const metaDiv = document.querySelector(`#vid-${moduleId} .v-item-meta`);
    if(metaDiv) metaDiv.innerHTML = `<i class="ri-time-line"></i> ${formatted}`;
}

function loadNotesForActiveVideo() { if(!activeVideo) return; const noteKey = `notes_v_${activeVideo.id}`; notesArea.value = localStorage.getItem(noteKey) || ''; notesArea.dataset.key = noteKey; }
let lastTypeTime = 0;
notesArea.addEventListener('input', (e) => {
    const now = Date.now(); if (now - lastTypeTime > 60) { sfx.data_stream(); lastTypeTime = now; }
    const key = e.target.dataset.key; if(key) { localStorage.setItem(key, e.target.value); document.getElementById('save-status').innerText = "SAVING..."; clearTimeout(notesArea.to); notesArea.to = setTimeout(() => { document.getElementById('save-status').innerText = "LOG SECURED"; sfx.click(); }, 1000); }
});
window.toggleDone = (key) => { sfx.boot_complete(); const current = localStorage.getItem(key) === 'true'; localStorage.setItem(key, !current); };

// --- 7. MODAL & ADMIN LOGIC ---

window.openModal = () => { 
    if (!isAdminMode) { sfx.denied(); setTimeout(()=>sfx.denied(),200); alert("ACCESS DENIED: ADMIN ONLY"); return; } 
    sfx.swoosh(); 
    editingCourseId = null;
    document.querySelector('.modal-title').innerText = "INITIALIZE NEW OP";
    document.querySelector('.btn[onclick="saveNewCourse()"]').innerText = "Confirm Init";
    document.getElementById('new-title').value = ''; 
    document.getElementById('new-image').value = ''; 
    document.getElementById('new-desc').value = '';
    document.getElementById('video-inputs-container').innerHTML = ''; 
    document.getElementById('sector-inputs-container').innerHTML = ''; 
    setMode('direct'); 
    addVideoRow('video-inputs-container'); 
    modal.classList.add('open'); 
};

window.editCourse = (id, e) => {
    e.stopPropagation();
    if (!isAdminMode) return;
    sfx.click();
    
    const course = courses.find(c => c.id === id);
    if(!course) return;

    editingCourseId = id;
    modal.classList.add('open');
    document.querySelector('.modal-title').innerText = "MODIFY OPERATION";
    document.querySelector('.btn[onclick="saveNewCourse()"]').innerText = "Save Changes";

    document.getElementById('new-title').value = course.title;
    document.getElementById('new-image').value = course.image;
    document.getElementById('new-desc').value = course.description;

    const isMulti = course.subCourses && course.subCourses.length > 0;
    setMode(isMulti ? 'sector' : 'direct');

    document.getElementById('video-inputs-container').innerHTML = '';
    document.getElementById('sector-inputs-container').innerHTML = '';

    if (!isMulti) {
        course.modules.forEach(mod => addVideoRow('video-inputs-container', mod.title, mod.url, mod.duration));
        if(course.modules.length === 0) addVideoRow('video-inputs-container');
    } else {
        course.subCourses.forEach(sector => {
            const secId = window.addSectorBlock(sector.title); 
            const subListId = `sub_list_${secId}`;
            document.getElementById(subListId).innerHTML = ''; 

            if(sector.subCourses && sector.subCourses.length > 0) {
                sector.subCourses.forEach(sub => {
                    const subDomId = window.addSubSectorBlock(subListId, sub.title);
                    const vListId = `vlist_${subDomId}`;
                    document.getElementById(vListId).innerHTML = ''; 
                    if(sub.modules) sub.modules.forEach(v => addVideoRow(vListId, v.title, v.url, v.duration));
                });
            }
        });
    }
};

window.closeModal = () => { sfx.back(); modal.classList.remove('open'); };
window.setMode = (mode) => { sfx.click(); modalMode = mode; const d = document.getElementById('form-direct-area'); const s = document.getElementById('form-sector-area'); 
    document.getElementById('btn-mode-direct').className = mode === 'direct' ? 'btn-outline mode-active' : 'btn-outline';
    document.getElementById('btn-mode-sector').className = mode === 'sector' ? 'btn-outline mode-active' : 'btn-outline';
    if(mode==='direct'){d.classList.remove('hidden');s.classList.add('hidden');}else{d.classList.add('hidden');s.classList.remove('hidden');} 
};

window.addVideoRow = (cId, title="", url="", dur="") => { 
    const finalDur = dur || "00:00:00"; 
    const d = document.createElement('div'); d.className='v-row'; 
    d.innerHTML=`<input type="text" class="v-title" placeholder="Title" value="${title}"><input type="text" class="v-url" placeholder="YouTube URL / Paste <iframe> code here" value='${url}'><input type="text" class="v-dur" placeholder="00:00:00" value="${finalDur}"><button class="btn-icon-only" style="width:30px; height:30px; flex-shrink:0;" onclick="this.parentElement.remove();sfx.back()"><i class="ri-close-line"></i></button>`; 
    document.getElementById(cId).appendChild(d); 
};

window.addSectorBlock = (titleVal = "") => { 
    const c = document.getElementById('sector-inputs-container'); 
    const id = 'sec_'+Date.now() + Math.floor(Math.random()*1000); 
    const b = document.createElement('div'); b.className='sector-block'; b.dataset.id = id;
    b.innerHTML=`<div class="sector-header-row"><input type="text" class="sector-input sector-title-val" placeholder="MAIN SECTOR NAME" value="${titleVal}"><button class="btn-delete-sector" onclick="this.closest('.sector-block').remove();sfx.back()"><i class="ri-delete-bin-2-line"></i></button></div><div class="sub-sector-list" id="sub_list_${id}"></div><button class="btn-add-sub" onclick="addSubSectorBlock('sub_list_${id}')">+ Add Sub-Sector</button>`; 
    c.appendChild(b); 
    if(titleVal === "") addSubSectorBlock(`sub_list_${id}`); 
    return id;
};

window.addSubSectorBlock = (parentId, titleVal = "") => {
    const parent = document.getElementById(parentId);
    const subId = 'sub_' + Date.now() + Math.floor(Math.random() * 1000);
    const d = document.createElement('div'); d.className = 'sub-sector-block';
    d.innerHTML = `<div class="sub-sector-header"><input type="text" class="sector-input sub-sector-title-val" style="width:85%; font-size:0.85rem;" placeholder="Sub-Sector Name" value="${titleVal}"><button class="btn-icon-only" style="width:30px;height:30px;" onclick="this.closest('.sub-sector-block').remove();sfx.back()"><i class="ri-close-line"></i></button></div><div id="vlist_${subId}"></div><button class="btn-add-vid-small" onclick="addVideoRow('vlist_${subId}')">+ Add Video</button>`;
    parent.appendChild(d);
    if(titleVal === "") addVideoRow(`vlist_${subId}`);
    return subId;
};

window.saveNewCourse = () => {
    const titleInput = document.getElementById('new-title').value;
    const imgInput = document.getElementById('new-image').value;
    const descInput = document.getElementById('new-desc').value;
    if (!titleInput) { alert("Title Required!"); sfx.denied(); return; }

    const newId = editingCourseId ? editingCourseId : Date.now();
    let newCourse = { id: newId, title: titleInput, image: imgInput || 'https://via.placeholder.com/300?text=NO+IMG', description: descInput || 'No briefing available.', subCourses: [], modules: [] };

    if (modalMode === 'direct') {
        const rows = document.querySelectorAll('#video-inputs-container .v-row');
        rows.forEach((row, index) => {
            const vTitle = row.querySelector('.v-title').value;
            const vUrl = row.querySelector('.v-url').value;
            const vDur = row.querySelector('.v-dur').value;
            if (vTitle && vUrl) newCourse.modules.push({ id: `v_${newId}_${index}`, title: vTitle, url: vUrl, duration: vDur || "00:00:00" });
        });
    } else {
        const mainSectors = document.querySelectorAll('#sector-inputs-container .sector-block');
        mainSectors.forEach((sec, sIndex) => {
            const secTitle = sec.querySelector('.sector-title-val').value || `Sector ${sIndex + 1}`;
            let mainSectorObj = { id: `s_${newId}_${sIndex}`, title: secTitle, image: imgInput, subCourses: [], modules: [] };
            const subSectors = sec.querySelectorAll('.sub-sector-block');
            subSectors.forEach((sub, subIndex) => {
                const subTitle = sub.querySelector('.sub-sector-title-val').value || `Unit ${subIndex + 1}`;
                let subSectorObj = { id: `sub_${newId}_${sIndex}_${subIndex}`, title: subTitle, image: imgInput, modules: [] };
                const vRows = sub.querySelectorAll('.v-row');
                vRows.forEach((row, vIndex) => {
                    const vTitle = row.querySelector('.v-title').value;
                    const vUrl = row.querySelector('.v-url').value;
                    const vDur = row.querySelector('.v-dur').value;
                    if (vTitle && vUrl) subSectorObj.modules.push({ id: `v_${newId}_${sIndex}_${subIndex}_${vIndex}`, title: vTitle, url: vUrl, duration: vDur || "00:00:00" });
                });
                mainSectorObj.subCourses.push(subSectorObj);
            });
            newCourse.subCourses.push(mainSectorObj);
        });
    }

    if (editingCourseId) { const idx = courses.findIndex(c => c.id === editingCourseId); if(idx !== -1) courses[idx] = newCourse; } 
    else { courses.push(newCourse); }
    saveData(); sfx.boot_complete(); renderHome(); closeModal();
};

window.deleteCourse = (id,e) => { e.stopPropagation(); sfx.denied(); if(confirm("Confirm Delete?")) { courses = courses.filter(c => c.id !== id); saveData(); renderHome(); } };

// --- 8. STARTUP & OVERRIDE ---

window.requestOverride = () => {
    if (isAdminMode) {
        isAdminMode = false; document.body.classList.remove('admin-mode');
        document.getElementById('admin-btn').innerHTML = '<i class="ri-shield-keyhole-line"></i> PROTOCOL: OVERRIDE'; sfx.lock(); 
    } else {
        document.getElementById('pin-input').value = ''; document.getElementById('pin-modal').classList.add('open'); sfx.swoosh();
    }
}
window.closePinModal = () => { sfx.back(); document.getElementById('pin-modal').classList.remove('open'); }
window.addPin = (num) => { sfx.data_stream(); const i = document.getElementById('pin-input'); if (i.value.length < 4) { i.value += num; if(i.value.length === 4) setTimeout(submitPin, 200); } }
window.clearPin = () => { sfx.back(); document.getElementById('pin-input').value = ''; }
window.submitPin = () => {
    if (document.getElementById('pin-input').value === ADMIN_PIN) {
        sfx.boot_complete(); isAdminMode = true; document.body.classList.add('admin-mode');
        document.getElementById('admin-btn').innerHTML = '<i class="ri-lock-unlock-line"></i> LOCK SYSTEM'; closePinModal();
    } else {
        sfx.denied(); setTimeout(()=>sfx.denied(), 200);
        const p = document.querySelector('.pin-content'); p.style.animation = 'shake 0.3s';
        setTimeout(() => { p.style.animation = ''; document.getElementById('pin-input').value = ''; }, 300);
    }
}
const styleSheet = document.createElement("style"); styleSheet.innerText = `@keyframes shake { 0% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } 100% { transform: translateX(0); } }`; document.head.appendChild(styleSheet);

function startExperience() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
    document.getElementById('terminal-log').classList.remove('hidden'); document.getElementById('bar-wrapper').classList.remove('hidden'); document.getElementById('start-prompt').style.display = 'none'; runBootSequence();
}
function runBootSequence() {
    const steps = ["CONNECTING...", "LOADING ASSETS...", "BYPASSING SECURITY...", "ESTABLISHING UPLINK...", "DECRYPTING...", "ACCESS GRANTED."];
    let stepIndex = 0; let progress = 0; sfx.startup();
    const bootInterval = setInterval(() => {
        progress += Math.random() * 5; if(progress > 100) progress = 100;
        document.getElementById('boot-bar').style.width = progress + "%";
        if (progress > (stepIndex * 20) && stepIndex < steps.length) { document.getElementById('terminal-log').innerText = "> " + steps[stepIndex]; stepIndex++; sfx.data_stream(); }
        if (progress >= 100) {
            clearInterval(bootInterval); sfx.boot_complete();
            setTimeout(() => { const o = document.getElementById('boot-overlay'); o.classList.add('glitch-out'); setTimeout(() => { o.classList.add('boot-complete'); o.classList.remove('glitch-out'); startAmbience(); }, 400); }, 600);
        }
    }, 80);
}
document.getElementById('boot-overlay').addEventListener('click', startExperience, {once:true});

const canvas = document.getElementById('particle-canvas');
if (canvas) {
    const ctxC = canvas.getContext('2d');
    let pts = []; let w, h;
    function rsz() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
    class P { constructor(){this.r();} r(){this.x=Math.random()*w;this.y=Math.random()*h;this.vx=(Math.random()-.5)*.5;this.vy=(Math.random()-.5)*.5;this.s=Math.random()*2;this.a=Math.random()*.5;} u(){this.x+=this.vx;this.y+=this.vy;if(this.x<0||this.x>w)this.vx*=-1;if(this.y<0||this.y>h)this.vy*=-1;} d(){ctxC.beginPath();ctxC.arc(this.x,this.y,this.s,0,7);ctxC.fillStyle=`rgba(138,43,226,${this.a})`;ctxC.fill();} }
    function loop() { ctxC.clearRect(0,0,w,h); pts.forEach(p=>{p.u();p.d();}); requestAnimationFrame(loop); }
    window.addEventListener('resize', rsz); rsz(); for(let i=0;i<(window.innerWidth<768?20:50);i++)pts.push(new P()); loop();
}

// --- 9. AUTO-DURATION LISTENER (RUMBLE & MESSAGE API) ---
window.addEventListener('message', (event) => {
    if (!activeVideo || !event.data) return;
    let data = event.data;
    try { if (typeof data === 'string') data = JSON.parse(data); } catch (e) { return; }
    if (data.event === "durationChange" || data.event === "loadedmetadata") {
        const duration = parseFloat(data.data);
        if (duration > 0 && activeVideo.url.includes('rumble.com')) {
            updateDurationDatabase(activeVideo.id, duration);
        }
    }
});

init();
