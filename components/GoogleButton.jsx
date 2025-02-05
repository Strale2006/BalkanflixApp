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
      <Text className='flex-row justify-center items-center text-center'>
        <View className="flex-row justify-center items-center text-center">
          {/* <Icon name="google" size={36} color="#ff00e0"/> */}
          <Text className={`${textStyles}`} >{title}</Text>
        </View>
      </Text>
    </TouchableOpacity>
  )
}

export default GoogleButton