import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { usePermissionStore } from './usePermissionStore';

const OverlayConfigScreen = () => {
  const {
    overlayConfig,
    updateOverlayConfig,
  } = usePermissionStore();

  const [customTitle, setCustomTitle] = useState(overlayConfig.title);
  const [customButtonText, setCustomButtonText] = useState(overlayConfig.buttonText);
  const [customColor, setCustomColor] = useState(overlayConfig.backgroundColor);
  const [customMinutes, setCustomMinutes] = useState(String(overlayConfig.timerMinutes || 5));

  const handleApplyCustom = () => {
    const customConfig = {
      title: customTitle,
      buttonText: customButtonText,
      backgroundColor: customColor,
      timerMinutes: Math.max(1, parseInt(customMinutes || '5', 10)),
    };
    
    updateOverlayConfig(customConfig);
    Alert.alert('Success', 'Custom overlay configuration applied!');
  };

  const handleTestOverlay = async () => {
    try {
      Alert.alert('Test Mode', 'Open Instagram Reels and scroll for 2 minutes to see your custom overlay!');
    } catch (error) {
      Alert.alert('Error', 'Failed to test overlay');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Customize Overlay Appearance</Text>
      
      {/* Current Configuration Preview */}
      <View style={[styles.previewContainer, { backgroundColor: overlayConfig.backgroundColor }]}>
        <Text style={styles.previewTitle}>{overlayConfig.title}</Text>
        <View style={styles.previewCat}>
          <Text style={styles.catEmoji}>🐱</Text>
        </View>
        <View style={styles.previewTimeCircle}>
          <Text style={styles.previewTime}>30</Text>
          <Text style={styles.previewTimeLabel}>mins left</Text>
        </View>
        <TouchableOpacity style={styles.previewButton}>
          <Text style={styles.previewButtonText}>{overlayConfig.buttonText}</Text>
        </TouchableOpacity>
      </View>

      {/* Theme Presets removed */}

      {/* Custom Configuration */}
      <Text style={styles.sectionTitle}>Custom Configuration</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Title Message</Text>
        <TextInput
          style={styles.textInput}
          value={customTitle}
          onChangeText={setCustomTitle}
          multiline
          numberOfLines={2}
          placeholder="Enter custom title..."
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Button Text</Text>
        <TextInput
          style={styles.textInput}
          value={customButtonText}
          onChangeText={setCustomButtonText}
          placeholder="Enter button text..."
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Background Color (Hex)</Text>
        <TextInput
          style={styles.textInput}
          value={customColor}
          onChangeText={setCustomColor}
          placeholder="#5865F2"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Timer Minutes (default 5)</Text>
        <TextInput
          style={styles.textInput}
          value={customMinutes}
          onChangeText={setCustomMinutes}
          placeholder="5"
          keyboardType="number-pad"
        />
      </View>

      <TouchableOpacity style={styles.applyButton} onPress={handleApplyCustom}>
        <Text style={styles.applyButtonText}>Apply Custom Configuration</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.testButton} onPress={handleTestOverlay}>
        <Text style={styles.testButtonText}>Test Overlay</Text>
      </TouchableOpacity>
   
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  previewContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  previewTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  previewCat: {
    marginBottom: 20,
  },
  catEmoji: {
    fontSize: 32,
  },
  previewTimeCircle: {
    backgroundColor: '#FFD700',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  previewTimeLabel: {
    fontSize: 10,
    color: '#000',
  },
  previewButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  previewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  themeButton: {
    flex: 1,
    minWidth: '45%',
    margin: 5,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  themeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  applyButton: {
    backgroundColor: '#5865F2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default OverlayConfigScreen;