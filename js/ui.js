window.Vault = window.Vault || {};

window.Vault.ui = (() => {
  function renderEntries({
    entriesEl,
    data,
    openEntryId,
    onToggleEntry,
    onSaveEntry,
    onDeleteEntry
  }) {
    entriesEl.innerHTML = "";

    data.forEach(entry => {
      const entryEl = document.createElement("vault-entry");
      entryEl.entry = entry;
      entryEl.open = openEntryId === entry.id;

      entryEl.addEventListener("vault-toggle", () => {
        onToggleEntry(entry.id);
      });

      entryEl.addEventListener("vault-save", () => {
        onSaveEntry(entry.id, entryEl);
      });

      entryEl.addEventListener("vault-delete", async () => {
        await onDeleteEntry(entry.id, entryEl);
      });

      entriesEl.append(entryEl);
    });
  }

  function getEntryFields(entryEl) {
    return entryEl.getFields();
  }

  return {
    renderEntries,
    getEntryFields
  };
})();