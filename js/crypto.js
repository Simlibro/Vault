window.Vault = window.Vault || {};

window.Vault.crypto = (() => {
  const ITERATIONS = 250000;

  async function encryptJSON(value, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);

    const plainBytes = new TextEncoder().encode(JSON.stringify(value));
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      plainBytes
    );

    return {
      salt: toBase64(salt),
      iv: toBase64(iv),
      data: toBase64(new Uint8Array(cipherBuffer))
    };
  }

  async function decryptJSON(payload, password) {
    const salt = fromBase64(payload.salt);
    const iv = fromBase64(payload.iv);
    const dataBytes = fromBase64(payload.data);
    const key = await deriveKey(password, salt);

    const plainBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      dataBytes
    );

    return JSON.parse(new TextDecoder().decode(plainBuffer));
  }

  async function deriveKey(password, salt) {
    const baseKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: ITERATIONS,
        hash: "SHA-256"
      },
      baseKey,
      {
        name: "AES-GCM",
        length: 256
      },
      false,
      ["encrypt", "decrypt"]
    );
  }

  function toBase64(bytes) {
    let text = "";
    bytes.forEach(byte => {
      text += String.fromCharCode(byte);
    });
    return btoa(text);
  }

  function fromBase64(base64) {
    const text = atob(base64);
    const bytes = new Uint8Array(text.length);

    for (let i = 0; i < text.length; i++) {
      bytes[i] = text.charCodeAt(i);
    }

    return bytes;
  }

  return {
    encryptJSON,
    decryptJSON
  };
})();