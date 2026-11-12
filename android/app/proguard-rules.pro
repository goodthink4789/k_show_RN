# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native 0.78 loads these classes by name from react_devsupportjni,
# including in release builds when InspectorFlags initializes.
-keep class com.facebook.react.devsupport.CxxInspectorPackagerConnection { *; }
-keep class com.facebook.react.devsupport.CxxInspectorPackagerConnection$* { *; }
