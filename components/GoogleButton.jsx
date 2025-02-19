import { TouchableOpacity, Text, View } from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome';

const GoogleButton = ({title, handlePress, containerStyles, textStyles, isLoading}) => {
  return (
    <TouchableOpacity 
      onPress={handlePress} 
      activeOpacity={0.7}
      className={` bg-blue-400 rounded-xl p-5 ${containerStyles} ${isLoading ? 'opacity-50' : ''}`}
      disabled={isLoading}
    >
      <View className="flex-row justify-center items-center">
        {/* <Icon name="google" size={24} color="#fff" /> */}
        <Text className={`${textStyles} ml-2`} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
      </View>
  </TouchableOpacity>
  )
}

export default GoogleButton