import React, { useEffect, useState } from "react";
import { View, Text, Image, FlatList, Dimensions, TouchableOpacity, ActivityIndicator } from "react-native";
import axios from "axios";
import { MaterialIcons } from "@expo/vector-icons";
import moment from "moment-timezone";
import { router } from "expo-router";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;

const ScheduleItem = ({ item }) => {
  // const navigation = useNavigation();

  // Formatiranje vremena za Beogradsku zonu
  const beogradskoVreme = moment(item.time)
    .tz("Europe/Belgrade")
    .format("DD MMM YYYY • HH:mm");

  return (
    <TouchableOpacity
      className="w-[80vw] mx-3 shadow-lg"
      activeOpacity={0.9}
      onPress={() => router.push(`/details/${item.title_params}`)}
    >
      <View className="bg-[#1a1c2b] rounded-2xl overflow-hidden p-4 h-96">
        {/* Slika sa overlayem */}
        <View className="relative mb-4 rounded-xl overflow-hidden">
          <Image
            source={{ uri: `https://images.balkanflix.com/${item.img}` }}
            className="w-full h-40"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/40 opacity-40" />
          
          <View className="absolute bottom-2 left-2 flex-row items-center bg-black/70 px-2 py-1 rounded-2xl">
            <MaterialIcons name="play-circle-outline" size={16} color="white" />
            <Text className="text-white text-sm ml-1">Ep {item.ep}</Text>
          </View>
        </View>

        {/* Naslov i vreme */}
        <Text className="text-white text-lg font-bold mb-3 leading-6" numberOfLines={2}>
          {item.title}
        </Text>
        
        <View className="flex-row items-center mb-4">
          <MaterialIcons name="access-time" size={16} color="#818cf8" />
          <Text className="text-gray-400 text-xs ml-2">{beogradskoVreme}</Text>
        </View>

        {/* Progress bar */}
        <View className="h-1 bg-[#2d3250] rounded-full mb-5">
          <View 
            className="h-full bg-indigo-500 rounded-full" 
            style={{ width: `${item.progress}%` }}
          />
        </View>

        {/* Countdown */}
        {item.countdown !== "USKORO" ? (
          <View className="flex-row justify-between mt-auto">
            {Object.entries({
              Dan: item.days,
              Sat: item.hours,
              Min: item.minutes
            }).map(([label, value]) => (
              <View key={label} className="items-center bg-[#25293c] p-2 rounded-lg flex-1 mx-1">
                <Text className="text-white text-xl font-psemibold">{value}</Text>
                <Text className="text-gray-400 text-[10px] font-semibold uppercase">{label}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-red-500/20 p-3 rounded-lg mt-auto">
            <Text className="text-red-400 text-center font-bold text-sm">USKORO</Text>
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
        <View className="h-32 items-center justify-center bg-gray-800/50 rounded-xl">
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
        <View className="h-32 items-center justify-center bg-gray-800/50 rounded-xl">
          <MaterialIcons name="event-busy" size={32} color="#9ca3af" />
          <Text className="text-gray-400 mt-2">Trenutno nema zakazanih epizoda</Text>
        </View>
    );
  }

  return (
    <View className="flex-1 py-4">
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <MaterialIcons name="loop" size={24} color="white" />
        </View>
      ) : (
        <FlatList
          data={schedule}
          renderItem={({ item }) => <ScheduleItem item={item} />}
          keyExtractor={(item) => item._id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + 24}
          decelerationRate="fast"
        />
      )}
    </View>
  );
};

export default Schedule;