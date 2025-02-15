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
      setPfp(data.pfp);
    } catch (error) {
      console.error("Server error", error);
    }
  }, [config]);

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
      // Optionally update global user info here if needed:
      if (response.data?.user) {
        setUser(response.data.user);
      }
      // Reset local form state
      setNewUsername("");
      setNewEmail("");
      setNewPfp(null);
      // Instead of reloading the window, navigate back
      router.replace("/profile");
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
        <View className="absolute inset-0 bg-black/50 w-full h-full items-center justify-center z-50">
            <View className="bg-white p-4 rounded-lg w-11/12">
                <Text className="text-xl font-pbold mb-4 text-black">Izaberite novu profilnu sliku</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {Object.keys(imageLists.pfp).map((category) => (
                    <TouchableOpacity
                        key={category}
                        onPress={() => selectPfpCategory(category)}
                        className="bg-gray-200 p-2 m-1 rounded"
                    >
                        <Text className="text-black font-psemibold">{category}</Text>
                    </TouchableOpacity>
                    ))}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
                    {renderPfpOptions()}
                </ScrollView>
                <TouchableOpacity onPress={togglePfpModal} className="bg-red-500 p-2 rounded mt-4">
                    <Text className="text-white text-center text-base font-pbold">Odustani</Text>
                </TouchableOpacity>
            </View>
        </View>
        )}

            {/* Main Modal Content */}
            <SafeAreaView className='bg-[#0B0F19] h-full'>
                <View className="bg-[#0B0F19] p-6 flex-1 w-full">
                    <View className='flex flex-row w-full justify-between items-center '>
                        <Text className="text-3xl text-white font-pbold mb-4">Uredi nalog</Text>
                        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} className='border border-white p-2 rounded-md bg-red-700'>
                            <Text className='text-white font-psemibold text-base'>Odustani</Text>
                        </TouchableOpacity>
                    </View>
                    <Text className="text-white mb-2 font-psemibold">Prilagodite informacije</Text>
                    {/* Banner Carousel */}
                    <View className="flex-row items-center justify-center mb-4">
                    <TouchableOpacity onPress={prevBanner}>
                    <MaterialCommunityIcons name='arrow-left-bold' color="#fff" size={30} />
                    </TouchableOpacity>
                    <Image
                        source={{ uri: imageLists.banner[bannerIndex] }}
                        className="w-64 h-32 mx-4 rounded"
                    />
                    <TouchableOpacity onPress={nextBanner}>
                        <MaterialCommunityIcons name='arrow-right-bold' color="#fff" size={30} />
                    </TouchableOpacity>
                    </View>
                    {/* Profile Picture with Edit */}
                    <TouchableOpacity onPress={togglePfpModal} className="mb-4">
                        <View className="relative">
                            <Image
                            source={{ uri: pfp }}
                            className="w-24 h-24 rounded-full"
                            />
                            <View className="absolute inset-0 items-center justify-center">
                            <FontAwesome5 name="pen" size={16} color="white" />
                            </View>
                        </View>
                    </TouchableOpacity>
                    {/* Username Input */}
                    <View className="mb-4">
                    <Text className="text-white mb-1 font-psemibold">Korisničko ime</Text>
                    <TextInput
                        placeholder="Unesi novo korisničko ime"
                        placeholderTextColor="#888"
                        value={newUsername}
                        onChangeText={setNewUsername}
                        className="bg-white/10 text-white p-3 rounded-lg font-pregular"
                    />
                    </View>
                    {/* Email Input */}
                    <View className="mb-4">
                    <Text className="text-white mb-1 font-psemibold">Email</Text>
                    <TextInput
                        placeholder="Unesi novi email"
                        placeholderTextColor="#888"
                        value={newEmail}
                        onChangeText={setNewEmail}
                        className="bg-white/10 text-white p-3 rounded-lg font-pregular"
                    />
                    </View>
                    {/* Save Button */}
                    <TouchableOpacity onPress={changeInfo} className="bg-blue-500 p-3 rounded">
                    <Text className="text-white text-center text-lg font-pbold">Izmeni</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
    </>
  );
};

export default ChangeInfoForm;
