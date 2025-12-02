import Toast from 'react-native-toast-message';

export type ToastType = 'success' | 'info' | 'error';

export function showToast(type: ToastType, text: string, opts?: { position?: 'top' | 'bottom'; visibilityTime?: number }) {
  Toast.show({ type, text1: text, position: opts?.position ?? 'top', visibilityTime: opts?.visibilityTime ?? 1700 });
}

