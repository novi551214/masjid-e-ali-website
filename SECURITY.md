# Security

## Current status

This community-site repository is undergoing portfolio and deployment hardening. Its public content, photographs, contacts, event details, and organizational authority still require a private authorized review. Do not treat the current public repository as an approved production deployment.

## Implemented controls

- JWT startup rejects missing, short, or placeholder signing secrets.
- Database seeding rejects default/placeholder administrator credentials and never prints a password.
- CORS uses exact configured origins and fails closed in production.
- API responses include restrictive security headers and global/request-specific rate limits.
- Contact and scholar submissions validate email format and field lengths.
- The SQLite database and uploaded runtime files are ignored; the database file is restricted to owner read/write permissions where supported.
- Admin prayer-time edits are authoritative only after a successful backend save; failed requests no longer claim a local save succeeded.
- Email recipients come from private environment configuration rather than hardcoded personal addresses in backend logic.
- A prepublication check validates ignored sensitive files and requires a private organization/content approval record.

## Private data

The database may contain administrator hashes, contact details, questions, event data, and email submissions. Never commit or upload it. Treat uploads and SMTP/JWT credentials as private runtime data.

If a credential was exposed, revoke or rotate it at the provider; deleting it from the current working tree is not sufficient.
