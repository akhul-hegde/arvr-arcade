"""Copy Unity web builds into games/<id>/Build and generate each game's page from the template."""
import os, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from csp import add_csp

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.environ.get("ARVR_LAB", os.path.join(os.path.dirname(ROOT), "ARVR_Lab"))  # folder with the Unity projects

GAMES = {
    "orb": dict(proj="Exp03_WebGLGame", title="Orb Runner", color="#35d9ff",
                help="WASD / Arrows roll · Space dash (and start) · R restart · M music · collect orbs, dodge red hunters"),
    "shooter": dict(proj="Exp04_VRCubeShooter", title="Cube Shooter", color="#ff8a2a",
                    help="Mouse aim · Left click / Space shoot · hold Right mouse to look · WASD move · R reset score · M music"),
    "heli": dict(proj="Exp10_VRHelicopter", title="Sky Rescue", color="#7dff6a",
                 help="I / W start engine · W/S up/down · A/D turn · Arrows fly · Shift boost · C camera · R reset · M music"),
}

tpl = open(os.path.join(ROOT, "tools", "game_template.html"), encoding="utf-8").read()
only = sys.argv[1:]
for gid, g in GAMES.items():
    if only and gid not in only:
        continue
    src = os.path.join(SRC, g["proj"], "Builds", "Web", "Build")
    dst = os.path.join(ROOT, "games", gid, "Build")
    files = {f: None for f in ["Web.loader.js", "Web.data.unityweb", "Web.framework.js.unityweb", "Web.wasm.unityweb"]}
    missing = [f for f in files if not os.path.exists(os.path.join(src, f))]
    if missing:
        print(gid, "MISSING", missing); continue
    if os.path.isdir(dst):
        shutil.rmtree(dst)
    os.makedirs(dst)
    for f in files:
        shutil.copy2(os.path.join(src, f), dst)
    html = (tpl.replace("{{TITLE}}", g["title"]).replace("{{COLOR}}", g["color"]).replace("{{HELP}}", g["help"])
               .replace("{{LOADER}}", "Web.loader.js").replace("{{DATA}}", "Web.data.unityweb")
               .replace("{{FRAMEWORK}}", "Web.framework.js.unityweb").replace("{{CODE}}", "Web.wasm.unityweb"))
    assert "{{" not in html
    html = add_csp(html)
    open(os.path.join(ROOT, "games", gid, "index.html"), "w", encoding="utf-8").write(html)
    print(gid, "ok", sum(os.path.getsize(os.path.join(dst, f)) for f in files) // 1024, "KB")
