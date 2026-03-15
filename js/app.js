window.Vault = window.Vault || {};



class VaultApp {

    constructor() {

        this.DEFAULT_ENTRIES = [
            {
                id: window.Vault.storage.createEntryId(),
                title: "This PC",
                username: "your pc name",
                password: "your password or code",
                recoveryMethod: "",
                url: "",
                notes: "This is an example only that you should overwrite.",
                file: null,
                updated: ""
            },
            {
                id: window.Vault.storage.createEntryId(),
                title: "Your email.",
                username: "your email address",
                password: "your email password",
                recoveryMethod: "your recovery method",
                url: "https://github.com",
                notes: "This is an example only that you should overwrite.",
                file: null,
                updated: ""
            }
        ];

        this.state = window.Vault.state;
        this.storage = window.Vault.storage;
        this.icons = window.Vault.icons;
        this.autolock = window.Vault.autolock;
        this.search = window.Vault.search;

        const dialogHost = document.querySelector("vault-dialog-host");
        this.dialog = window.Vault.createDialogService(dialogHost);

        this.reset = new window.Vault.ResetPasswordController({
            dialog: this.dialog,
            icons: this.icons
        });

        this.entriesEl = document.getElementById("entries");
        this.addBtn = document.querySelector("[data-action='add']");
        this.lockBtn = document.getElementById("lock-button");
        this.exportBtn = document.getElementById("export-button");
        this.importBtn = document.getElementById("import-button");
        this.importFileInput = document.getElementById("import-file-input");
        this.searchBtn = document.getElementById("search-button");

        this.unlockView = document.getElementById("unlock");
        this.vaultView = document.getElementById("vault");
        this.masterInput = document.getElementById("master-password");
        this.unlockButton = document.getElementById("unlock-button");
        this.toggleMaster = document.getElementById("toggle-master");

        this.topbarActions = document.getElementById("topbar-actions");
        this.resetPasswordBtn = document.getElementById("reset-password-button");

        this.searchUI = null;
    }

    init() {
        this.searchUI = this.search.init({
            state: this.state,
            icons: this.icons,
            searchBtn: this.searchBtn,
            entriesEl: this.entriesEl,
            render: this.render.bind(this),
            hasUnsavedChanges: this.hasUnsavedChanges.bind(this),
            getOpenEntryId: () => this.state.getOpenEntryId(),
            setOpenEntryId: id => this.state.setOpenEntryId(id)
        });

        this.setupIcons();
        this.bindEvents();
        this.setupAutolock();
        this.start();
        this.registerServiceWorker();
    }

    setupIcons() {
        this.icons.setIcon(this.lockBtn, "lock", "Lock vault");
        this.icons.setIcon(this.addBtn, "add", "Add entry");
        this.icons.setIcon(this.toggleMaster, "eye", "Show password");
        this.icons.setIcon(this.exportBtn, "export", "Export vault");
        this.icons.setIcon(this.importBtn, "import", "Import vault");
        this.icons.setIcon(this.searchBtn, "search", "Search vault");
        this.icons.setIcon(this.resetPasswordBtn, "key", "Reset master password");
    }

    bindEvents() {
        this.unlockButton.addEventListener("click", this.unlockVault.bind(this));
        this.addBtn.addEventListener("click", this.addEntry.bind(this));
        this.lockBtn.addEventListener("click", () => this.lockVault("manual"));
        this.exportBtn.addEventListener("click", this.exportVault.bind(this));
        this.importBtn.addEventListener("click", () => this.importFileInput.click());
        this.importFileInput.addEventListener("change", this.importVault.bind(this));

        this.masterInput.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                e.preventDefault();
                this.unlockVault();
            }
        });

        this.toggleMaster.addEventListener("click", () => {
            const show = this.masterInput.type === "password";
            this.masterInput.type = show ? "text" : "password";
            this.icons.setIcon(
                this.toggleMaster,
                show ? "eyeOff" : "eye",
                show ? "Hide password" : "Show password"
            );
        });

        window.addEventListener("beforeunload", e => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = "";
            }
            this.secureClearVault();
        });

        window.addEventListener("pagehide", this.secureClearVault.bind(this));

        this.resetPasswordBtn.addEventListener("click", () => {
            this.reset.openDialog({
                state: this.state,
                storage: this.storage,
                autolock: this.autolock,
                hasUnsavedChanges: this.hasUnsavedChanges.bind(this)
            });
        });
    }

    setupAutolock() {
        this.autolock.setHandler(async () => {
            await this.lockVault("auto");
        });
    }

    start() {
        this.topbarActions.hidden = true;
        this.storage.vaultExists().then(exists => {
            if (!exists) {
                this.unlockButton.textContent = "Create vault";
            }
        });
    }

    getEntryIndexById(entryId) {
        return this.state.getData().findIndex(e => e.id === entryId);
    }

    async unlockVault() {
        const pass = this.masterInput.value.trim();
        if (!pass) return;

        this.state.setMasterPassword(pass);

        if (!(await this.storage.vaultExists())) {
            this.state.setData(structuredClone(this.DEFAULT_ENTRIES));
            await this.persist();
            this.showVault();
            return;
        }

        try {
            const loaded = await this.storage.loadVault(pass);
            this.state.setData(loaded);
            this.showVault();
        } catch {
            await this.dialog.alert("Wrong password or corrupted vault");
        }
    }

    showVault() {
        this.unlockView.hidden = true;
        this.vaultView.hidden = false;
        this.topbarActions.hidden = false;

        this.masterInput.value = "";
        this.masterInput.type = "password";

        this.icons.setIcon(this.toggleMaster, "eye", "Show password");

        this.render();
        this.autolock.start();
    }

    async lockVault(mode = "manual", silent = false) {
        if (!silent && this.hasUnsavedChanges()) {
            const message =
                mode === "auto"
                    ? "You have unsaved changes.\n\nDiscard them and auto-lock the vault?"
                    : "You have unsaved changes.\n\nDiscard them and lock the vault?";

            const ok = await this.dialog.confirm(message);

            if (!ok) {
                if (mode === "auto") {
                    this.autolock.restart();
                }
                return;
            }
        }

        this.autolock.stop();

        if (this.searchUI && typeof this.searchUI.close === "function") {
            this.searchUI.close();
        }

        this.secureClearVault();
        this.vaultView.hidden = true;
        this.unlockView.hidden = false;
        this.topbarActions.hidden = true;
        this.masterInput.value = "";
        this.masterInput.type = "password";
        this.icons.setIcon(this.toggleMaster, "eye", "Show password");
        this.masterInput.focus();
    }

    render() {
        this.entriesEl.innerHTML = "";

        const entries = [...this.state.getData()].sort((a, b) => {
            const ta = (a.title || "").toLowerCase();
            const tb = (b.title || "").toLowerCase();
            return ta.localeCompare(tb);
        });

        entries.forEach(entry => {

            const entryEl = document.createElement("vault-entry");

            entryEl.entry = entry;
            entryEl.open = this.state.getOpenEntryId() === entry.id;

            entryEl.addEventListener("vault-toggle", () => {
                const open = this.state.getOpenEntryId() === entry.id ? null : entry.id;
                this.state.setOpenEntryId(open);
                this.render();
            });

            entryEl.addEventListener("vault-save", async () => {
                await this.saveEntry(entry.id, entryEl);
            });

            entryEl.addEventListener("vault-delete", async () => {
                await this.deleteEntry(entry.id, entryEl);
            });

            this.entriesEl.append(entryEl);
        });
    }

    async persist() {
        await this.storage.saveVault(
            this.state.getData(),
            this.state.getMasterPassword()
        );
    }

    async saveEntry(entryId, entryEl) {

        const index = this.getEntryIndexById(entryId);
        if (index === -1) return;

        const value = entryEl.getValue();
        const current = this.state.getData();
        const entry = current[index];

        const existingFiles = current
            .filter(e => e.file && e.id !== entryId)
            .map(e => ({ name: e.file.name, size: e.file.size }));

        if (entry.file) {

            const duplicate = existingFiles.find(
                f => f.name === entry.file.name && f.size === entry.file.size
            );

            if (duplicate) {

                const ok = confirm(
                    "A file with the same name and size already exists in another entry.\n\n" +
                    "This will duplicate the file inside the vault and increase its size.\n\n" +
                    "Attach anyway?"
                );

                if (!ok) return;
            }
        }

        const updatedEntry = {
            ...entry,                 // preserves file object
            ...value,
            updated: this.today()
        };

        const nextData = [...current];
        nextData[index] = updatedEntry;

        this.state.setData(nextData);

        await this.persist();

        this.render();
        this.autolock.restart();
    }

    addEntry() {

        const entry = {
            id: this.storage.createEntryId(),
            title: "",
            username: "",
            password: "",
            recoveryMethod: "",
            url: "",
            notes: "",
            file: null,
            updated: ""
        };

        const nextData = [...this.state.getData(), entry];

        this.state.setData(nextData);
        this.state.setOpenEntryId(entry.id);

        this.render();

        requestAnimationFrame(() => {

            const el = this.entriesEl.querySelector(
                `[data-entry-id="${entry.id}"]`
            );

            if (el) {
                el.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }

        });

        this.autolock.restart();
    }

    async deleteEntry(entryId, entryEl) {
        const index = this.getEntryIndexById(entryId);
        if (index === -1) return;

        const value = entryEl.getValue();
        const hasPassword = (value.password || "").trim() !== "";

        if (hasPassword) {
            const ok = await this.dialog.confirm(
                "This entry contains a password.\n\nDelete it permanently?\n\nThis cannot be undone."
            );

            if (!ok) return;
        }

        const nextData = [...this.state.getData()];
        nextData.splice(index, 1);
        this.state.setData(nextData);

        if (this.state.getOpenEntryId() === entryId) {
            this.state.setOpenEntryId(null);
        }

        await this.persist();
        this.render();
        this.autolock.restart();
    }

    hasUnsavedChanges() {
        const entryEl = this.entriesEl.querySelector("vault-entry[open]");
        if (!entryEl) return false;
        return entryEl.isDirty();
    }

    secureClearVault() {
        const data = this.state.getData();

        if (Array.isArray(data)) {
            for (const entry of data) {
                for (const key in entry) {
                    entry[key] = "";
                }
            }
        }

        this.state.resetState();
        this.entriesEl.innerHTML = "";
    }

    today() {
        const d = new Date();
        return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
    }

    async exportVault() {
        const blob = await this.storage.exportVaultBlob();

        if (!blob) {
            await this.dialog.alert("Nothing to export.");
            return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "vault-backup.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    async importVault(event) {
        const file = event.target.files[0];
        event.target.value = "";

        if (!file) return;

        try {
            const text = await file.text();
            await this.storage.importVaultString(text);
            await this.dialog.alert("Vault imported. Unlock it with the correct password.");
            location.reload();
        } catch {
            await this.dialog.alert("Invalid vault file.");
        }
    }

    registerServiceWorker() {

        if (location.protocol === "file:") return;
        if (!("serviceWorker" in navigator)) return;

        window.addEventListener("load", async () => {

            try {

                await navigator.serviceWorker.register(
                    "/vault/sw.js",
                    { scope: "/vault/" }
                );

                console.log("Service worker registered");

            } catch (err) {

                console.error("Service worker failed", err);
            }
        });
    }
}

window.Vault.VaultApp = VaultApp;
window.Vault.app = new VaultApp();
window.Vault.app.init();