function arrangeCards() {
    const container = document.querySelector('.shows-holder');
    const cards = Array.from(container.querySelectorAll('.show-card'));
    
    let currentRow = 1;
    
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        
        if (card.classList.contains('portrait')) {
            // Портретная карточка - ставим в первую колонку
            card.style.gridColumn = '1';
            card.style.gridRow = currentRow;
            
            // Проверяем следующую карточку
            if (i + 1 < cards.length && cards[i + 1].classList.contains('landscape')) {
                // Если следующая - ландшафтная, ставим её рядом
                cards[i + 1].style.gridColumn = '2';
                cards[i + 1].style.gridRow = currentRow;
                i++; // Пропускаем следующую карточку
            }
            currentRow++;
            
        } else if (card.classList.contains('landscape')) {
            // Ландшафтная карточка - занимает всю строку
            card.style.gridColumn = '1 / 3'; /* Занимает обе колонки */
            card.style.gridRow = currentRow;
            currentRow++;
        }
    }
}

// Функция для определения ориентации
function applyOrientationClasses() {
    const showCards = document.querySelectorAll('.show-card');
    
    showCards.forEach(card => {
        let img = card.querySelector('.show-card-image img');

        if (img.complete) {
            setOrientationClass(img, card);
        } else {
            img.addEventListener('load', function() {
                setOrientationClass(img, card);
            });
        }
    });
}

function setOrientationClass(img, card) {
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    
    card.classList.remove('portrait', 'landscape');
    
    if (height > width) {
        card.classList.add('portrait');
    } else {
        card.classList.add('landscape');
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    applyOrientationClasses();
    
    window.addEventListener('load', function() {
        arrangeCards();
    });
});