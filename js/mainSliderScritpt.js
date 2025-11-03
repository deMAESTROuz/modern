// Единый класс для управления всеми типами слайдеров
class UniversalSlider {
    constructor(container) {
        this.container = container;
        this.slider = this.findSlider();
        this.slides = this.findSlides();
        this.prevBtn = container.querySelector('.prev, .slider-arrow.prev, .repertory-arrow.prev, .logo-arrow.prev');
        this.nextBtn = container.querySelector('.next, .slider-arrow.next, .repertory-arrow.next, .logo-arrow.next');
        this.dotsContainer = this.findDotsContainer();

        this.currentSlide = 0;
        this.isAnimating = false;
        this.autoPlayInterval = null;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.mouseStartX = 0;
        this.mouseEndX = 0;
        this.isMouseDown = false;
        this.isSwiping = false;
        this.isClickBlocked = false;
        this.swipeThreshold = 50;

        // Определяем тип слайдера
        this.sliderType = this.determineSliderType();
        this.visibleItems = this.getVisibleItemsCount();

        // Для repertory слайдера собираем все элементы
        if (this.sliderType === 'repertory') {
            this.allRepertoryItems = [];
            this.collectRepertoryItems();
        }

        this.init();
    }

    determineSliderType() {
        if (this.container.classList.contains('logo-slider-container')) return 'logo';
        if (this.container.classList.contains('repertory-slider-container')) return 'repertory';
        if (this.container.classList.contains('image-slider-container')) return 'image';
        return 'main';
    }

    findSlider() {
        const selectors = ['.slider', '.repertory-slider', '.logo-slider', '.image-slider'];
        for (let selector of selectors) {
            const element = this.container.querySelector(selector);
            if (element) return element;
        }
        return null;
    }

    findSlides() {
        const selectors = ['.slide', '.repertory-slide', '.logo-slide', '.image-slide'];
        for (let selector of selectors) {
            const elements = this.container.querySelectorAll(selector);
            if (elements.length > 0) return elements;
        }
        return [];
    }

    findDotsContainer() {
        const selectors = ['.slider-dots', '.repertory-dots', '.logo-dots', '.image-slider-dots'];
        for (let selector of selectors) {
            const element = this.container.querySelector(selector);
            if (element) return element;
        }
        return null;
    }

    getVisibleItemsCount() {
        const isMobile = window.innerWidth <= 768;

        switch (this.sliderType) {
            case 'logo':
                return isMobile ? 3 : 5;
            case 'repertory':
                return isMobile ? 4 : 6;
            case 'image':
            case 'main':
            default:
                return 1;
        }
    }

    collectRepertoryItems() {
        // Собираем все элементы из существующих слайдов
        const existingSlides = this.slider.querySelectorAll('.repertory-slide');
        existingSlides.forEach(slide => {
            const items = slide.querySelectorAll('.repertory-item');
            items.forEach(item => {
                this.allRepertoryItems.push(item.cloneNode(true));
            });
        });

        // Очищаем слайдер для перестроения
        this.slider.innerHTML = '';
    }

    createRepertorySlides() {
        const itemsPerSlide = this.visibleItems;

        // Разбиваем все элементы на слайды
        for (let i = 0; i < this.allRepertoryItems.length; i += itemsPerSlide) {
            const slideItems = this.allRepertoryItems.slice(i, i + itemsPerSlide);
            this.createRepertorySlide(slideItems);
        }
    }

    createRepertorySlide(items) {
        const slide = document.createElement('div');
        slide.className = 'repertory-slide';

        // Настраиваем grid в зависимости от количества элементов
        if (this.visibleItems === 4) {
            // Мобильная версия: 2x2
            slide.style.gridTemplateColumns = 'repeat(2, 1fr)';
            slide.style.gridTemplateRows = 'repeat(2, 1fr)';
        } else {
            // Десктопная версия: 3x2
            slide.style.gridTemplateColumns = 'repeat(3, 1fr)';
            slide.style.gridTemplateRows = 'repeat(2, 1fr)';
        }

        slide.style.gap = '10px';
        slide.style.display = 'grid';
        slide.style.width = '100%';
        slide.style.flexShrink = '0';

        // Добавляем элементы в слайд
        items.forEach(item => {
            slide.appendChild(item);
        });

        this.slider.appendChild(slide);
    }

    init() {
        if (this.slides.length <= 1 && this.sliderType !== 'repertory') return;

        // Для repertory слайдера перестраиваем структуру
        if (this.sliderType === 'repertory') {
            this.createRepertorySlides();
            this.slides = this.slider.querySelectorAll('.repertory-slide');
        }

        // Настраиваем слайдер в зависимости от типа
        this.setupSlider();

        // Создаем точки для навигации
        this.createDots();

        // Настраиваем события
        this.setupEvents();

        // Для image-слайдеров запускаем автопрокрутку
        if (this.sliderType === 'image') {
            this.startAutoPlay();
        }

        // Слушаем изменения размера окна
        window.addEventListener('resize', () => this.handleResize());
    }

    setupSlider() {
        // Настраиваем бесконечную прокрутку для всех слайдеров кроме лого и repertory
        if (this.sliderType !== 'logo') {
        this.setupInfiniteScroll();
    }

        // Настраиваем отображение в зависимости от типа
        switch (this.sliderType) {
            case 'logo':
                this.setupLogoSlider();
                break;
            case 'repertory':
                // Для repertory слайдера уже настроено при создании
                break;
            case 'image':
                this.setupImageSlider();
                break;
        }

        this.updateDots();
        this.goToSlide(0, false);
    }

    setupInfiniteScroll() {
        if (this.slides.length <= 1) return;

        // Клонируем первый и последний слайды
        const firstClone = this.slides[0].cloneNode(true);
        const lastClone = this.slides[this.slides.length - 1].cloneNode(true);

        this.slider.appendChild(firstClone);
        this.slider.insertBefore(lastClone, this.slides[0]);

        // Обновляем ссылки на слайды
        this.slides = this.container.querySelectorAll('.slide, .repertory-slide, .image-slide');

        // Устанавливаем начальную позицию
        this.goToSlide(1, false);
    }

    setupLogoSlider() {
        const slideWidth = 100 / this.visibleItems;
        this.slides.forEach(slide => {
            slide.style.minWidth = `${slideWidth}%`;
            slide.style.flex = `0 0 ${slideWidth}%`;
        });
    }

    setupImageSlider() {
        // Для image-слайдеров дополнительных настроек не нужно
    }

    setupEvents() {
        // Кнопки навигации
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prev());
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.next());
        }

        // Сенсорные события для мобильных устройств
        this.setupTouchEvents();

        // События мыши для десктопных устройств
        this.setupMouseEvents();

        // Останавливаем автопрокрутку при взаимодействии
        if (this.sliderType === 'image') {
            this.container.addEventListener('mouseenter', () => this.stopAutoPlay());
            this.container.addEventListener('mouseleave', () => this.startAutoPlay());
            this.container.addEventListener('touchstart', () => this.stopAutoPlay());
            this.container.addEventListener('touchend', () => this.startAutoPlay());
        }
    }

    setupTouchEvents() {
        this.slider.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.isSwiping = false;
        }, { passive: true });

        this.slider.addEventListener('touchmove', (e) => {
            if (!this.touchStartX) return;

            const currentX = e.changedTouches[0].screenX;
            const diff = Math.abs(this.touchStartX - currentX);

            // Если перемещение достаточно большое, считаем это свайпом
            if (diff > 10) {
                this.isSwiping = true;
                e.preventDefault(); // Предотвращаем скролл страницы
            }
        }, { passive: false });

        this.slider.addEventListener('touchend', (e) => {
            if (!this.touchStartX) return;

            this.touchEndX = e.changedTouches[0].screenX;
            const swipeDistance = this.touchStartX - this.touchEndX;

            // Обрабатываем свайп только если был достаточный сдвиг
            if (this.isSwiping && Math.abs(swipeDistance) > this.swipeThreshold) {
                this.handleSwipe(swipeDistance);
                // Блокируем все клики на 300ms после свайпа
                this.blockClicksTemporarily();
                e.preventDefault();
            }

            this.touchStartX = 0;
            this.isSwiping = false;
        });
    }

    setupMouseEvents() {
        // События для свайпа мышкой
        this.slider.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
            this.mouseStartX = e.clientX;
            this.isSwiping = false;
            e.preventDefault(); // Предотвращаем выделение текста
        });

        this.slider.addEventListener('mousemove', (e) => {
            if (!this.isMouseDown) return;

            this.mouseEndX = e.clientX;
            const diff = Math.abs(this.mouseStartX - this.mouseEndX);

            // Если перемещение достаточно большое, считаем это свайпом
            if (diff > 5) {
                this.isSwiping = true;
            }
        });

        this.slider.addEventListener('mouseup', (e) => {
            if (!this.isMouseDown) return;

            const swipeDistance = this.mouseStartX - this.mouseEndX;
            this.isMouseDown = false;

            // Обрабатываем свайп только если был достаточный сдвиг
            if (this.isSwiping && Math.abs(swipeDistance) > this.swipeThreshold) {
                this.handleMouseSwipe(swipeDistance);
                // Блокируем все клики на 300ms после свайпа
                this.blockClicksTemporarily();
                e.preventDefault();
                e.stopPropagation();
            }

            this.isSwiping = false;
        });

        this.slider.addEventListener('mouseleave', (e) => {
            if (this.isMouseDown) {
                const swipeDistance = this.mouseStartX - this.mouseEndX;
                this.isMouseDown = false;

                if (this.isSwiping && Math.abs(swipeDistance) > this.swipeThreshold) {
                    this.handleMouseSwipe(swipeDistance);
                    this.blockClicksTemporarily();
                    e.preventDefault();
                }

                this.isSwiping = false;
            }
        });

        // Глобальный обработчик для блокировки кликов после свайпа
        document.addEventListener('click', (e) => {
            if (this.isClickBlocked && this.slider.contains(e.target)) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        }, true); // Используем capture phase

        // Добавляем курсор grab для индикации возможности перетаскивания
        this.slider.style.cursor = 'grab';

        this.slider.addEventListener('mousedown', () => {
            this.slider.style.cursor = 'grabbing';
        });

        this.slider.addEventListener('mouseup', () => {
            this.slider.style.cursor = 'grab';
        });
    }

    blockClicksTemporarily() {
        this.isClickBlocked = true;
        setTimeout(() => {
            this.isClickBlocked = false;
        }, 300);
    }

    handleSwipe(swipeDistance) {
        if (swipeDistance > 0) {
            this.next();
        } else {
            this.prev();
        }
    }

    handleMouseSwipe(swipeDistance) {
        if (swipeDistance > 0) {
            this.next();
        } else {
            this.prev();
        }
    }

    createDots() {
        if (!this.dotsContainer || this.sliderType === 'logo') return;

        this.dotsContainer.innerHTML = '';

        let slideCount;
        if (this.sliderType === 'repertory') {
            // Для repertory слайдера используем актуальное количество слайдов
            slideCount = this.slides.length;
        } else if (this.sliderType !== 'logo') {
            // Для других слайдеров с бесконечной прокруткой
            slideCount = this.slides.length - 2;
        } else {
            slideCount = this.slides.length;
        }

        for (let i = 0; i < slideCount; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            if (this.sliderType === 'image') dot.className = 'image-slider-dot';

            dot.dataset.slide = i;
            dot.addEventListener('click', () => {
                let targetSlide;
                if (this.sliderType === 'repertory' || this.sliderType === 'logo') {
                    targetSlide = i;
                } else {
                    targetSlide = i + 1;
                }
                this.goToSlide(targetSlide);
            });

            this.dotsContainer.appendChild(dot);
        }

        this.updateDots();
    }

    goToSlide(index, animate = true) {
        if (this.isAnimating || index < 0 || index >= this.slides.length) return;

        this.isAnimating = true;
        this.currentSlide = index;

        if (animate) {
            this.slider.style.transition = 'transform 0.5s ease-in-out';
        } else {
            this.slider.style.transition = 'none';
        }

        let transformValue;
        if (this.sliderType === 'logo') {
            const slideWidth = 100 / this.visibleItems;
            transformValue = `translateX(-${index * slideWidth}%)`;
        } else {
            transformValue = `translateX(-${index * 100}%)`;
        }

        this.slider.style.transform = transformValue;
        this.updateDots();

        // Обработка бесконечной прокрутки
        if (this.sliderType !== 'logo' && this.sliderType !== 'repertory') {
            setTimeout(() => {
                this.handleInfiniteScroll(index);
                this.isAnimating = false;
            }, 500);
        } else {
            setTimeout(() => {
                this.isAnimating = false;
            }, 500);
        }
    }

    handleInfiniteScroll(index) {
        if (index === 0) {
            this.slider.style.transition = 'none';
            const newIndex = this.slides.length - 2;
            this.currentSlide = newIndex;
            this.slider.style.transform = `translateX(-${newIndex * 100}%)`;
        } else if (index === this.slides.length - 1) {
            this.slider.style.transition = 'none';
            this.currentSlide = 1;
            this.slider.style.transform = `translateX(-100%)`;
        }

        this.updateDots();
    }

    next() {
        if (this.slides.length <= 1) return;

        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }

    prev() {
        if (this.slides.length <= 1) return;

        const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prevIndex);
    }

    updateDots() {
        if (!this.dotsContainer || this.sliderType === 'logo') return;

        const dots = this.dotsContainer.querySelectorAll('.dot, .image-slider-dot');
        if (dots.length === 0) return;

        let dotIndex;

        if (this.sliderType === 'repertory') {
            // Для repertory слайдера просто текущий слайд
            dotIndex = this.currentSlide;
        } else {
            // Для слайдеров с бесконечной прокруткой
            dotIndex = this.currentSlide - 1;
            if (dotIndex < 0) {
                dotIndex = this.slides.length - 3;
            } else if (dotIndex >= dots.length) {
                dotIndex = 0;
            }
        }

        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === dotIndex);
        });
    }

    startAutoPlay() {
        if (this.sliderType !== 'image') return;

        this.stopAutoPlay();
        this.autoPlayInterval = setInterval(() => {
            this.next();
        }, 3000);
    }

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    handleResize() {
        const oldVisibleItems = this.visibleItems;
        this.visibleItems = this.getVisibleItemsCount();

        // Для repertory слайдера перестраиваем при изменении количества элементов
        if (this.sliderType === 'repertory' && oldVisibleItems !== this.visibleItems) {
            this.rebuildRepertorySlider();
        }

        // Для лого-слайдера просто обновляем видимые элементы без перестройки
        if (this.sliderType === 'logo' && oldVisibleItems !== this.visibleItems) {
            this.setupLogoSlider();
            // Возвращаем на текущий слайд после изменения размера
            this.goToSlide(this.currentSlide, false);
        }

        // Для других слайдеров
        if (oldVisibleItems !== this.visibleItems && this.sliderType !== 'repertory' && this.sliderType !== 'logo') {
            this.rebuildSlider();
        }
    }
    rebuildRepertorySlider() {
        this.isAnimating = true;

        // Сохраняем текущую позицию
        const currentPosition = this.currentSlide;

        // Перестраиваем слайды
        this.slider.innerHTML = '';
        this.createRepertorySlides();

        // Обновляем ссылки на слайды
        this.slides = this.slider.querySelectorAll('.repertory-slide');

        // Пересоздаем точки
        this.createDots();

        // Восстанавливаем позицию
        const newPosition = Math.min(currentPosition, this.slides.length - 1);
        this.goToSlide(newPosition, false);

        this.isAnimating = false;
    }

    rebuildSlider() {
        this.isAnimating = true;

        const currentPosition = this.currentSlide;

        this.slider.innerHTML = '';

        if (this.sliderType !== 'logo') {
            const originalSlides = Array.from(this.slides).slice(1, -1);
            originalSlides.forEach(slide => {
                this.slider.appendChild(slide.cloneNode(true));
            });
        }

        this.slides = this.container.querySelectorAll('.slide, .repertory-slide, .logo-slide, .image-slide');
        this.setupSlider();

        const newPosition = Math.min(currentPosition, this.slides.length - 1);
        this.goToSlide(newPosition, false);

        this.isAnimating = false;
    }

    destroy() {
        this.stopAutoPlay();
        window.removeEventListener('resize', () => this.handleResize());
    }
}

// Функция для инициализации всех слайдеров на странице
function initializeAllSliders() {
    console.log('Инициализация всех слайдеров...');

    const sliderContainers = document.querySelectorAll(
        '.slider-container, .repertory-slider-container, .logo-slider-container, .image-slider-container'
    );

    sliderContainers.forEach((container, index) => {
        if (!container.hasAttribute('data-slider-initialized')) {
            console.log(`Инициализация слайдера ${index + 1}:`, container.className);
            new UniversalSlider(container);
            container.setAttribute('data-slider-initialized', 'true');
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileNavMenu = document.querySelector('.mobile-nav-menu');

    if (menuToggle && mobileNavMenu) {
        menuToggle.addEventListener('click', function () {
            mobileNavMenu.classList.toggle('active');
        });
    }

    initializeAllSliders();

    window.addEventListener('load', function () {
        setTimeout(initializeAllSliders, 100);
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const nav = document.getElementById('main-nav');
    const scrollOffset = 50; // Отступ в пикселях
    
    function checkScroll() {
        if (window.scrollY > scrollOffset) {
            nav.classList.add('scroll');
        } else {
            nav.classList.remove('scroll');
        }
    }
    
    // Проверяем при загрузке страницы
    checkScroll();
    
    // Проверяем при скролле
    window.addEventListener('scroll', checkScroll);
});
