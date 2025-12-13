import { Platform, Alert } from 'react-native';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * 웹과 모바일 모두에서 작동하는 알림 함수
 */
export const showAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[]
) => {
  if (Platform.OS === 'web') {
    // 웹에서는 window.alert와 window.confirm 사용
    try {
      if (buttons && buttons.length > 1) {
        // 확인/취소 버튼이 있는 경우
        const confirmMessage = message ? `${title}\n\n${message}` : title;
        const result = window.confirm(confirmMessage);
        
        if (result) {
          // 확인 버튼 (첫 번째 non-cancel 버튼)
          const confirmButton = buttons.find(btn => btn.style !== 'cancel');
          confirmButton?.onPress?.();
        } else {
          // 취소 버튼
          const cancelButton = buttons.find(btn => btn.style === 'cancel');
          cancelButton?.onPress?.();
        }
      } else {
        // 단순 알림
        const alertMessage = message ? `${title}\n\n${message}` : title;
        window.alert(alertMessage);
        buttons?.[0]?.onPress?.();
      }
    } catch (error) {
      console.error('웹 알림 오류:', error);
      // 웹에서 window 객체 접근 실패 시 콘솔 로그로 대체
      console.log(`알림: ${title}${message ? ` - ${message}` : ''}`);
      buttons?.[0]?.onPress?.();
    }
  } else {
    // 모바일에서는 기존 Alert.alert 사용
    Alert.alert(title, message, buttons);
  }
};

/**
 * 단순 알림 (확인 버튼만)
 */
export const showSimpleAlert = (title: string, message?: string, onPress?: () => void) => {
  showAlert(title, message, [{ text: '확인', onPress }]);
};

/**
 * 확인/취소 알림
 */
export const showConfirmAlert = (
  title: string,
  message?: string,
  onConfirm?: () => void,
  onCancel?: () => void
) => {
  showAlert(title, message, [
    { text: '취소', style: 'cancel', onPress: onCancel },
    { text: '확인', onPress: onConfirm }
  ]);
};