import { View, Text, Image } from 'react-native'
import { Tabs, Redirect } from 'expo-router'

import {icons} from '../../constants'

const TabIcon = ({icon, color, name, focused}) => {
  return (
    <View className="flex items-center justify-center gap-1">
      <Image
        source={icon}
        resizeMode="contain"
        tintColor={color}
        className="w-5 h-5"
      />
      <Text
        className={`${focused ? "font-psemibold" : "font-pregular"} text-xs w-16 text-center`}
        style={{ color: color }}
      >
        {name}
      </Text>
    </View>
  );
}

const TabsLayout = () => {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#FFA001',
          tabBarInactiveTintColor: '#CDCDE0',
          tabBarStyle: {
            backgroundColor: '#101420',
            borderTopWidth: 1,
            borderTopColor: '#232533',
            height: 84,
            paddingTop: 10
          }
        }}
      >
          <Tabs.Screen name='home' options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color, focused}) => (
              <TabIcon icon={icons.home} color={color} name="Home" focused={focused} />
            )
          }} />

          <Tabs.Screen name='[query]' options={{
            title: 'Search',
            headerShown: false,
            tabBarIcon: ({ color, focused}) => (
              <TabIcon icon={icons.search} color={color} name="Search" focused={focused} />
            )
          }} />

          <Tabs.Screen name='chat' options={{
            title: 'Chat',
            headerShown: false,
            tabBarIcon: ({ color, focused}) => (
              <TabIcon icon={icons.plus} color={color} name="Chat" focused={focused} />
            )
          }} />

          <Tabs.Screen name='profile' options={{
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({ color, focused}) => (
              <TabIcon icon={icons.profile} color={color} name="Profile" focused={focused} />
            )
          }} />
      </Tabs>
      
    </>
  )
}

export default TabsLayout