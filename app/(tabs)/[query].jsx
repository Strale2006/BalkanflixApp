import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSearch from '../../lib/useSearch';
import SearchInput from '../../components/SearchInput';
import EmptyState from '../../components/EmptyState';
import VideoCard from '../../components/VideoCard';

const Search = () => {
    const [searchText, setSearchText] = useState('');
    const flatListRef = useRef(null);
    const { data: posts, loading, error, loadMore, searchNow } = useSearch(searchText);

    // Resetuj skrol na vrh kad se rezultati promene
    useEffect(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, [posts]);

    const handleSubmit = useCallback(() => {
        searchNow();
    }, [searchNow]);

    return (
        <SafeAreaView className="bg-primary h-full">
            {/* Fiksni header sa SearchInput */}
            <View className="px-4 pt-6 pb-2">
                <Text className="font-pmedium text-sm text-gray-100 mb-1">
                    Rezultati Pretrage
                </Text>
                <Text className="text-2xl font-psemibold text-white mb-4">
                    {searchText.trim() || "Pretražite nešto..."}
                </Text>
                <SearchInput
                    value={searchText}
                    onChangeText={setSearchText}
                    onSubmit={handleSubmit}
                />
            </View>

            {/* Lista rezultata */}
            <FlatList
                ref={flatListRef}
                data={posts}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <VideoCard item={item} />}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() =>
                    loading && <ActivityIndicator size="small" color="#fff" className="py-4" />
                }
                ListEmptyComponent={() =>
                    !loading && (
                        <EmptyState
                            title={error ? "Greška u pretrazi" : "Nema rezultata"}
                            subtitle={error || "Ništa nije pronađeno"}
                        />
                    )
                }
                // Važno: sprečava da tastatura nestane pri dodiru liste
                keyboardShouldPersistTaps="handled"
            />
        </SafeAreaView>
    );
};

export default Search;