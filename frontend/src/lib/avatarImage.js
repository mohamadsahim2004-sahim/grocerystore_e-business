// Turns a photo picked by the user into a small square JPEG data URL that is safe to send to
// PUT /api/profile/avatar. Runs entirely in the browser (canvas): it crops to a centred square, resizes,
// flattens transparency onto white and lowers the JPEG quality until the result is small enough.
// The server validates everything again, so this is for size and convenience, not for trust.

export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_INPUT_BYTES = 8 * 1024 * 1024; // refuse absurdly large originals before decoding
const MAX_OUTPUT_LENGTH = 60000; // characters of the data URL (server limit is 70000)
const SIZES = [256, 160];
const QUALITIES = [0.9, 0.8, 0.7, 0.6, 0.5];

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as an image.'));
    };
    img.src = url;
  });

export async function prepareAvatar(file) {
  if (!file || !ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Please choose a JPEG, PNG or WebP image.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('That image is too large (maximum 8 MB).');
  }

  const img = await loadImage(file);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  if (!side) throw new Error('That file could not be read as an image.');
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) / 2;

  for (const size of SIZES) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

    for (const quality of QUALITIES) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= MAX_OUTPUT_LENGTH) return dataUrl;
    }
  }
  throw new Error('That image is too detailed to use. Please choose a simpler photo.');
}
