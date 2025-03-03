import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationTest from '../notifications/NotificationTest';

export default function NotificationTestScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <NotificationTest />
    </SafeAreaView>
  );
} 