import { StyleSheet } from 'react-native';

export const screenStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ecf0f1',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 10,
    color: '#34495e',
    textAlign: 'center',
  },
  instructionText: {
    marginBottom: 30,
    fontSize: 15,
    textAlign: 'center',
    color: '#7f8c8d',
    lineHeight: 24,
  },
});