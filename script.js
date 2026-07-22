// ==========================================
// ⚙️ GITHUB API CONFIGURATION (YAHAN CHANGE KARO)
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

// --- Helper: Generate Dynamic Title from Folder ID ---
function formatTitleFromId(id) {
    return id.split('-')
             .map(word => word.charAt(0).toUpperCase() + word.slice(1))
             .join(' ');
}

// ==========================================
// 🚀 DYNAMIC FOLDER SCANNING & OPTIMIZATION
// ==========================================
async function fetchComicsDynamically() {
    comicGrid.innerHTML = '<h3 style="text-align:center; width:100%; color:var(--primary-pink);">Loading Magical Books... ✨</h3>';
    
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/comics`);
        if (!response.ok) throw new Error("GitHub Repo nahi mili. API ya Folders check karo.");
        
        const data = await response.json();
        const folders = data.filter(item => item.type === 'dir');
        
        comicsList = []; 

        for (let folder of folders) {
            // 1. Comic Folder ki files check karo
            const folderRes = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/comics/${folder.name}`);
            const folderData = await folderRes.json();
            
            // 2. Cover image dynamic extention check (jpg, jpeg, png, webp, gif)
            const coverFile = folderData.find(f => f.name.toLowerCase().match(/^cover\.(jpg|jpeg|png|webp|gif)$/i));
            const coverName = coverFile ? coverFile.name : 'cover.png'; 
            
            // 3. Pages count aur unka extension detect karo (DYNAMIC PAGE EXTENSIONS)
            const pagesMap = {};
            let totalPages = 0;

            folderData.forEach(file => {
                // Ye check karega files jaise: 1-e.jpg, 2-h.png, 3-e.webp
                const match = file.name.match(/^(\d+)-(e|h)\.(jpg|jpeg|png|webp)$/i);
                if (match) {
                    const pageNum = parseInt(match[1]);
                    const lang = match[2].toLowerCase(); // 'e' or 'h'
                    const ext = match[3]; // 'png', 'jpg', etc.

                    if (!pagesMap[pageNum]) {
                        pagesMap[pageNum] = {};
                    }
                    pagesMap[pageNum][lang] = ext; // Extension save kar lo

                    if (pageNum > totalPages) {
                        totalPages = pageNum;
                    }
                }
            });

            // 4. Audio Folder me file scan karo
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

            // Dynamic Data Push
            comicsList.push({
                id: folder.name,
                title: formatTitleFromId(folder.name),
                pages: totalPages, 
                coverName: coverName,
                pagesMap: pagesMap,     // Har page ka apna extension store ho gaya
                audioName: audioFileName 
            });
        }

        comicGrid.innerHTML = ''; 
        initLibrary();

    } catch (error) {
        console.error("Error:", error);
        comicGrid.innerHTML = `<p style="color:red; text-align:center;">Error: ${error.message}</p>`;
    }
}

// 1. Initialize Library 
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

// 2. Open Book & Play Background Music
function openBook(comic) {
    currentComic = comic;
    currentZoom = 1;
    currentLang = 'e'; 
    langToggleBtn.innerText = 'EN';
    
    const savedPage = localStorage.getItem(`progress_${comic.id}`);
    currentPage = savedPage ? parseInt(savedPage) : 1;
    
    libraryView.classList.add('hidden');
    readerView.classList.remove('hidden');
    
    if (isSoundEnabled) openSound.play();

    // Dedicated Book Background Music Setup
    if (bgmAudio) {
        bgmAudio.muted = true;
        bgmAudio.pause();
        bgmAudio.currentTime = 0;
    }

    if (comic.audioName) {
        bgmAudio = new Audio(`comics/${comic.id}/audio/${comic.audioName}`);
        bgmAudio.loop = true; 
        if (isSoundEnabled) {
            bgmAudio.muted = false;
            bgmAudio.play().catch(e => console.log("BGM Play error: ", e));
        }
    }
    
    loadPage();
    showTutorial();
}

// 3. Tutorial Logic
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

// 4. Load Page (Image extension direct pagesMap se uthega)
function loadPage() {
    comicImage.style.transform = `scale(${currentZoom})`;
    
    // Check karo is page aur language ka extension kya hai (default 'png')
    const ext = currentComic.pagesMap[currentPage] && currentComic.pagesMap[currentPage][currentLang]
                ? currentComic.pagesMap[currentPage][currentLang] 
                : 'png';
                
    comicImage.src = `comics/${currentComic.id}/${currentPage}-${currentLang}.${ext}`;
}

// 5. Flip Logic (Left / Right)
function goNextPage() {
    if (currentPage < currentComic.pages) {
        if (isSoundEnabled) flipSound.play();
        
        pageElement.classList.add('flip-next');
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
        
        pageElement.classList.add('flip-prev');
        setTimeout(() => {
            currentPage--;
            localStorage.setItem(`progress_${currentComic.id}`, currentPage); 
            loadPage();
            pageElement.classList.remove('flip-prev');
        }, 300);
    }
}

bookContainer.addEventListener('click', (e) => {
    const screenWidth = window.innerWidth;
    if (e.clientX < screenWidth / 2) {
        goPrevPage();
    } else {
        goNextPage();
    }
});

// 6. Language Toggle Logic
langToggleBtn.addEventListener('click', function() {
    currentLang = currentLang === 'e' ? 'h' : 'e';
    this.innerText = currentLang === 'e' ? 'EN' : 'HI';
    loadPage();
});

// 7. Zoom Logic
document.getElementById('zoom-in').addEventListener('click', () => {
    if (currentZoom < 3) {
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

// 8. Close Book
document.getElementById('close-btn').addEventListener('click', () => {
    readerView.classList.add('hidden');
    libraryView.classList.remove('hidden');
    
    // Stop BGM when returning to library
    if (bgmAudio) {
        bgmAudio.muted = true;
        bgmAudio.pause();
    }
});

// 9. Toggle Sound (Fully Fixed for 100% Mute)
document.getElementById('bgm-toggle').addEventListener('click', function() {
    isSoundEnabled = !isSoundEnabled;
    const icon = this.querySelector('i');
    
    if (isSoundEnabled) {
        if (icon) icon.className = 'fas fa-volume-up';
        
        if (bgmAudio) {
            bgmAudio.muted = false;
            bgmAudio.play().catch(e => console.log("Audio play blocked by browser:", e));
        }
    } else {
        if (icon) icon.className = 'fas fa-volume-mute';
        
        if (bgmAudio) {
            bgmAudio.muted = true;
            bgmAudio.pause();
        }
    }
});

// Start fetching and loading
fetchComicsDynamically();
