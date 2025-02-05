import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity, FlatList, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width  } = Dimensions.get('window');

const sliderData = [
  {
    id: '1',
    image: require('../assets/slider/DDDp.webp'),
    text: 'Dandadan',
    buttonText: 'Gledaj',
  },
  {
    id: '2',
    image: require('../assets/slider/AaRA2p.webp'),
    text: 'Latest Trends',
    buttonText: 'Gledaj',
  },
  {
    id: '3',
    image: require('../assets/slider/LLIAW.webp'),
    text: 'Loner Life in Another World',
    buttonText: 'Gledaj',
  },
  {
    id: '4',
    image: require('../assets/slider/BLu20p.webp'),
    text: 'Blue Lock vs U.20',
    buttonText: 'Gledaj',
  },
];

const SliderItem = ({ item }) => (
  <View className="w-screen h-[250px]">
    <ImageBackground
      source={item.image}
      className="w-screen h-[230px] justify-between p-[15px]"
      imageStyle={{ opacity: 0.8 }}
    >
      <Text className="text-white text-2xl font-bold text-left">{item.text}</Text>
      <TouchableOpacity className="bg-red-500 p-3 rounded-[5px] self-start">
        <Text className="text-white font-bold text-base">{item.buttonText}</Text>
      </TouchableOpacity>
    </ImageBackground>
  </View>
);

const TopSlider = () => {
  return (
    <View className="flex-1">
      <FlatList
        data={sliderData}
        renderItem={({ item }) => <SliderItem item={item} />}
        keyExtractor={(item) => item.id}
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