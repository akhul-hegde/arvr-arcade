# ARVR Arcade

One web page with three Unity WebGL mini games:

| Game | Unity project | Controls |
|---|---|---|
| Orb Runner | Exp03_WebGLGame | WASD/arrows roll, Space dash, R restart, M music |
| Cube Shooter | Exp04_VRCubeShooter | Mouse aim, click/Space shoot, right-drag look, WASD move |
| Sky Rescue | Exp10_VRHelicopter | I engine, W/S up/down, A/D turn, arrows fly, Shift boost, C camera, R reset |

Live site: https://akhul-hegde.github.io/arvr-arcade/

## Rebuilding a game
Each Unity project has `Assets/Editor/ArcadeWebBuild.cs`. Either use menu **Lab > Build Web Arcade Version**,
or put the game name in `Builds/_build_web.txt` and open the project: it builds to `Builds/Web` and quits.
Builds use gzip + decompression fallback, so they run on any static host (GitHub Pages, Netlify, etc.).

## Files
- `index.html` – arcade menu; games launch inside this page.
- `games/<id>/index.html` – each game on its own page (direct links).
- `games/<id>/Build/` – Unity build output.
- `tools/` – page generator (`assemble.py`, `make_hub.py`, `csp.py`, `index_src.html`, `game_template.html`) and browser tests (`smoke_test.js`, `spa_test.js`).

## Security
Static site, no server, no logins, no data collected. Every page has a Content-Security-Policy that only allows the site's own files and Google Fonts, and pins the inline scripts by hash.
