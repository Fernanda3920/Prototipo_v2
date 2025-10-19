// screens/NotesScreen.js
import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import SQLiteNotesComponent from '../components/SQLiteNotesComponent';
import { screenStyles as styles } from '../styles/NotesScreenStyles';
export default function NotesScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <SQLiteNotesComponent />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
