import Toast from 'react-native-toast-message';

export type ToastType = 'success' | 'info' | 'error' | 'warning';

export function showToast(type: ToastType, text: string, opts?: { position?: 'top' | 'bottom'; visibilityTime?: number }) {
  Toast.show({ type, text1: text, position: opts?.position ?? 'top', visibilityTime: opts?.visibilityTime ?? 2500 });
}

export function showSuccessToast(message: string) {
  showToast('success', message);
}

export function showErrorToast(message: string) {
  showToast('error', message);
}

export function showInfoToast(message: string) {
  showToast('info', message);
}

export function showWarningToast(message: string) {
  showToast('warning', message);
}
