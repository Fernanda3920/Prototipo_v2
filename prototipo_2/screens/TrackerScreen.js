// screens/TrackerScreen.js
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import MedicationCalendarTracker from '../components/MedicationCalendarTracker';

export default function TrackerScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <MedicationCalendarTracker />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
  },
});