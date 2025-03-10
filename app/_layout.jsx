import { SplashScreen, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import "react-native-url-polyfill/auto";
import { useEffect } from 'react';
import GlobalProvider from '../context/GlobalProvider';
import useNotificationObserver from '../notifications/useNotificationObserver';

SplashScreen.preventAutoHideAsync();

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

    useEffect(() => {
        if (error) throw error;
        if (fontsLoaded) SplashScreen.hideAsync();
    }, [fontsLoaded, error]);

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