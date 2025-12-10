document.addEventListener("DOMContentLoaded", () => {
    const elements = document.querySelectorAll(".reveal");

    const appearOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
            } else {
                entry.target.classList.remove("active");
            }
        });
    }, appearOptions);

    elements.forEach(el => {
        appearOnScroll.observe(el);
    });
});
