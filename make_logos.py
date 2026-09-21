import sys
import os
import numpy as np
from PIL import Image

src, out_root = sys.argv[1], sys.argv[2]
DARK_GREEN = np.array([15, 77, 46], dtype=np.uint8)   # #0f4d2e brand primary style

# Load the target square logo image asset cleanly
im = Image.open(src).convert('RGBA')
width, height = im.size
img_data = np.array(im)

r, g, b, a = img_data[..., 0], img_data[..., 1], img_data[..., 2], img_data[..., 3]

# Isolate background grid elements perfectly without touching the artwork bounds
# This targets the gray grid pixels while leaving text and leaf colors completely untouched
bg_mask = (r > 90) & (g > 90) & (b > 90) & (np.abs(r.astype(int) - g.astype(int)) < 15) & ~((g - np.maximum(r, b) > 10))

def build_variant(tone):
    # Copy the absolute original image color data exactly to preserve textures and design integrity
    new_img = img_data.copy()
    
    if tone == 'dark':
        # Dark surface layout: Re-map background pixels to solid brand green
        new_img[bg_mask, 0] = DARK_GREEN[0]
        new_img[bg_mask, 1] = DARK_GREEN[1]
        new_img[bg_mask, 2] = DARK_GREEN[2]
        new_img[bg_mask, 3] = 255
    else:
        # Light surface navbar header layout: Turn background completely transparent
        new_img[bg_mask, 3] = 0 
        
    return Image.fromarray(new_img, 'RGBA')

# Target asset output destinations matching folder expectations
logo_dir = os.path.join(out_root, 'src', 'assets', 'logo')
os.makedirs(logo_dir, exist_ok=True)
os.makedirs(os.path.join(out_root, 'public'), exist_ok=True)

# Generate individual responsive design variations
dark_version = build_variant('dark')
white_version = build_variant('white')

# FIX: Modified dimensions from 480x158 to a square 300x300 canvas to match your new logo source aspect ratio
dark_version.resize((300, 300), Image.Resampling.LANCZOS).save(os.path.join(logo_dir, 'exotic-logo.png'), optimize=True)
white_version.resize((300, 300), Image.Resampling.LANCZOS).save(os.path.join(logo_dir, 'exotic-logo-white.png'), optimize=True)
dark_version.resize((300, 300), Image.Resampling.LANCZOS).save(os.path.join(logo_dir, 'exotic-wordmark.png'), optimize=True)
white_version.resize((300, 300), Image.Resampling.LANCZOS).save(os.path.join(logo_dir, 'exotic-wordmark-white.png'), optimize=True)

# Build Browser Tab Favicon Icon
fav_mark = white_version.copy()
fav_mark.thumbnail((56, 56), Image.Resampling.LANCZOS)
favicon = Image.new('RGBA', (64, 64), (255, 255, 255, 0))
favicon.alpha_composite(fav_mark, ((64 - fav_mark.width) // 2, (64 - fav_mark.height) // 2))
favicon.save(os.path.join(out_root, 'public', 'favicon.png'), optimize=True)

print('done')
