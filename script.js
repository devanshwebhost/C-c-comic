// ==========================================
// ⚙️ GITHUB API CONFIGURATION (YAHAN CHANGE KARO)
// ==========================================
const GITHUB_USERNAME = 'devanshwebhost'; // 👈 Apna GitHub Username yahan likho (e.g., 'rahul123')
const GITHUB_REPO = 'C-c-comic'; // 👈 Apni Repository ka naam yahan likho (e.g., 'comic-website')

// Ab tumhe manually koi list nahi banani padegi!
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
let pageAudio = null;

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
// 🚀 DYNAMIC FOLDER SCANNING (GITHUB API)
// ==========================================
async function fetchComicsDynamically() {
    comicGrid.innerHTML = '<h3 style="text-align:center; width:100%; color:var(--primary-pink);">Loading Magic... ✨</h3>';
    
    try {
        // 1. GitHub API se 'comics' folder check karo
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/comics`);
        if (!response.ok) throw new Error("GitHub Repo nahi mili. Username ya Repo name check karo.");
        
        const data = await response.json();
        
        // 2. Sirf folders (directories) ko filter karo
        const folders = data.filter(item => item.type === 'dir');
        comicsList = []; // Reset list

        for (let folder of folders) {
            // 3. Har folder ke andar jaakar check karo kitne pages hain
            const folderRes = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/comics/${folder.name}`);
            const folderData = await folderRes.json();
            
            // '-e.png' wali files ko count karke total pages pata lagao
            // Agar tumne image jpg me rakhi hai, toh '-e.png' ko '.jpg' se replace kar dena
            const pageFiles = folderData.filter(file => file.name.includes('-e.')); 
            const totalPages = pageFiles.length > 0 ? pageFiles.length : 1; // Default 1 page agar kuch na mile

            // Dynamic Data Push
            comicsList.push({
                id: folder.name,
                title: formatTitleFromId(folder.name),
                pages: totalPages, 
                coverExt: 'jpg', // Cover ke liye .jpg
                pageExt: 'png'   // Pages ke liye .png (Agar jpg hai toh ise 'jpg' kar dena)
            });
        }

        // Jab sab load ho jaye toh library start karo
        comicGrid.innerHTML = ''; // Clear loading text
        initLibrary();

    } catch (error) {
        console.error("Error:", error);
        comicGrid.innerHTML = `<p style="color:red; text-align:center;">Error: ${error.message}</p>`;
    }
}

// 1. Initialize Library (Ab dynamic list se chalega)
function initLibrary() {
    comicsList.forEach(comic => {
        const card = document.createElement('div');
        card.className = 'comic-card';
        card.innerHTML = `
            <img src="comics/${comic.id}/cover.${comic.coverExt}" alt="${comic.title}">
            <h3>${comic.title}</h3>
        `;
        card.addEventListener('click', () => openBook(comic));
        comicGrid.appendChild(card);
    });
}

// 2. Open Book & Load Local Storage
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

// 4. Load Page & Audio
function loadPage() {
    comicImage.style.transform = `scale(${currentZoom})`;
    
    comicImage.src = `comics/${currentComic.id}/${currentPage}-${currentLang}.${currentComic.pageExt}`;

    if (pageAudio) {
        pageAudio.pause();
        pageAudio.currentTime = 0;
    }

    if (isSoundEnabled) {
        pageAudio = new Audio(`comics/${currentComic.id}/audio/${currentPage}.mp3`);
        pageAudio.play().catch(e => console.log("Audio not found: ", e));
    }
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
    if (pageAudio) pageAudio.pause();
});

// 9. Toggle Sound
document.getElementById('bgm-toggle').addEventListener('click', function() {
    isSoundEnabled = !isSoundEnabled;
    const icon = this.querySelector('i');
    
    if (isSoundEnabled) {
        icon.className = 'fas fa-volume-up';
        if (pageAudio) pageAudio.play();
    } else {
        icon.className = 'fas fa-volume-mute';
        if (pageAudio) pageAudio.pause();
    }
});

// YAHAN SE SITE START HOGI API CALL KE SATH
fetchComicsDynamically();
