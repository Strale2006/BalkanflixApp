import { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSearch from '../../lib/useSearch';
import SearchInput from '../../components/SearchInput';
import EmptyState from '../../components/EmptyState';
import VideoCard from '../../components/VideoCard';

const Search = () => {
  const [submittedQuery, setSubmittedQuery] = useState('');
  const flatListRef = useRef(null);
  const { data: posts, loading, error, loadMore } = useSearch(submittedQuery);

  // Scroll to top when search changes
  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [submittedQuery]);

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        ref={flatListRef}
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <VideoCard item={item} />}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={() => (
          <View className="my-6 px-4">
            <Text className="font-pmedium text-sm text-gray-100">
              Rezultati Pretrage
            </Text>
            <Text className="text-2xl font-psemibold text-white">
              {submittedQuery ? submittedQuery : "Pretražite nešto..."} 
            </Text>

            <View className="mt-6 mb-8">
              <SearchInput 
                initialQuery={submittedQuery}
                onSearch={setSubmittedQuery}
              />
            </View>
          </View>
        )}
        ListFooterComponent={() => (
          loading && <ActivityIndicator size="small" color="#fff" className="py-4" />
        )}
        ListEmptyComponent={() => (
          !loading && (
            <EmptyState 
              title={error ? "Greška u pretrazi" : "Nema rezultata"}
              subtitle={error || "Ništa nije pronađeno"}
            />
          )
        )}
      />
    </SafeAreaView>
  );
};

export default Search;