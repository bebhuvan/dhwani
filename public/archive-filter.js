// Archive page filtering functionality
(function() {
  // Client-side filtering
  const searchInput = document.getElementById('search-input');
  const authorFilter = document.getElementById('author-filter');
  const languageFilter = document.getElementById('language-filter');
  const genreFilter = document.getElementById('genre-filter');
  const yearFilter = document.getElementById('year-filter');
  const workItems = Array.from(document.querySelectorAll('.work-item'));
  const showingCount = document.getElementById('showing-count');

  function filterWorks() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedAuthor = authorFilter.value.toLowerCase();
    const selectedLanguage = languageFilter.value.toLowerCase();
    const selectedGenre = genreFilter.value.toLowerCase();
    const selectedYearRange = yearFilter.value;

    let visibleCount = 0;

    workItems.forEach(item => {
      const title = item.dataset.title || '';
      const author = item.dataset.author || '';
      const description = item.dataset.description || '';
      const language = item.dataset.language || '';
      const genre = item.dataset.genre || '';
      const year = item.dataset.year || '';

      const matchesSearch = !searchTerm ||
        title.includes(searchTerm) ||
        author.includes(searchTerm) ||
        description.includes(searchTerm);

      // Extract just the name part from author (remove dates/numbers)
      const cleanSelectedAuthor = selectedAuthor.replace(/^\d{4}-\d{4}\s+/, '').toLowerCase();
      const matchesAuthor = !selectedAuthor || author.includes(cleanSelectedAuthor);
      const matchesLanguage = !selectedLanguage || language.includes(selectedLanguage);
      const matchesGenre = !selectedGenre || genre.includes(selectedGenre);

      let matchesYear = true;
      if (selectedYearRange && year) {
        const [minYear, maxYear] = selectedYearRange.split('-').map(Number);
        const workYear = Number(year);
        matchesYear = workYear >= minYear && workYear <= maxYear;
      }

      const isVisible = matchesSearch && matchesAuthor && matchesLanguage && matchesGenre && matchesYear;

      // Use class-based approach instead of inline style
      if (isVisible) {
        item.classList.remove('hidden');
        visibleCount++;
      } else {
        item.classList.add('hidden');
      }
    });

    if (showingCount) {
      showingCount.textContent = visibleCount.toString();
    }
  }

  searchInput?.addEventListener('input', filterWorks);
  authorFilter?.addEventListener('change', filterWorks);
  languageFilter?.addEventListener('change', filterWorks);
  genreFilter?.addEventListener('change', filterWorks);
  yearFilter?.addEventListener('change', filterWorks);
})();
