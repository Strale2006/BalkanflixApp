import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ImageBackground, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.58;

const SliderItem = ({ item, index, scrollX }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const scale = scrollX.interpolate({
        inputRange,
        outputRange: [0.94, 1, 0.94],
        extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.55, 1, 0.55],
        extrapolate: 'clamp',
    });

    return (
        <View style={{ width, height: HERO_HEIGHT }}>
            <Animated.View style={{ flex: 1, transform: [{ scale }], opacity }}>
                <ImageBackground
                    source={{ uri: `https://images.balkanflix.com/${item?.poster}` }}
                    style={{ flex: 1 }}
                    resizeMode="cover"
                >
                    {/* gornji fade — da se status bar / nav ikonice vide */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.55)', 'transparent']}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 110 }}
                    />

                    {/* donji fade — cinematic + blendira se sa bg ispod */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.55)', '#000']}
                        locations={[0, 0.6, 1]}
                        style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 22, paddingBottom: 34 }}
                    >
                        <Text className="text-red-500 text-[12px] font-pbold tracking-[2px] uppercase mb-2">
                            Izdvajamo
                        </Text>

                        <Text
                            className="text-white text-[34px] font-pextrabold leading-[38px] mb-3"
                            style={{
                                textShadowColor: 'rgba(0,0,0,0.8)',
                                textShadowOffset: { width: 0, height: 3 },
                                textShadowRadius: 10,
                            }}
                            numberOfLines={2}
                        >
                            {item?.title}
                        </Text>

                        <View className="flex-row items-center mb-5">
                            {item.genre?.slice(0, 3).map((genre, key) => (
                                <View key={key} className="flex-row items-center">
                                    <Text className="text-gray-200 text-[13px] font-psemibold">{genre}</Text>
                                    {key < Math.min(item.genre.length, 3) - 1 && (
                                        <View className="w-1 h-1 rounded-full bg-gray-400 mx-2" />
                                    )}
                                </View>
                            ))}
                        </View>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                activeOpacity={0.85}
                                className="bg-white py-3 px-6 rounded-full flex-row items-center justify-center flex-1"
                                style={{
                                    shadowColor: '#fff',
                                    shadowOpacity: 0.3,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowRadius: 8,
                                    elevation: 5,
                                }}
                                onPress={() => router.push(`/details/${encodeURIComponent(item?.title_params)}`)}
                            >
                                <MaterialIcons name="play-arrow" size={22} color="black" />
                                <Text className="text-black font-pbold ml-1 text-[15px]">Gledaj</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.8}
                                className="bg-white/15 border border-white/25 py-3 px-5 rounded-full flex-row items-center justify-center"
                                onPress={() => router.push(`/details/${encodeURIComponent(item?.title_params)}`)}
                            >
                                <MaterialIcons name="info-outline" size={20} color="white" />
                                <Text className="text-white font-psemibold ml-1.5 text-[15px]">Detalji</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </ImageBackground>
            </Animated.View>
        </View>
    );
};

const TopSlider = () => {
    const [series, setSeries] = useState([]);
    const scrollX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const fetchSeries = async () => {
            try {
                const { data } = await axios.get("https://balkanflix-server.up.railway.app/api/content/seriesHero");
                setSeries(data.series);
            } catch (error) {
                console.error("Greška pri učitavanju:", error);
            }
        };
        fetchSeries();
    }, []);

    return (
        <View className="bg-black" style={{ height: HERO_HEIGHT }}>
            <Animated.FlatList
                data={series}
                renderItem={({ item, index }) => (
                    <SliderItem item={item} index={index} scrollX={scrollX} />
                )}
                keyExtractor={(item) => item.title}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={width}
                decelerationRate="fast"
                bounces={false}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
            />

            {/* linije na dnu koje nagoveštavaju redosled */}
            {series.length > 1 && (
                <View className="absolute bottom-3 left-0 right-0 flex-row justify-center items-center gap-2">
                    {series.map((_, i) => {
                        const lineColor = scrollX.interpolate({
                            inputRange: [(i - 0.5) * width, i * width, (i + 0.5) * width],
                            outputRange: ['rgba(255,255,255,0.3)', '#dc2626', 'rgba(255,255,255,0.3)'],
                            extrapolate: 'clamp',
                        });

                        const lineWidth = scrollX.interpolate({
                            inputRange: [(i - 0.5) * width, i * width, (i + 0.5) * width],
                            outputRange: [16, 28, 16],
                            extrapolate: 'clamp',
                        });

                        return (
                            <Animated.View
                                key={i}
                                style={{
                                    height: 3,
                                    width: lineWidth,
                                    borderRadius: 2,
                                    backgroundColor: lineColor,
                                }}
                            />
                        );
                    })}
                </View>
            )}
        </View>
    );
};

export default TopSlider;