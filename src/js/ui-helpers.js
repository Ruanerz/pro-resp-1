// Shared UI helper functions
export function showLoader(show) {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = show ? 'block' : 'none';
}

export function showError(msg) {
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) {
    errorMessage.textContent = msg;
    errorMessage.style.display = 'block';
  }
}

export function hideError() {
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) errorMessage.style.display = 'none';
}

export function setQtyInputValue(val) {
  const input = document.getElementById('qty-global');
  if (!input) return;
  if (typeof window._qtyInputValue !== 'undefined') {
    input.value = window._qtyInputValue;
  } else {
    input.value = window.globalQty;
  }
}

export function getQtyInputValue() {
  const input = document.getElementById('qty-global');
  return input ? parseInt(input.value, 10) : 1;
}
