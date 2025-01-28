import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import useSearch from '../../lib/useSearch';
import SearchInput from '../../components/SearchInput';
import EmptyState from '../../components/EmptyState';
import VideoCard from '../../components/VideoCard';

const Search = () => {
  const { query } = useLocalSearchParams();
  const { data: posts, loading, error, loadMore } = useSearch(query);

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList 
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <VideoCard item={item} />
        )}
        numColumns={2} // Display 2 cards per row
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={() => (
          <View className="my-6 px-4">
            <Text className="font-pmedium text-sm text-gray-100">
              Search Results
            </Text>
            <Text className="text-2xl font-psemibold text-white">
              {query}
            </Text>

            <View className="mt-6 mb-8">
              <SearchInput initialQuery={query} />
            </View>
          </View>
        )}
        ListFooterComponent={() => (
          loading && <ActivityIndicator size="small" color="#fff" className="py-4" />
        )}
        ListEmptyComponent={() => (
          !loading && (
            <EmptyState 
              title={error ? "Search Error" : "No Results"}
              subtitle={error || "No series found for this search query"}
            />
          )
        )}
      />
    </SafeAreaView>
  );
};

export default Search;