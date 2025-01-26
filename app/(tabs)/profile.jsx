import { View, Text, Image, TouchableOpacity, FlatList, ScrollView  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from './../../context/GlobalProvider';
import { icons } from '../../constants';
import InfoBox from './../../components/InfoBox';
import { router } from "expo-router";
import { logoutUser } from '../../lib/apiControllers'; // Import your logout function

const Profile = () => {
  const { user, setUser, setIsLoggedIn } = useGlobalContext();
  const totalEpisodesWatched = user?.full_ep.length;

  const dashboard = () => {
    router.push('/dash-home')
  }

  const logout = async () => {
    try {
      // Log out the user
      await logoutUser(); // Clears the token and user session

      // Reset context values
      setIsLoggedIn(false);
      setUser(null);

      // Redirect to the login page
      router.replace('/sign-in');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView className="flex-1">
        {/* Banner Image */}
        <View className="w-full h-40 relative mb-8">
          <Image
            source={{ uri: user?.banner }}
            resizeMode="cover"
            className="w-full h-full rounded-xl"
          />
          {/* Profile Picture */}
          <View className="absolute left-4 bottom-[-30px]">
            <Image
              source={{ uri: user?.pfp }}
              resizeMode="contain"
              className="w-24 h-24 rounded-full border-4 border-secondary"
            />
          </View>
        </View>

        

        {/* User Info Section */}
        <View className="px-6">
          <Text className="text-3xl font-bold text-white">{user?.username}</Text>
          <Text className="text-lg text-gray-400">{user?.email}</Text>

          {user?.isVerified && (
            <Text className="mt-2 text-sm text-green-500 font-psemibold">Verifikovan Korisnik</Text>
          )}

          {/* Admin Badge */}
          {user?.isAdmin && (
            <Text className="mt-1 text-sm text-blue-500 font-psemibold">Admin👑</Text>
          )}

          {user?.isTranslator && (
            <Text className="mt-1 text-sm text-red-500 font-psemibold">Prevodilac📝</Text>
          )}

          {user?.isTranslator && (
            <TouchableOpacity activeOpacity={0.8} onPress={dashboard}>
              <Text className="mt-3 p-4 border border-dashed border-white w-32 text-center text-white font-psemibold bg-blue-600 rounded-xl">Dashboard</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={logout}>
            <Image 
              source={icons.logout}
              className="w-6 h-6"
            />
          </TouchableOpacity>

          

          <View className="w-full flex">   
            <View className="flex-row mt-6 justify-between">
              <InfoBox
                title={totalEpisodesWatched}
                subtitle="Odgledanih Epizoda"
                containerStyles=" p-3 border border-red-500 rounded-lg"
                titleStyles="text-xl font-semibold"
                subtitleStyles="text-gray-400"
              />

              {user?.isTranslator && (
                <InfoBox
                  title={user?.brojPrevoda}
                  subtitle="Prevedeno Epizoda"
                  containerStyles=" p-3 border border-red-500 rounded-lg"
                  titleStyles="text-xl font-semibold"
                  subtitleStyles="text-gray-400"
                />
              )}
            </View>
          </View>


          {/* Favorites Section */}
          <View className="mt-6">
            <Text className="text-xl font-bold text-white">Omiljeno</Text>
            <View className="mt-4 flex-row flex-wrap">
              {user?.favorites?.map((title, index) => (
                <View key={index} className="bg-secondary rounded-lg p-2 mx-2 mb-2">
                  <Text className="text-white text-sm">{title}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;