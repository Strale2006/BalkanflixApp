import React from 'react';
import { View, ActivityIndicator } from 'react-native';

const CardSkeleton = () => {
  return (
    <View
      className="bg-[#091238] rounded-lg justify-center items-center"
      style={{ aspectRatio: 0.7 }}
    >
      <ActivityIndicator size="large" color="#D7F7F4" />
    </View>
  );
};

export default CardSkeleton;