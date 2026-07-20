// --- Configuration ---
const comicsList = [
    {
        id: 'elara-the-warrior',
        title: 'Elara The Warrior',
        pages: 3, 
        coverExt: 'jpg',
        pageExt: 'jpg' // Pages are now saved as .png
    }
];

// --- Universal Audios ---
const flipSound = new Audio('universal-audios/page-flip.mp3');
const openSound = new Audio('universal-audios/book-open.mp3');
const zoomSound = new Audio('universal-audios/zoom.mp3');

// State Variables
let currentComic = null;
let currentPage = 1;
let currentZoom = 1;
let currentLang = 'e'; // 'e' for English, 'h' for Hindi/Hinglish
let isSoundEnabled = true;
let pageAudio = null;

// DOM Elements
const libraryView = document.getElementById('library-view');
const readerView = document.getElementById('reader-view');
const comicGrid = document.getElementById('comic-grid');
const comicImage = document.getElementById('comic-image');
const pageElement = document.getElementById('page-element');
const langToggleBtn = document.getElementById('lang-toggle');

// 1. Initialize Library
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

// 2. Open Book Logic
function openBook(comic) {
    currentComic = comic;
    currentPage = 1;
    currentZoom = 1;
    currentLang = 'e'; // Reset to English on open
    langToggleBtn.innerText = 'EN';
    
    libraryView.classList.add('hidden');
    readerView.classList.remove('hidden');
    
    if (isSoundEnabled) openSound.play();
    
    loadPage();
}

// 3. Load Page & Audio with Language Logic
function loadPage() {
    comicImage.style.transform = `scale(${currentZoom})`;
    
    // NEW LOGIC: Loads 1-e.png or 1-h.png based on language selection
    comicImage.src = `comics/${currentComic.id}/${currentPage}-${currentLang}.${currentComic.pageExt}`;

    if (pageAudio) {
        pageAudio.pause();
        pageAudio.currentTime = 0;
    }

    if (isSoundEnabled) {
        // Assuming audio files are independent of language (1.mp3, 2.mp3 etc.)
        // If you want separate audio for languages, you can change this to `${currentPage}-${currentLang}.mp3`
        pageAudio = new Audio(`comics/${currentComic.id}/audio/${currentPage}.mp3`);
        pageAudio.play().catch(e => console.log("Audio not found: ", e));
    }
}

// 4. Language Toggle Logic
langToggleBtn.addEventListener('click', function() {
    if (currentLang === 'e') {
        currentLang = 'h';
        this.innerText = 'HI';
    } else {
        currentLang = 'e';
        this.innerText = 'EN';
    }
    // Reload the current page with the new language image
    loadPage();
});

// 5. Page Navigation
document.getElementById('next-page').addEventListener('click', () => {
    if (currentPage < currentComic.pages) {
        if (isSoundEnabled) flipSound.play();
        
        pageElement.classList.add('flip-next');
        
        setTimeout(() => {
            currentPage++;
            loadPage();
            pageElement.classList.remove('flip-next');
        }, 300);
    }
});

document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
        if (isSoundEnabled) flipSound.play();
        
        pageElement.classList.add('flip-prev');
        
        setTimeout(() => {
            currentPage--;
            loadPage();
            pageElement.classList.remove('flip-prev');
        }, 300);
    }
});

// 6. Zoom Logic
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

// 7. Close Book
document.getElementById('close-btn').addEventListener('click', () => {
    readerView.classList.add('hidden');
    libraryView.classList.remove('hidden');
    if (pageAudio) pageAudio.pause();
});

// 8. Toggle Sound
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

initLibrary();
