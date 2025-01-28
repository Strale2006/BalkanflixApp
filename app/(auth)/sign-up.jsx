import { View, Text, ScrollView, Image, Alert } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, router} from 'expo-router'

import {images} from '../../constants'
import FormField from './../../components/FormField';
 
import CustomButton from '../../components/CustomButton'
import { registerUser } from '../../lib/apiControllers'
import { useGlobalContext } from "../../context/GlobalProvider";


const SignUp = () => {
  const { handleRegister } = useGlobalContext();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!form.username || !form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all the fields');
      return;
    }
    setIsSubmitting(true);
    try {
      await handleRegister(form.username, form.email, form.password);
      Alert.alert('Success', 'You have successfully registered');
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
        <View className="w-full justify-center h-full px-4 my-5">
          <Image
            source={images.logo}
            resizeMode='contain'
            className="w-[210px] h-[70px]"
          />

          <Text className="text-2xl text-white mt-5 font-pbold">Registruj se na BalkanFlix</Text>

          <FormField 
            title='Korisničko ime'
            placeholder='Unesite korisničko ime'
            value={form.username}
            handleChangeText={(e) => setForm({...form, username: e})}
            otherStyles='mt-10'
          />
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

          <CustomButton
            title='Registruj se'
            handlePress={submit}
            containerStyles='mt-7'
            isLoading={isSubmitting}
          />

          <View className="justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray-100 font-pregular">
              Već imaš nalog?
            </Text>
            <Link href='/sign-in' className='text-lg font-psemibold text-secondary'>
              Poveži se
            </Link>
          </View>
        </View>
      </ScrollView>
    </ SafeAreaView>
  )
}

export default SignUp