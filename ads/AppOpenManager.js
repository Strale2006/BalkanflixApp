// import {
//     AppOpenAd,
//     AdEventType,
//     TestIds
// } from "react-native-google-mobile-ads";
//
// const adUnitId = __DEV__
//     ? TestIds.APP_OPEN
//     : "ca-app-pub-5998257044328183/9226616300";
//
// const appOpenAd = AppOpenAd.createForAdRequest(adUnitId);
//
// let loaded = false;
//
// export function loadAppOpen() {
//     appOpenAd.load();
// }
//
// appOpenAd.addAdEventListener(
//     AdEventType.LOADED,
//     () => {
//         loaded = true;
//         appOpenAd.show();
//     }
// );
//
// appOpenAd.addAdEventListener(
//     AdEventType.CLOSED,
//     () => {
//         loaded = false;
//         appOpenAd.load();
//     }
// );
// appOpenAd.addAdEventListener(
//     AdEventType.ERROR,
//     error => {
//         console.log(error);
//     }
// );
//
// export function showAppOpen() {
//     if (loaded) {
//         appOpenAd.show();
//         loaded = false;
//     }
// }