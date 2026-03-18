const rawData = window.WAKFUDEX_DATA;

const archetypeColors = {
  "sans archetype": "#7de1d1",
  altruiste: "#f4ca74",
  defensif: "#83b7ff",
  offensif: "#ee8e63",
};

const portraitFiles = {
  "piou rouge": "./assets/portraits/piou rouge.png",
  moogrr: "./assets/portraits/moogr.png",
  kaskargo: "./assets/portraits/kaskargo.png",
  corbac: "./assets/portraits/korbac.png",
  "chafer elite": "./assets/portraits/chafer \u00e9lite.png",
  "chuchoteur porte-etendard": "./assets/portraits/chuchoteur porte-etandard.png",
  "gros smare": "./assets/portraits/gros smare.png",
  patapattes: "./assets/portraits/patapattes.png",
  boufette: "./assets/portraits/boufette.png",
  muloune: "./assets/portraits/muloune.png",
  "tiwallieuw wabbit": "./assets/portraits/tiwallieuw wabbit.png",
  pheromane: "./assets/portraits/ph\u00e9romane.png",
  pinsulaire: "./assets/portraits/pinsulaire.png",
  "chimere veilleuse": "./assets/portraits/chim\u00e8re veilleuse.png",
  "craqueleur ancestral": "./assets/portraits/craqueleur ancestral.png",
  grokoko: "./assets/portraits/grokoko.png",
  "mulmouth enrage": "./assets/portraits/mulmouth enrag\u00e9.png",
  "abraknyde ancestral": "./assets/portraits/abraknyde ancestral.png",
  lairdavan: "./assets/portraits/lairdavan.png",
  rhinoceroc: "./assets/portraits/rhinoc\u00e9roc.png",
  tofu: "./assets/portraits/tofu.png",
  arakne: "./assets/portraits/arakne.png",
  "long brick": "./assets/portraits/long brick.png",
  zespadon: "./assets/portraits/zespadon.png",
  cepolourpode: "./assets/portraits/c\u00eapolourpode.png",
  sramva: "./assets/portraits/sramva.png",
  gerbouille: "./assets/portraits/gerbouille.png",
  "dragoeuf guerrier": "./assets/portraits/dragoeuf guerrier.png",
  gentibourg: "./assets/portraits/gentibourg.png",
  loupin: "./assets/portraits/loupin.png",
  ceevroaint: "./assets/portraits/ceEvroaint.png",
  inanite: "./assets/portraits/inanite.png",
};

const data = rawData;
const invocations = data.invocations.map((invocation) => ({
  ...invocation,
  levelMin: getLevelBounds(invocation.level).min,
  levelMax: getLevelBounds(invocation.level).max,
}));

const state = {
  filtered: [...invocations],
  selectedName: invocations[0]?.name ?? "",
};

const elements = {
  search: document.querySelector("#search-input"),
  archetype: document.querySelector("#archetype-filter"),
  level: document.querySelector("#level-filter"),
  sort: document.querySelector("#sort-filter"),
  reset: document.querySelector("#reset-filters"),
  count: document.querySelector("#results-count"),
  title: document.querySelector("#results-title"),
  list: document.querySelector("#entry-list"),
  entryTemplate: document.querySelector("#entry-template"),
  selectedName: document.querySelector("#selected-name"),
  selectedArchetype: document.querySelector("#selected-archetype"),
  selectedLevel: document.querySelector("#selected-level"),
  selectedLocation: document.querySelector("#selected-location"),
  selectedPortrait: document.querySelector("#selected-portrait"),
  selectedPortraitFallback: document.querySelector("#selected-portrait-fallback"),
  selectedPortraitFrame: document.querySelector(".screen__portrait-frame"),
  selectedIndex: document.querySelector("#selected-index"),
  selectedSpells: document.querySelector("#selected-spells"),
  selectedNotes: document.querySelector("#selected-notes"),
};

boot();

function boot() {
  renderArchetypeOptions();

  elements.search.addEventListener("input", applyFilters);
  elements.archetype.addEventListener("change", applyFilters);
  elements.level.addEventListener("change", applyFilters);
  elements.sort.addEventListener("change", applyFilters);
  elements.reset.addEventListener("click", resetFilters);

  applyFilters();
}

function getLevelBounds(level) {
  const numbers = level.match(/\d+/g)?.map(Number) ?? [0];
  return {
    min: numbers[0],
    max: numbers[numbers.length - 1],
  };
}

function renderArchetypeOptions() {
  const archetypes = ["all", ...new Set(invocations.map((invocation) => invocation.archetype))];
  elements.archetype.innerHTML = archetypes
    .map((archetype) => {
      const label = archetype === "all" ? "Tous les arch\u00e9types" : escapeHtml(archetype);
      return `<option value="${escapeAttribute(archetype)}">${label}</option>`;
    })
    .join("");
}

function resetFilters() {
  elements.search.value = "";
  elements.archetype.value = "all";
  elements.level.value = "all";
  elements.sort.value = "level-asc";
  applyFilters();
}

function applyFilters() {
  const query = normalize(elements.search.value);
  const selectedArchetype = elements.archetype.value;
  const selectedLevel = elements.level.value;
  const selectedSort = elements.sort.value;

  state.filtered = invocations
    .filter((invocation) => matchesSearch(invocation, query))
    .filter((invocation) => selectedArchetype === "all" || invocation.archetype === selectedArchetype)
    .filter((invocation) => matchesLevel(invocation, selectedLevel))
    .sort((left, right) => sortInvocations(left, right, selectedSort));

  if (!state.filtered.some((invocation) => invocation.name === state.selectedName)) {
    state.selectedName = state.filtered[0]?.name ?? "";
  }

  renderList(selectedArchetype);
  renderSelected();
}

function renderList(selectedArchetype) {
  elements.count.textContent = `${state.filtered.length} r\u00e9sultat${state.filtered.length > 1 ? "s" : ""}`;
  elements.title.textContent =
    selectedArchetype === "all" ? "Toutes les invocations" : `Invocations ${selectedArchetype.toLowerCase()}`;

  if (state.filtered.length === 0) {
    elements.list.innerHTML = `
      <div class="empty-state">
        Aucun r\u00e9sultat pour ces filtres.
      </div>
    `;
    return;
  }

  elements.list.innerHTML = "";
  state.filtered.forEach((invocation) => {
    const fragment = elements.entryTemplate.content.cloneNode(true);
    const button = fragment.querySelector(".entry-button");
    const thumb = fragment.querySelector(".entry-button__thumb");
    const portrait = fragment.querySelector(".entry-button__portrait");
    const fallback = fragment.querySelector(".entry-button__fallback");
    const level = fragment.querySelector(".entry-button__level");
    const name = fragment.querySelector(".entry-button__name");
    const meta = fragment.querySelector(".entry-button__meta");
    const portraitSrc = getPortraitSrc(invocation.name);

    button.dataset.name = invocation.name;
    button.classList.toggle("is-active", invocation.name === state.selectedName);
    button.style.borderColor = `${getArchetypeColor(invocation.archetype)}55`;
    portrait.alt = `Miniature de ${invocation.name}`;
    portrait.hidden = true;
    fallback.textContent = getInitials(invocation.name);
    level.textContent = `Niv. ${invocation.level}`;
    name.textContent = invocation.name;
    meta.textContent = invocation.archetype;

    if (portraitSrc) {
      hydrateSelectedPortrait(portraitSrc, portrait, thumb);
    } else {
      portrait.removeAttribute("src");
    }

    button.addEventListener("click", () => {
      state.selectedName = invocation.name;
      renderList(elements.archetype.value);
      renderSelected();
    });

    elements.list.appendChild(fragment);
  });
}

function renderSelected() {
  const invocation = state.filtered.find((item) => item.name === state.selectedName);

  if (!invocation) {
    elements.selectedName.textContent = "Aucune invocation";
    elements.selectedArchetype.textContent = "";
    elements.selectedLevel.textContent = "";
    elements.selectedLocation.textContent = "Ajuste les filtres pour retrouver une entrée.";
    elements.selectedIndex.textContent = "-- / --";
    elements.selectedSpells.innerHTML = "";
    elements.selectedNotes.innerHTML = "";
    elements.selectedPortrait.removeAttribute("src");
    elements.selectedPortrait.hidden = true;
    elements.selectedPortraitFrame.classList.remove("has-image");
    elements.selectedPortraitFallback.textContent = "--";
    return;
  }

  const position = state.filtered.findIndex((item) => item.name === invocation.name) + 1;
  const portraitSrc = getPortraitSrc(invocation.name);

  elements.selectedName.textContent = invocation.name;
  elements.selectedArchetype.textContent = invocation.archetype;
  elements.selectedArchetype.style.color = getArchetypeColor(invocation.archetype);
  elements.selectedLevel.textContent = `Niv. ${invocation.level}`;
  elements.selectedLocation.textContent = invocation.location;
  elements.selectedIndex.textContent = `${position} / ${state.filtered.length}`;
  elements.selectedPortrait.alt = `Portrait de ${invocation.name}`;
  elements.selectedPortrait.hidden = true;
  elements.selectedPortraitFrame.classList.remove("has-image");
  elements.selectedPortraitFallback.textContent = getInitials(invocation.name);

  if (portraitSrc) {
    hydrateSelectedPortrait(portraitSrc, elements.selectedPortrait, elements.selectedPortraitFrame);
  } else {
    elements.selectedPortrait.removeAttribute("src");
  }

  elements.selectedSpells.innerHTML = invocation.spells
    .map(
      (spell) => `
        <li>
          <strong>${escapeHtml(spell.name)}</strong>
          <p>${escapeHtml(spell.description)}</p>
        </li>
      `,
    )
    .join("");

  elements.selectedNotes.innerHTML = (invocation.notes ?? [])
    .map((note) => `<p>${escapeHtml(note)}</p>`)
    .join("");
}

function hydrateSelectedPortrait(src, image, frame) {
  image.onload = () => {
    image.hidden = false;
    frame.classList.add("has-image");
  };

  image.onerror = () => {
    image.hidden = true;
    frame.classList.remove("has-image");
    image.removeAttribute("src");
  };

  image.src = src;
}

function matchesSearch(invocation, query) {
  if (!query) {
    return true;
  }

  const haystack = normalize([
    invocation.name,
    invocation.location,
    invocation.archetype,
    invocation.level,
    ...invocation.spells.flatMap((spell) => [spell.name, spell.description]),
    ...(invocation.notes ?? []),
  ].join(" "));

  return haystack.includes(query);
}

function matchesLevel(invocation, selectedLevel) {
  if (selectedLevel === "all") {
    return true;
  }

  if (selectedLevel === "201+") {
    return invocation.levelMax >= 201;
  }

  const [min, max] = selectedLevel.split("-").map(Number);
  return invocation.levelMax >= min && invocation.levelMin <= max;
}

function sortInvocations(left, right, mode) {
  if (mode === "level-desc") {
    return right.levelMin - left.levelMin || left.name.localeCompare(right.name, "fr");
  }

  if (mode === "name-asc") {
    return left.name.localeCompare(right.name, "fr");
  }

  return left.levelMin - right.levelMin || left.name.localeCompare(right.name, "fr");
}

function normalize(value) {
  return String(value)
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getArchetypeColor(archetype) {
  return archetypeColors[normalize(archetype)] ?? "#7de1d1";
}

function getPortraitSrc(name) {
  return portraitFiles[normalize(name)] ?? "";
}

function getInitials(value) {
  return value
    .split(/[\s'-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
