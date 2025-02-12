import React, { useEffect, useState } from 'react';
import { View, Text, ImageBackground, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import axios from 'axios';

const { width } = Dimensions.get('window');

const SliderItem = ({ item }) => (
  <View className="w-screen h-[250px]">
    <ImageBackground
      source={{ uri: `https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/${item.poster}` }} // Postavi ispravno učitavanje slike
      className="w-screen h-[230px] justify-between p-[15px]"
      imageStyle={{ opacity: 0.8 }}
    >
      <Text className="text-white text-2xl font-bold text-left">{item.title}</Text>
      <TouchableOpacity className="bg-red-500 p-3 rounded-[5px] self-start">
        <Text className="text-white font-bold text-base">Gledaj</Text>
      </TouchableOpacity>
    </ImageBackground>
  </View>
);

const TopSlider = () => {
  const [series, setSeries] = useState([]);

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const { data } = await axios.get("https://balkanflix-server.vercel.app/api/content/seriesHero");
        setSeries(data.series);
      } catch (error) {
        console.error("Greška prilikom učitavanja serija:", error);
      }
    };

    fetchSeries();
  }, []);

  return (
    <View className="flex-1">
      <FlatList
        data={series}
        renderItem={({ item }) => <SliderItem item={item} />}
        keyExtractor={(item) => item.title}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToInterval={width}
        decelerationRate="fast"
      />
    </View>
  );
};

export default TopSlider;