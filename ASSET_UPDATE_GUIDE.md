# Korosh Nova — Asset-only GitHub Update Guide

The Secret Room is intentionally data-driven.

## Adding future photos/assets
1. Put the new image files inside `webapp/assets/secret_room/` (or another existing `assets/` subfolder).
2. Give each file a stable descriptive filename.
3. Update only `webapp/assets/secret_room/manifest.json` when a new default/slot is needed.
4. Commit the image files + manifest. **Do not rewrite or paste images into `app.js`.**

The UI keeps asset paths separate from behavior, so adding four photos does not require rebuilding the application logic or inflating the JavaScript file with image data.

## Runtime Gallery
Secret Room settings also support the phone's Gallery/File Picker. Those selections are stored locally in the browser/WebView and do not modify the source package.

## Gift assets
Built-in Gift choices are normal files under `assets/` and are referenced by path. New Gift images can be added without changing the layout engine; only the data map/manifest entry needs to be updated.
