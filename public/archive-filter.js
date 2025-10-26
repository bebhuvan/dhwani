// Archive page filtering functionality
(function() {
  // Client-side filtering
  const searchInput = document.getElementById('search-input');
  const authorFilter = document.getElementById('author-filter');
  const languageFilter = document.getElementById('language-filter');
  const genreFilter = document.getElementById('genre-filter');
  const yearFilter = document.getElementById('year-filter');
  const workItems = Array.from(document.querySelectorAll('.work-item'));
  const currentPageItems = Array.from(document.querySelectorAll('.work-item-page'));
  const worksList = document.getElementById('works-list');
  const filteredContainer = document.getElementById('filtered-works-container');
  const showingCount = document.getElementById('showing-count');
  const pagination = document.querySelector('nav[aria-label="Archive pagination"]');

  let allWorksData = null; // Will be loaded on first filter
  let isLoadingData = false;
  let searchTimeout = null;

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Debounce function for search input
  function debounce(func, wait) {
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(searchTimeout);
        func(...args);
      };
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(later, wait);
    };
  }

  async function loadAllWorksData() {
    if (allWorksData || isLoadingData) return;

    isLoadingData = true;
    try {
      const response = await fetch('/archive-data.json');
      allWorksData = await response.json();
    } catch (error) {
      console.error('Failed to load works data:', error);
      allWorksData = [];
    }
    isLoadingData = false;
  }

  function renderWork(work) {
    const genres = work.genre.slice(0, 2).map(g =>
      `<span class="inline-flex items-center font-medium rounded-sm bg-accent-wash text-accent border border-accent-pale text-[0.75rem] px-2.5 py-1 tracking-[0.02em]">${escapeHtml(g)}</span>`
    ).join('');

    const languages = work.language.map(lang =>
      `<span class="inline-flex items-center font-medium rounded-sm bg-warm-white text-ink-medium border border-line text-[0.75rem] px-2.5 py-1 tracking-[0.02em]">${escapeHtml(lang)}</span>`
    ).join('');

    const year = work.year ?
      `<span class="inline-flex items-center font-medium rounded-sm bg-transparent text-ink-light border border-line-light text-[0.75rem] px-2.5 py-1 tracking-[0.02em]">${escapeHtml(String(work.year))}</span>` : '';

    return `
      <a href="/works/${escapeHtml(work.slug)}" class="work-item-filtered group block py-10 md:py-12 lg:py-14 border-b border-line first:pt-0 transition-all duration-300 px-6 -mx-6 hover:px-8 hover:border-l-2 hover:border-l-ink">
        <div class="mb-5 md:mb-6">
          <h2 class="font-serif text-[1.65rem] md:text-[2.25rem] lg:text-[2.5rem] font-normal leading-[1.2] tracking-tight text-ink mb-2 md:mb-3 transition-all duration-300 group-hover:tracking-[-0.01em]">
            ${escapeHtml(work.title)}
          </h2>
          <div class="text-base md:text-lg text-ink-medium font-normal transition-colors duration-300 group-hover:text-ink">
            ${escapeHtml(work.author.join(', '))}
          </div>
        </div>
        <p class="font-serif-body text-[0.95rem] md:text-[1.05rem] leading-[1.7] text-ink-light font-normal mb-5 md:mb-6 max-w-[48rem] line-clamp-3 transition-colors duration-300 group-hover:text-ink-medium">
          ${escapeHtml(work.description)}
        </p>
        <div class="flex flex-wrap gap-2 opacity-80 transition-opacity duration-300 group-hover:opacity-100">
          ${languages}
          ${year}
          ${genres}
        </div>
      </a>
    `;
  }

  // Calculate relevance score for search results
  function calculateRelevance(work, searchTerm) {
    if (!searchTerm) return 0;

    const title = work.title.toLowerCase();
    const author = work.authorNormalized.join(' ').toLowerCase();
    const description = work.description.toLowerCase();

    let score = 0;

    // Title exact match (highest priority)
    if (title === searchTerm) score += 100;
    // Title starts with search term
    else if (title.startsWith(searchTerm)) score += 50;
    // Title contains search term
    else if (title.includes(searchTerm)) score += 25;

    // Author exact match
    if (author === searchTerm) score += 75;
    // Author starts with search term
    else if (author.startsWith(searchTerm)) score += 40;
    // Author contains search term
    else if (author.includes(searchTerm)) score += 20;

    // Description contains search term (lower priority)
    if (description.includes(searchTerm)) score += 5;

    // Boost recent works slightly
    if (work.year && work.year > 1900) score += 1;

    return score;
  }

  async function filterWorks() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedAuthor = authorFilter.value.toLowerCase().trim();
    const selectedLanguage = languageFilter.value.toLowerCase().trim();
    const selectedGenre = genreFilter.value.toLowerCase().trim();
    const selectedYearRange = yearFilter.value;

    const isFiltering = searchTerm || selectedAuthor || selectedLanguage || selectedGenre || selectedYearRange;

    if (isFiltering) {
      // Show loading state
      if (filteredContainer) {
        filteredContainer.innerHTML = '<div class="py-20 text-center text-ink-light">Loading...</div>';
        filteredContainer.classList.remove('hidden');
        worksList.classList.add('hidden');
      }

      // Load all works data if not already loaded
      await loadAllWorksData();

      // Check if data loaded successfully
      if (!allWorksData || allWorksData.length === 0) {
        filteredContainer.innerHTML = '<div class="py-20 text-center text-ink-light">Unable to load works data. Please try again.</div>';
        return;
      }

      // Filter and score all works
      const filteredWithScores = allWorksData
        .map(work => {
          const title = work.title.toLowerCase();
          const author = work.authorNormalized.join(' ').toLowerCase();
          const description = work.description.toLowerCase();
          const language = work.language.join(' ').toLowerCase();
          const genre = work.genre.join(' ').toLowerCase();

          const matchesSearch = !searchTerm ||
            title.includes(searchTerm) ||
            author.includes(searchTerm) ||
            description.includes(searchTerm);

          const matchesAuthor = !selectedAuthor || author.includes(selectedAuthor);
          const matchesLanguage = !selectedLanguage || language.includes(selectedLanguage);
          const matchesGenre = !selectedGenre || genre.includes(selectedGenre);

          let matchesYear = true;
          if (selectedYearRange && work.year) {
            const [minYear, maxYear] = selectedYearRange.split('-').map(Number);
            matchesYear = work.year >= minYear && work.year <= maxYear;
          }

          const matches = matchesSearch && matchesAuthor && matchesLanguage && matchesGenre && matchesYear;

          return {
            work,
            matches,
            relevance: matches ? calculateRelevance(work, searchTerm) : 0
          };
        })
        .filter(item => item.matches)
        .sort((a, b) => b.relevance - a.relevance) // Sort by relevance (highest first)
        .map(item => item.work);

      // Hide paginated list, show filtered results
      worksList.classList.add('hidden');
      filteredContainer.classList.remove('hidden');

      if (filteredWithScores.length === 0) {
        filteredContainer.innerHTML = '<div class="py-20 text-center text-ink-light">No works found matching your filters.</div>';
      } else {
        filteredContainer.innerHTML = filteredWithScores.map(renderWork).join('');
      }

      if (showingCount) {
        showingCount.textContent = filteredWithScores.length.toString();
      }

      if (pagination) {
        pagination.classList.add('hidden');
      }
    } else {
      // Show paginated list, hide filtered results
      worksList.classList.remove('hidden');
      filteredContainer.classList.add('hidden');
      filteredContainer.innerHTML = '';

      const currentPageCount = currentPageItems.length;
      if (showingCount) {
        showingCount.textContent = currentPageCount.toString();
      }

      if (pagination) {
        pagination.classList.remove('hidden');
      }
    }
  }

  // Debounce search input (300ms delay) to avoid excessive filtering
  const debouncedFilter = debounce(filterWorks, 300);

  searchInput?.addEventListener('input', debouncedFilter);
  authorFilter?.addEventListener('change', filterWorks);
  languageFilter?.addEventListener('change', filterWorks);
  genreFilter?.addEventListener('change', filterWorks);
  yearFilter?.addEventListener('change', filterWorks);

  // Run initial filter to ensure correct display on page load
  filterWorks();
})();
