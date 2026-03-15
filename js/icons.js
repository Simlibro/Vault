window.Vault = window.Vault || {};

window.Vault.icons = (() => {

  const ICONS = {

    eye: `
<svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="3"/></svg>
`,

    eyeOff: `
<svg viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.6 10.6A3 3 0 0 0 13.4 13.4"/><path d="M9.9 5.2A11.4 11.4 0 0 1 12 5c6.5 0 10 7 10 7a17.2 17.2 0 0 1-4 4.8"/><path d="M6.5 6.6A17.5 17.5 0 0 0 2 12s3.5 7 10 7a10.9 10.9 0 0 0 4.1-.8"/></svg>
`,

    lock: `
<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/></svg>
`,

    add: `
<svg viewBox="0 0 24 24"><path d="M14 3H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6"/><path d="M12 12v5"/><path d="M9.5 14.5h5"/></svg>
`,

    key: `
<svg viewBox="0 0 24 24"><circle cx="8" cy="12" r="3"/><path d="M11 12h10"/><path d="M17 12v3"/><path d="M20 12v2"/></svg>
`,

    save: `
<svg viewBox="0 0 24 24"><path d="M5 4h11l3 3v13H5Z"/><path d="M8 4v6h8V4"/><path d="M9 18h6"/></svg>
`,

    left: `
<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>
`,

    right: `
<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>
`,

    close: `
<svg viewBox="0 0 24 24"><path d="M6 6l12 12"/><path d="M18 6l-12 12"/></svg>
`,

    delete: `
<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M7 7l1 13h8l1-13"/><path d="M10 11v5"/><path d="M14 11v5"/></svg>
`,

    plus: `
<svg viewBox="0 0 24 24"><path d="M12 6v12"/><path d="M6 12h12"/></svg>
`,

    minus: `
<svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg>
`,

    copy: `
<svg viewBox="0 0 24 24"><rect x="9" y="9" width="10" height="10" rx="2"/><path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"/></svg>
`,

    check: `
<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
`,

    export: `
<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="M8 11l4 4 4-4"/><path d="M5 21h14"/></svg>
`,

    import: `
<svg viewBox="0 0 24 24"><path d="M12 21V9"/><path d="M8 13l4-4 4 4"/><path d="M5 3h14"/></svg>
`,

    fail: `
<svg viewBox="0 0 24 24"><path d="M12 8v5"/><circle cx="12" cy="16.5" r=".5" fill="#1f1f1d" stroke="none"/><circle cx="12" cy="12" r="9"/></svg>
`,

    search: `
<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><line x1="16" y1="16" x2="21" y2="21"/></svg>
`,

    /* file icons */

    file: `
<svg viewBox="0 0 24 24"><path d="M14 3H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6"/></svg>
`,

    image: `
<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="10" r="2"/><path d="M21 15l-5-5-7 7"/></svg>
`,

    video: `
<svg viewBox="0 0 24 24"><rect x="3" y="6" width="15" height="12" rx="2"/><path d="M18 10l3-2v8l-3-2"/></svg>
`,

    audio: `
<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
`,

    pdf: `
<svg viewBox="0 0 24 24"><path d="M14 3H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6"/></svg>
`,

    archive: `
<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 4v16"/></svg>
`,

    text: `
<svg viewBox="0 0 24 24"><path d="M14 3H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6"/><path d="M9 13h6M9 16h6"/></svg>
`

  };

  function setIcon(button, iconName, label) {
    if (!button) {
      console.warn("Missing icon target:", iconName, label);
      return;
    }

    button.innerHTML = ICONS[iconName] || ICONS.file;
    button.title = label;
    button.setAttribute("aria-label", label);
  }

  function createIconButton(iconName, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "icon-button";
    setIcon(button, iconName, label);
    return button;
  }

  function createFileIcon(type) {

    let icon = "file";

    if (type?.startsWith("image/")) icon = "image";
    else if (type?.startsWith("video/")) icon = "video";
    else if (type?.startsWith("audio/")) icon = "audio";
    else if (type === "application/pdf") icon = "pdf";
    else if (type?.includes("zip")) icon = "archive";
    else if (type?.includes("text")) icon = "text";

    const span = document.createElement("span");
    span.className = "file-icon";
    span.innerHTML = ICONS[icon];

    return span;
  }

  return {
    setIcon,
    createIconButton,
    createFileIcon
  };

})();