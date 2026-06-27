import { View, TextInput, TouchableOpacity, Image } from 'react-native';
import { icons } from '../constants';

const SearchInput = ({ value, onChangeText, onSubmit }) => {
    return (
        <View className="border-2 border-black-200 w-full h-16 px-4 bg-black-100 rounded-2xl items-center flex-row">
            <TextInput
                className="text-base mt-0.5 text-white flex-1 font-pregular"
                value={value}
                placeholder="Pretražite vaše omiljene serijale"
                placeholderTextColor="#CDCDE0"
                onChangeText={onChangeText}
                onSubmitEditing={onSubmit}
                returnKeyType="search"
            />
            <TouchableOpacity onPress={onSubmit}>
                <Image source={icons.search} className="w-5 h-5" resizeMode="contain" />
            </TouchableOpacity>
        </View>
    );
};

export default SearchInput;