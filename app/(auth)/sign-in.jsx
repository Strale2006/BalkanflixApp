import { View, Text, ScrollView, Image, Alert } from 'react-native'
import { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, router } from 'expo-router'
import {images} from '../../constants'
import FormField from './../../components/FormField';
import CustomButton from '../../components/CustomButton'
import { useGlobalContext } from "../../context/GlobalProvider";
import GoogleButton from '../../components/GoogleButton'


// GoogleSignin.configure({
//   webClientId: '140537177807-1tkrju2cp5dqmpkg7mhfkbhc4pntbka5.apps.googleusercontent.com',
//   scopes: ['https://www.googleapis.com/auth/drive.readonly'],
//   offlineAccess: true,
//   forceCodeForRefreshToken: false,
//   iosClientId: '140537177807-vc2dto6ikkvj69rvkpv1t3a47oijhn7o.apps.googleusercontent.com'
// });


const SignIn = () => {
  const { handleLogin, handleGoogleLogin } = useGlobalContext();
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
      // Alert.alert('Success', 'You have successfully logged in');
      router.replace('/home');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitGoogle = async () => {
    setIsSubmitting(true);
    try {
      await handleGoogleLogin();
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

          <Text className="text-2xl text-white mt-5 font-pbold">Prijavi se na BalkanFlix</Text>

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

          {/* <View className="flex-row justify-end mt-3">
            <Link href='/forgot-password' className='text-secondary text-base font-psemibold'>
              Zaboravili ste lozinku?
            </Link>
          </View> */}

          <CustomButton
            title='Prijavi se'
            handlePress={submit}
            containerStyles='mt-7'
            isLoading={isSubmitting}
            textStyle="text-white"
          />

          
          <GoogleButton
            title='Prijavi se putem Googlea'
            handlePress={submitGoogle}
            containerStyles='mt-7'
            isLoading={isSubmitting}
            textStyles="text-white flex justify-center items-center text-center font-psemibold text-lg"
          />

          <View className="justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray-100 font-pregular">
              Nemaš nalog?
            </Text>
            <Link href='/sign-up' className='text-lg font-psemibold text-secondary'>
              Registruj se
            </Link>
          </View>

          {/* <GoogleSigninButton 
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={GoogleLogin}
          /> */}
          

        </View>
      </ScrollView>
    </ SafeAreaView>
  )
}

export default SignIn