# YOLOX-S architecture explorer

Open index.html directly in Edge, Chrome, or Firefox. No server, installation, or framework is required. Classic deferred scripts intentionally support local file URLs.

See [STYLE_GUIDE.md](STYLE_GUIDE.md) for the agreed visual, interaction, notation, and popup rules.

- architecture.js: model hierarchy, layer parameters, and tensor shapes.
- core.js: shared state, DOM references, and SVG helpers.
- diagram.js: rendering, connections, pan/zoom, fitting, and startup.
- popups.js: shared hover, focus, dismissal, and animation lifecycle.
- animations/: individual popup explanations and animations.
- styles.css: presentation.

Scripts share one page scope and load in the order listed in index.html. Keep startup in diagram.js after all popup implementations have loaded.

## Portable export

Run node build-single-file.js from this directory. The generated dist/yolox-explorer.html embeds all CSS and JavaScript and can be shared alone. Edit the source files rather than the generated export.

The original standalone HTML remains unchanged one directory above. A byte-for-byte pre-refactor backup is in ../backups/.

## Layout verification

Run `node audit-layout.cjs` with Playwright available and Microsoft Edge installed. The Codex bundled Playwright is used as a fallback. The audit checks individual and combined expansion states for arrows crossing operation text, dimensions crossing frames, overlapping labels, and arrows running along group borders. Set `AUDIT_ZOOM` to check a different zoom (default 1). Add `--screenshot` for overview and bottom-up detail images. Reports and screenshots are saved in `../output/layout-audit/`.
