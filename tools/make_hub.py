"""Build index.html (the arcade menu) from tools/index_src.html."""
import json, os
from csp import add_csp
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, "tools", "index_src.html"), encoding="utf-8").read()
names = {"loader": "Web.loader.js", "data": "Web.data.unityweb", "framework": "Web.framework.js.unityweb", "code": "Web.wasm.unityweb"}
html = add_csp(src.replace("__BUILD_NAMES__", json.dumps(names)))
open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(html)
print("index.html ok")
