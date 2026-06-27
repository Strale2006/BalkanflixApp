import { SplashScreen, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import "react-native-url-polyfill/auto";
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import GlobalProvider from '../context/GlobalProvider';
import useNotificationObserver from '../notifications/useNotificationObserver';
import mobileAds, { AppOpenAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

SplashScreen.preventAutoHideAsync();

// Tokom testiranja uvek koristi TestIds, nikad pravi ID!
const AD_UNIT_ID = __DEV__
    ? TestIds.APP_OPEN
    : 'ca-app-pub-5998257044328183/9226616300';

const RootLayout = () => {
    const [fontsLoaded, error] = useFonts({
        "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
        "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
        "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
        "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
        "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
        "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
        "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
        "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
        "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
    });

    useNotificationObserver();

    const appState = useRef(AppState.currentState);
    const lastAdShown = useRef(0);
    const AD_COOLDOWN = 30 * 60 * 1000;

    const loadAd = () => {
        const now = Date.now();

        // Ne prikazuj reklamu ako nije prošlo dovoljno vremena
        if (now - lastAdShown.current < AD_COOLDOWN) {
            return;
        }

        const ad = AppOpenAd.createForAdRequest(AD_UNIT_ID);

        ad.addAdEventListener(AdEventType.LOADED, () => {
            ad.show();
        });

        ad.addAdEventListener(AdEventType.CLOSED, () => {
            lastAdShown.current = Date.now(); // zabeleži kada je zatvorena
        });

        ad.addAdEventListener(AdEventType.ERROR, (error) => {
            console.log('AdMob greška:', error);
        });

        ad.load();
    };

    useEffect(() => {
        mobileAds().initialize().then(() => {
            loadAd(); // prva reklama pri otvaranju
        });

        const subscription = AppState.addEventListener('change', (nextState) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextState === 'active'
            ) {
                loadAd(); // reklama kad se vrati iz pozadine, ali samo ako je prošlo 60s
            }
            appState.current = nextState;
        });

        return () => subscription.remove();
    }, []);

    useEffect(() => {
        if (!fontsLoaded) return;
        SplashScreen.hideAsync();
    }, [fontsLoaded]);

    if (!fontsLoaded && !error) return null;

    return (
        <GlobalProvider>
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(dash)" options={{ headerShown: false }} />
                <Stack.Screen name="details/[title]" options={{ headerShown: false }} />
                <Stack.Screen name="[title]/[ep]" options={{ headerShown: false }} />
                <Stack.Screen name="profileModal" options={{ headerShown: false, presentation: 'modal' }} />
            </Stack>
        </GlobalProvider>
    );
};

export default RootLayout;