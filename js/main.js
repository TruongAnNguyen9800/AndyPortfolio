// js/main.js
document.addEventListener('DOMContentLoaded', function() {
    // Load initial page based on URL hash or default to index
    const initialHash = window.location.hash.substring(1);
    const initialPage = initialHash ? initialHash + '.html' : 'index.html';
    
    loadPage(initialPage);
    
    // Navigation click handler
    document.querySelectorAll('#main-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            loadPage(page);
            // Update URL without reload
            history.pushState(null, null, '#' + page.replace('.html', ''));
        });
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', function() {
        const page = window.location.hash.substring(1) || 'index';
        loadPage(page + '.html');
    });
    
    function loadPage(pageUrl) {
        const container = document.getElementById('content-container');
        if (!container) {
            console.error('content-container not found!');
            return;
        }
        
        container.style.opacity = '0.7';
        
        fetch(pageUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(html => {
                // Extract main content from the page
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const mainContent = doc.querySelector('main');
                
                if (mainContent) {
                    // Remove header from loaded content (we have our own)
                    const header = mainContent.querySelector('header');
                    if (header) header.remove();
                    
                    // Remove footer if exists
                    const footer = mainContent.querySelector('footer');
                    if (footer) footer.remove();
                    
                    container.innerHTML = '';
                    container.appendChild(mainContent);
                    
                    // Reinitialize audio player if needed
                    if (pageUrl === 'audio.html') {
                        // Remove any existing audio script
                        const oldScript = document.querySelector('script[src="js/audio.js"]');
                        if (oldScript) oldScript.remove();
                        
                        // Load audio.js
                        const script = document.createElement('script');
                        script.src = 'js/audio.js';
                        script.onload = function() {
                            console.log('Audio player loaded');
                        };
                        document.body.appendChild(script);
                    }
                    
                    // Scroll to top and fade in
                    window.scrollTo(0, 0);
                    setTimeout(() => {
                        container.style.opacity = '1';
                    }, 100);
                } else {
                    throw new Error('No main content found');
                }
            })
            .catch(error => {
                console.error('Error loading page:', error);
                container.innerHTML = '<div style="padding: 50px; text-align: center;"><p>Error loading content. Please try again.</p></div>';
                container.style.opacity = '1';
            });
    }
    
    // Make loadPage function available globally if needed
    window.loadPage = loadPage;
});