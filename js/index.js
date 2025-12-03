document.addEventListener('DOMContentLoaded', function() {
    const scrollingContainer = document.getElementById('scrolling-container');
    const iframes = document.querySelectorAll('.page-iframe');
    const navLinks = document.querySelectorAll('.main-nav a');
    const dots = document.querySelectorAll('.dot');
    const scrollHint = document.querySelector('.scroll-hint');
    
    // Function to update active dot
    function updateActiveDot() {
        const scrollPosition = scrollingContainer.scrollTop;
        const iframeHeight = iframes[0].offsetHeight;
        const currentIndex = Math.round(scrollPosition / iframeHeight);
        
        dots.forEach((dot, index) => {
            if (index === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    // Smooth scroll to iframe
    function scrollToIframe(targetId) {
        const targetIframe = document.getElementById(targetId);
        if (targetIframe) {
            const offset = targetIframe.offsetTop;
            scrollingContainer.scrollTo({
                top: offset,
                behavior: 'smooth'
            });
        }
    }
    
    // Navigation links click handler
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToIframe(targetId);
        });
    });
    
    // Dot navigation click handler
    dots.forEach(dot => {
        dot.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            scrollToIframe(targetId);
        });
    });
    
    // Hide headers in iframes when they load
    iframes.forEach(iframe => {
        iframe.onload = function() {
            try {
                // Inject CSS to remove all scrollbars and headers
                const style = `
                    <style>
                        /* Remove ALL scrollbars */
                        html, body {
                            overflow: hidden !important;
                            height: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        
                        /* Hide headers and footers */
                        header, footer {
                            display: none !important;
                        }
                        
                        /* Make sure content fills the iframe */
                        body > * {
                            margin: 0 !important;
                        }
                        
                        /* Remove any padding/margin that might cause overflow */
                        main, section, div {
                            max-height: 100% !important;
                            overflow: hidden !important;
                        }
                    </style>
                `;
                
                // Try to inject style
                if (iframe.contentDocument && iframe.contentDocument.head) {
                    iframe.contentDocument.head.insertAdjacentHTML('beforeend', style);
                    
                    // Also force the body to have no overflow
                    if (iframe.contentDocument.body) {
                        iframe.contentDocument.body.style.overflow = 'hidden';
                        iframe.contentDocument.body.style.height = '100%';
                    }
                }
            } catch (e) {
                // Cross-origin error, we'll handle it differently
                console.log('Could not modify iframe content (cross-origin)');
            }
        };
    });
    
    // Hide scroll hint on first interaction
    function hideScrollHint() {
        scrollHint.classList.add('hidden');
        // Remove event listeners after hiding
        scrollingContainer.removeEventListener('scroll', hideScrollHint);
        window.removeEventListener('keydown', hideScrollHint);
        window.removeEventListener('wheel', hideScrollHint);
    }
    
    scrollingContainer.addEventListener('scroll', hideScrollHint);
    window.addEventListener('keydown', hideScrollHint);
    window.addEventListener('wheel', hideScrollHint);
    
    // Update active dot on scroll
    scrollingContainer.addEventListener('scroll', updateActiveDot);
    
    // Initialize active dot
    updateActiveDot();
    
    // Keyboard navigation
    window.addEventListener('keydown', function(e) {
        const iframeHeight = iframes[0].offsetHeight;
        const currentScroll = scrollingContainer.scrollTop;
        const maxScroll = scrollingContainer.scrollHeight - scrollingContainer.clientHeight;
        
        if (e.key === 'ArrowDown' || e.key === 'PageDown') {
            e.preventDefault();
            scrollingContainer.scrollBy({
                top: iframeHeight,
                behavior: 'smooth'
            });
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
            e.preventDefault();
            scrollingContainer.scrollBy({
                top: -iframeHeight,
                behavior: 'smooth'
            });
        } else if (e.key === 'Home') {
            e.preventDefault();
            scrollingContainer.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else if (e.key === 'End') {
            e.preventDefault();
            scrollingContainer.scrollTo({
                top: maxScroll,
                behavior: 'smooth'
            });
        }
    });
    
    // Mouse wheel scroll with page snapping
    let isScrolling = false;
    scrollingContainer.addEventListener('wheel', function(e) {
        if (isScrolling) {
            e.preventDefault();
            return;
        }
        
        isScrolling = true;
        
        const iframeHeight = iframes[0].offsetHeight;
        const currentScroll = scrollingContainer.scrollTop;
        const currentIndex = Math.round(currentScroll / iframeHeight);
        
        let targetIndex;
        if (e.deltaY > 0) {
            // Scrolling down
            targetIndex = Math.min(currentIndex + 1, iframes.length - 1);
        } else {
            // Scrolling up
            targetIndex = Math.max(currentIndex - 1, 0);
        }
        
        scrollingContainer.scrollTo({
            top: targetIndex * iframeHeight,
            behavior: 'smooth'
        });
        
        setTimeout(() => {
            isScrolling = false;
        }, 500);
        
        e.preventDefault();
    }, { passive: false });
    
    // Touch/swipe support for mobile
    let touchStartY = 0;
    scrollingContainer.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    scrollingContainer.addEventListener('touchend', function(e) {
        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchStartY - touchEndY;
        
        if (Math.abs(deltaY) > 50) { // Minimum swipe distance
            const iframeHeight = iframes[0].offsetHeight;
            const currentScroll = scrollingContainer.scrollTop;
            const currentIndex = Math.round(currentScroll / iframeHeight);
            
            let targetIndex;
            if (deltaY > 0) {
                // Swiped up
                targetIndex = Math.min(currentIndex + 1, iframes.length - 1);
            } else {
                // Swiped down
                targetIndex = Math.max(currentIndex - 1, 0);
            }
            
            scrollingContainer.scrollTo({
                top: targetIndex * iframeHeight,
                behavior: 'smooth'
            });
        }
    }, { passive: true });
});