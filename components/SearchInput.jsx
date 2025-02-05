import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { icons } from '../constants';

const SearchInput = ({ initialQuery, onSearch }) => {
  const [query, setQuery] = useState(initialQuery || '');

  // Sync with parent's query updates
  useEffect(() => {
    setQuery(initialQuery || '');
  }, [initialQuery]);

  const handleSearch = () => {
    if (!query.trim()) {
      Alert.alert('Ništa nije uneto', 
        "Molimo vas unesite ključne reči"
      );
      return;
    }
    onSearch(query);
  };

  return (
    <View className="border-2 border-black-200 w-full h-16 px-4 bg-black-100 rounded-2xl focus:border-secondary items-center flex flex-row">
      <TextInput 
        className="text-base mt-0.5 text-white flex-1 font-pregular"
        value={query}
        placeholder="Pretražite vaše omiljene serijale"
        placeholderTextColor="#CDCDE0"
        onChangeText={setQuery}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
      />

      <TouchableOpacity onPress={handleSearch}>
        <Image 
          source={icons.search}
          className="w-5 h-5"
          resizeMode='contain'
        />
      </TouchableOpacity>
    </View>
  );
};

export default SearchInput;