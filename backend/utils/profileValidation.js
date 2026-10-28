// Validation for PUT /api/profile. Only name, email and phone can ever be edited through the profile form;
// everything else in the request body (role, isActive, password, addresses, ...) is ignored on purpose.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\-\s\d]+$/;

const LIMITS = {
  nameMin: 2,
  nameMax: 100,
  emailMax: 254,
  phoneMax: 20,
  phoneMinDigits: 7
};

// Trim and collapse repeated whitespace; non-strings become null so they are rejected rather than coerced.
const clean = (value) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : null);

// Returns { data, errors }. `data` holds only the editable fields that were sent, normalised;
// `errors` maps field name -> message and is empty when the input is valid.
function validateProfileUpdate(body) {
  const input = body && typeof body === 'object' ? body : {};
  const data = {};
  const errors = {};

  if (input.name !== undefined) {
    const name = clean(input.name);
    if (name === null || name.length < LIMITS.nameMin || name.length > LIMITS.nameMax) {
      errors.name = `Name must be between ${LIMITS.nameMin} and ${LIMITS.nameMax} characters`;
    } else {
      data.name = name;
    }
  }

  if (input.email !== undefined) {
    const email = clean(input.email);
    const normalized = email === null ? null : email.toLowerCase();
    if (normalized === null || normalized.length > LIMITS.emailMax || !EMAIL_PATTERN.test(normalized)) {
      errors.email = 'Please enter a valid email address';
    } else {
      data.email = normalized;
    }
  }

  if (input.phone !== undefined && input.phone !== null) {
    const phone = clean(input.phone);
    if (
      phone === null ||
      (phone &&
        (!PHONE_PATTERN.test(phone) ||
          phone.length > LIMITS.phoneMax ||
          phone.replace(/\D/g, '').length < LIMITS.phoneMinDigits))
    ) {
      errors.phone = 'Please enter a valid phone number';
    } else {
      data.phone = phone;
    }
  } else if (input.phone === null) {
    data.phone = '';
  }

  return { data, errors };
}

module.exports = { validateProfileUpdate, LIMITS };
