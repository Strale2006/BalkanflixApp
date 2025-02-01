import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity, FlatList, Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

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
  <View style={styles.sliderItem}>
    <ImageBackground source={item.image} style={styles.sliderImage} imageStyle={styles.imageStyle}>
      <Text style={styles.sliderText}>{item.text}</Text>
      <TouchableOpacity style={styles.sliderButton}>
        <Text style={styles.buttonText}>{item.buttonText}</Text>
      </TouchableOpacity>
    </ImageBackground>
  </View>
);

const TopSlider = () => {
  return (
    <View style={styles.sliderContainer}>
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

const styles = StyleSheet.create({
  sliderContainer: {
    flex: 1,
  },
  sliderItem: {
    width: width,
    height: 250,
  },
  sliderImage: {  
    width: width,
    height: 230,
    justifyContent: 'space-between',
    padding: 15,
  },
  imageStyle: {
    opacity: 0.8,
  },
  sliderText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  sliderButton: {
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TopSlider;