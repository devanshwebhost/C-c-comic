// --- Configuration ---
// Static site hai isliye yahan define karenge books ka data
const comicsList = [
    {
        id: 'elara-the-warrior',
        title: 'Elara The Warrior',
        pages: 3, // Total inside pages (1.jpg, 2.jpg, 3.jpg)
        coverExt: 'jpg'
    }
    // Aur books add kar sakte ho yahan...
];

// --- Universal Audios ---
const flipSound = new Audio('universal-audios/page-flip.mp3');
const openSound = new Audio('universal-audios/book-open.mp3');
const zoomSound = new Audio('universal-audios/zoom.mp3');

// State Variables
let currentComic = null;
let currentPage = 1;
let currentZoom = 1;
let isSoundEnabled = true;
let pageAudio = null;

// DOM Elements
const libraryView = document.getElementById('library-view');
const readerView = document.getElementById('reader-view');
const comicGrid = document.getElementById('comic-grid');
const comicImage = document.getElementById('comic-image');
const pageElement = document.getElementById('page-element');

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
    
    libraryView.classList.add('hidden');
    readerView.classList.remove('hidden');
    
    if (isSoundEnabled) openSound.play();
    
    loadPage();
}

// 3. Load Page & Audio
function loadPage() {
    comicImage.style.transform = `scale(${currentZoom})`;
    comicImage.src = `comics/${currentComic.id}/${currentPage}.jpg`;

    // Stop previous audio if playing
    if (pageAudio) {
        pageAudio.pause();
        pageAudio.currentTime = 0;
    }

    // Play dedicated page audio
    if (isSoundEnabled) {
        pageAudio = new Audio(`comics/${currentComic.id}/audio/${currentPage}.mp3`);
        pageAudio.play().catch(e => console.log("Audio not found or blocked: ", e));
    }
}

// 4. Page Navigation with FLIP Animation
document.getElementById('next-page').addEventListener('click', () => {
    if (currentPage < currentComic.pages) {
        if (isSoundEnabled) flipSound.play();
        
        // Trigger CSS Flip Animation
        pageElement.classList.add('flip-next');
        
        setTimeout(() => {
            currentPage++;
            loadPage();
            // Reset animation instantly while invisible
            pageElement.classList.remove('flip-next');
        }, 300); // 300ms matches halfway point of CSS transition
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

// 5. Zoom Logic
document.getElementById('zoom-in').addEventListener('click', () => {
    if (currentZoom < 3) { // Max 3x zoom
        currentZoom += 0.2;
        comicImage.style.transform = `scale(${currentZoom})`;
        if (isSoundEnabled) zoomSound.play();
    }
});

document.getElementById('zoom-out').addEventListener('click', () => {
    if (currentZoom > 1) { // Min 1x zoom
        currentZoom -= 0.2;
        comicImage.style.transform = `scale(${currentZoom})`;
        if (isSoundEnabled) zoomSound.play();
    }
});

// 6. Close Book
document.getElementById('close-btn').addEventListener('click', () => {
    readerView.classList.add('hidden');
    libraryView.classList.remove('hidden');
    if (pageAudio) pageAudio.pause();
});

// 7. Toggle Sound
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

// Start app
initLibrary();
