if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            await navigator.serviceWorker.register("/vault/sw.js", {
                scope: "/vault/"
            });
            console.log("Service worker registered");
        } catch (err) {
            console.error("Service worker failed", err);
        }
    });
}

window.addEventListener("beforeinstallprompt", event => {
    console.log("beforeinstallprompt fired");
    event.preventDefault();
    deferredPrompt = event;
    installButton.hidden = false;
});


let deferredPrompt = null;

const installButton = document.getElementById("install-button");
const helpButton = document.getElementById("install-help-button");
const helpPanel = document.getElementById("install-help");

const chromeBlock = document.getElementById("help-chrome");
const iosBlock = document.getElementById("help-ios");
const genericBlock = document.getElementById("help-generic");

function detectPlatform() {
    const ua = navigator.userAgent || "";
    const isIOS =
        /iPhone|iPad|iPod/.test(ua) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    const isSafari =
        /Safari/.test(ua) &&
        !/Chrome|CriOS|Edg|OPR|Firefox/.test(ua);

    const isChromiumLike =
        /Chrome|CriOS|Edg|OPR|Android/.test(ua);

    return {
        isIOS,
        isSafari,
        isChromiumLike
    };
}

function showHelp() {
    const { isIOS, isSafari, isChromiumLike } = detectPlatform();

    helpPanel.hidden = false;
    chromeBlock.hidden = true;
    iosBlock.hidden = true;
    genericBlock.hidden = true;

    if (isIOS && isSafari) {
        iosBlock.hidden = false;
        return;
    }

    if (isChromiumLike) {
        chromeBlock.hidden = false;
        return;
    }

    genericBlock.hidden = false;
}

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
    if (!deferredPrompt) {
        showHelp();
        return;
    }

    deferredPrompt.prompt();

    try {
        await deferredPrompt.userChoice;
    } finally {
        deferredPrompt = null;
        installButton.hidden = true;
    }
});

helpButton.addEventListener("click", () => {
    showHelp();
});

window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installButton.hidden = true;
});