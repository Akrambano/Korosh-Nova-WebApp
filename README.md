# Korosh Nova — Full Web Test Harness

This package is the GitHub-ready Web App test harness for Korosh Nova.

- `index.html`: app shell and fixed seven-icon dock.
- `app.js`: behavior and data-driven UI logic.
- `style.css`: visual system.
- `assets/secret_room/manifest.json`: asset/slot map for future GitHub merges.
- `ASSET_UPDATE_GUIDE.md`: rules for adding photos and other visual assets without rewriting app logic.

## Secret Room
- Five-touch discovery is preserved.
- A large animated lock gate appears after the fifth touch.
- Unlock animation leads to the three Secret Room pages: Treasure Chests, Family Frame, Memory Album.
- Five personal chests + one fixed special guide chest.
- Secret Room settings are reached from the hidden-but-discoverable key at the top of Room of Command.
- Settings use visual identity cards, not a loose group of generic buttons.
- Image-related choices provide **Gallery** and **Gift** paths.
- Effect choices use check-mark selection and close automatically.
- Gallery selections close their selection layer automatically after returning.
- Secret settings persist locally.

## GitHub asset strategy
Image files remain external assets. Future image additions should be uploaded as individual files and registered through the manifest/data layer; image bytes are never embedded into JavaScript.
