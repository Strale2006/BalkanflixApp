// app/modal.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { router } from 'expo-router';
import axios from 'axios';
import { useGlobalContext } from '../context/GlobalProvider'; // Adjust path if needed
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';


const imageLists = {
  banner: [
    "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/Banner1.webp",
    "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/Banner2.webp",
    "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/Banner3.webp",
    "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/Banner4.webp",
    "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/Banner5.webp",
  ],
  pfp: {
    Naruto: [
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp1.webp",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp2.webp",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp3.webp",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp4.webp",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp5.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp6.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp7.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp8.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp9.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp10.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp11.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp12.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp13.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp14.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp15.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp16.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp17.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp18.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp19.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp20.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp21.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp22.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp23.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp24.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp25.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp26.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/narutopfp27.jpg",
    ],
    BlueLock: [
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/blpfp1.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/blpfp2.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/blpfp3.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/blpfp4.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/blpfp5.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/blpfp6.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/blpfp7.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/blpfp8.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/blpfp9.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/blpfp10.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/blpfp11.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/blpfp12.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/blpfp13.jpg",
    ],
    JJK: [
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/jjpfp1.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/jjpfp2.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/jjpfp3.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/jjpfp4.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/jjpfp5.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/jjpfp6.jpg",
    ],
    DragonBall: [
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/dbpfp1.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/dbpfp2.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/dbpfp3.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/dbpfp4.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/dbpfp5.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/dbpfp6.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/dbpfp7.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/dbpfp8.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/dbpfp9.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/dbpfp10.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/dbpfp11.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/dbpfp12.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/dbpfp13.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/dbpfp14.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/dbpfp15.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/dbpfp16.jpg",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/dbpfp17.webp",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/dbpfp18.jpg",
    ],
    Jojo: [
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/jojopfp1.webp",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/jojopfp2.webp",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/jojopfp3.webp",
    ],
    OnePiece: [
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/onepiecepfp1.webp",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/onepiecepfp2.webp",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/onepiecepfp3.webp",
    ],
    Bleach: [
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/bleachpfp1.webp",
    ],

    Berserk: [
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/berserkpfp1.webp",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/berserkpfp2.webp",
    ],


    Ostalo: [
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/yugiohpfp1.webp",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/hogurashipfp1.webp",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/kakeguruipfp1.webp",
      "https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/blackcloverpfp1.webp",
    ],
  },
};

export const ChangeInfoForm = () => {
  // Local state for form data and modal visibility for PFP selection
  const [selectedPfpCategory, setSelectedPfpCategory] = useState("JJK");
  const [pfp, setPfp] = useState(null);
  const [newPfp, setNewPfp] = useState(null);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [bannerIndex, setBannerIndex] = useState(0);
  const [pfpModalOpen, setPfpModalOpen] = useState(false);

  // Global context to obtain auth token and optionally update user info
  const { token, setUser, user } = useGlobalContext();

  // Initialize pfp state with user's current profile picture
  useEffect(() => {
    if (user?.pfp) {
      setPfp(user.pfp);
    }
  }, [user?.pfp]);

  // Toggle profile picture selection modal
  const togglePfpModal = () => {
    setPfpModalOpen(!pfpModalOpen);
  };

  // When a PFP is selected, update local state and close modal
  const previewPfp = (profilePic) => {
    setPfp(profilePic);
    setNewPfp(profilePic);
    togglePfpModal();
  };

  // Set the active profile picture category
  const selectPfpCategory = (category) => {
    setSelectedPfpCategory(category);
  };

  // Render available profile picture options for the selected category
  const renderPfpOptions = () => {
    if (!selectedPfpCategory) return null;
    return imageLists.pfp[selectedPfpCategory].map((imageUrl, index) => (
      <TouchableOpacity key={index} onPress={() => previewPfp(imageUrl)}>
        <Image
          source={{ uri: imageUrl }}
          className="w-12 h-12 m-1 rounded"
        />
      </TouchableOpacity>
    ));
  };

  // Cycle to the next banner image
  const nextBanner = () => {
    setBannerIndex((prevIndex) =>
      prevIndex === imageLists.banner.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Cycle to the previous banner image
  const prevBanner = () => {
    setBannerIndex((prevIndex) =>
      prevIndex === 0 ? imageLists.banner.length - 1 : prevIndex - 1
    );
  };

  // Prepare axios config using the token from global context
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  // Optionally fetch the current user info to update PFP (if needed)
  const fetchUser = useCallback(async () => {
    try {
      const { data } = await axios.get("https://balkanflix-server.vercel.app/api/private", config);
      // Only set pfp if it hasn't been changed by the user
      if (!newPfp) {
        setPfp(data.pfp);
      }
    } catch (error) {
      console.error("Server error", error);
    }
  }, [config, newPfp]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Update the user profile with new information
  const changeInfo = async () => {
    const updateData = {};
    if (newUsername) updateData.newUsername = newUsername;
    if (newEmail) updateData.newEmail = newEmail;
    updateData.newBanner = imageLists.banner[bannerIndex];
    if (newPfp) updateData.newPfp = newPfp;

    try {
      const response = await axios.put(
        "https://balkanflix-server.vercel.app/api/auth/updateProfile",
        updateData,
        config
      );
      
      // Update global user state and AsyncStorage
      if (response.data?.user) {
        setUser(response.data.user);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      }
      
      // Reset local form state
      setNewUsername("");
      setNewEmail("");
      setNewPfp(null);
      
      // Navigate back to profile page
      router.back();
      return response;
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(
        "Failed to update profile. Error: " +
          (error.response?.data?.error || "Server error")
      );
    }
  };

  return (
    <>
      {pfpModalOpen && (
        <View className="absolute inset-0 bg-black/90 w-full h-full items-center justify-center z-50">
          <View className="bg-gray-800 p-4 rounded-2xl w-11/12 max-w-md">
            <Text className="text-xl font-pbold mb-4 text-white">Izaberi profilnu sliku</Text>
            
            {/* Category Chips */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              {Object.keys(imageLists.pfp).map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => selectPfpCategory(category)}
                  className={`px-4 py-2 mr-2 rounded-full ${
                    selectedPfpCategory === category 
                      ? 'bg-blue-500' 
                      : 'bg-gray-700'
                  }`}
                >
                  <Text className={`font-psemibold ${
                    selectedPfpCategory === category 
                      ? 'text-white' 
                      : 'text-gray-300'
                  }`}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Image Grid */}
            <ScrollView 
              contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}
              className="max-h-96"
            >
              {imageLists.pfp[selectedPfpCategory].map((imageUrl, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => previewPfp(imageUrl)}
                  className="p-1 w-1/4"
                >
                  <Image
                    source={{ uri: imageUrl }}
                    className="w-full aspect-square rounded-lg"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity 
              onPress={togglePfpModal} 
              className="mt-4 bg-gray-700 py-3 rounded-xl"
            >
              <Text className="text-white text-center text-base font-pbold">Izađi</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Content */}
      <SafeAreaView className="bg-slate-950 h-full">
        <View className="p-6 flex-1">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-3xl text-white font-pbold">Uredi Profil</Text>
            <TouchableOpacity 
              onPress={() => router.back()}
              className="p-2 rounded-full bg-gray-800"
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Banner Section */}
          <View className="mb-8">
            <View className="relative h-48 rounded-2xl overflow-hidden">
              <Image
                source={{ uri: imageLists.banner[bannerIndex] }}
                className="w-full h-full"
              />
              
              <View className="absolute inset-0 flex-row justify-evenly items-center px-4 py-20 gap-56">	
                <TouchableOpacity 
                  onPress={prevBanner}
                  className="p-2 rounded-full bg-white/20"
                >
                  <Ionicons name="chevron-back" size={24} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={nextBanner}
                  className="p-2 rounded-full bg-white/20"
                >
                  <Ionicons name="chevron-forward" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Profile Picture Section */}
          <View className="items-center -mt-20 mb-8">
            <TouchableOpacity 
              onPress={togglePfpModal}
              className="relative"
            >
              <Image
                source={{ uri: pfp }}
                className="w-32 h-32 rounded-full border-4 border-slate-900"
              />
              <View className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full border-2 border-slate-900">
                <FontAwesome5 name="pen" size={16} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Username Input */}
            <View className="mb-6">
              <Text className="text-gray-300 mb-2 font-psemibold">Korisničko ime</Text>
              <TextInput
                placeholder="Novo korisničko ime"
                placeholderTextColor="#94a3b8"
                value={newUsername}
                onChangeText={setNewUsername}
                className="bg-gray-800 text-white p-4 rounded-xl font-pregular focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </View>

            {/* Email Input */}
            <View className="mb-8">
              <Text className="text-gray-300 mb-2 font-psemibold">Email</Text>
              <TextInput
                placeholder="Novi email"
                placeholderTextColor="#94a3b8"
                value={newEmail}
                onChangeText={setNewEmail}
                className="bg-gray-800 text-white p-4 rounded-xl font-pregular focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity 
              onPress={changeInfo} 
              className="bg-blue-500 py-4 rounded-xl active:bg-blue-600"
            >
              <Text className="text-white text-center text-lg font-pbold">Sačuvaj Promene</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
};

export default ChangeInfoForm;
