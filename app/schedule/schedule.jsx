import React, { useEffect, useState } from "react";
import { View, Text, Image, FlatList, Dimensions } from "react-native";
import axios from "axios";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8; // 80% of screen width

const ScheduleItem = ({ item }) => (
  <View style={{ width: CARD_WIDTH, marginHorizontal: 10, marginVertical:10 }}>
    <View className="bg-[#141929] rounded-xl overflow-hidden p-3">
      <Image
        source={{ uri: `https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/${item.img}` }}
        className="w-full h-[150px] rounded-lg"
        resizeMode="cover"
      />
      <Text numberOfLines={2} className="text-white text-lg font-pbold mt-2">{item.title}</Text>
      <Text className="text-gray-400 text-sm font-pregular">Epizoda {item.ep}</Text>
      <Text className="text-white text-sm font-pregular">📅 {item.date} ⏰ {item.time}</Text>
      <Text className="text-red-400 font-pbold text-lg">{item.countdown}</Text>
    </View>
  </View>
);

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const { data } = await axios.get("https://balkanflix-server.vercel.app/api/schedule/animeSchedule");
        const formattedData = data.map((item) => ({
          ...item,
          originalTime: item.time,
          time: convertToBelgradeTime(item.time),
          date: formatDate(item.time),
          countdown: calculateCountdown(item.time),
        }));
        setSchedule(formattedData);
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSchedule((prevSchedule) =>
        prevSchedule.map((item) => ({
          ...item,
          countdown: calculateCountdown(item.originalTime),
        }))
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const convertToBelgradeTime = (isoString) => {
    const date = new Date(isoString);
    const options = { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Belgrade" };
    return new Intl.DateTimeFormat("en-GB", options).format(date);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const options = { year: "numeric", month: "short", day: "numeric", timeZone: "Europe/Belgrade" };
    return new Intl.DateTimeFormat("en-GB", options).format(date);
  };

  const calculateCountdown = (isoString) => {
    const eventDate = new Date(isoString);
    const now = new Date();
    const difference = eventDate - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
      return "USKORO";
    }
  };

  return (
    <View className="flex-1">
      {/* <Text className="text-white text-xl font-bold p-4">📅 Procenjeno vreme izlaska</Text> */}
      {loading ? (
        <Text className="text-white text-center">Učitavanje...</Text>
      ) : (
        <FlatList
          data={schedule}
          renderItem={({ item }) => <ScheduleItem item={item} />}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={CARD_WIDTH + 20} // Adjust to include margin
          decelerationRate="fast"
        />
      )}
    </View>
  );
};

export default Schedule;
