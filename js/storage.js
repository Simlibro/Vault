window.Vault = window.Vault || {};

const VAULT_DB = "vault-db";
const VAULT_STORE = "vault-store";
const VAULT_KEY = "encrypted-vault";

function openVaultDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(VAULT_DB, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(VAULT_STORE)) {
        db.createObjectStore(VAULT_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = async () => {
      const db = request.result;

      const tx = db.transaction(VAULT_STORE, "readonly");
      const store = tx.objectStore(VAULT_STORE);
      const req = store.get(VAULT_KEY);

      req.onsuccess = async () => {
        if (!req.result) {
          const legacy = localStorage.getItem("vault-encrypted");
          if (legacy) {
            const tx2 = db.transaction(VAULT_STORE, "readwrite");
            tx2.objectStore(VAULT_STORE).put({
              key: VAULT_KEY,
              value: legacy
            });
            localStorage.removeItem("vault-encrypted");
          }
        }
        resolve(db);
      };
    };

    request.onerror = () => reject(request.error);
  });
}

async function idbGet(key) {
  const db = await openVaultDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(VAULT_STORE, "readonly");
    const store = tx.objectStore(VAULT_STORE);
    const req = store.get(key);

    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openVaultDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(VAULT_STORE, "readwrite");
    const store = tx.objectStore(VAULT_STORE);
    const req = store.put({ key, value });

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

class VaultRepository {
  constructor({ crypto } = {}) {
    this.crypto = crypto;
  }

  createEntryId() {
    return "e_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  async vaultExists() {
    const v = await idbGet(VAULT_KEY);
    return !!v;
  }

  async getStoredVaultString() {
    return idbGet(VAULT_KEY);
  }

  async setStoredVaultString(value) {
    await idbSet(VAULT_KEY, value);
  }

  async saveVault(data, masterPassword) {
    const encrypted = await this.crypto.encryptJSON(data, masterPassword);

    try {
      await this.setStoredVaultString(JSON.stringify(encrypted));
    } catch (err) {

      if (err.name === "QuotaExceededError") {
        alert(
          "Vault storage limit reached.\n\n" +
          "Large attachments may have filled browser storage.\n" +
          "Download or delete large files before saving again."
        );
        throw err;
      }

      throw err;
    }
  }

  async loadVault(masterPassword) {
    const storedText = await this.getStoredVaultString();

    if (!storedText) {
      throw new Error("No vault found");
    }

    const stored = JSON.parse(storedText);
    return this.crypto.decryptJSON(stored, masterPassword);
  }

  async exportVaultBlob() {
    const stored = await this.getStoredVaultString();
    if (!stored) return null;

    return new Blob([stored], { type: "application/json" });
  }

  async importVaultString(jsonText) {
    const parsed = JSON.parse(jsonText);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.salt !== "string" ||
      typeof parsed.iv !== "string" ||
      typeof parsed.data !== "string"
    ) {
      throw new Error("Invalid vault file");
    }

    await this.setStoredVaultString(JSON.stringify(parsed));
  }
}

window.Vault.VaultRepository = VaultRepository;

window.Vault.storage = new VaultRepository({
  crypto: window.Vault.crypto
});