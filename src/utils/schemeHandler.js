import { Platform, Linking, Alert } from "react-native";

// 외부 스킴 목록
const externalSchemes = [
  'kakaotalk://', 'kakaolink://', 'kakaokompassauth://', 
  'itms-apps://', 'itms-appss://', // 앱스토어 관련
  'ispmobile://', 'kb-acp://', 'kbbank://', 'lpayapp://',
  'liivbank://', 'nhappcardansimclick://', 'nhallonepayansimclick://',
  'payco://', 'mpocket.online.ansimclick://', 'samsungpay://',
  'shinhan-sr-ansimclick://', 'citimobileapp://', 'wooripay://',
  'supertoss://', 'cloudpay://', 'hdcardappcardansimclick://',
  'kakaotalk://','nicepay://', 'niceappcard://', 'nice://'
];

// 외부 스킴 여부 확인
export const isExternalScheme = (url) => {
  // 1. 목록에 직접 포함되어 있는지 확인
  const isMatched = externalSchemes.some(scheme => url.startsWith(scheme));
  
  // 2. 혹시 모르니 'kakaotalk' 단어가 포함된 커스텀 스킴인지 한 번 더 확인
  return isMatched || url.startsWith('kakaotalk:'); 
};

// 앱스토어 매핑
const appStoreMap = {
  'com.kbstar.kbbank': '1118732739',
  'com.kbstar.liivbank': '1223445678',
  'com.kbcard.cxh.appcard': '1138390090',
  'com.kakao.talk': '362057947',
  'com.nhnent.payapp': '998765432',
  'com.lotte.lpay': '1058707161',
  'com.samsung.android.spay': '949952976',
  'com.kakaobank.channel': '1138340219',
  'com.hyundaicard.appcard': '490512732',
  'com.shcard.smartpay': '486085659',
  'com.wooribank.smart.npib': '1171971656',
  'viva.republica.toss': '839333328',
  'kr.co.citibank.citimobile': '1179759666',
  'com.kftc.bankpay.android': '398456893',
  'com.nicepay.app': '1475375887'
};

// 앱스토어 ID 가져오기
export const getAppStoreID = (packageName) => {
  return appStoreMap[packageName] || '362057947'; // 기본값: 카카오톡
};

// Intent에서 패키지명 추출
export const getPackageNameFromIntent = (url) => {
  if (Platform.OS === 'ios') {
    if (url.startsWith('kb-acp://')) return 'com.kbcard.cxh.appcard';
    if (url.startsWith('nicepay://') || url.startsWith('niceappcard://')) return 'com.nicepay.app';
    const schemeMatch = url.match(/scheme=([^;]+)/);
    return schemeMatch ? schemeMatch[1] : null;
  } else {
    const match = url.match(/package=([^;]+)/);
    return match ? match[1] : null;
  }
};

// 마켓 이동
export const redirectToMarket = (packageName) => {
  const appStoreID = getAppStoreID(packageName);
  const marketUrl = Platform.OS === 'android'
    ? `https://play.google.com/store/apps/details?id=${packageName}`
    : `https://apps.apple.com/app/id${appStoreID}`;

  Linking.openURL(marketUrl).catch(err => {
    console.error('마켓 이동 실패:', err);
    if (Platform.OS === 'ios') {
      const fallbackUrl = `https://apps.apple.com/kr/app/id${appStoreID}`;
      Linking.openURL(fallbackUrl).catch((err) =>
        console.error('App Store URL 이동 실패:', err)
      );
    }
  });
};

// 마켓 리다이렉트 처리
export const handleMarketRedirect = (url) => {
  const packageName = getPackageNameFromIntent(url) || 'com.kakao.talk';
  redirectToMarket(packageName);
};

// 외부 스킴 실행
export const handleExternalScheme = (url) => {
  // iOS에서 공백이나 특수문자가 포함된 경우를 대비해 인코딩
  const encodedUrl = url.includes('%') ? url : encodeURI(url);

  Linking.canOpenURL(encodedUrl)
    .then((supported) => {
      if (supported) {
        // iOS는 지원된다면 바로 실행
        return Linking.openURL(encodedUrl);
      } else {
        // 지원되지 않는다면(앱 미설치 등) 마켓으로
        handleMarketRedirect(url);
      }
    })
    .catch((err) => {
      console.error('iOS Scheme Error:', err);
      handleMarketRedirect(url);
    });
};