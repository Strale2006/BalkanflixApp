import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../context/GlobalProvider'; // Import your GlobalContext here
import {Image} from 'expo-image';


const Calendar = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { user, setUser, setIsLoggedIn } = useGlobalContext();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get('https://balkanflix-server.vercel.app/api/schedule/animeCalendar');
        const convertedData = data.map(item => {
          return {
            ...item,
            originalTime: item.time,
            time: convertToBelgradeTime(item.time),
            date: formatDate(item.time),
            countdown: calculateCountdown(item.time),
            img: item.img,
          };
        });
        setSchedule(convertedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]); // Trigger fetch whenever user changes

  useEffect(() => {
    const timer = setInterval(() => {
      setSchedule(prevSchedule => prevSchedule.map(item => ({
        ...item,
        countdown: calculateCountdown(item.originalTime),
      })));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const convertToBelgradeTime = (isoString) => {
    const date = new Date(isoString);
    const options = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Belgrade' };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const options = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Europe/Belgrade' };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
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
      return 'USKORO';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black p-4">
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-white">Učitavanje...</Text>
        </View>
      ) : (
        <FlatList
          data={schedule}
          keyExtractor={(item) => item._id} // Use the $oid field for keyExtractor
          renderItem={({ item }) => (
            <View
              className={`bg-[#060610] p-4 rounded-xl shadow-md mb-5 transition-transform ${user.username === item.pv ? "bg-[#0B0B15]" : ""}`}
              key={item.title}
            >
              <View className="flex flex-row items-center">
              <Image
                source={{ uri: `https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/${item.img}` }}
                style={{ width: 80, height: 100 }}
                contentFit="contain"
              />
                <View className="ml-4 flex-1">
                  <Text className="text-white font-psemibold text-lg" numberOfLines={2}>{item.title}</Text>
                  <Text className="text-gray-400 text-sm font-pmedium">Epizoda {item.ep}</Text>
                  <Text className="text-gray-400 text-sm font-pmedium">Datum: {item.date}</Text>
                  <Text className="text-gray-400 text-sm font-pmedium">Vreme: {item.time}</Text>
                  <Text className={`text-red-600 text-sm font-pbold ${user.username === item.pv ? "text-blue-600" : ""}`}>{item.pv}</Text>
                  <Text className={`text-red-500 text-sm font-pbold `}>
                    {item.countdown}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default Calendar;
