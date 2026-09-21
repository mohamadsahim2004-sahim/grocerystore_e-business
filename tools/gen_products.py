import os
OUT = 'frontend/public/images/products'
FONT = 'font-family="Inter, Segoe UI, Arial, sans-serif"'

def ink(c):
    # readable text colour for the label: darken pale shades
    r, g, b = int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16)
    if (0.299 * r + 0.587 * g + 0.114 * b) > 150:
        return '#4a3510'
    return c

def wrap(body, shadow=True):
    sh = '<ellipse cx="200" cy="372" rx="105" ry="12" fill="#16261d" opacity=".12"/>' if shadow else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img">{sh}{body}</svg>'

def label(l1, l2, x, y, w, h, dark, accent, brand=True):
    cx = x + w / 2
    fs = 21 if len(l1) <= 9 else (18 if len(l1) <= 11 else 16)
    if w < 130 and len(l1) > 9:
        fs -= 2
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="#fffdf8"/>'
    if brand:
        s += f'<text x="{cx}" y="{y+26}" text-anchor="middle" {FONT} font-size="15" font-weight="800" letter-spacing="3" fill="{dark}">EXOTIC</text>'
        s += f'<rect x="{cx-18}" y="{y+34}" width="36" height="3" rx="1.5" fill="{accent}"/>'
    s += f'<text x="{cx}" y="{y+h-40}" text-anchor="middle" {FONT} font-size="{fs}" font-weight="800" fill="{ink(dark)}">{l1}</text>'
    s += f'<text x="{cx}" y="{y+h-16}" text-anchor="middle" {FONT} font-size="17" font-weight="600" fill="{accent}">{l2}</text>'
    return s

def bag(main, dark, accent, l1, l2):
    return wrap(f'''
<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="{main}"/><stop offset="1" stop-color="{dark}"/></linearGradient></defs>
<path d="M104 96h192l12 22v226a16 16 0 0 1-16 16H108a16 16 0 0 1-16-16V118z" fill="url(#g)"/>
<rect x="98" y="84" width="204" height="24" rx="5" fill="{dark}"/>
<path d="M104 92h192M104 100h192" stroke="#fff" stroke-opacity=".25" stroke-width="2" stroke-dasharray="3 5"/>
<path d="M120 120v230" stroke="#fff" stroke-opacity=".18" stroke-width="10" stroke-linecap="round"/>
{label(l1,l2,128,176,144,136,dark,accent)}''')

def jar(main, dark, accent, l1, l2, lid='#c9a227'):
    return wrap(f'''
<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="{main}"/><stop offset="1" stop-color="{dark}"/></linearGradient></defs>
<rect x="128" y="78" width="144" height="34" rx="8" fill="{lid}"/>
<rect x="128" y="100" width="144" height="8" fill="#000" opacity=".12"/>
<path d="M136 112h128c14 0 26 12 26 26v190c0 18-14 32-32 32H142c-18 0-32-14-32-32V138c0-14 12-26 26-26z" fill="url(#g)"/>
<path d="M132 130v190" stroke="#fff" stroke-opacity=".3" stroke-width="10" stroke-linecap="round"/>
{label(l1,l2,140,178,120,128,dark,accent)}''')

def bottle(main, dark, accent, l1, l2, cap='#3aa24f'):
    return wrap(f'''
<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="{main}"/><stop offset="1" stop-color="{dark}"/></linearGradient></defs>
<rect x="172" y="40" width="56" height="34" rx="6" fill="{cap}"/>
<rect x="178" y="70" width="44" height="34" fill="url(#g)"/>
<path d="M178 100c-40 14-66 34-66 66v168c0 18 14 32 32 32h112c18 0 32-14 32-32V166c0-32-26-52-66-66z" fill="url(#g)"/>
<path d="M134 176v150" stroke="#fff" stroke-opacity=".35" stroke-width="9" stroke-linecap="round"/>
{label(l1,l2,142,190,116,130,dark,accent)}''')

def box(main, dark, accent, l1, l2):
    return wrap(f'''
<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="{main}"/><stop offset="1" stop-color="{dark}"/></linearGradient></defs>
<path d="M96 96l40-22h188l-32 22z" fill="{accent}"/>
<path d="M296 96l28-22v264l-28 30z" fill="{dark}"/>
<rect x="96" y="96" width="200" height="268" rx="4" fill="url(#g)"/>
<path d="M112 110v240" stroke="#fff" stroke-opacity=".2" stroke-width="8" stroke-linecap="round"/>
{label(l1,l2,116,150,160,150,dark,accent)}
<circle cx="196" cy="326" r="14" fill="#fffdf8" opacity=".9"/><path d="M190 326h12M196 320v12" stroke="{dark}" stroke-width="2.5" stroke-linecap="round"/>''')

def pouch(main, dark, accent, l1, l2):
    return wrap(f'''
<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="{main}"/><stop offset="1" stop-color="{dark}"/></linearGradient></defs>
<path d="M112 84c30 10 146 10 176 0l16 32-8 226c0 14-10 24-24 24H128c-14 0-24-10-24-24l-8-226z" fill="url(#g)"/>
<path d="M112 84c30 10 146 10 176 0" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none" stroke-dasharray="4 5"/>
<path d="M126 128v200" stroke="#fff" stroke-opacity=".2" stroke-width="9" stroke-linecap="round"/>
{label(l1,l2,128,172,144,138,dark,accent)}''')

items = [
    ('basmati-rice-5kg',     bag,    ('#17604a', '#0d3d2e', '#b8871d', 'Basmati Rice', '5 kg')),
    ('red-lentils-1kg',      bag,    ('#e9772b', '#b8501a', '#b8501a', 'Red Lentils', '1 kg')),
    ('coconut-oil-1l',       bottle, ('#f6e7b4', '#dcc27a', '#7a5a12', 'Coconut Oil', '1 L')),
    ('mango-pickle-400g',    jar,    ('#e0592f', '#a52d14', '#a52d14', 'Mango Pickle', '400 g')),
    ('masala-tea-200g',      box,    ('#2f6fb4', '#1d4a7e', '#c9891f', 'Masala Tea', '200 g')),
    ('chickpeas-1kg',        bag,    ('#d9b26a', '#a8802f', '#8a5f12', 'Chickpeas', '1 kg')),
    ('green-cardamom-100g',  jar,    ('#6fae4b', '#3f7a2a', '#2f6a1c', 'Cardamom', '100 g')),
    ('curry-powder-200g',    pouch,  ('#e8b21f', '#b7830b', '#8a5f0a', 'Curry Powder', '200 g')),
    ('ghee-500g',            jar,    ('#f1c453', '#c8901c', '#7a4f08', 'Pure Ghee', '500 g')),
    ('cinnamon-sticks-100g', bag,    ('#a5622f', '#6f3a17', '#6f3a17', 'Cinnamon', '100 g')),
]
os.makedirs(OUT, exist_ok=True)
for slug, fn, args in items:
    with open(f'{OUT}/{slug}.svg', 'w') as f:
        f.write(fn(*args))
print(len(items), 'files written to', OUT)