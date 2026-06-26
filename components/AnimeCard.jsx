import React from 'react';
import { TouchableOpacity, ImageBackground, Text } from 'react-native';
import { router } from 'expo-router';

const MovieCard = ({ item }) => {
  return (
    <TouchableOpacity 
      onPress={() => {
        router.push(`/details/${encodeURIComponent(item.title_params)}`);
      }}
      >
      <ImageBackground
        source={{ uri: `https://images.balkanflix.com/${item.img}` }}
        className="overflow-hidden rounded-lg"
        style={{ aspectRatio: 0.7 }}
        imageStyle={{ resizeMode: 'cover' }}
      >
      </ImageBackground>
      <Text className="text-white font-psemibold p-2" numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );
};

export default MovieCard;