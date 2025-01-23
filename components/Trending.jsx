import { useState } from "react";
import { useVideoPlayer, VideoView } from 'expo-video';
import * as Animatable from "react-native-animatable";
import {
  FlatList,
  Image,
  ImageBackground,
  TouchableOpacity,
  View
} from "react-native";

import { icons } from "../constants";
import { WebView } from 'react-native-webview';


const zoomIn = {
  0: {
    scale: 0.9,
  },
  1: {
    scale: 1,
  },
}

const zoomOut = {
  0: {
    scale: 1,
  },
  1: {
    scale: 0.9
  },
}


const TrendingItem = ({activeItem, item}) => {

  const [play, setPlay] = useState(false)

  return (
    <Animatable.View
      className="mr-5"
      animation={activeItem === item.$id ? zoomIn : zoomOut}
      duration={500}
    >
      {play ? (
        <View className=" w-52 h-72 ">
          <WebView
          source={{
              uri: item.video,
          }}
          className="w-full h-60 rounded-xl mt-3"   
          allowsFullscreenVideo
          mixedContentMode='always'
          />
        </View>
      ): (
        <TouchableOpacity className="relative justify-center items-center" activeOpacity={0.7} onPress={() => setPlay(true)}>
          <ImageBackground
            source={{uri: item.thumbnail}}
            className="w-52 h-72 rounded-[35px] my-5 overflow-hidden shadow-lg shadow-black/40"
            resizeMode='cover'
          />

          <Image 
            source={icons.play}
            className="w-12 h-12 absolute"
            resizeMode='contain'
          />
        </TouchableOpacity>
      )}
    </Animatable.View>
  )
}

const Trending = ({ posts }) => {

  const [activeItem, setActiveItem] = useState(posts[0])

  const viewableItemsChanged = ({ viewableItems }) => {
    setActiveItem(viewableItems[0].key)
  }
  

  return (
    <FlatList
        data={posts}
        keyExtractor={(item) => item.$id}
        horizontal
        renderItem={({ item }) => (
            <TrendingItem
              activeItem={activeItem}
              item={item}
            />
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 70
        }}
        contentOffset={{x: 70}}
    />
  )
}

export default Trending