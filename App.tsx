import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable } from 'react-native';

export default function App() {
  const [enabled, setEnabled] = useState(false);
  const [count, setCount] = useState(0);

  const onPress = () => {
    setEnabled(v => !v);
    setCount(c => c + 1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello Expo 🚀</Text>
      <Text style={styles.subtitle}>Ton appli est bien en train de tourner 🎉</Text>

      <Pressable onPress={onPress} style={({ pressed }) => [
        styles.button,
        enabled ? styles.buttonOn : styles.buttonOff,
        pressed && styles.buttonPressed
      ]}>
        <Text style={styles.buttonText}>
          {enabled ? 'Désactiver' : 'Activer'}
        </Text>
      </Pressable>

      <Text style={styles.info}>
        État : <Text style={{fontWeight:'bold'}}>{enabled ? 'ON' : 'OFF'}</Text> • Appuis : {count}
      </Text>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#555', marginBottom: 20, textAlign: 'center' },
  button: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 12, marginTop: 8 },
  buttonOn: { backgroundColor: '#2ecc71' },
  buttonOff: { backgroundColor: '#3498db' },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  info: { marginTop: 14, fontSize: 16, color: '#333' },
});
