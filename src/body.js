import React, {useEffect, useRef, useState} from 'react';
import {WebView} from 'react-native-webview';
import RNExitApp from 'react-native-exit-app';
import {
  AppState,
  SafeAreaView,
  TouchableWithoutFeedback,
  BackHandler,
  Linking,
  ToastAndroid,
  Platform, View,
  PermissionsAndroid,
} from "react-native";
import LinkingAndroid from 'react-native-intent-linking';
import {fcmService} from './FCMService';
import { localNotificationService } from './localNotificationService';
//import PushNotification from 'react-native-push-notification';
import SplashScreen from 'react-native-splash-screen';
import {usePermissions} from './hooks/usePermissions';
import { isExternalScheme, handleExternalScheme } from './utils/schemeHandler';
import BlobUtil from 'react-native-blob-util';
// import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';


const header = {
  'Content-Type': 'application/json; charset=utf-8',
  Accept: '*/*',
};

const body = () => {
  const ref = useRef();
  const [web, setWeb] = useState({
    // url: Platform.OS === 'android' ? 'https://jme070111.mycafe24.com/front/Main/AndReturn' : 'https://jme070111.mycafe24.com/front/Main',
    //url: 'https://sa.awsome-app.kr/parent/Member/Login',
    url: 'https://k-show.world',
    idx: 0
  });
  const [link, setLink] = useState('');
  const [navState, setNavState] = useState();
  const [fcmToken, setFcmToken] = useState('');
  const [change, setChange] = useState(false);
  const [onLoad, setLoad] = useState(false);
  const [uAgent, setUAgent] = useState('');
  const { requestPermissions } = usePermissions();
  const [refreshing, setRefreshing] = useState(false);
  

  const requestAndroidNotificationPermission = async () => {
    if (Platform.OS !== 'android') return;
    if (Platform.Version < 33) return;
  
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
  
    console.log('[Android] POST_NOTIFICATIONS:', granted);
  };

  useEffect(() => {
    SplashScreen.hide();
    console.log('useEffect 호출됨 - requestPermissions 시작');
    requestPermissions();
    if (Platform.OS === 'android') {
      setUAgent('Mozilla/5.0 (Linux; Android 9; kshow; Android SDK built for x86_64 Build/PSR1.180720.122;) AppleWebKit/537.36 (KHTML, like Gecko) Version/8.0 Chrome/69.0.3497.100 Mobile Safari/537.36');
    } else if (Platform.OS === 'ios') {
      setUAgent('Mozilla/5.0 (iPhone; kshow; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1');
    }
    // console.log('CameraRoll object:', CameraRoll);

    if (Platform.OS === 'android') {
      setTimeout(() => {
        requestAndroidNotificationPermission();
      }, 500);
    }

    fcmService.registerAppWithFCM();
    fcmService.register(onRegister, onNotification, onOpenNotification);
    localNotificationService.configure(onOpenNotification);

    function onRegister(token) {
      console.log('[App] onRegister : token :', token);
      setFcmToken(token);
    }

    function onNotification(notify) {
      console.log('[App] onNotification : notify11222 :', notify);

      let sound = 'default';
      let channelId = 'kshow'; // 기본값

      if (Platform.OS === 'android') {
        // 안드로이드
        if (notify?.notification?.android?.sound) {
          sound = notify.notification.android.sound; // "chulcheck"
        } else if (notify.soundName) {
          sound = notify.soundName;
        }

        if (notify?.notification?.android?.channelId) {
          channelId = notify.notification.android.channelId;
        }
      } else if (Platform.OS === 'ios') {
        // iOS
        if (notify?.notification?.sound) {
          // FCM payload: "sound": "chulcheck"
          // iOS는 반드시 확장자까지 필요 → .caf
          sound = notify.notification.sound.endsWith('.caf')
            ? notify.notification.sound
            : `${notify.notification.sound}.caf`;
        } else if (notify.soundName) {
          sound = notify.soundName;
        }
      }

      const options = {
        soundName: sound,
        channelId: channelId,
        playSound: true,
      };

      localNotificationService.showNotification(
        0,
        notify.notification?.title || notify.title,
        notify.notification?.body || notify.message,
        notify,
        options,
      );
    }

    function onOpenNotification(alertAction, notify, foreground) {
      console.log('alertAction :', alertAction);
      console.log('notify :', notify);
      console.log('foregroundlink22222 :', foreground);
       
      if( Platform.OS === 'android'){
        console.log('foreground :', foreground);
        if(foreground === false){
          console.log('백그라운드 및 종료', notify);

                console.log('페이지 이동', notify);
                // setWeb({ url: notify });
                setLink(notify);
                setChange(true);

        } else {
          console.log('앱 실행중');
          if( alertAction === 'view'){
            //setWeb({url: notify})
            setLink(notify);
            setChange(true);
          }
        }
      }
      else{
        if(notify === true){
         setChange(true);
        } else {
          console.log('link :', notify);
          saveLink(notify);
        }
      }

    }

    setTimeout(() => {
      if (Platform.OS === 'android') {
        SplashScreen.hide();
      } 
    }, 1000);
    return () => {
      console.log('[App] unRegister');
      if(Platform.OS === 'ios'){
        fcmService.unRegister();
      }else{
        localNotificationService.AllLocalNotifications();
      }
    };
  }, []);

  const saveLink =(url)=>{
    console.log('saveLink :', url);
    setLink(url);
  }

  useEffect(()=>{
    if(link){
      console.log('link22222 :', link);
    }
  }, [link]);

  useEffect(()=>{
    if(onLoad){
      if(change){
        setTimeout(() => {
          setWeb((prevState) => ({ url: link, idx: prevState.idx + 1 }));
          console.log('setTimeout 11',link);
          setLink('');
          setChange(false);
        }, 1000); 
      }
    }

  }, [change]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        console.log("앱 활성화됨");

        // iOS만 reload 필요
        if (Platform.OS === 'ios') {
          setTimeout(() => {
            if (ref.current) {
              console.log('iOS WebView reloaded after resume');
              ref.current.reload();
            }
          }, 600);
        }
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(()=>{
    if(onLoad){
      if(change) {
        setTimeout(() => {
          setWeb((prevState) => ({ url: link, idx: prevState.idx + 1 }));
          console.log('setTimeout 22',link);
          setLink('');
          setChange(false);
        }, 1000);
      }
    };
  }, [onLoad]);

  useEffect(() => {
    const onAndroidBackPress = () => {
      if (navState?.canGoBack) {
        ref.current?.goBack();
        return true;
      } else if (ref.exitApp === undefined || ref.exitApp === false) {
        ToastAndroid.show(
          '‘뒤로’ 버튼을 한번 더 누르시면 종료됩니다.',
          ToastAndroid.SHORT,
        );
        ref.exitApp = true;
        ref.timeout = setTimeout(() => {
          ref.exitApp = false;
        }, 2000);
      } else {
        clearTimeout(ref.timeout);
        RNExitApp.exitApp();
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onAndroidBackPress,
    );

    return () => backHandler.remove();
  }, [navState?.canGoBack]);

  //스와이프 새로고침
  // const handleRefresh = async () => {
  //   console.log('[RN] 스와이프 새로고침 실행됨');
  //   setRefreshing(true);
  //   try {
  //     ref.current?.postMessage(JSON.stringify({ type: 'refresh_student' }));
  //   } catch (err) {
  //     console.error('refresh_student 메시지 전송 실패:', err);
  //   } finally {
  //     setTimeout(() => setRefreshing(false), 1200);
  //   }
  // };

  const onNavigationStateChange = navState => {
    console.log('onNavigationStateChange : ', navState.url);
      if ( navState.url.startsWith('http://') ||navState.url.startsWith('https://')) {
        if(Platform?.OS === 'ios' && navState.url.includes('Login')){
          ref.current?.postMessage(JSON.stringify({ type: 'Simasa' }));
        }
          ref.canGoBack = navState.canGoBack;
          setNavState(navState);
          //setWeb((prevState) => ({ url: navState.url, idx: prevState.idx + 1 }));
          return true;
      }
  };
  const onShouldStartLoadWithRequest = (event) => {
    const url = event.url;
    console.log('onShouldStartLoadWithRequest : ', url);
    
    // 1. 불필요한 로딩 차단
    if (url === 'about:blank' || url.includes('ssl.pstatic.net/tveta')) {
      return false;
    }
  
    // 2. 전화 걸기 처리
    if (url.startsWith('tel:')) {
      Linking.openURL(url).catch(err => console.error('전화 실패:', err));
      return false;
    }
  
    // 3. 외부 앱 스킴 통합 처리 (카카오톡, 결제, intent 등)
    // 기존에 분산되어 있던 kakaotalk, intent 체크를 isExternalScheme 내부로 몰아넣으세요.
    if (isExternalScheme(url) || url.startsWith('kakaotalk://') || url.startsWith('intent://')) {
      console.log('[RN] 외부 앱 실행 시도:', url);
      handleExternalScheme(url); // 인코딩 및 마켓 이동 로직이 포함된 함수 호출
      return false; // 웹뷰 로딩 중단 (에러 페이지 방지 핵심)
    }
  
    // 4. 일반 웹 페이지 로딩
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return true;
    }
  
    console.log('Unhandled URL, skipping:', url);
    return false;
  };

  //웹과 웹뷰 간에 메시지 통신처리
  const _onMessage = (e) => {
    console.log('_onMessage :', e.nativeEvent.data);
    try {
      const rawMessage = e.nativeEvent.data; 
      // JSON 형식인지 확인
      let message;
      try {
        message = JSON.parse(rawMessage); // JSON 메시지 파싱 시도
      } catch {
        console.warn("[App] Non-JSON message received, fallback to string parsing.");
        const parsedMessage = rawMessage.split('|');
        if (parsedMessage.length > 1) {
          message = { type: parsedMessage[0], data: parsedMessage.slice(1).join('|') };
        } else {
          throw new Error("[App] Invalid string message format.");
        }
      }
      // 메시지 타입에 따라 처리
      switch (message.type) {
        case "FCM_REQUEST": {
          // 웹에서 FCM 토큰 요청 처리
          fcmService.getToken((token) => {
            if (token) {
              const response = JSON.stringify({ type: "FCM", data: { fcmToken: token } });
              console.log("[App] Sending FCM Token to WebView:", response);
              ref.current.postMessage(response); // WebView로 전송
            } else {
              console.warn("[App] FCM Token is null or undefined.");
            }
          });
          break;
        }
        case "FCM": {
          // FCM 관련 작업 처리
          const action = message.action; // action: "Login", "Join", etc.
          const data = message.data || {};

          switch (action) {
              case "Login": {
                  // FCM 로그인 관련 로직 처리
                  const memberType = data.memberType;
                  console.log("[App] Handling FCM Login for memberType:", memberType);
                  handleFCMSubscription(memberType); // 예: 토픽 구독 처리
                  break;
              }
              case "Join": {
                  // FCM 회원가입 관련 로직 처리
                  const memberType = data.memberType;
                  console.log("[App] Handling FCM Join for memberType:", memberType);
                  handleFCMSubscription(memberType); // 예: 토픽 구독 처리
                  break;
              }
              default: {
                  console.warn("[App] Unknown FCM action:", action);
              }
          }
          break;
        }
        case "SHARE": {
          const shareUrl = message.url || message.data?.url;
          const shareTitle = message.title || message.data?.title || 'Shared Link';
        
          if (shareUrl) {
            Share.open({
              title: shareTitle,
              message: `${shareTitle}\n${shareUrl}`
            })
            .then((res) => {
              console.log('[App] Share success:', res);
            })
            .catch((err) => {
              if (err && err.message !== 'User did not share') {
                console.error('[App] Share error:', err); // ← 바로 이 부분
              }
            });
          } else {
            console.warn('[App] No URL to share.');
          }
          break;
        }
  
        case "Another": {
          // 외부 링크 처리
          const externalUrl = message.data?.url || message.data;
          if (!externalUrl) {
            console.warn("[App] 'Another' message received without URL.");
            break;
          }
  
          if (Platform.OS === 'android') {
            LinkingAndroid?.canOpenURL(externalUrl).then((res) => {
              if (res) {
                LinkingAndroid.openURL(externalUrl);
              } else {
                Linking.openURL(externalUrl).catch((err) => {
                  console.error("[App] Error opening URL on Android:", err);
                  alert("앱 실행이 실패했습니다. 설치 상태를 확인해주세요.");
                });
              }
            });
          } else if (Platform.OS === 'ios') {
            Linking.openURL(externalUrl).catch((err) => {
              console.error("[App] Error opening URL on iOS:", err);
              alert("앱 실행이 실패했습니다. 설치 상태를 확인해주세요.");
            });
          }
          break;
        }
        case "download": {
          const fileUrl = message.url || message.data?.url || message.data;
          if (!fileUrl) {
            console.warn("[App] 'down' message received without URL.");
            break;
          }
          downloadFile(fileUrl);
          break;
        }
        // case "openCamera": {
        //   handleCamera();
        //   break;
        // }
        default:
          console.log("[App] Unknown Message Type:", message.type);
      }
      
    } catch (error) {
      console.error("[App] Message Handling Error:", error);
    }
  };

  const handleFCMSubscription = (memberType) => {
    if (!memberType) {
      console.warn("No memberType provided for FCM subscription.");
      return;
    }
  
    // if (Platform.OS === 'android') {
    //   localNotificationService.Subscribe(); // 기본 토픽 구독
    //   if (memberType === "MM001") {
    //     localNotificationService.SubscribeToGroup("M1");
    //   } else if (memberType === "MM002") {
    //     localNotificationService.SubscribeToGroup("M2");
    //   }
    // } else {
    //   fcmService.iosSubscribe(); // 기본 토픽 구독
    //   if (memberType === "MM001") {
    //     fcmService.iosSubscribeToGroup("M1");
    //   } else if (memberType === "MM002") {
    //     fcmService.iosSubscribeToGroup("M2");
    //   }
    // }
  };
// const downloadFile = async (url, fileName) => {
//   const { fs, config } = BlobUtil;
//   const saveName = fileName || url.split('/').pop() || `file_${Date.now()}`;
//   const fixedUrl = url.startsWith('http') ? url : `https://sa.it.kr${url}`;
//   const isImage = /\.(jpg|jpeg|png|gif|bmp|heic|webp)$/i.test(saveName);
//   const mimeType = isImage ? 'image/*' : 'application/octet-stream';
//   console.log('다운로드 시도:', fixedUrl, saveName);
//   try {
//     if (Platform.OS === 'android') {

//       if (isImage) {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
//         );
//         if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//           console.log("갤러리 권한 거부됨");
//           return;
//         }
//         try {
//           const tmpPath = `${fs.dirs.DocumentDir}/${saveName}`;
//           console.log("Android 이미지 임시 저장:", tmpPath);

//           const res = await config({
//             fileCache: true,
//             path: tmpPath
//           }).fetch("GET", fixedUrl);

//           const fileUri = res.path().startsWith("file://")
//             ? res.path()
//             : `file://${res.path()}`;

//           console.log("Android 이미지 임시 다운로드 완료:", fileUri);

//           // 2) CameraRoll.save 로 실제 갤러리에 저장
//           const saved = await CameraRoll.save(fileUri, {
//             type: "photo"
//           });

//           console.log("Android 갤러리 저장 완료:", saved);

//           ref.current?.postMessage(JSON.stringify({
//             type: "DOWNLOAD_COMPLETE",
//             platform: "android",
//             file: saveName,
//             path: saved
//           }));

//         } catch (err) {
//           console.error("Android 이미지 저장 실패:", err);
//           ref.current?.postMessage(JSON.stringify({
//             type: "DOWNLOAD_FAILED",
//             platform: "android",
//             file: saveName,
//             error: err?.message || "unknown",
//           }));
//         }

//         return;
//       }
//       const downloadPath = `${fs.dirs.DownloadDir}/${saveName}`;
//       console.log("Android 일반 파일 저장:", downloadPath);

//       const res = await config({
//         addAndroidDownloads: {
//           useDownloadManager: true,
//           notification: true,
//           path: downloadPath,
//           description: '파일 다운로드',
//           mime: mimeType,
//           mediaScannable: true,
//         }
//       }).fetch("GET", fixedUrl);

//       console.log("Android 일반 파일 저장 완료:", res.path());

//       ref.current?.postMessage(JSON.stringify({
//         type: "DOWNLOAD_COMPLETE",
//         platform: "android",
//         file: saveName,
//         path: res.path(),
//       }));

//       return;
//     }
//     if (Platform.OS === 'ios') {
//       const path = `${fs.dirs.DocumentDir}/${saveName}`;
//       const res = await config({ fileCache: true, path }).fetch("GET", fixedUrl);

//       console.log('iOS 파일 다운로드:', res.path());

//       if (isImage) {
//         const fileUri = res.path().startsWith("file://")
//           ? res.path()
//           : `file://${res.path()}`;

//         const saved = await CameraRoll.save(fileUri, { type: "photo" });

//         console.log("iOS 갤러리 저장 완료:", saved);

//         ref.current?.postMessage(JSON.stringify({
//           type: "DOWNLOAD_COMPLETE",
//           platform: "ios",
//           file: saveName,
//           path: saved,
//         }));

//       } else {
//         ref.current?.postMessage(JSON.stringify({
//           type: "DOWNLOAD_COMPLETE",
//           platform: "ios",
//           file: saveName,
//           path: res.path(),
//         }));
//       }
//     }

//   } catch (err) {
//     console.error('다운로드 실패:', err);

//     ref.current?.postMessage(JSON.stringify({
//       type: "DOWNLOAD_FAILED",
//       platform: Platform.OS,
//       file: saveName,
//       error: err?.message || "unknown",
//     }));
//   }
// };

  console.log('url :', web.url);
  return (
    <SafeAreaView style={{flex: 1}}>
      {Platform.OS === 'android' ? (
          <WebView
            ref={ref}
            style={{flex: 1}}
            source={{uri: web.url}}
            originWhitelist={['*']}
            javaScriptEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            domStorageEnabled
            onMessage={_onMessage}
            onNavigationStateChange={onNavigationStateChange}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            userAgent={uAgent}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            setSupportMultipleWindows={false}
            overScrollMode="never"
          />
      ) : (
        <WebView
          ref={ref}
          style={{flex: 1}}
          source={{uri: web.url}}
          originWhitelist={['*']}
          javaScriptEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          domStorageEnabled
          onMessage={_onMessage}
          onNavigationStateChange={onNavigationStateChange}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          userAgent={uAgent}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          pullToRefreshEnabled={false}
          geolocationEnabled={false}
          // onScroll={(e) => {
          //   const offsetY = e.nativeEvent.contentOffset.y;
          //   if (offsetY < -100 && !refreshing) {
          //     console.log('[RN] iOS onScroll 스와이프 감지됨 → 새로고침 실행');
          //     handleRefresh();
          //   }
          // }}
        />
      )}
    </SafeAreaView>
  );
};

export default body;
