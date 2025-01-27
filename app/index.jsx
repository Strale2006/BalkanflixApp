import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView, Image } from 'react-native';
import {Redirect, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context';

import {images} from '../constants';
import CustomButton from '../components/CustomButton';

import { useGlobalContext } from '../context/GlobalProvider';

export default function App() {

  const {isLoading, isLoggedIn} = useGlobalContext();

  if(!isLoading && isLoggedIn) return <Redirect href='/home' />

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView contentContainerStyle={{ height: '100%' }}>
        <View className="w-full justify-center items-center min-h-[85vh] px-4">
          <Image
            source={images.logo}
            className="w-[130px] h-[84px]"
            resizeMode='contain'
          />

          <Image 
            source={images.cards}
            className="max-w-[380px] h-[200px] w-full h=[300px]"
            resizeMode='contain'
          />

          <View className="relative mt-5">
            <Text className="text-3xl text-white font-bold text-center">
              Istražuj anime uz Balkan{''}
              <Text className="text-secondary-200">Flix</Text>
            </Text>
            <Image
              source={images.path}
              className="w=[20px] h-[15px] absolute -bottom-2 -right-10"
              resizeMode='contain'
            />
          </View>
          
          <Text className="text-sm font-pregular text-gray-100 mt-7 text-center">
            Uživajte gledajući omiljene serijale potpuno besplatno uz najbolji kvalitet na Balkanu
          </Text>

          <CustomButton 
              title="Poveži se"
              handlePress={() => router.push('sign-in')}
              containerStyles="w-full mt-7"
          />
        </View>
      </ScrollView>

      <StatusBar backgroundColor='#161622' style='light'/>
    </SafeAreaView>
  );
}
