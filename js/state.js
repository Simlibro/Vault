window.Vault = window.Vault || {};

class VaultSession {
  constructor() {
    this.data = [];
    this.openEntryId = null;
    this.masterPassword = "";
  }

  getData() {
    return this.data;
  }

  setData(value) {
    this.data = value;
  }

  getOpenEntryId() {
    return this.openEntryId;
  }

  setOpenEntryId(value) {
    this.openEntryId = value;
  }

  getMasterPassword() {
    return this.masterPassword;
  }

  setMasterPassword(value) {
    this.masterPassword = value;
  }

  resetState() {
    this.data = [];
    this.openEntryId = null;
    this.masterPassword = "";
  }
}

window.Vault.VaultSession = VaultSession;

window.Vault.state = new VaultSession();