import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

const VideoCard = ({ item }) => {
  return (
    <TouchableOpacity 
      className="mr-4"
      onPress={() => {
        router.push(`/details/${encodeURIComponent(item.title_params)}`);
      }}
      >
      <Image
        source={{ uri: `https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/${item.img}` }}
        className="w-40 h-56 rounded-xl"
        resizeMode="cover"
      />
        
        {/* Series Title */}
      <Text className="text-white font-psemibold text-sm mt-2 mb-4 max-w-[170px]" numberOfLines={2}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );
};

export default VideoCard;