window.Vault = window.Vault || {};

window.Vault.createDialogService = (host) => {

    if (!host) {
        throw new Error("Dialog host not provided.");
    }

    let queue = Promise.resolve();

    function closeActive() {
        host.close();
    }

    function createButton(def, api) {
        const btn = document.createElement("button");

        btn.type = "button";
        btn.textContent = def.label || "OK";

        if (def.className) {
            btn.className = def.className;
        }

        btn.addEventListener("click", async event => {
            if (typeof def.onClick === "function") {
                await def.onClick(event, api, btn);
            } else {
                api.close();
            }
        });

        return btn;
    }

    function open({
        title = "Dialog",
        text = "",
        content = null,
        actions = [],
        initialFocus = null,
        onClose = null,
        overlayClose = true
    } = {}) {
        host.close();

        const dialog = document.createElement("div");
        dialog.className = "dialog-card";
        dialog.setAttribute("role", "dialog");
        dialog.setAttribute("aria-modal", "true");

        const headingId = `dialog-title-${Date.now()}`;
        dialog.setAttribute("aria-labelledby", headingId);
        const textId = `dialog-text-${Date.now()}`;

        const titleEl = document.createElement("h2");
        titleEl.className = "dialog-title";
        titleEl.id = headingId;
        titleEl.textContent = title;
        dialog.append(titleEl);

        if (text) {
            const textEl = document.createElement("p");
            textEl.className = "dialog-text";
            textEl.id = textId;
            textEl.textContent = text;

            dialog.setAttribute("aria-describedby", textId);

            dialog.append(textEl);
        }

        if (content) {
            dialog.append(content);
        }

        const actionsEl = document.createElement("div");
        actionsEl.className = "dialog-actions";

        let closed = false;
        let defaultButton = null;

        const api = {
            dialog,
            close() {
                if (closed) return;
                closed = true;
                host.close();
            }
        };

        actions.forEach(def => {
            const btn = createButton(def, api);

            if (def.initialFocus) {
                initialFocus = btn;
            }

            if (def.default) {
                defaultButton = btn;
            }

            actionsEl.append(btn);
        });

        if (actions.length) {
            dialog.append(actionsEl);
        }

        dialog.addEventListener("keydown", event => {
            if (event.key !== "Enter") return;

            const tag = document.activeElement?.tagName;
            if (tag === "BUTTON" || tag === "TEXTAREA") return;

            if (defaultButton) {
                event.preventDefault();
                defaultButton.click();
            }
        });

        host.open(dialog, {
            initialFocus,
            overlayClose,
            onClose: () => {
                if (closed) return;
                closed = true;
                if (typeof onClose === "function") onClose();
            }
        });

        return api;
    }

    function alert(message, title = "Notice") {
        queue = queue.then(() => {
            return new Promise(resolve => {
                let settled = false;

                const settle = value => {
                    if (settled) return;
                    settled = true;
                    resolve(value);
                };

                open({
                    title,
                    text: message,
                    actions: [
                        {
                            label: "OK",
                            default: true,
                            initialFocus: true,
                            onClick: (_, api) => {
                                settle(true);
                                api.close();
                            }
                        }
                    ],
                    onClose: () => settle(true)
                });
            });
        });

        return queue;
    }

    function confirm(message, title = "Confirm") {
        queue = queue.then(() => {
            return new Promise(resolve => {
                let settled = false;

                const settle = value => {
                    if (settled) return;
                    settled = true;
                    resolve(value);
                };

                open({
                    title,
                    text: message,
                    actions: [
                        {
                            label: "Cancel",
                            onClick: (_, api) => {
                                settle(false);
                                api.close();
                            }
                        },
                        {
                            label: "OK",
                            default: true,
                            initialFocus: true,
                            onClick: (_, api) => {
                                settle(true);
                                api.close();
                            }
                        }
                    ],
                    onClose: () => settle(false)
                });
            });
        });

        return queue;
    }

    return {
        open,
        alert,
        confirm,
        closeActive
    };

};