window.Vault = window.Vault || {};

class VaultDialogHost extends HTMLElement {
    constructor() {
        super();

        this._overlay = null;
        this._panel = null;
        this._onClose = null;
        this._lastFocused = null;
        this._allowOverlayClose = true;
    }

    connectedCallback() {
        if (this._overlay) return;
        this.render();
    }

    render() {
        this.classList.add("vault-dialog-host");

        const overlay = document.createElement("div");
        overlay.className = "dialog-overlay";

        const panel = document.createElement("div");
        panel.className = "dialog-panel";
        panel.tabIndex = -1;

        overlay.addEventListener("click", () => {
            if (this._allowOverlayClose) {
                this.close();
            }
        });

        panel.addEventListener("click", event => {
            event.stopPropagation();
        });

        panel.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                event.preventDefault();
                this.close();
                return;
            }

            if (event.key === "Tab") {
                this.trapFocus(event);
            }
        });

        this.append(overlay, panel);

        this._overlay = overlay;
        this._panel = panel;
    }

    getFocusable() {
        if (!this._panel) return [];

        return [...this._panel.querySelectorAll(
            'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        )].filter(el => !el.disabled && el.offsetParent !== null);
    }

    trapFocus(event) {
        const focusable = this.getFocusable();
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && active === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
        }
    }

    open(content, { initialFocus = null, onClose = null, overlayClose = true } = {}) {
        if (!this._panel) this.render();

        this._lastFocused = document.activeElement;
        this._onClose = onClose;
        this._panel.innerHTML = "";
        this._allowOverlayClose = overlayClose;

        if (content instanceof Node) {
            this._panel.append(content);
        } else {
            this._panel.textContent = content;
        }

        this.setAttribute("open", "");
        document.body.classList.add("dialog-open");

        queueMicrotask(() => {
            const target = initialFocus || this.getFocusable()[0] || this._panel;
            if (target) target.focus();
        });
    }

    close() {
        if (!this.hasAttribute("open")) return;

        this.removeAttribute("open");
        document.body.classList.remove("dialog-open");

        if (this._panel) {
            this._panel.innerHTML = "";
        }

        const onClose = this._onClose;
        this._onClose = null;

        if (this._lastFocused && document.contains(this._lastFocused)) {
            this._lastFocused.focus();
        }
        this._lastFocused = null;

        if (typeof onClose === "function") {
            onClose();
        }
    }
}

window.Vault.VaultDialogHost = VaultDialogHost;

if (!customElements.get("vault-dialog-host")) {
    customElements.define("vault-dialog-host", VaultDialogHost);
}