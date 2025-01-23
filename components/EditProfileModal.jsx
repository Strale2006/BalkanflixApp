import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { useGlobalContext } from '../../context/GlobalProvider';
import { icons } from '../../constants'; // Assuming icons like save, close, etc.

const EditProfileModal = ({ visible, onClose }) => {
  const { user, setUser } = useGlobalContext();
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newPfp, setNewPfp] = useState(user?.pfp || '');
  const [newBanner, setNewBanner] = useState(user?.banner || '');

  const handleSave = () => {
    // Here you can implement the logic to update the profile
    // You would call an API or context setter to update the user details

    // Just simulating a profile update for now
    setUser({
      ...user,
      username: newUsername,
      email: newEmail,
      pfp: newPfp,
      banner: newBanner,
    });

    // Close modal after saving changes
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent={true}
    >
      <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <View className="bg-primary p-6 w-80 rounded-xl">
          <Text className="text-2xl font-bold text-white mb-4">Edit Profile</Text>

          {/* Banner Image */}
          <TouchableOpacity onPress={() => setNewBanner('https://new-banner-url.com')}>
            <Image source={{ uri: newBanner }} className="w-full h-20 rounded-lg mb-4" />
            <Text className="text-blue-500">Change Banner</Text>
          </TouchableOpacity>

          {/* Profile Picture */}
          <TouchableOpacity onPress={() => setNewPfp('https://new-pfp-url.com')}>
            <Image source={{ uri: newPfp }} className="w-24 h-24 rounded-full mb-4 self-center border-4 border-secondary" />
            <Text className="text-blue-500">Change Profile Picture</Text>
          </TouchableOpacity>

          {/* Username Input */}
          <TextInput
            value={newUsername}
            onChangeText={setNewUsername}
            className="bg-secondary p-3 text-white rounded-lg mb-4"
            placeholder="New Username"
            placeholderTextColor="#ddd"
          />

          {/* Email Input */}
          <TextInput
            value={newEmail}
            onChangeText={setNewEmail}
            className="bg-secondary p-3 text-white rounded-lg mb-4"
            placeholder="New Email"
            placeholderTextColor="#ddd"
          />

          {/* Save Button */}
          <TouchableOpacity onPress={handleSave} className="bg-blue-500 p-3 rounded-lg mt-4">
            <Text className="text-white text-center">Save Changes</Text>
          </TouchableOpacity>

          {/* Close Button */}
          <TouchableOpacity onPress={onClose} className="absolute top-2 right-2">
            <Text className="text-white text-xl">&times;</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default EditProfileModal;
