import React from 'react';
import { View, ActivityIndicator } from 'react-native';

const CardSkeleton = () => {
  return (
    <View
      className="bg-[#1a1a1a] rounded-lg justify-center items-center"
      style={{ aspectRatio: 0.7 }}
    >
      <ActivityIndicator size="large" color="#E50914" />
    </View>
  );
};

export default CardSkeleton;