// import { useEffect, useState, useCallback, useMemo } from 'react';
// import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import { GlobalContext } from '../../context/GlobalProvider';
// import { Video } from 'expo-av';
// import { ScrollView } from 'react-native-gesture-handler';

// export default function EpisodeScreen() {
//   const { user } = GlobalContext();
//   const { id, ep } = useLocalSearchParams();
//   const router = useRouter();
//   const [episodeData, setEpisodeData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [server, setServer] = useState('default');

//   useEffect(() => {
//     if (!user) {
//       router.replace('/login');
//       return;
//     }
//     fetchEpisode();
//   }, [id, ep, user]);

//   const fetchEpisode = useCallback(async () => {
//     try {
//       setLoading(true);
//       const res = await fetch(`https://yourapi.com/anime/${id}/episode/${ep}`);
//       const data = await res.json();
//       setEpisodeData(data);
//     } catch (error) {
//       console.error('Error fetching episode:', error);
//     } finally {
//       setLoading(false);
//     }
//   }, [id, ep]);

//   const videoSource = useMemo(() => {
//     return episodeData?.servers?.[server] || episodeData?.defaultUrl || '';
//   }, [episodeData, server]);

//   if (loading) {
//     return (
//       <View className="flex-1 items-center justify-center">
//         <ActivityIndicator size="large" color="#fff" />
//       </View>
//     );
//   }

//   return (
//     <ScrollView className="flex-1 bg-black p-4">
//       <Text className="text-white text-xl font-bold mb-2">
//         {episodeData?.title || 'Episode'} {ep}
//       </Text>
      
//       {videoSource ? (
//         <Video
//           source={{ uri: videoSource }}
//           useNativeControls
//           resizeMode="contain"
//           className="w-full h-56 mb-4"
//         />
//       ) : (
//         <Text className="text-gray-400">No video available</Text>
//       )}

//       <View className="flex-row gap-2 mt-4">
//         {Object.keys(episodeData?.servers || {}).map((key) => (
//           <TouchableOpacity
//             key={key}
//             className={`px-4 py-2 rounded-lg ${server === key ? 'bg-blue-500' : 'bg-gray-700'}`}
//             onPress={() => setServer(key)}
//           >
//             <Text className="text-white">{key}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>
//     </ScrollView>
//   );
// }
