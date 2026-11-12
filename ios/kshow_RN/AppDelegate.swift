import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore
import UserNotifications

@main
class AppDelegate: RCTAppDelegate, UNUserNotificationCenterDelegate {
  private var reactLaunchOptions: [UIApplication.LaunchOptionsKey: Any]?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
  ) -> Bool {
    self.moduleName = "kshow_RN"
    self.dependencyProvider = RCTAppDependencyProvider()
    self.initialProps = [:]
    // UIScene owns window creation. RCTAppDelegate still initializes the RN factory.
    self.automaticallyLoadReactNativeWindow = false
    self.reactLaunchOptions = launchOptions

    // Firebase 초기화
    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
    }

    // iOS 알림 delegate 등록
    UNUserNotificationCenter.current().delegate = self
    application.registerForRemoteNotifications()

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func connectReactNativeWindow(to windowScene: UIWindowScene) -> UIWindow {
    let rootView = rootViewFactory().view(
      withModuleName: moduleName ?? "kshow_RN",
      initialProperties: initialProps,
      launchOptions: reactLaunchOptions
    )
    let rootViewController = createRootViewController()
    setRootView(rootView, toRootViewController: rootViewController)

    let sceneWindow = UIWindow(windowScene: windowScene)
    sceneWindow.rootViewController = rootViewController
    // Keep the app delegate window available to existing React Native modules.
    self.window = sceneWindow
    sceneWindow.makeKeyAndVisible()
    return sceneWindow
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }

  // MARK: Push Notification 연결

  // 디바이스 토큰 등록 성공 시
  override func application(_ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    RNCPushNotificationIOS.didRegisterForRemoteNotifications(withDeviceToken: deviceToken)
  }

  // 원격 알림 수신 시
  override func application(_ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable : Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    RNCPushNotificationIOS.didReceiveRemoteNotification(
      userInfo,
      fetchCompletionHandler: completionHandler
    )
  }

  // 알림 클릭 시
  func userNotificationCenter(_ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void) {
    RNCPushNotificationIOS.didReceive(response)
    completionHandler()
  }

  // 앱 실행 중 알림 수신 시
  func userNotificationCenter(_ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    completionHandler([.alert, .sound, .badge])
  }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate else {
      return
    }
    window = appDelegate.connectReactNativeWindow(to: windowScene)
  }

  func windowScene(
    _ windowScene: UIWindowScene,
    didUpdate previousCoordinateSpace: UICoordinateSpace,
    interfaceOrientation previousInterfaceOrientation: UIInterfaceOrientation,
    traitCollection previousTraitCollection: UITraitCollection
  ) {
    // Preserve RN's window-size updates when the iPad scene rotates or resizes.
    NotificationCenter.default.post(name: NSNotification.Name("RCTWindowFrameDidChangeNotification"), object: self)
  }
}
