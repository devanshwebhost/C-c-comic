// ==========================================
// ⚙️ GITHUB API CONFIGURATION
// ==========================================
const GITHUB_USERNAME = 'devanshwebhost'; 
const GITHUB_REPO = 'C-c-comic'; 

let comicsList = []; 

// --- Universal Audios ---
const flipSound = new Audio('universal-audios/page-flip.mp3');
const openSound = new Audio('universal-audios/book-open.mp3');
const zoomSound = new Audio('universal-audios/zoom.mp3');

// State Variables
let currentComic = null;
let currentPage = 1;
let currentZoom = 1;
let currentLang = 'e'; 
let isSoundEnabled = true;
let bgmAudio = null;

// DOM Elements
const libraryView = document.getElementById('library-view');
const readerView = document.getElementById('reader-view');
const comicGrid = document.getElementById('comic-grid');
const comicImage = document.getElementById('comic-image');
const pageElement = document.getElementById('page-element');
const langToggleBtn = document.getElementById('lang-toggle');
const bookContainer = document.getElementById('book-container');
const tutorialOverlay = document.getElementById('tutorial-overlay');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingProgress = document.getElementById('loading-progress');
const pageCounter = document.getElementById('page-counter'); // New UI

// --- Helper: Generate Dynamic Title ---
function formatTitleFromId(id) {
    return id.split('-')
             .map(word => word.charAt(0).toUpperCase() + word.slice(1))
             .join(' ');
}

// ==========================================
// 🚀 DYNAMIC FOLDER SCANNING
// ==========================================
async function fetchComicsDynamically() {
    comicGrid.innerHTML = '<h3 style="text-align:center; width:100%; color:var(--primary-pink);">Summoning Magic Books... ✨</h3>';
    
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/comics`);
        if (!response.ok) throw new Error("GitHub Repo nahi mili.");
        
        const data = await response.json();
        const folders = data.filter(item => item.type === 'dir');
        
        comicsList = []; 

        for (let folder of folders) {
            const folderRes = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/comics/${folder.name}`);
            const folderData = await folderRes.json();
            
            // Dynamic Cover Extension
            const coverFile = folderData.find(f => f.name.toLowerCase().match(/^cover\.(jpg|jpeg|png|webp|gif)$/i));
            const coverName = coverFile ? coverFile.name : 'cover.png'; 
            
            // Dynamic Page Extensions Map
            const pagesMap = {};
            let totalPages = 0;

            folderData.forEach(file => {
                const match = file.name.match(/^(\d+)-(e|h)\.(jpg|jpeg|png|webp)$/i);
                if (match) {
                    const pageNum = parseInt(match[1]);
                    const lang = match[2].toLowerCase();
                    const ext = match[3];

                    if (!pagesMap[pageNum]) pagesMap[pageNum] = {};
                    pagesMap[pageNum][lang] = ext;

                    if (pageNum > totalPages) totalPages = pageNum;
                }
            });

            // Audio Check
            let audioFileName = null;
            try {
                const audioRes = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/comics/${folder.name}/audio`);
                if (audioRes.ok) {
                    const audioData = await audioRes.json();
                    const audioFile = audioData.find(f => f.name.match(/\.(mp3|wav|ogg)$/i));
                    if (audioFile) audioFileName = audioFile.name;
                }
            } catch (e) {
                console.log(`No audio found for ${folder.name}`);
            }

            comicsList.push({
                id: folder.name,
                title: formatTitleFromId(folder.name),
                pages: totalPages, 
                coverName: coverName,
                pagesMap: pagesMap,     
                audioName: audioFileName 
            });
        }

        comicGrid.innerHTML = ''; 
        initLibrary();

    } catch (error) {
        comicGrid.innerHTML = `<p style="color:red; text-align:center;">Error: ${error.message}</p>`;
    }
}

function initLibrary() {
    comicsList.forEach(comic => {
        const card = document.createElement('div');
        card.className = 'comic-card';
        card.innerHTML = `
            <img src="comics/${comic.id}/${comic.coverName}" alt="${comic.title}">
            <h3>${comic.title}</h3>
        `;
        card.addEventListener('click', () => openBook(comic));
        comicGrid.appendChild(card);
    });
}

// ==========================================
// ⏳ IMAGE PRELOADER
// ==========================================
async function preloadComicPages(comic) {
    return new Promise((resolve) => {
        let imagesToLoad = [];
        for (let i = 1; i <= comic.pages; i++) {
            if (comic.pagesMap[i]) {
                if (comic.pagesMap[i]['e']) imagesToLoad.push(`comics/${comic.id}/${i}-e.${comic.pagesMap[i]['e']}`);
                if (comic.pagesMap[i]['h']) imagesToLoad.push(`comics/${comic.id}/${i}-h.${comic.pagesMap[i]['h']}`);
            }
        }

        if (imagesToLoad.length === 0) return resolve();

        let loadedCount = 0;
        imagesToLoad.forEach(src => {
            const img = new Image();
            img.onload = img.onerror = () => {
                loadedCount++;
                let percent = Math.round((loadedCount / imagesToLoad.length) * 100);
                if (loadingProgress) loadingProgress.innerText = `${percent}%`;
                if (loadedCount === imagesToLoad.length) resolve();
            };
            img.src = src; 
        });
    });
}

// ==========================================
// 📖 READER LOGIC
// ==========================================
async function openBook(comic) {
    currentComic = comic;
    currentZoom = 1;
    currentLang = 'e'; 
    langToggleBtn.innerText = 'EN';
    
    const savedPage = localStorage.getItem(`progress_${comic.id}`);
    currentPage = savedPage ? parseInt(savedPage) : 1;
    
    // Show Loader
    loadingOverlay.classList.remove('hidden');
    loadingOverlay.style.display = 'flex';
    loadingProgress.innerText = "0%";

    await preloadComicPages(comic); // Wait for download

    // Hide Loader
    loadingOverlay.classList.add('hidden');
    loadingOverlay.style.display = 'none';

    libraryView.classList.add('hidden');
    readerView.classList.remove('hidden');
    
    if (isSoundEnabled) openSound.play();

    // BGM Setup
    if (bgmAudio) {
        bgmAudio.muted = true;
        bgmAudio.pause();
    }
    if (comic.audioName) {
        bgmAudio = new Audio(`comics/${comic.id}/audio/${comic.audioName}`);
        bgmAudio.loop = true; 
        if (isSoundEnabled) {
            bgmAudio.muted = false;
            bgmAudio.play().catch(e => console.log("BGM blocked:", e));
        }
    }
    
    loadPage();
    showTutorial();
}

function loadPage() {
    comicImage.style.transform = `scale(${currentZoom})`;
    
    // Update Page Counter UI
    pageCounter.innerText = `Page ${currentPage} / ${currentComic.pages}`;
    
    const ext = currentComic.pagesMap[currentPage] && currentComic.pagesMap[currentPage][currentLang]
                ? currentComic.pagesMap[currentPage][currentLang] 
                : 'png';
                
    comicImage.src = `comics/${currentComic.id}/${currentPage}-${currentLang}.${ext}`;
}

// --- Navigation ---
function goNextPage() {
    if (currentPage < currentComic.pages) {
        if (isSoundEnabled) flipSound.play();
        pageElement.classList.add('flip-next'); // Slide left animation
        
        setTimeout(() => {
            currentPage++;
            localStorage.setItem(`progress_${currentComic.id}`, currentPage); 
            loadPage();
            pageElement.classList.remove('flip-next');
        }, 300);
    }
}

function goPrevPage() {
    if (currentPage > 1) {
        if (isSoundEnabled) flipSound.play();
        pageElement.classList.add('flip-prev'); // Slide right animation
        
        setTimeout(() => {
            currentPage--;
            localStorage.setItem(`progress_${currentComic.id}`, currentPage); 
            loadPage();
            pageElement.classList.remove('flip-prev');
        }, 300);
    }
}

// Click to Flip
bookContainer.addEventListener('click', (e) => {
    const screenWidth = window.innerWidth;
    if (e.clientX < screenWidth / 2) goPrevPage();
    else goNextPage();
});

// Keyboard Support (New UX)
document.addEventListener('keydown', (e) => {
    if (readerView.classList.contains('hidden')) return; // Sirf tab kaam kare jab book khuli ho
    if (e.key === 'ArrowRight') goNextPage();
    if (e.key === 'ArrowLeft') goPrevPage();
});

// --- Controls ---
langToggleBtn.addEventListener('click', function() {
    currentLang = currentLang === 'e' ? 'h' : 'e';
    this.innerText = currentLang === 'e' ? 'EN' : 'HI';
    loadPage();
});

document.getElementById('zoom-in').addEventListener('click', () => {
    if (currentZoom < 2.5) {
        currentZoom += 0.2;
        comicImage.style.transform = `scale(${currentZoom})`;
        if (isSoundEnabled) zoomSound.play();
    }
});

document.getElementById('zoom-out').addEventListener('click', () => {
    if (currentZoom > 1) {
        currentZoom -= 0.2;
        comicImage.style.transform = `scale(${currentZoom})`;
        if (isSoundEnabled) zoomSound.play();
    }
});

document.getElementById('close-btn').addEventListener('click', () => {
    readerView.classList.add('hidden');
    libraryView.classList.remove('hidden');
    if (bgmAudio) {
        bgmAudio.muted = true;
        bgmAudio.pause();
    }
});

document.getElementById('bgm-toggle').addEventListener('click', function() {
    isSoundEnabled = !isSoundEnabled;
    const icon = this.querySelector('i');
    
    if (isSoundEnabled) {
        if (icon) icon.className = 'fas fa-volume-up';
        if (bgmAudio) {
            bgmAudio.muted = false;
            bgmAudio.play().catch(e => console.log("Blocked:", e));
        }
    } else {
        if (icon) icon.className = 'fas fa-volume-mute';
        if (bgmAudio) {
            bgmAudio.muted = true;
            bgmAudio.pause();
        }
    }
});

function showTutorial() {
    if (!localStorage.getItem('tutorial_seen')) {
        tutorialOverlay.classList.remove('hidden');
        tutorialOverlay.addEventListener('click', function hideTut(e) {
            e.stopPropagation();
            tutorialOverlay.classList.add('hidden');
            localStorage.setItem('tutorial_seen', 'true');
            tutorialOverlay.removeEventListener('click', hideTut);
        });
    }
}

// Start
fetchComicsDynamically();
