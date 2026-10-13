// Address validation for the checkout form.
// Mirrors backend/utils/addressValidation.js exactly - keep the rules and messages in sync with that file.

const SRI_LANKA = /^(sri\s*lanka|srilanka|lk|lka)$/i;

export const isSriLanka = (country) => SRI_LANKA.test(String(country || '').trim());

const PHONE_CHARS = /^\+?[\d\s().-]+$/;

// Returns the 9-digit national number (without the leading 0) or '' when the format is not Sri Lankan.
// Accepted: 07XXXXXXXX, +947XXXXXXXX, 947XXXXXXXX, 00947XXXXXXXX and landlines such as 0112345678.
function sriLankanNational(raw, digits) {
  let national = '';
  if (raw.startsWith('+')) {
    if (!digits.startsWith('94')) return '';
    national = digits.slice(2);
  } else if (digits.startsWith('0094')) {
    national = digits.slice(4);
  } else if (digits.startsWith('94') && digits.length === 11) {
    national = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length === 10) {
    national = digits.slice(1);
  } else {
    return '';
  }
  // "+94 (0) 77 123 4567" style: tolerate the optional trunk 0 after the country code
  if (national.length === 10 && national.startsWith('0')) national = national.slice(1);
  return /^[1-9]\d{8}$/.test(national) ? national : '';
}

// -> error message, or '' when valid
export function phoneError(phone, country) {
  const raw = String(phone || '').trim();
  if (!raw) return 'Phone number is required';
  const digits = raw.replace(/\D/g, '');
  if (isSriLanka(country)) {
    if (!PHONE_CHARS.test(raw) || !sriLankanNational(raw, digits)) {
      return 'Enter a valid Sri Lankan phone number, e.g. 0771234567 or +94771234567';
    }
    return '';
  }
  if (!PHONE_CHARS.test(raw) || digits.length < 7 || digits.length > 15) {
    return 'Enter a valid phone number';
  }
  return '';
}

// -> error message, or '' when valid
export function postalCodeError(postalCode, country) {
  const code = String(postalCode || '').trim();
  if (!code) return 'Postal code is required';
  if (isSriLanka(country)) {
    return /^\d{5}$/.test(code) ? '' : 'Enter a valid 5-digit postal code, e.g. 10100';
  }
  return /^[A-Za-z0-9][A-Za-z0-9 -]{1,11}$/.test(code) ? '' : 'Enter a valid postal code';
}