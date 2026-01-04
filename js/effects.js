/* Reveal Effect */

let revealObserver;

function initReveal() {
  if (revealObserver) revealObserver.disconnect();

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
      } else {
        entry.target.classList.remove("active");
      }
    });
  }, {
    threshold: 0.1
  });

  document.querySelectorAll(".reveal").forEach(el => {
    el.classList.remove("active");
    revealObserver.observe(el);
  });
}

document.addEventListener("DOMContentLoaded", initReveal);

