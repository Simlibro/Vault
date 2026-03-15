window.Vault = window.Vault || {};

class ResetPasswordController {
    constructor({ dialog, icons } = {}) {
        this.dialog = dialog;
        this.icons = icons;
    }

    openDialog({ state, storage, autolock, hasUnsavedChanges }) {
        if (typeof hasUnsavedChanges === "function" && hasUnsavedChanges()) {
            this.dialog.alert(
                "Please save or discard your current changes before changing the master password."
            );
            return;
        }

        if (!state.getMasterPassword()) {
            this.dialog.alert("Unlock the vault first.");
            return;
        }

        const content = document.createElement("div");
        content.className = "dialog-body";

        const currentField = this.createPasswordField("Current password");
        const newField = this.createPasswordField("New password");
        const confirmField = this.createPasswordField("Confirm new password");

        content.append(
            currentField.wrap,
            newField.wrap,
            confirmField.wrap
        );

        const modal = this.dialog.open({
            title: "Reset master password",
            text: "Enter your current password, then choose a new one.",
            content,
            initialFocus: currentField.input,
            overlayClose: false,
            actions: [
                {
                    label: "Cancel",
                    onClick: (_, api) => {
                        api.close();
                    }
                },
                {
                    label: "Change password",
                    initialFocus: false,
                    onClick: async (_, api) => {
                        await this.submit({
                            api,
                            state,
                            storage,
                            autolock,
                            currentField,
                            newField,
                            confirmField
                        });
                    }
                }
            ],
            onClose: () => {
                this.clearFields(currentField, newField, confirmField);
            }
        });
    }

    async submit({ api, state, storage, autolock, currentField, newField, confirmField }) {
        const currentPassword = currentField.input.value;
        const newPassword = newField.input.value;
        const confirmPassword = confirmField.input.value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            await this.dialog.alert("Please fill in all three password fields.");
            return;
        }

        if (currentPassword !== state.getMasterPassword()) {
            await this.dialog.alert("Current password is incorrect.");
            this.focusAndSelect(currentField.input);
            return;
        }

        if (newPassword !== confirmPassword) {
            await this.dialog.alert("New passwords do not match.");
            this.focusAndSelect(confirmField.input);
            return;
        }

        if (newPassword === currentPassword) {
            await this.dialog.alert("New password must be different from the current password.");
            this.focusAndSelect(newField.input);
            return;
        }

        try {
            await storage.saveVault(state.getData(), newPassword);
            state.setMasterPassword(newPassword);
            autolock.restart();
            api.close();
            await this.dialog.alert("Master password changed.");
        } catch (error) {
            console.error(error);
            await this.dialog.alert("Could not change the master password.");
        }
    }

    focusAndSelect(input) {
        input.focus();
        input.select();
    }

    clearFields(...fields) {
        fields.forEach(field => {
            field.input.value = "";

            if (field.input.type === "text") {
                field.input.type = "password";
                this.icons.setIcon(field.toggle, "eye", "Show password");
            }
        });
    }

    createPasswordField(labelText) {
        const wrap = document.createElement("label");
        wrap.className = "dialog-field";

        const head = document.createElement("div");
        head.className = "dialog-field-head";

        const label = document.createElement("span");
        label.textContent = labelText;

        const input = document.createElement("input");
        input.type = "password";
        input.autocomplete = "off";
        input.spellcheck = false;

        const toggle = this.icons.createIconButton("eye", "Show password");

        toggle.addEventListener("click", event => {
            event.preventDefault();

            const show = input.type === "password";
            input.type = show ? "text" : "password";

            this.icons.setIcon(
                toggle,
                show ? "eyeOff" : "eye",
                show ? "Hide password" : "Show password"
            );
        });

        head.append(label, toggle);
        wrap.append(head, input);

        return { wrap, input, toggle };
    }
}

window.Vault.ResetPasswordController = ResetPasswordController;
