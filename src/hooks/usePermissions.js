// src/hooks/usePermissions.js
import { Platform, Alert } from 'react-native';
import { 
  PERMISSIONS, 
  RESULTS, 
  requestMultiple, 
  requestNotifications 
} from 'react-native-permissions';

export const usePermissions = () => {
  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'ios') {
        // iOS 알림 권한
        const { status: notifStatus } = await requestNotifications([
          'alert',
          'sound',
          'badge'
        ]);
        console.log("iOS 알림 권한 상태:", notifStatus);

        // iOS 카메라 + 사진 라이브러리 권한 (저장 포함)
        // const results = await requestMultiple([
        //   PERMISSIONS.IOS.CAMERA,
        //   PERMISSIONS.IOS.PHOTO_LIBRARY,
        //   PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY,
        // ]);

        // if (results[PERMISSIONS.IOS.CAMERA] !== RESULTS.GRANTED) {
        //   Alert.alert("권한 요청", "카메라 권한이 거부되었습니다.");
        // }

        // if (
        //   results[PERMISSIONS.IOS.PHOTO_LIBRARY] !== RESULTS.GRANTED &&
        //   results[PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY] !== RESULTS.GRANTED
        // ) {
        //   Alert.alert("권한 요청", "사진 라이브러리 권한이 거부되었습니다.");
        // }

      } else {
        // ANDROID
        let permissionsToRequest = [
          PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
        ];

        // if (Platform.Version >= 33) {
        //   permissionsToRequest.push(
        //     PERMISSIONS.ANDROID.READ_MEDIA_IMAGES, 
        //   );
        // } else {
        //   permissionsToRequest.push(
        //     PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
        //   );
        // }

        const results = await requestMultiple(permissionsToRequest);
        console.log("Android 권한 요청 결과:", results);

        const checkResult = (permission, message) => {
          if (results[permission] !== RESULTS.GRANTED) {
            console.warn(`[권한 경고] ${message} 권한이 거부되었습니다.`);
          }
        };
        checkResult(PERMISSIONS.ANDROID.POST_NOTIFICATIONS, "알림");

        // if (Platform.Version >= 33) {
        //   checkResult(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES, "사진/이미지");
        // } else {
        //   checkResult(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE, "저장소 쓰기");
        // }
      }
    } catch (err) {
      console.error("권한 요청 오류:", err);
    }
  };

  return { requestPermissions };
};
