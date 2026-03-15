window.Vault = window.Vault || {};

class VaultEntryElement extends HTMLElement {

    constructor() {
        super();
        this._entry = null;
        this._open = false;
    }

    set entry(value) {
        this._entry = value;
        this.render();
    }

    get entry() {
        return this._entry;
    }

    set open(value) {
        this._open = Boolean(value);
        this.render();
    }

    get open() {
        return this._open;
    }

    getFields() {
        const fields = {};
        const inputs = this.querySelectorAll(".editor [data-key]");

        inputs.forEach(input => {
            fields[input.dataset.key] = input;
        });

        return fields;
    }

    buildMeta(entry) {

        const parts = [];

        const username = (entry.username || "").trim();
        const recovery = (entry.recoveryMethod || "").trim();
        const updated = (entry.updated || "").trim();

        if (username) {
            parts.push(username);
        } else if (recovery) {
            parts.push(recovery);
        }

        if (updated) {
            parts.push(updated);
        }

        return parts.join(" · ");
    }

    createField(def, value, showLabel = true) {

        const wrap = document.createElement("label");
        wrap.className = "field";

        if (def.type === "password") {

            const input = document.createElement("input");
            input.type = "password";
            input.value = value || "";
            input.dataset.key = def.key;

            const toggle = window.Vault.icons.createIconButton("eye", "Show password");

            toggle.addEventListener("click", event => {

                event.preventDefault();

                const show = input.type === "password";
                input.type = show ? "text" : "password";

                window.Vault.icons.setIcon(
                    toggle,
                    show ? "eyeOff" : "eye",
                    show ? "Hide password" : "Show password"
                );

            });

            const copy = window.Vault.icons.createIconButton("copy", "Copy password");

            copy.addEventListener("click", async event => {

                event.preventDefault();
                if (!input.value) return;

                try {

                    await navigator.clipboard.writeText(input.value);

                    window.Vault.icons.setIcon(copy, "check", "Copied");

                    setTimeout(() => {
                        window.Vault.icons.setIcon(copy, "copy", "Copy password");
                    }, 900);

                } catch {

                    window.Vault.icons.setIcon(copy, "fail", "Copy failed");

                    setTimeout(() => {
                        window.Vault.icons.setIcon(copy, "copy", "Copy password");
                    }, 900);
                }

            });

            const tools = document.createElement("div");
            tools.className = "field-tools";
            tools.append(toggle, copy);

            if (showLabel) {

                const head = document.createElement("div");
                head.className = "field-head";

                const label = document.createElement("span");
                label.textContent = def.label;

                head.append(label, tools);
                wrap.append(head, input);

            } else {

                const row = document.createElement("div");
                row.className = "field-inline-tools";

                row.append(tools);
                wrap.append(row, input);
            }

            return { key: def.key, wrap, input };
        }

        const input = def.type === "textarea"
            ? document.createElement("textarea")
            : document.createElement("input");

        if (def.type !== "textarea") {
            input.type = "text";
        }

        input.value = value || "";
        input.dataset.key = def.key;

        if (showLabel) {

            const label = document.createElement("span");
            label.textContent = def.label;

            wrap.append(label, input);

        } else {

            wrap.append(input);
        }

        return { key: def.key, wrap, input };
    }

    createOptionalField(def, value = "") {

        const details = document.createElement("details");
        details.className = "optional-field";

        if (value && value.trim() !== "") {
            details.open = true;
        }

        const summary = document.createElement("summary");
        summary.textContent = def.label;

        const field = this.createField(def, value, false);
        field.wrap.classList.add("optional-input-wrap");

        details.append(summary, field.wrap);

        return details;
    }

    createFileField(entry) {

        const details = document.createElement("details");
        details.className = "optional-field";

        if (entry.file) details.open = true;

        const summary = document.createElement("summary");
        summary.textContent = "Attachment";

        const wrap = document.createElement("div");
        wrap.className = "file-field";

        const input = document.createElement("input");
        input.type = "file";
        input.hidden = true;

        const info = document.createElement("div");
        info.className = "file-info";

        if (entry.file) {

            const meta = document.createElement("div");
            meta.className = "file-meta";

            const icon = window.Vault.icons.createFileIcon(entry.file.type);
            icon.classList.add("file-icon");

            const name = document.createElement("span");
            name.textContent =
                entry.file.name + " (" + this.formatFileSize(entry.file.size) + ")";

            meta.append(icon, name);

            const actions = document.createElement("div");
            actions.className = "file-actions";

            const open = window.Vault.icons.createIconButton("open", "Open file");
            open.addEventListener("click", e => {
                e.preventDefault();
                this.openFile(entry.file);
            });

            const download = window.Vault.icons.createIconButton("download", "Download file");
            download.addEventListener("click", e => {
                e.preventDefault();
                this.downloadFile(entry.file);
            });

            const del = window.Vault.icons.createIconButton("delete", "Delete file");
            del.addEventListener("click", e => {
                e.preventDefault();
                this.removeFile(entry);
            });

            actions.append(open, download, del);
            info.append(meta, actions);

        } else {

            const attach = document.createElement("button");
            attach.type = "button";
            attach.textContent = "Attach file";
            attach.className = "attach-file-button";

            attach.addEventListener("click", e => {
                e.preventDefault();
                input.click();
            });

            const hint = document.createElement("div");
            hint.className = "file-drop-hint";
            hint.textContent = "or drag and drop a file here";

            info.append(attach, hint);
        }

        input.addEventListener("change", async () => {
            const file = input.files[0];
            input.value = "";
            await this.attachFile(entry, file);
        });

        wrap.addEventListener("dragover", e => {
            if (entry.file) return;
            e.preventDefault();
            wrap.classList.add("file-drop-active");
        });

        wrap.addEventListener("dragenter", e => {
            if (entry.file) return;
            e.preventDefault();
            wrap.classList.add("file-drop-active");
        });

        wrap.addEventListener("dragleave", e => {
            if (entry.file) return;
            if (!wrap.contains(e.relatedTarget)) {
                wrap.classList.remove("file-drop-active");
            }
        });

        wrap.addEventListener("drop", async e => {
            if (entry.file) return;
            e.preventDefault();
            wrap.classList.remove("file-drop-active");

            const file = e.dataTransfer?.files?.[0];
            await this.attachFile(entry, file);
        });

        wrap.append(input, info);
        details.append(summary, wrap);

        return details;
    }

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                const result = reader.result;
                const base64 = result.split(",")[1];
                resolve(base64);
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    applySnapshotToEntry(entry, snapshot) {
        entry.title = snapshot.title || "";
        entry.username = snapshot.username || "";
        entry.password = snapshot.password || "";
        entry.recoveryMethod = snapshot.recoveryMethod || "";
        entry.url = snapshot.url || "";
        entry.notes = snapshot.notes || "";
    }

    async attachFile(entry, file) {
        if (!file) return;

        const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

        if (file.size > MAX_ATTACHMENT_BYTES) {
            alert(
                "Attachments must be 5 MB or smaller.\n\n" +
                "Store larger documents externally and keep only essential files in the vault."
            );
            return;
        }

        if (entry.file) {
            alert("This entry already contains a file. Download or delete it first.");
            return;
        }

        const current = this.snapshotValue();
        const data = await this.fileToBase64(file);
        const cleanFileName = file.name.replace(/\.[^/.]+$/, "");

        this.applySnapshotToEntry(entry, current);

        if (!entry.title) {
            entry.title = cleanFileName;
        }

        entry.file = {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
            data
        };

        this.render();
    }

    removeFile(entry) {
        const current = this.snapshotValue();
        this.applySnapshotToEntry(entry, current);
        entry.file = null;
        this.render();
    }

    base64ToBlob(base64, type) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        return new Blob([bytes], { type });
    }

    formatFileSize(bytes) {

        const units = ["B", "KB", "MB", "GB"];
        let i = 0;

        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024;
            i++;
        }

        return bytes.toFixed(1) + " " + units[i];
    }

    openFile(file) {
        const blob = this.base64ToBlob(file.data, file.type);
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    downloadFile(file) {
        const blob = this.base64ToBlob(file.data, file.type);
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    buildEditor(entry) {

        const editor = document.createElement("div");
        editor.className = "editor";

        editor.append(this.createField({ key: "title", label: "Title", type: "input" }, entry.title).wrap);
        editor.append(this.createField({ key: "username", label: "Username", type: "input" }, entry.username).wrap);
        editor.append(this.createField({ key: "password", label: "Password", type: "password" }, entry.password).wrap);
        editor.append(this.createOptionalField({ key: "recoveryMethod", label: "Recovery method", type: "input" }, entry.recoveryMethod));
        editor.append(this.createOptionalField({ key: "url", label: "URL", type: "input" }, entry.url));
        editor.append(this.createOptionalField({ key: "notes", label: "Notes", type: "textarea" }, entry.notes));

        editor.append(this.createFileField(entry));

        return editor;
    }

    emit(name) {

        this.dispatchEvent(new CustomEvent(name, {
            bubbles: true,
            detail: {
                entryId: this._entry?.id || "",
                entryEl: this
            }
        }));
    }

    render() {

        const entry = this._entry;

        if (!entry) {
            this.innerHTML = "";
            return;
        }

        this.innerHTML = "";

        this.className = "entry";
        this.dataset.entryId = entry.id || "";

        const header = document.createElement("header");

        const main = document.createElement("div");
        main.className = "entry-main";

        const summary = document.createElement("div");
        summary.className = "entry-summary";

        const title = document.createElement("span");
        title.className = "entry-title";
        title.textContent = entry.title || "New entry";

        const meta = document.createElement("span");
        meta.className = "entry-meta";
        meta.textContent = this.buildMeta(entry);

        summary.append(title, meta);
        main.append(summary);

        const tools = document.createElement("div");
        tools.className = "entry-tools";

        if (this._open) {

            const saveButton = window.Vault.icons.createIconButton("save", "Save entry");

            saveButton.addEventListener("click", event => {

                event.stopPropagation();
                this.emit("vault-save");
            });

            const deleteButton = window.Vault.icons.createIconButton("delete", "Delete entry");

            deleteButton.addEventListener("click", event => {

                event.stopPropagation();
                this.emit("vault-delete");
            });

            tools.append(saveButton, deleteButton);
        }

        const toggleButton = window.Vault.icons.createIconButton(
            this._open ? "minus" : "plus",
            this._open ? "Close entry" : "Open entry"
        );

        toggleButton.addEventListener("click", event => {

            event.stopPropagation();
            this.emit("vault-toggle");
        });

        tools.append(toggleButton);
        header.append(main, tools);

        header.addEventListener("click", () => {
            this.emit("vault-toggle");
        });

        this.append(header);

        if (this._open) {
            this.append(this.buildEditor(entry));
        }
    }

    snapshotValue() {

        const fields = this.getFields();

        return {
            title: fields.title?.value.trim() || "",
            username: fields.username?.value.trim() || "",
            password: fields.password?.value || "",
            recoveryMethod: fields.recoveryMethod?.value.trim() || "",
            url: fields.url?.value.trim() || "",
            notes: fields.notes?.value.trim() || ""
        };
    }

    getValue() {
        return this.snapshotValue();
    }

    isDirty() {

        if (!this._open) return false;

        const current = this.snapshotValue();
        const saved = this.getSavedValue();

        return (
            current.title !== saved.title ||
            current.username !== saved.username ||
            current.password !== saved.password ||
            current.recoveryMethod !== saved.recoveryMethod ||
            current.url !== saved.url ||
            current.notes !== saved.notes
        );
    }

    getSavedValue() {

        const entry = this._entry || {};

        return {
            title: (entry.title || "").trim(),
            username: (entry.username || "").trim(),
            password: entry.password || "",
            recoveryMethod: (entry.recoveryMethod || "").trim(),
            url: (entry.url || "").trim(),
            notes: (entry.notes || "").trim()
        };
    }
}

window.Vault.VaultEntryElement = VaultEntryElement;

if (!customElements.get("vault-entry")) {
    customElements.define("vault-entry", VaultEntryElement);
}