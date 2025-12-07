import * as ImagePicker from 'expo-image-picker';
import {storage} from '@/config/firebase';
import {ref, uploadBytes, getDownloadURL} from 'firebase/storage';
import {Alert, ActionSheetIOS, Platform} from 'react-native';

export const imageService = {
  // 이미지 선택 (카메라/갤러리)
  async pickImage(): Promise<string | null> {
    return new Promise(resolve => {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['취소', '카메라로 촬영', '갤러리에서 선택'],
            cancelButtonIndex: 0,
          },
          async buttonIndex => {
            if (buttonIndex === 1) {
              const result = await this.launchCamera();
              resolve(result);
            } else if (buttonIndex === 2) {
              const result = await this.launchGallery();
              resolve(result);
            } else {
              resolve(null);
            }
          },
        );
      } else {
        // Android의 경우 Alert 사용
        Alert.alert('프로필 사진 변경', '사진을 어디서 가져올까요?', [
          {text: '취소', style: 'cancel', onPress: () => resolve(null)},
          {
            text: '카메라',
            onPress: async () => {
              const result = await this.launchCamera();
              resolve(result);
            },
          },
          {
            text: '갤러리',
            onPress: async () => {
              const result = await this.launchGallery();
              resolve(result);
            },
          },
        ]);
      }
    });
  },

  // 카메라 실행
  async launchCamera(): Promise<string | null> {
    const {status} = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  },

  // 갤러리 실행
  async launchGallery(): Promise<string | null> {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  },

  // Firebase Storage에 이미지 업로드
  async uploadProfilePicture(userId: string, imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const filename = `profile-pictures/${userId}/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      return downloadURL;
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      throw error;
    }
  },
};
