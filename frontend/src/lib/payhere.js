import api from '../api/client';

// Only these PayHere checkout pages may receive the payment form
const ALLOWED_CHECKOUT_URLS = ['https://sandbox.payhere.lk/pay/checkout', 'https://www.payhere.lk/pay/checkout'];
const PENDING_KEY = 'exotic_payhere_order';

// PayHere does not tell the return page which order it was, so the id is also kept for the browser session
export const rememberPendingOrder = (orderId) => {
  try {
    sessionStorage.setItem(PENDING_KEY, orderId);
  } catch {
    /* storage unavailable */
  }
};
export const getPendingOrder = () => {
  try {
    return sessionStorage.getItem(PENDING_KEY) || '';
  } catch {
    return '';
  }
};
export const forgetPendingOrder = () => {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* storage unavailable */
  }
};

// Posts the server-generated fields to PayHere in the browser (a normal HTML form POST, as the Checkout API requires)
export function submitPayHereForm({ checkoutUrl, params }) {
  if (!ALLOWED_CHECKOUT_URLS.includes(checkoutUrl)) {
    throw new Error('Unexpected payment gateway address. Payment was not started.');
  }
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = checkoutUrl;
  form.style.display = 'none';
  Object.entries(params).forEach(([name, value]) => {
    if (value === undefined || value === null) return;
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = String(value);
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

// Asks the backend for the signed PayHere fields for an existing order, then leaves for PayHere.
// Amount, customer and hash all come from the server - nothing payment-related is computed here.
export async function startPayHerePayment(orderId) {
  const { data } = await api.post('/payments/payhere/params', { orderId });
  rememberPendingOrder(orderId);
  submitPayHereForm(data);
}