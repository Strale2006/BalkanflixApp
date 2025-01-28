import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

const VideoCard = ({ item }) => {
  return (
    <View className="mr-4">
        <Image
          source={{ uri: `https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/${item.img}` }}
          className="w-40 h-56 rounded-lg"
          resizeMode="cover"
        />
        
        {/* Series Title */}
      <Text className="text-white font-pmedium text-sm mt-2" numberOfLines={1}>
        {item.title}
      </Text>
    </View>
  );
};

export default VideoCard;