import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    StatusBar,
    Platform,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';

const BalkanflixPlayer = ({ url, intro, onValidView }) => {
    const player = useVideoPlayer(url, (player) => {
        player.timeUpdateEventInterval = 0.5;
        player.play();
    });

    const [showSkip, setShowSkip] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
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

    // ---- Custom fullscreen logika ----
    const enterFullscreen = async () => {
        setFullscreen(true);
        await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.LANDSCAPE
        );
    };

    const exitFullscreen = async () => {
        await ScreenOrientation.unlockAsync();
        setFullscreen(false);
    };

    // Zajednički sadržaj za oba moda
    const playerContent = (
        <View style={styles.videoContainer}>
            <VideoView
                player={player}
                style={styles.video}
                nativeControls={true}
            />
            {showSkip && (
                <TouchableOpacity
                    style={fullscreen ? styles.skipButtonFS : styles.skipButton}
                    onPress={skipIntro}
                    activeOpacity={0.8}
                >
                    <Text style={styles.skipText}>⏭ Preskoči uvod</Text>
                </TouchableOpacity>
            )}
            {/* Dugme za ulazak u fullscreen (samo u inline modu) */}
            {!fullscreen && (
                <TouchableOpacity
                    style={styles.fullscreenButton}
                    onPress={enterFullscreen}
                >
                    <MaterialCommunityIcons name="fullscreen" size={24} color="white" />
                </TouchableOpacity>
            )}
            {/* Dugme za izlaz iz fullscreen‑a */}
            {fullscreen && (
                <TouchableOpacity
                    style={styles.exitFullscreenButton}
                    onPress={exitFullscreen}
                >
                    <MaterialCommunityIcons name="fullscreen-exit" size={24} color="white" />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.root}>
            {/* Inline prikaz */}
            {!fullscreen && playerContent}

            {/* Fullscreen modal */}
            <Modal
                visible={fullscreen}
                animationType="fade"
                supportedOrientations={['landscape']}
                onRequestClose={exitFullscreen}
            >
                <StatusBar hidden />
                {playerContent}
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
        bottom: 40,
        right: 24,
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
    skipText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    fullscreenButton: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 8,
        borderRadius: 20,
        zIndex: 99,
    },
    exitFullscreenButton: {
        position: 'absolute',
        top: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 16,
        left: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 10,
        borderRadius: 20,
        zIndex: 99,
    },
});

export default BalkanflixPlayer;