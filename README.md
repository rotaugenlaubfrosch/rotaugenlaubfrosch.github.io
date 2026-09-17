# Franz’s personal workspace

A static, desktop-style portfolio built with HTML, CSS, and vanilla JavaScript. No build step, framework, CDN, or backend is required.

## Run locally

From this directory:

```sh
npx --yes http-server . -p 8000 -c-1
```

Open **http://localhost:8000**. This preview command requires Node.js and provides HTTP byte ranges for video scrubbing. Python's basic `http.server` does not support byte ranges and may display videos without allowing seeking; use the command above to test the city backgrounds. The deployed website remains fully static and needs no Node.js server.

## Contents

- `index.html`: desktop icons, wallpaper labels, and taskbar.
- `styles.css`: dark desktop design and responsive layout.
- `app.js`: profile/project content, document registry, portfolio shell, and window manager.
- `city-background.js` / `city-background.css`: scroll-controlled video wallpaper and city controls.
- `assets/cities/`: optimized city videos and first-frame poster images.
- `assets/franz.jpg`: portrait extracted from the supplied CV.
- `docs/`: original CV, thesis, CIL report, and course summaries.

Clicking an application or document types its command into the terminal and then opens its window. Windows support dragging, resizing, minimizing, maximizing, and taskbar switching. The terminal supports command history, autocomplete, `help`, and document-opening commands. This is a simulated portfolio shell, not an operating-system shell.

The background autoplays on **Zürich at 0.5× speed**, with **Madrid** and **Budapest** available through city buttons. Scroll over empty desktop space, swipe the background on touch devices, or use the keyboard-accessible camera-path slider to pause and scrub along the rendered camera animation. Scrolling inside windows does not move the background. Play resumes a hands-free tour at half speed; Reset returns to the first frame and pauses. Changing cities resets the path and starts its tour at half speed. Autoplay respects reduced-motion preferences, and playback pauses when the tab is hidden or reduced motion is enabled. If the browser blocks autoplay, Play remains available. The mail form opens a prefilled draft in the visitor’s email app.

## Publish

Upload `index.html`, `styles.css`, `app.js`, `city-background.css`, `city-background.js`, `favicon.svg`, `assets/`, and the PDFs under `docs/` to any static host, including GitHub Pages. **Do not upload `docs/blend/`**: those are the large source renders, ignored by Git. The site uses the smaller videos in `assets/cities/` (each below GitHub's 100 MiB per-file limit). Relative paths support deployment in a subdirectory. A host with HTTP byte-range support, such as GitHub Pages, allows efficient video seeking before the whole file is downloaded.

## Prepare city videos

The supplied 1440p/60 fps videos were converted to 720p/60 fps H.264, preserving all source frames so **0.5× playback displays 30 frames per second**. The web copies have no audio, a keyframe every half-second of source time, a 6 Mbps maximum video rate, and fast-start metadata for browser loading and scrubbing. Source renders are preserved under `docs/blend/`. To regenerate a city (replace `zurich` with its file name):

```sh
ffmpeg -i docs/blend/zurich.mp4 -vf "scale=1280:-2,fps=60" \
  -c:v libx264 -preset fast -crf 27 -maxrate 6M -bufsize 12M -g 30 -keyint_min 30 \
  -sc_threshold 0 -pix_fmt yuv420p -an -movflags +faststart assets/cities/zurich.mp4
ffmpeg -i docs/blend/zurich.mp4 -vf "scale=1920:-2" \
  -frames:v 1 -update 1 -q:v 3 assets/cities/zurich.jpg
```

## Edit content

Update the `DOCUMENTS`, `LINKS`, and content functions in `app.js`. Add PDFs under `docs/` and register them in `DOCUMENTS` to make them available to the terminal. Desktop launchers in `index.html` use `data-command` attributes.

Desktop/terminal interaction concept inspired by [Taha Atlagh’s portfolio](https://taha1703.github.io/). This implementation is written for Franz Schwinn using the supplied documents and the public org-agent README.
