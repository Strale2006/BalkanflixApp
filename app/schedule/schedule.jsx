import React, { useEffect, useState } from "react";
import { View, Text, ImageBackground, FlatList, Dimensions, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { MaterialIcons } from "@expo/vector-icons";
import moment from "moment-timezone";
import { router } from "expo-router";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;
const GAP = 16;

const ScheduleItem = ({ item }) => {
    const beogradskoVreme = moment(item.time)
        .tz("Europe/Belgrade")
        .format("DD MMM YYYY • HH:mm");

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push(`/details/${item.title_params}`)}
            style={{
                width: CARD_WIDTH, // FIX: ranije ovo bilo "w-[80vw]" u className, nepouzdano u RN/NativeWind
                shadowColor: '#000',
                shadowOpacity: 0.35,
                shadowOffset: { width: 0, height: 8 },
                shadowRadius: 14,
                elevation: 8,
            }}
        >
            <View className="bg-[#1a1c2b] rounded-3xl overflow-hidden p-4 h-[400px] border border-white/5">
                {/* Slika sa overlayem */}
                <View className="mb-4 rounded-2xl overflow-hidden" style={{ height: 150 }}>
                    <ImageBackground
                        source={{ uri: `https://images.balkanflix.com/${item.img}` }}
                        style={{ flex: 1, justifyContent: 'flex-end' }}
                        imageStyle={{ resizeMode: 'cover' }}
                    >
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            locations={[0.4, 1]}
                            style={{ flex: 1, justifyContent: 'flex-end', padding: 8 }}
                        >
                            <View className="flex-row items-center bg-indigo-500/90 self-start px-2.5 py-1 rounded-full">
                                <MaterialIcons name="play-circle-outline" size={14} color="white" />
                                <Text className="text-white text-xs font-psemibold ml-1">Ep {item.ep}</Text>
                            </View>
                        </LinearGradient>
                    </ImageBackground>
                </View>

                {/* Naslov i vreme */}
                <Text className="text-white text-lg font-pbold mb-2.5 leading-6" numberOfLines={2}>
                    {item.title}
                </Text>

                <View className="flex-row items-center mb-4">
                    <MaterialIcons name="access-time" size={15} color="#818cf8" />
                    <Text className="text-gray-400 text-xs ml-2">{beogradskoVreme}</Text>
                </View>

                {/* Progress bar */}
                <View className="h-1.5 bg-[#2d3250] rounded-full mb-5 overflow-hidden">
                    <View
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${item.progress}%` }}
                    />
                </View>

                {/* Countdown */}
                {item.countdown !== "USKORO" ? (
                    <View className="flex-row justify-between mt-auto" style={{ gap: 8 }}>
                        {Object.entries({
                            Dan: item.days,
                            Sat: item.hours,
                            Min: item.minutes
                        }).map(([label, value]) => (
                            <View
                                key={label}
                                className="items-center bg-[#25293c] py-2.5 rounded-xl flex-1 border border-white/5"
                            >
                                <Text className="text-white text-xl font-psemibold">{value}</Text>
                                <Text className="text-gray-400 text-[10px] font-semibold uppercase mt-0.5">{label}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View className="bg-red-500/15 border border-red-500/30 py-3 rounded-xl mt-auto flex-row items-center justify-center">
                        <MaterialIcons name="notifications-active" size={16} color="#f87171" />
                        <Text className="text-red-400 text-center font-pbold text-sm ml-1.5">USKORO</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const Schedule = () => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSchedule = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(
                "https://balkanflix-server.up.railway.app/api/schedule/animeSchedule"
            );
            const formattedData = data.map((item) => {
                const { days, hours, minutes, progress, countdown } =
                    calculateCountdown(item.time);
                return { ...item, days, hours, minutes, progress, countdown };
            });
            setSchedule(formattedData);
        } catch (error) {
            console.error("Error:", error);
            setError("Nije moguće učitati raspored");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, []);

    const calculateCountdown = (isoString) => {
        const eventDate = moment.tz(isoString, "Europe/Belgrade");
        const now = moment.tz("Europe/Belgrade");
        const diff = eventDate.diff(now);

        if (diff > 0) {
            const duration = moment.duration(diff);
            const totalDuration = moment.duration(7, 'days');
            const progress = Math.min(100, (1 - duration.asMilliseconds() / totalDuration.asMilliseconds()) * 100);

            return {
                days: duration.days().toString().padStart(2, '0'),
                hours: duration.hours().toString().padStart(2, '0'),
                minutes: duration.minutes().toString().padStart(2, '0'),
                progress,
                countdown: "active"
            };
        }
        return { countdown: "USKORO", progress: 100 };
    };

    if (loading) {
        return (
            <View className="h-32 items-center justify-center">
                <ActivityIndicator size="large" color="#818cf8" />
                <Text className="text-gray-400 mt-2">Učitavanje...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="h-32 items-center justify-center bg-gray-800/50 rounded-2xl">
                <MaterialIcons name="error-outline" size={32} color="#f87171" />
                <Text className="text-red-400 mt-2">{error}</Text>
                <TouchableOpacity
                    onPress={fetchSchedule}
                    className="mt-2 bg-indigo-600 px-4 py-1.5 rounded-full"
                >
                    <Text className="text-white font-psemibold">Pokušaj ponovo</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (schedule.length === 0) {
        return (
            <View className="h-32 items-center justify-center bg-gray-800/50 rounded-2xl">
                <MaterialIcons name="event-busy" size={32} color="#9ca3af" />
                <Text className="text-gray-400 mt-2">Trenutno nema zakazanih epizoda</Text>
            </View>
        );
    }

    return (
        <View className="py-4">
            <FlatList
                data={schedule}
                renderItem={({ item }) => <ScheduleItem item={item} />}
                keyExtractor={(item, index) => item._id?.toString() || index.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + GAP}
                decelerationRate="fast"
                ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
                contentContainerStyle={{ paddingHorizontal: 4 }}
            />
        </View>
    );
};

export default Schedule;