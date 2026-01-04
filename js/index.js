document.addEventListener('DOMContentLoaded', function() {
  const scrollingContainer = document.getElementById('scrolling-container');
  const iframes = document.querySelectorAll('.page-iframe');
  const navLinks = document.querySelectorAll('.main-nav a');

  // Reference to music iframe
  const musicIframe = document.getElementById('music');

  // Global mini player elements
  const globalMiniPlayer = document.getElementById('global-mini-player');
  const gmpTitle = document.getElementById('gmp-title');
  const gmpTime = document.getElementById('gmp-time');
  const gBars = document.querySelectorAll('.gbar');
  const gPrevBtn = document.getElementById('gprevBtn');
  const gPlayPauseBtn = document.getElementById('gplayPauseBtn');
  const gNextBtn = document.getElementById('gnextBtn');

  // Dropdown menu elements
  const projectsToggle = document.getElementById('projects-toggle');
  const projectsMenu = document.getElementById('projects-menu');

  function scrollToIframe(targetId) {
    const targetIframe = document.getElementById(targetId);
    if (targetIframe) {
      const offset = targetIframe.offsetTop;
      scrollingContainer.scrollTo({ top: offset, behavior: 'smooth' });
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
          main, section {
            max-height: 100% !important;
            overflow: hidden !important;
          }

          #playlist {
            overflow-y: auto !important;
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
        console.log('Could not modify iframe content');
      }
    };
  });

  window.addEventListener('keydown', function(e) {
    const iframeHeight = iframes[0].offsetHeight;
    const maxScroll = scrollingContainer.scrollHeight - scrollingContainer.clientHeight;

    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      scrollingContainer.scrollBy({ top: iframeHeight, behavior: 'smooth' });
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      scrollingContainer.scrollBy({ top: -iframeHeight, behavior: 'smooth' });
    } else if (e.key === 'Home') {
      e.preventDefault();
      scrollingContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (e.key === 'End') {
      e.preventDefault();
      scrollingContainer.scrollTo({ top: maxScroll, behavior: 'smooth' });
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

    scrollingContainer.scrollTo({ top: targetIndex * iframeHeight, behavior: 'smooth' });

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

      scrollingContainer.scrollTo({ top: targetIndex * iframeHeight, behavior: 'smooth' });
    }
  }, { passive: true });

  //  Global Mini Player Message Handling
  
  window.addEventListener('message', function(event) {
    if (event.source !== musicIframe.contentWindow) return;
    
    const data = event.data;
    if (!data || typeof data !== 'object' || !data.type) return;

    // Show bar and set title on first play
    if (data.type === 'music-now-playing') {
      if (globalMiniPlayer.classList.contains('hidden-mini-player')) {
        globalMiniPlayer.classList.remove('hidden-mini-player');
      }
      gmpTitle.textContent = data.title || '—';
    }

    // Update time display
    if (data.type === 'music-time-update') {
      if (typeof data.textTime === 'string') {
        gmpTime.textContent = data.textTime;
      }
    }

    if (data.type === 'music-frequency-data') {
      if (data.dataArray && data.dataArray.length >= 10) {
        gBars.forEach((bar, i) => {
          let value = data.dataArray[i * 2] || 0;
          let height = (value / 255) * 30 + 5;
          bar.style.height = height + 'px';
        });
      }
    }
  });

  // Send commands to music iframe
  function sendMusicCommand(command) {
    if (!musicIframe || !musicIframe.contentWindow) return;
    musicIframe.contentWindow.postMessage({ type: 'music-command', command }, '*');
  }

  gPrevBtn.addEventListener('click', () => sendMusicCommand('prev'));
  gPlayPauseBtn.addEventListener('click', () => sendMusicCommand('toggle-play'));
  gNextBtn.addEventListener('click', () => sendMusicCommand('next'));
  
  // Dropdown Menu Handling
  
  if (projectsToggle && projectsMenu) {
    projectsToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      projectsMenu.classList.toggle('show');
    });

    document.addEventListener('click', function (e) {
      if (!projectsMenu.contains(e.target) && e.target !== projectsToggle) {
        projectsMenu.classList.remove('show');
      }
    });
  }
});
