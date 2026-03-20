import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform } from 'react-native';

class LocalNotificationService {
  // 푸시 알림을 초기화하고 설정하는 함수
  configure = (onOpenNotification) => {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('[LocalNotificationService] onRegister : token', token);
        if (Platform.OS === 'ios') {
          PushNotificationIOS.setApplicationIconBadgeNumber(0); // 뱃지 초기화
        }
      },
      onNotification: function (notification) {
        console.log('푸시 알림 수신:', notification);

        // 알림이 클릭된 경우 처리
        if (notification.userInteraction) {
          console.log('푸시 알림이 클릭되었습니다.');
          onOpenNotification(notification);
        } else {
          // 포그라운드 또는 백그라운드에서 알림 수신 시
          //localNotificationService.showNotification(notification);
        }

        if (Platform.OS === 'ios') {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      }.bind(this),

      // iOS 전용: 푸시 알림 권한 요청
      permissions: { alert: true, badge: true, sound: true },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Android 전용 알림 채널 생성
    if (Platform.OS === 'android') {
      this.createChannel();
    }
  };

  // Android 전용 알림 채널 생성 함수
  createChannel = () => {
    PushNotification.createChannel(
      {
        channelId: 'kshow',
        channelName: 'kshow Notifications',
        channelDescription: 'Channel for kshow notifications',
        importance: PushNotification.Importance.MAX,
        vibrate: true,
        visibility: 'public',
      },
      (created) => console.log(`알림 채널 생성됨: '${created}'`)
    );
  };

  // 수신된 푸시 알림을 표시하는 함수
  showNotification = (id, title, message, data = {}, options = {}) => {
    PushNotification.localNotification({
      channelId: 'kshow',
      title: title || '알림 제목',
      message: message || '알림 메시지 내용',
      playSound: options.playSound !== false, 
      soundName: options.soundName || 'default', 
      priority: 'max',  // 중요도와 우선순위 설정
      importance: 'max',
      visibility: 'public',
      allowWhileIdle: true,
      userInteraction: false,
      ...this.buildAndroidNotification(id, title, message, data, options),
      ...this.buildIOSNotification(id, title, message, data, options),
    });
  };

  // Android 전용 알림 설정 구성 함수
  buildAndroidNotification = (id, title, message, data = {}, options = {}) => {
    return {
      id: id,
      largeIcon: options.largeIcon || 'ic_launcher',
      smallIcon: options.smallIcon || 'ic_notification',
      bigText: message || '',
      subText: title || '',
      vibrate: options.vibrate || true,
      vibration: options.vibration || 300,
      priority: options.priority || 'high',
      importance: options.importance || 'high',
      data: data,
      ignoreInForeground: false,
    };
  };

  // iOS 전용 알림 설정 구성 함수
  buildIOSNotification = (id, title, message, data = {}, options = {}) => {
    return {
      alertAction: options.alertAction || 'view',
      category: options.category || '',
      userInfo: { id: id, item: data },
    };
  };

  // 모든 로컬 알림을 취소하는 함수
  cancelAllLocalNotifications = () => {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.removeAllDeliveredNotifications();
    } else {
      PushNotification.cancelAllLocalNotifications();
    }
  };

  // 특정 ID의 로컬 알림을 취소하는 함수
  removeDeliveredNotificationByID = (notificationId) => {
    console.log('[LocalNotificationService] removeDeliveredNotificationByID:', notificationId);
    PushNotification.cancelLocalNotifications({ id: `${notificationId}` });
  };

  // 모든 사용자에게 알림을 보내기 위한 구독 설정
  Subscribe = () => {
    console.log('구독');
    PushNotification.subscribeToTopic('all');
  };

  // 모든 사용자 알림 구독을 취소하는 함수
  UnSubscribe = () => {
    console.log('구독 취소');
    PushNotification.unsubscribeFromTopic('all');
  };

  // 모든 로컬 알림을 취소하는 함수
  AllLocalNotifications = () => {
    PushNotification.cancelAllLocalNotifications();
  };

  SubscribeToGroup = (group) => {
    console.log(`${group} 그룹에 구독합니다.`);
    PushNotification.subscribeToTopic(group);
  };
}

// LocalNotificationService 인스턴스를 생성
export const localNotificationService = new LocalNotificationService();
