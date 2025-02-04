import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

const FormCard = ({
  title,
  subtitle,
  malLabel = 'MAL',
  tmdbLabel = 'TMDB',
  buttonText,
  onSubmit,
  index,
  malValue,
  tmdbValue,
  onChangeMal,
  onChangeTmdb,
}) => {
  return (
    <View
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 400, delay: index * 100 }}
      className="mb-6"
    >
      <View className="bg-slate-900 border border-gray-800 shadow-2xl rounded-xl p-4">
        <View className="mb-4 space-y-1">
          <Text className="text-xl font-bold text-cyan-400">{title}</Text>
          {subtitle && (
            <Text className="text-sm text-gray-400 font-medium">
              {subtitle}
            </Text>
          )}
        </View>
        <View className="mb-4 space-y-4">
          <View className="flex-row space-x-4">
            <View className="flex-1 space-y-2">
              <Text className="text-gray-300">{malLabel}</Text>
              <TextInput
                placeholder="Unesi ID"
                placeholderTextColor="#A1A1AA"
                value={malValue}
                onChangeText={onChangeMal}
                className="bg-gray-800 border border-gray-700 text-white p-2 rounded"
              />
            </View>
            <View className="flex-1 space-y-2">
              <Text className="text-gray-300">{tmdbLabel}</Text>
              <TextInput
                placeholder="Unesi ID"
                placeholderTextColor="#A1A1AA"
                value={tmdbValue}
                onChangeText={onChangeTmdb}
                className="bg-gray-800 border border-gray-700 text-white p-2 rounded"
              />
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={onSubmit} activeOpacity={0.8}>
          <View className="w-full bg-blue-500 p-3 rounded-lg shadow-lg">
            <Text className="text-center text-white font-medium">{buttonText}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FormCard;
