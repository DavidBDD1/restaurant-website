const filterBtns = document.querySelectorAll('.filter-btn');
const sections = document.querySelectorAll('.menu-section');

filterBtns.forEach(btn => {
  btn.addEventListener('click', function () {
    filterBtns.forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    const filter = this.getAttribute('data-filter');
    sections.forEach(section => {
      if (filter === 'all' || section.getAttribute('data-category') === filter) {
        section.style.display = 'block';
      } else {
        section.style.display = 'none';
      }
    });
  });
});

// Animationen
const animateElements = document.querySelectorAll('.animate');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });
animateElements.forEach(el => observer.observe(el));