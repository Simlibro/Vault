window.Vault = window.Vault || {};

class AutoLockManager {
  constructor(timeoutSeconds) {
    this.timeoutSeconds = timeoutSeconds;
    this.timeoutId = null;
    this.timeoutMs = this.timeoutSeconds * 1000;
    this.isEnabled = true;
    this.onTimeout = null;
    this.isBound = false;
    this.activityEvents = ["mousedown", "keydown", "touchstart"];
    this.handleActivity = this.handleActivity.bind(this);
  }

  setHandler(handler) {
    this.onTimeout = handler;
  }

  start() {
    this.bindActivity();
    this.restart();
  }

  stop() {
    this.clearTimer();
    this.unbindActivity();
  }

  restart() {
    if (!this.isEnabled) return;

    this.clearTimer();

    this.timeoutId = window.setTimeout(async () => {
      if (typeof this.onTimeout === "function") {
        await this.onTimeout();
      }
    }, this.timeoutMs);
  }

  handleActivity() {
    this.restart();
  }

  bindActivity() {
    if (this.isBound) return;

    this.activityEvents.forEach(eventName => {
      window.addEventListener(eventName, this.handleActivity);
    });

    this.isBound = true;
  }

  unbindActivity() {
    if (!this.isBound) return;

    this.activityEvents.forEach(eventName => {
      window.removeEventListener(eventName, this.handleActivity);
    });

    this.isBound = false;
  }

  clearTimer() {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

window.Vault.AutoLockManager = AutoLockManager;

window.Vault.autolock = new AutoLockManager(300);