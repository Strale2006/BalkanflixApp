import React, { useEffect, useState } from "react";
import { View, Text, Image, FlatList, Dimensions, TouchableOpacity } from "react-native";
import axios from "axios";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import moment from "moment-timezone";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;

const ScheduleItem = ({ item }) => {
  const navigation = useNavigation();

  // Formatiranje vremena za Beogradsku zonu
  const beogradskoVreme = moment(item.time)
    .tz("Europe/Belgrade")
    .format("DD MMM YYYY • HH:mm");

  return (
    <TouchableOpacity
      className="mx-3 shadow-lg"
      activeOpacity={0.9}
      onPress={() => navigation.navigate("AnimeDetail", { animeId: item._id })}
    >
      <View className="w-80 bg-slate-800 rounded-2xl overflow-hidden p-4 h-96">
        {/* Slika sa overlayem */}
        <View className="relative mb-4">
          <Image
            source={{ uri: `https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/${item.img}` }}
            className="w-full h-40 rounded-xl"
          />
          <View className="absolute inset-0 bg-black/40" />
          
          <View className="absolute bottom-2 left-2 flex-row items-center bg-black/60 px-2 py-1 rounded-full">
            <MaterialIcons name="play-circle-outline" size={16} color="white" />
            <Text className="text-white text-sm ml-1">Ep {item.ep}</Text>
          </View>
        </View>

        {/* Naslov i vreme */}
        <Text className="text-white text-base font-bold mb-2 leading-tight" numberOfLines={2}>
          {item.title}
        </Text>
        
        <View className="flex-row items-center mb-4">
          <MaterialIcons name="access-time" size={16} color="#818cf8" />
          <Text className="text-slate-400 text-sm ml-2">{beogradskoVreme}</Text>
        </View>

        {/* Progress bar */}
        <View className="h-1 bg-slate-700 mb-6 rounded-full">
          <View 
            className="h-full bg-indigo-500 rounded-full" 
            style={{ width: `${item.progress}%` }}
          />
        </View>

        {/* Countdown */}
        {item.countdown !== "USKORO" ? (
          <View className="flex-row justify-between">
            {Object.entries({
              Dan: item.days,
              Sat: item.hours,
              Min: item.minutes
            }).map(([label, value]) => (
              <View key={label} className="items-center bg-slate-700/50 p-2 rounded-lg flex-1 mx-1">
                <Text className="text-white text-xl font-bold">{value}</Text>
                <Text className="text-slate-400 text-xs uppercase">{label}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-rose-500/20 py-3 rounded-lg">
            <Text className="text-rose-400 text-center font-bold">USKORO</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const { data } = await axios.get("https://balkanflix-server.vercel.app/api/schedule/animeSchedule");
        const formattedData = data.map((item) => {
          const { days, hours, minutes, progress, countdown } = calculateCountdown(item.time);
          return {
            ...item,
            days,
            hours,
            minutes,
            progress,
            countdown
          };
        });
        setSchedule(formattedData);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

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

  return (
    <View className="flex-1">
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