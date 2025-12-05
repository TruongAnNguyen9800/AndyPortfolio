document.addEventListener('DOMContentLoaded', function() {
    const scrollingContainer = document.getElementById('scrolling-container');
    const iframes = document.querySelectorAll('.page-iframe');
    const navLinks = document.querySelectorAll('.main-nav a');
    const dots = document.querySelectorAll('.dot');
    
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
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToIframe(targetId);
        });
    });

    iframes.forEach(iframe => {
        iframe.onload = function() {
            try {

                const style = `
                    <style>
                        html, body {
                            overflow: hidden !important;
                            height: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        
                        header, footer {
                            display: none !important;
                        }
                        
                        body > * {
                            margin: 0 !important;
                        }
                        
                        main, section, div {
                            max-height: 100% !important;
                            overflow: hidden !important;
                        }
                    </style>
                `;
                
                if (iframe.contentDocument && iframe.contentDocument.head) {
                    iframe.contentDocument.head.insertAdjacentHTML('beforeend', style);
                    
                    if (iframe.contentDocument.body) {
                        iframe.contentDocument.body.style.overflow = 'hidden';
                        iframe.contentDocument.body.style.height = '100%';
                    }
                }
            } catch (e) {
                console.log('Could not modify iframe content (cross-origin)');
            }
        };
    });
    
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
            targetIndex = Math.min(currentIndex + 1, iframes.length - 1);
        } else {
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
    
    let touchStartY = 0;
    scrollingContainer.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    scrollingContainer.addEventListener('touchend', function(e) {
        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchStartY - touchEndY;
        
        if (Math.abs(deltaY) > 50) {
            const iframeHeight = iframes[0].offsetHeight;
            const currentScroll = scrollingContainer.scrollTop;
            const currentIndex = Math.round(currentScroll / iframeHeight);
            
            let targetIndex;
            if (deltaY > 0) {
                targetIndex = Math.min(currentIndex + 1, iframes.length - 1);
            } else {
                targetIndex = Math.max(currentIndex - 1, 0);
            }
            
            scrollingContainer.scrollTo({
                top: targetIndex * iframeHeight,
                behavior: 'smooth'
            });
        }
    }, { passive: true });
});