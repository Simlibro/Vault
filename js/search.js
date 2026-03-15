window.Vault = window.Vault || {};

class SearchController {
  constructor({ state, icons, searchBtn, entriesEl, render, hasUnsavedChanges, getOpenEntryId, setOpenEntryId } = {}) {
    this.state = state;
    this.icons = icons;
    this.searchBtn = searchBtn;
    this.entriesEl = entriesEl;
    this.render = render;
    this.hasUnsavedChanges = hasUnsavedChanges;
    this.getOpenEntryId = getOpenEntryId;
    this.setOpenEntryId = setOpenEntryId;

    this.ids = [];
    this.index = -1;

    this.tray = document.createElement("div");
    this.tray.className = "search-tray";
    this.tray.hidden = true;

    this.input = document.createElement("input");
    this.input.type = "text";
    this.input.placeholder = "Search";

    this.prevBtn = this.icons.createIconButton("left", "Previous result");
    this.nextBtn = this.icons.createIconButton("right", "Next result");
    this.closeBtn = this.icons.createIconButton("close", "Close search");

    this.count = document.createElement("span");
    this.count.className = "search-count";

    this.tray.append(this.input, this.prevBtn, this.count, this.nextBtn, this.closeBtn);
    document.body.append(this.tray);

    this.handleEscape = this.handleEscape.bind(this);

    this.bindEvents();
    this.setNavVisible(false);
  }

  bindEvents() {
    this.searchBtn.addEventListener("click", () => {
      this.tray.hidden = !this.tray.hidden;

      if (this.tray.hidden) {
        this.close();
        return;
      }

      this.input.focus();

      if (this.input.value.trim()) {
        this.run(this.input.value);
      }
    });

    this.input.addEventListener("input", () => {
      this.run(this.input.value);
    });

    this.prevBtn.addEventListener("click", () => this.cycle(-1));
    this.nextBtn.addEventListener("click", () => this.cycle(1));
    this.closeBtn.addEventListener("click", () => this.close());

    window.addEventListener("keydown", this.handleEscape);
  }

  handleEscape(event) {
    if (event.key === "Escape" && !this.tray.hidden) {
      this.close();
    }
  }

  run(term) {
    const needle = term.toLowerCase().trim();
    this.ids = [];
    this.index = -1;

    if (needle.length < 3) {
      this.count.textContent = "";
      this.clearMarks();
      this.setNavVisible(false);
      return;
    }

    for (const entry of this.state.getData()) {
      const text = [
        entry.title,
        entry.username,
        entry.password,
        entry.recoveryMethod,
        entry.url,
        entry.notes
      ]
        .map(value => value || "")
        .join(" ")
        .toLowerCase();

      if (text.includes(needle)) {
        this.ids.push(entry.id);
      }
    }

    if (this.ids.length) {
      this.setNavVisible(this.ids.length > 1);
      this.cycle(1);
    } else {
      this.count.textContent = "0";
      this.clearMarks();
      this.setNavVisible(false);
    }
  }

  cycle(dir) {
    if (!this.ids.length) return;

    const nextIndex = (this.index + dir + this.ids.length) % this.ids.length;
    const nextId = this.ids[nextIndex];
    const openId = this.getOpenEntryId();

    if (openId !== nextId) {
      if (openId !== null && this.hasUnsavedChanges()) {
        const ok = window.confirm(
          "You have unsaved changes.\n\nDiscard them and open another entry?"
        );
        if (!ok) return;
      }

      this.setOpenEntryId(nextId);
      this.render();
    }

    this.index = nextIndex;
    this.count.textContent = `${this.index + 1}/${this.ids.length}`;

    requestAnimationFrame(() => {
      const article = this.entriesEl.querySelector(`.entry[data-entry-id="${nextId}"]`);
      if (!article) return;

      article.scrollIntoView({
        block: "center",
        behavior: "smooth"
      });

      this.markMatch(article, this.input.value);
      this.input.focus();
    });
  }

  markMatch(article, term) {
    this.clearMarks();

    const needle = (term || "").toLowerCase().trim();
    if (!needle) return;

    const fields = article.querySelectorAll("input, textarea");

    for (const field of fields) {
      const value = (field.value || "").toLowerCase();
      if (!value.includes(needle)) continue;

      field.classList.add("search-hit");

      const row = field.closest(".field") || field.parentElement;
      if (row) row.classList.add("search-hit-row");

      article.classList.add("search-hit-entry");
      return;
    }
  }

  clearMarks() {
    document.querySelectorAll(".search-hit").forEach(el => el.classList.remove("search-hit"));
    document.querySelectorAll(".search-hit-row").forEach(el => el.classList.remove("search-hit-row"));
    document.querySelectorAll(".search-hit-entry").forEach(el => el.classList.remove("search-hit-entry"));
  }

  setNavVisible(show) {
    this.prevBtn.hidden = !show;
    this.nextBtn.hidden = !show;
  }

  close() {
    this.tray.hidden = true;
    this.ids = [];
    this.index = -1;
    this.input.value = "";
    this.count.textContent = "";
    this.clearMarks();
    this.setNavVisible(false);
  }
}

window.Vault.SearchController = SearchController;

window.Vault.search = {
  init(opts) {
    return new SearchController(opts);
  }
};