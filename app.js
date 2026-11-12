const genres = [
  "Isekai", "Sci-fi", "Slice of life", "Rom com", "Harem",
  "Battle", "Psychological", "Horror", "Sports"
];

const imageIds = [
  "photo-1578632767115-351597cf2477",
  "photo-1519608487953-e999c86e7455",
  "photo-1518709268805-4e9042af9f23",
  "photo-1534447677768-be436bb09401"
];
const imageFor = index =>
  `https://images.unsplash.com/${imageIds[index % imageIds.length]}?auto=format&fit=crop&w=600&q=80`;

const saved = localStorage.getItem("ANIMEBASKET-anime");
let anime = saved ? JSON.parse(saved) :[];

let currentGenre = "All";

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

function save() {
  localStorage.setItem("ANIMEBASKET-anime", JSON.stringify(anime));
  render();
}

function render() {
  const watched = anime.filter(item => item.watched);

  document.querySelector("#animeCount").textContent = watched.length;
  document.querySelector("#episodeCount").textContent =
    watched.reduce((sum, item) => sum + Number(item.episodes || 0), 0).toLocaleString();

  document.querySelector("#filters").innerHTML = ["All", ...genres].map(genre => `
    <button class="filter-button ${currentGenre === genre ? "active" : ""}"
      data-filter="${escapeHtml(genre)}">${escapeHtml(genre)}</button>
  `).join("");

  const query = document.querySelector("#searchInput").value.trim().toLowerCase();
  let visible = watched.filter(item =>
    (currentGenre === "All" || item.genre === currentGenre) &&
    (!query || item.title.toLowerCase().includes(query))
  );

  const sort = document.querySelector("#sortSelect").value;
  if (sort === "az") visible.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "rating") visible.sort((a, b) => b.rating - a.rating);
  if (sort === "recent") visible.sort((a, b) => b.addedAt - a.addedAt);

  const groups = currentGenre === "All"
    ? genres.filter(genre => visible.some(item => item.genre === genre))
    : [currentGenre];

  document.querySelector("#shelves").innerHTML = groups.map(genre => {
    const items = visible.filter(item => item.genre === genre);
    return `
      <section class="shelf">
        <div class="shelf-heading">
          <h2>${escapeHtml(genre)}</h2><span class="count">· ${items.length}</span>
          <button class="view-all" data-filter="${escapeHtml(genre)}">View all ›</button>
        </div>
        <div class="anime-row">${items.map(item => `
          <article class="anime-card" data-open="${item.id}">
            <div class="poster">
              <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">
              <span class="watched-badge">✓ Watched</span>
            </div>
            <div class="anime-title">${escapeHtml(item.title)}</div>
          </article>
        `).join("")}</div>
      </section>`;
  }).join("") || `<p class="count">No anime found. Add one you’ve watched to get started.</p>`;

  renderGenres();
  renderStats();
}

function renderGenres() {
  document.querySelector("#genreGrid").innerHTML = genres.map((genre, index) => {
    const count = anime.filter(item => item.watched && item.genre === genre).length;
    return `
      <article class="genre-card" data-filter="${escapeHtml(genre)}">
        <img src="${imageFor(index)}" alt="">
        <div class="genre-card-content">
          <span><b>${escapeHtml(genre)}</b><small>Explore this genre</small></span>
          <span><b>${count}</b><small>watched</small></span>
        </div>
      </article>`;
  }).join("");
}

function renderStats() {
  const watched = anime.filter(item => item.watched);
  const episodes = watched.reduce((sum, item) => sum + Number(item.episodes || 0), 0);
  const average = watched.length
    ? (watched.reduce((sum, item) => sum + Number(item.rating || 0), 0) / watched.length).toFixed(1)
    : "0.0";
  const explored = new Set(watched.map(item => item.genre)).size;

  document.querySelector("#statsGrid").innerHTML = [
    ["Anime watched", watched.length],
    ["Episodes completed", episodes],
    ["Genres explored", explored],
    ["Average rating", `${average}/10`]
  ].map(([label, value]) => `
    <div class="stat-card"><span class="count">${label}</span><strong>${value}</strong></div>
  `).join("");
}

function showPage(page) {
  document.querySelector("#libraryPage").hidden = page !== "library";
  document.querySelector("#genresPage").hidden = page !== "genres";
  document.querySelector("#statsPage").hidden = page !== "stats";
  document.querySelector("#detailPage").hidden = true;

  document.querySelectorAll(".nav-button").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });
}

function openDetail(item) {
  document.querySelector("#libraryPage").hidden = true;
  document.querySelector("#genresPage").hidden = true;
  document.querySelector("#statsPage").hidden = true;
  document.querySelector("#detailPage").hidden = false;

  document.querySelector("#detailContent").innerHTML = `
    <article class="detail-card">
      <img class="detail-poster" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">
      <div>
        <h1>${escapeHtml(item.title)}</h1>
        <p><span class="tag">${escapeHtml(item.genre)}</span>
          <span class="tag">${item.episodes} episodes</span></p>
        <p class="detail-description">A story worth remembering. Keep your watch status and personal notes here.</p>
        <button class="status-button" id="toggleWatched">
          ${item.watched ? "✓ Watched" : "＋ Mark as watched"}
        </button>
        <span class="rating">　★ ${item.rating || "Unrated"}/10</span>
        <div class="notes">
          <b>Notes</b>
          <textarea id="animeNotes" placeholder="Add a note about this anime…">${escapeHtml(item.notes)}</textarea>
        </div>
      </div>
    </article>`;

  document.querySelector("#toggleWatched").onclick = () => {
    item.watched = !item.watched;
    save();
    openDetail(item);
  };
  document.querySelector("#animeNotes").oninput = event => {
    item.notes = event.target.value;
    localStorage.setItem("ANIMEBASKET-anime", JSON.stringify(anime));
  };
}

document.addEventListener("click", event => {
  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) {
    currentGenre = filterButton.dataset.filter;
    showPage("library");
    render();
    return;
  }

  const navButton = event.target.closest("[data-page]");
  if (navButton) {
    showPage(navButton.dataset.page);
    return;
  }

  const animeCard = event.target.closest("[data-open]");
  if (animeCard) {
    const item = anime.find(entry => entry.id == animeCard.dataset.open);
    if (item) openDetail(item);
  }
});

document.querySelector("#backButton").onclick = () => showPage("library");
document.querySelector("#sortSelect").onchange = render;
document.querySelector("#searchInput").oninput = render;

document.querySelector("#searchButton").onclick = () => {
  const input = document.querySelector("#searchInput");
  input.hidden = !input.hidden;
  if (!input.hidden) input.focus();
};

document.querySelector("#addAnimeButton").onclick = () => {
  const title = prompt("What anime did you watch?");
  if (!title?.trim()) return;

  const genreInput = prompt(`Choose a genre: ${genres.join(", ")}`, "Isekai") || "Isekai";
  const genre = genres.find(item => item.toLowerCase() === genreInput.trim().toLowerCase()) || "Isekai";
  const episodes = Number.parseInt(prompt("How many episodes?", "12"), 10) || 12;

  anime.unshift({
    id: Date.now(),
    title: title.trim(),
    genre,
    episodes,
    rating: 0,
    image: imageFor(anime.length),
    watched: true,
    notes: "",
    addedAt: Date.now()
  });

  currentGenre = "All";
  save();
};

render();
