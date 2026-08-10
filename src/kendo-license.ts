import { setScriptKey } from '@progress/kendo-licensing';

// Set KendoReact license from environment variable
const licenseKey = import.meta.env.VITE_KENDO_UI_LICENSE;

if (licenseKey) {
  setScriptKey(licenseKey);
} else {
  console.warn('KendoReact license key not found. Set VITE_KENDO_UI_LICENSE in .env file.');
}


