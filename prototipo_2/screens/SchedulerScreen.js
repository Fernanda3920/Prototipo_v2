// screens/SchedulerScreen.js
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import NotificationScheduler from '../components/NotificationScheduler';

export default function SchedulerScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <NotificationScheduler />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
  },
});