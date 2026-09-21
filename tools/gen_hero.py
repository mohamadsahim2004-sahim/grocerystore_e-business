import random, math
random.seed(7)
W, H = 640, 420
out = []

def leaf(x, y, rot, l, w, c1, c2):
    return (f'<g transform="translate({x} {y}) rotate({rot})"><path d="M0 0C{w} {-l*.3} {w} {-l*.8} 0 {-l}C{-w} {-l*.8} {-w} {-l*.3} 0 0z" fill="{c1}"/>'
            f'<path d="M0 -4L0 {-l*.9}" stroke="{c2}" stroke-width="2" fill="none" opacity=".7"/></g>')

greens = ['#2f8f3f', '#3aa24f', '#1f6f34', '#4fb35a', '#2a7d3a', '#175c2b']

# back foliage
for i in range(46):
    x = random.uniform(250, 640); y = random.uniform(20, 230)
    out.append(leaf(x, y, random.uniform(-70, 70), random.uniform(60, 110), random.uniform(20, 36), random.choice(greens), '#0d3d1c'))

# spice bowl (top right)
out.append('<ellipse cx="548" cy="112" rx="66" ry="16" fill="#000" opacity=".18" transform="translate(0 46)"/>')
out.append('<path d="M482 92h132c0 40-26 66-66 66s-66-26-66-66z" fill="url(#terra)"/>')
out.append('<ellipse cx="548" cy="92" rx="66" ry="17" fill="#a4471f"/><ellipse cx="548" cy="92" rx="56" ry="12" fill="#3a1d10"/>')
for i in range(40):
    a = random.uniform(0, 6.28); r = random.uniform(0, 48)
    out.append(f'<circle cx="{548+math.cos(a)*r:.1f}" cy="{90+math.sin(a)*r*.18:.1f}" r="{random.uniform(1.2,2.6):.1f}" fill="{random.choice(["#7a2c14","#c2571a","#e28a2f","#241109"])}"/>')

# wooden bowl
out.append('<ellipse cx="330" cy="392" rx="190" ry="20" fill="#000" opacity=".22"/>')
out.append('<path d="M118 214h424c-6 92-70 166-212 166S124 306 118 214z" fill="url(#wood)"/>')
out.append('<path d="M150 262c60 22 300 22 360 0" stroke="#8a5a2b" stroke-width="3" fill="none" opacity=".55"/><path d="M170 310c50 18 270 18 320 0" stroke="#8a5a2b" stroke-width="3" fill="none" opacity=".45"/>')

def tomato(x, y, r):
    return (f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#tom)"/><ellipse cx="{x-r*.35}" cy="{y-r*.45}" rx="{r*.28}" ry="{r*.16}" fill="#fff" opacity=".35" transform="rotate(-30 {x-r*.35} {y-r*.45})"/>'
            f'<path d="M{x-r*.45} {y-r*.85}l{r*.45} {r*.25} {r*.45} {-r*.25} {-r*.25} {r*.4} {-r*.2} {-r*.2} {-r*.2} {r*.2}z" fill="#2f8f3f"/>')

def potato(x, y, rx, ry, rot):
    return (f'<g transform="rotate({rot} {x} {y})"><ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#e8c26a"/>'
            f'<ellipse cx="{x-rx*.3}" cy="{y-ry*.3}" rx="{rx*.35}" ry="{ry*.25}" fill="#fff" opacity=".3"/>'
            f'<circle cx="{x+rx*.2}" cy="{y+ry*.1}" r="2" fill="#a8802f"/><circle cx="{x-rx*.1}" cy="{y+ry*.4}" r="1.6" fill="#a8802f"/></g>')

out.append(potato(440, 196, 44, 32, -15)); out.append(potato(500, 206, 34, 26, 20)); out.append(potato(392, 180, 28, 22, -30))
# carrot
out.append('<g transform="rotate(-22 300 150)"><path d="M268 40c14-12 44-12 58 0l14 190c-2 14-14 24-43 24s-41-10-43-24z" fill="url(#car)"/><path d="M280 90h30M282 140h28M285 190h24" stroke="#c8641a" stroke-width="3" stroke-linecap="round" opacity=".55"/></g>')
# red pepper
out.append('<path d="M382 92c-30 6-40 40-34 78 4 26 22 38 40 30 22-8 34-46 26-84-4-18-16-28-32-24z" fill="url(#pep)"/><path d="M390 88c-6-14 0-24 10-30" stroke="#2f8f3f" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M372 110c-8 20-6 44 4 60" stroke="#fff" stroke-opacity=".3" stroke-width="7" stroke-linecap="round" fill="none"/>')
# cucumber
out.append('<g transform="rotate(38 200 130)"><rect x="150" y="98" width="112" height="46" rx="23" fill="url(#cuc)"/><path d="M168 108v26M196 104v34M226 106v30" stroke="#8fd27a" stroke-width="3" stroke-linecap="round" opacity=".5"/></g>')
for (x, y, r) in [(250, 196, 30), (318, 208, 36), (214, 214, 26), (560, 214, 24)]:
    out.append(tomato(x, y, r))
# herbs inside bowl
for i in range(14):
    out.append(leaf(random.uniform(170, 520), random.uniform(196, 222), random.uniform(-80, 80), random.uniform(30, 52), random.uniform(9, 15), random.choice(greens), '#0d3d1c'))
# bowl front rim
out.append('<path d="M114 214c0-8 6-12 14-12h404c8 0 14 4 14 12 0 10-8 16-16 16H130c-8 0-16-6-16-16z" fill="#c98a4b"/><path d="M120 208h420" stroke="#e8b878" stroke-width="3" stroke-linecap="round" opacity=".7"/>')
# foreground: tomatoes, chili, lemon, purple cabbage
out.append(tomato(96, 330, 44)); out.append(tomato(158, 372, 34)); out.append(tomato(58, 384, 28))
out.append('<path d="M196 384c40 8 90-4 130-34" stroke="#c62f2f" stroke-width="16" stroke-linecap="round" fill="none"/><path d="M196 384c-8-2-16 0-20 6" stroke="#2f8f3f" stroke-width="8" stroke-linecap="round" fill="none"/>')
out.append('<g><ellipse cx="516" cy="356" rx="34" ry="28" fill="#f4d03f"/><ellipse cx="506" cy="346" rx="12" ry="7" fill="#fff" opacity=".35" transform="rotate(-25 506 346)"/><path d="M548 356l8-4" stroke="#c9a227" stroke-width="5" stroke-linecap="round"/></g>')
out.append('<g><circle cx="590" cy="380" r="30" fill="#7a3a8c"/><path d="M574 366c10 6 22 6 32 0M570 384c14 8 36 8 50 0" stroke="#a468b8" stroke-width="3" fill="none" stroke-linecap="round"/></g>')
for i in range(12):
    out.append(leaf(random.uniform(40, 240), random.uniform(390, 410), random.uniform(-100, -60) if random.random() < .5 else random.uniform(60, 100), random.uniform(30, 50), random.uniform(9, 14), random.choice(greens), '#0d3d1c'))

defs = '''<defs>
<linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9a566"/><stop offset="1" stop-color="#9a6a35"/></linearGradient>
<linearGradient id="terra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d0743b"/><stop offset="1" stop-color="#8f3c17"/></linearGradient>
<radialGradient id="tom" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#ff6a4a"/><stop offset="1" stop-color="#c62f2f"/></radialGradient>
<linearGradient id="car" x1="0" x2="1"><stop offset="0" stop-color="#f7952f"/><stop offset="1" stop-color="#e2731a"/></linearGradient>
<linearGradient id="pep" x1="0" x2="1"><stop offset="0" stop-color="#e5482f"/><stop offset="1" stop-color="#b52020"/></linearGradient>
<linearGradient id="cuc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fa54a"/><stop offset="1" stop-color="#2a7d3a"/></linearGradient>
</defs>'''
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMaxYMax meet">{defs}{"".join(out)}</svg>'
with open('frontend/src/assets/hero-produce.svg', 'w') as f:
    f.write(svg)
print('hero written')