"""Adds a Content-Security-Policy <meta> tag that only allows this site's own files,
Google Fonts, and the exact inline scripts on the page (pinned by SHA-256 hash)."""
import base64, hashlib, re

def add_csp(html):
    hashes = []
    for body in re.findall(r"<script>(.*?)</script>", html, flags=re.S):
        digest = base64.b64encode(hashlib.sha256(body.encode("utf-8")).digest()).decode()
        hashes.append("'sha256-%s'" % digest)
    policy = "; ".join([
        "default-src 'self'",
        "script-src 'self' blob: 'wasm-unsafe-eval' " + " ".join(hashes),
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src https://fonts.gstatic.com",
        "img-src 'self' data: blob:",
        "media-src 'self' data: blob:",
        "connect-src 'self' blob: data:",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
    ])
    meta = '<meta http-equiv="Content-Security-Policy" content="%s">\n<meta name="referrer" content="no-referrer">\n' % policy
    html = re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>\n<meta name="referrer"[^>]*>\n', "", html)
    return html.replace("<title>", meta + "<title>", 1)
