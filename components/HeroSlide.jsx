import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ImageBackground, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { router } from 'expo-router';
const { width } = Dimensions.get('window');

const SliderItem = ({ item }) => (
  <View className="w-screen h-72">
    <ImageBackground
      source={{ uri: `https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/${item.poster}` }}
      className="flex-1 justify-end p-4"
      imageStyle={{ opacity: 0.9 }}
    >
      <View className="bg-black/40 absolute inset-0" />
      
      <View className="z-10">
        <Text className="text-white text-xl font-pextrabold" numberOfLines={2}>{item.title}</Text>
        <View className="flex-row gap-2 mt-1">
          {item.genre?.map((genre, key) => (
            <Text key={key} className="text-gray-200 text-xs font-bold mb-2">{genre}</Text>
          ))}
        </View>
        <TouchableOpacity 
        className="bg-red-600 py-1.5 px-3 rounded-full self-start flex-row items-center"
        onPress={() => router.push(`/details/${encodeURIComponent(item.title_params)}`)}
        >
          <MaterialIcons name="play-circle" size={15} color="white" />
          <Text className="text-white font-bold"> Gledaj</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  </View>
);

const TopSlider = () => {
  const [series, setSeries] = useState([]);
  const flatListRef = useRef(null);

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const { data } = await axios.get("https://balkanflix-server.vercel.app/api/content/seriesHeroMobile");
        setSeries(data.series);
      } catch (error) {
        console.error("Greška pri učitavanju:", error);
      }
    };
    fetchSeries();
  }, []);

  return (
    <View className="bg-black">
      <FlatList
        ref={flatListRef}
        data={series}
        renderItem={({ item }) => <SliderItem item={item} />}
        keyExtractor={(item) => item.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={width}
      />
    </View>
  );
};

export default TopSlider;