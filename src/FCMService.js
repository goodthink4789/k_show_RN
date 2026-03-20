import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

let change_url = '';
class FCMService {
  register = (onRegister, onNotification, onOpenNotification) => {
    this.checkPermission(onRegister);
    this.createNotificationListeners(
      onRegister,
      onNotification,
      onOpenNotification,
    );
  };

  registerAppWithFCM = async () => {
    if (Platform.OS === 'ios') {
      // await messaging().registerDeviceForRemoteMessages();
      await messaging().setAutoInitEnabled(true);
    }
  };

  checkPermission = (onRegister) => {
    messaging()
      .hasPermission()
      .then((enabled) => {
        if (enabled) {
          //User has permission
          this.getToken(onRegister);
        } else {
          //User doesn't have permission
          this.requestPermission(onRegister);
        }
      })
      .catch((error) => {
        console.log('[FCMService] Permission rejected ', error);
      });
  };

  getToken = (onRegister) => {
    console.log('[FCMService] Attempting to retrieve FCM token...');
    
    messaging()
      .getToken()
      .then((fcmToken) => {
        if (fcmToken) {
          console.log('[FCMService] Successfully retrieved token:', fcmToken);
          onRegister(fcmToken);
        } else {
          console.warn('[FCMService] No device token found. Ensure the user has enabled notifications.');
          onRegister(null); // 토큰이 없을 경우 null 반환
        }
      })
      .catch((error) => {
        console.error('[FCMService] Error retrieving token:', error.message, error);
        onRegister(null); // 에러 발생 시 null 반환
      });
  };

  requestPermission = (onRegister) => {
    messaging()
      .requestPermission()
      .then(() => {
        this.getToken(onRegister);
      })
      .catch((error) => {
        console.log('[FCMService] Request Permission rejected', error);
      });
  };

  deleteToken = () => {
    console.log('[FCMService] deleteToken');
    messaging()
      .deleteToken()
      .catch((error) => {
        console.log('[FCMService] Delete token error', error);
      });
  };

  iosSubscribe = () => {
    messaging().subscribeToTopic('all');
  };

  iosUnSubscribe = () => {
    messaging().unsubscribeFromTopic('all');
  };
  iosSubscribeToGroup = (group) => {
    console.log(`${group} 그룹에 구독합니다.`);
    messaging.subscribeToTopic(group);
  };

  createNotificationListeners = (
    onRegister,
    onNotification,
    onOpenNotification,
  ) => {
    //실행중이지만 현재화면은 다른 앱이 실행중이거나 아무것도 실행하지않을때
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log(
        '[FCMService] onNotificationOpenApp Notification caused app to open from background',
        remoteMessage,
      );
      if (remoteMessage) {
        const notification = remoteMessage;
        //onOpenNotification(notification);
        //this.removeDeliveredNotification(Notification.NotificationId)
      } else {
        //console.log('background notification error', error);
      }
      //alert(remoteMessage.body);
    });

    //Check whether an initial notification is available
    //앱이 실행중이 아닐때
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        console.log(
          '[FCMService] getInitialNotification casued app to open from quit state : fcmremoteMessage :',
          remoteMessage,
        );

        if (remoteMessage) {
          const notification = remoteMessage;
          //onOpenNotification(notification);
          //this.removeDeliveredNotification(notification.notificationId)
        } else {
          //console.log('quit state notification error : ', error);
        }
      });

    //실행중이고 현재 화면일때
    this.messageListener = messaging().onMessage(async (remoteMessage) => {
      console.log('[FCMService] A new FCM message arrived', remoteMessage);
      if (remoteMessage) {
        let notification = null;
        if (Platform.OS === 'ios') {
          // notification = remoteMessage.data.notification;
          notification = remoteMessage.notification;
        } else {

          notification = remoteMessage.notification;
        }
        console.log(remoteMessage);
        onNotification(remoteMessage);
      }
    });

    //Triggerd when have new token
    messaging().onTokenRefresh((fcmToken) => {
      console.log('[FCMService] New token refresh :', fcmToken);
      onRegister(fcmToken);
    });
  };

  unRegister = () => {
    this.messageListener();
  };

}

export const fcmService = new FCMService();