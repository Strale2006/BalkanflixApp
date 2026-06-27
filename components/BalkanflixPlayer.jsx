import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';
import * as ScreenOrientation from 'expo-screen-orientation';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// ── Telo plejera, IZVUCENO van glavne komponente ──────────────────────────
// Ovo je kljucno: ako je definisano unutar BalkanflixPlayer-a, na svaki
// re-render (npr. svakih 0.5s kad se currentTime promeni) React vidi
// "novu" komponentu i remountuje VideoView + dugmice -> treperenje i
// tapovi koji ne stignu da se uhvate.
const PlayerBody = ({
                        player,
                        fullscreen,
                        showSkip,
                        onSkip,
                        onToggleFullscreen,
                    }) => (
    <View style={styles.videoContainer}>
        <VideoView
            player={player}
            style={styles.video}
            nativeControls={true}
            allowsFullscreen={false}
            contentFit="contain"
        />

        <TouchableOpacity
            style={fullscreen ? styles.fsButtonActive : styles.fsButton}
            onPress={onToggleFullscreen}
            activeOpacity={0.8}
        >
            <MaterialIcons
                name={fullscreen ? 'fullscreen-exit' : 'fullscreen'}
                size={20}
                color="#fff"
            />
        </TouchableOpacity>

        {showSkip && (
            <TouchableOpacity
                style={fullscreen ? styles.skipButtonFS : styles.skipButton}
                onPress={onSkip}
                activeOpacity={0.8}
            >
                <Text style={styles.skipText}>⏭ Preskoči uvod</Text>
            </TouchableOpacity>
        )}
    </View>
);

const BalkanflixPlayer = ({ url, intro, onValidView }) => {
    const player = useVideoPlayer(url, (player) => {
        player.timeUpdateEventInterval = 0.5;
        player.play();
    });

    const [showSkip, setShowSkip] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const viewCounted = useRef(false);
    const watchTime = useRef(0);
    const lastTime = useRef(0);

    // Reset na promenu URL‑a
    useEffect(() => {
        viewCounted.current = false;
        watchTime.current = 0;
        lastTime.current = 0;
        setShowSkip(false);
    }, [url]);

    const { currentTime } = useEvent(player, 'timeUpdate', {
        currentTime: player.currentTime,
    });

    // Intro logika
    useEffect(() => {
        if (!intro || currentTime === undefined) return;
        const inRange = currentTime >= intro.start && currentTime <= intro.end;
        setShowSkip(inRange);

        if (viewCounted.current) return;
        const delta = currentTime - lastTime.current;
        if (delta > 0 && delta < 2) watchTime.current += delta;
        lastTime.current = currentTime;
        if (watchTime.current >= 120) {
            viewCounted.current = true;
            onValidView?.();
        }
    }, [currentTime, intro, onValidView]);

    const skipIntro = () => {
        if (player && intro) {
            player.currentTime = intro.end;
            setShowSkip(false);
        }
    };

    // ── Sopstveni fullscreen (ne koristimo native, jer on prekriva ceo RN sloj
    //    i skip dugme bi ostalo nevidljivo iza njega) ──
    const enterFullscreen = async () => {
        setIsFullscreen(true);
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    };

    const exitFullscreen = async () => {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setIsFullscreen(false);
    };

    useEffect(() => {
        return () => {
            ScreenOrientation.unlockAsync();
            setIsFullscreen(false);
        };
    }, []);

    return (
        <View style={styles.root}>
            <PlayerBody
                player={player}
                fullscreen={false}
                showSkip={showSkip}
                onSkip={skipIntro}
                onToggleFullscreen={enterFullscreen}
            />

            <Modal
                visible={isFullscreen}
                animationType="fade"
                supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
                onRequestClose={exitFullscreen}
                statusBarTranslucent
            >
                {isFullscreen && <StatusBar hidden />}
                <PlayerBody
                    player={player}
                    fullscreen={true}
                    showSkip={showSkip}
                    onSkip={skipIntro}
                    onToggleFullscreen={exitFullscreen}
                />
            </Modal>
        </View>
    );
};

// ----- Stilovi -----
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#000',
        borderRadius: 12,
        overflow: 'hidden',
    },
    videoContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    video: {
        flex: 1,
    },
    fsButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.75)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        padding: 9,
        borderRadius: 20,
        zIndex: 100,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
    },
    fsButtonActive: {
        position: 'absolute',
        top: 18,
        right: 18,
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.45)',
        padding: 11,
        borderRadius: 24,
        zIndex: 999,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
    },
    skipButton: {
        position: 'absolute',
        bottom: 80,
        right: 16,
        backgroundColor: '#ef4444',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 30,
        zIndex: 100,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
    },
    skipButtonFS: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: '#ef4444',
        paddingHorizontal: 22,
        paddingVertical: 13,
        borderRadius: 30,
        zIndex: 100,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
    },
    skipText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
});

export default BalkanflixPlayer;