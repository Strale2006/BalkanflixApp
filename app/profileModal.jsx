// app/modal.tsx
import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
const Modal = () => {
  // Local state for form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  const handleSave = () => {
    // TODO: Add your update logic here (e.g., call an API or update context)
    // After saving, dismiss the modal:
    router.back();
  };

  return (
    <View className="flex-1 items-center justify-center bg-[#0B0F19] p-6">
      <Text className="text-2xl text-white font-pbold mb-4">Change Information</Text>
      <TextInput
        placeholder="Username"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
        className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-white font-psemibold"
      />
      
      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-white font-psemibold"
      />
      
      <View className="w-full flex-row justify-end space-x-4">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Text className="text-red-500 font-psemibold">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} className="bg-blue-500 rounded px-4 py-2">
          <Text className="text-white font-psemibold">Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default Modal;