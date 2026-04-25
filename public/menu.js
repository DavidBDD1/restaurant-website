const filterBtns = document.querySelectorAll('.filter-btn');
const sections = document.querySelectorAll('.menu-section');

filterBtns.forEach(btn => {
  btn.addEventListener('click', function () {

    // Aktiven Button setzen
    filterBtns.forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    const filter = this.getAttribute('data-filter');

    sections.forEach(section => {
      if (filter === 'all') {
        section.style.display = 'block';
      } else if (section.getAttribute('data-category') === filter) {
        section.style.display = 'block';
      } else {
        section.style.display = 'none';
      }
    });
  });
});