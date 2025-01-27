import { View, Text, ScrollView, Image, Alert } from 'react-native'
import { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, router } from 'expo-router'

import {images} from '../../constants'
import FormField from './../../components/FormField';
import CustomButton from '../../components/CustomButton'

// import { signIn, getCurrentUser } from '../../lib/appwrite'
import { loginUser, getUser } from '../../lib/apiControllers'
import { useGlobalContext } from "../../context/GlobalProvider";


const SignIn = () => {
  const { handleLogin } = useGlobalContext();
  const [form, setForm] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all the fields');
      return;
    }
    setIsSubmitting(true);
    try {
      await handleLogin(form.email, form.password);
      Alert.alert('Success', 'You have successfully logged in');
      router.replace('/home');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView>
        <View className="w-full justify-center h-full px-4 my-6">
          <Image
            source={images.logo}
            resizeMode='contain'
            className="w-[182px] h-[60px]"
          />

          <Text className="text-2xl text-white mt-10 font-psemibold">Prijavi se na BalkanFlix</Text>

          <FormField 
            title='Email'
            placeholder='Unesite email'
            value={form.email}
            handleChangeText={(e) => setForm({...form, email: e})}
            otherStyles='mt-7'
            keyboardType='email-address'
          />

          <FormField 
            title='Lozinka'
            placeholder='Unesite lozinku'
            value={form.password}
            handleChangeText={(e) => setForm({...form, password: e})}
            otherStyles='mt-7'
          />

          <View className="flex-row justify-end mt-3">
            <Link href='/forgot-password' className='text-secondary text-base font-psemibold'>
              Zaboravili ste lozinku?
            </Link>
          </View>

          <CustomButton
            title='Prijavi se'
            handlePress={submit}
            containerStyles='mt-7'
            isLoading={isSubmitting}
            textStyle="text-white"
          />

          <View className="justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray-100 font-pregular">
              Nemaš nalog?
            </Text>
            <Link href='/sign-up' className='text-lg font-psemibold text-secondary'>
              Registruj se
            </Link>
          </View>
        </View>
      </ScrollView>
    </ SafeAreaView>
  )
}

export default SignIn