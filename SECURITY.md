# Security Policy

Vault is an experimental offline password manager designed to keep the architecture small and transparent.

Passwords are encrypted locally using the Web Crypto API and stored on the user's device.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

Contact:
cam@simlibro.com

Please do not publicly disclose vulnerabilities until they have been reviewed.

## Design Principles

Vault attempts to reduce attack surface by:

- performing encryption locally
- avoiding cloud storage
- avoiding account infrastructure
- keeping the codebase small and inspectable

## Limitations

Vault cannot protect against:

- compromised devices
- weak master passwords
- unsafe backups
- browser vulnerabilities
