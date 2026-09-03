#!/usr/bin/env python3
"""Turn the Artifact-format sources into standalone HTML documents.

index.html is fully self-contained: React is inlined from vendor/ so the file
works with no network at all, which a copy sitting on a phone needs.
"""
import io, os, re, sys

HEAD_EXTRA = """<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="{desc}">
<meta name="color-scheme" content="light dark">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="DDK Tracker">
<style>html{{-webkit-text-size-adjust:100%}}body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>"""

CDN = re.compile(r'<script src="https://cdnjs\.cloudflare\.com/ajax/libs/'
                 r'(react|react-dom)/[^"]+"></script>\n?')

def read(p): return io.open(p, encoding="utf-8").read()

def build(src, out, desc, inline_react):
    s = read(src)
    cut = s.rindex("</style>") + len("</style>")
    head, body = s[:cut], s[cut:]

    if inline_react:
        names = CDN.findall(body)
        if len(names) != 2:
            sys.exit("expected 2 CDN script tags in %s, found %d" % (src, len(names)))
        body = CDN.sub("", body)
        libs = "".join(
            "<script>/* %s (UMD production build, inlined for offline use) */\n%s\n</script>\n"
            % (n, read(os.path.join("vendor", n + ".production.min.js")))
            for n in names)
        body = body.replace('<div id="root">', libs + '<div id="root">', 1)

    doc = ("<!doctype html>\n<html lang=\"en\">\n<head>\n"
           + HEAD_EXTRA.format(desc=desc) + "\n" + head
           + "\n</head>\n<body>\n" + body.strip() + "\n</body>\n</html>\n")
    io.open(out, "w", encoding="utf-8").write(doc)
    print("%-12s %7d bytes  react=%s" % (out, len(doc), "inlined" if inline_react else "cdn"))

build("src/tracker-app.artifact.html", "index.html",
      "Tracker for the east Bengaluru school search and house hunt, AY 2027-28.", True)
build("src/report.artifact.html", "report.html",
      "Schools and housing research for a family relocating to east Bengaluru, AY 2027-28.", False)
