// src/components/MultiModalInput.jsx
/**
 * Multi-Modal Input Component
 * 
 * Allows combining Voice + Image + Text in single message:
 * - Voice note with transcription
 * - Image with text question
 * - Code snippet with explanation
 * - Document with query
 * 
 * UI: Expandable composer with multiple input types
 */

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export const MultiModalInput = ({ onSend, ecosystem }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef(null);

  /**
   * Add image attachment
   */
  const addImage = async (source = 'library') => {
    try {
      let result;
      
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          base64: true,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          base64: true,
        });
      }

      if (!result.canceled) {
        const attachment = {
          type: 'image',
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
          width: result.assets[0].width,
          height: result.assets[0].height,
        };
        
        setAttachments([...attachments, attachment]);
      }
    } catch (err) {
      console.error('Image picker error:', err);
    }
  };

  /**
   * Add voice recording
   */
  const toggleVoiceRecording = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setIsProcessing(true);

      try {
        const transcript = await ecosystem.beta.stopListening();
        
        if (transcript) {
          const attachment = {
            type: 'voice',
            text: transcript,
            duration: 0, // Would come from actual recording
          };
          
          setAttachments([...attachments, attachment]);
        }
      } catch (err) {
        console.error('Voice recording error:', err);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Start recording
      setIsRecording(true);
      await ecosystem.beta.startListening();
    }
  };

  /**
   * Remove attachment
   */
  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  /**
   * Send multi-modal message
   */
  const handleSend = async () => {
    if (!text.trim() && attachments.length === 0) return;

    setIsProcessing(true);

    try {
      // Build multi-modal message
      const message = {
        text: text.trim(),
        attachments: attachments.map(att => ({
          type: att.type,
          ...(att.type === 'image' ? {
            uri: att.uri,
            base64: att.base64,
          } : {}),
          ...(att.type === 'voice' ? {
            text: att.text,
            duration: att.duration,
          } : {}),
        })),
        timestamp: Date.now(),
      };

      // Send to parent
      await onSend(message);

      // Clear inputs
      setText('');
      setAttachments([]);
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <ScrollView
          horizontal
          style={styles.attachmentsScroll}
          showsHorizontalScrollIndicator={false}
        >
          {attachments.map((att, index) => (
            <View key={index} style={styles.attachmentItem}>
              {att.type === 'image' && (
                <Image
                  source={{ uri: att.uri }}
                  style={styles.attachmentImage}
                  resizeMode="cover"
                />
              )}
              {att.type === 'voice' && (
                <View style={styles.voiceAttachment}>
                  <Text style={styles.voiceIcon}>🎤</Text>
                  <Text style={styles.voiceText} numberOfLines={2}>
                    {att.text}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeAttachment(index)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        {/* Action Buttons (Left) */}
        <View style={styles.actionsLeft}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => addImage('library')}
            disabled={isProcessing}
          >
            <Text style={styles.actionIcon}>📷</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              isRecording && styles.actionButtonActive,
            ]}
            onPress={toggleVoiceRecording}
            disabled={isProcessing}
          >
            <Text style={styles.actionIcon}>
              {isRecording ? '⏹️' : '🎤'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder="Type your message..."
          placeholderTextColor="#888"
          multiline
          maxLength={2000}
        />

        {/* Send Button (Right) */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            (text.trim() || attachments.length > 0) && styles.sendButtonActive,
          ]}
          onPress={handleSend}
          disabled={isProcessing || (!text.trim() && attachments.length === 0)}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#EAEAEA" />
          ) : (
            <Text style={styles.sendButtonText}>
              {attachments.length > 0 ? '📤' : '⬆️'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Recording Indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Recording...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#16213E',
    borderTopWidth: 1,
    borderTopColor: '#6C63FF',
    paddingBottom: 10,
  },
  attachmentsScroll: {
    maxHeight: 120,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  attachmentItem: {
    marginRight: 10,
    position: 'relative',
  },
  attachmentImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#1A1A2E',
  },
  voiceAttachment: {
    width: 150,
    height: 80,
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  voiceText: {
    fontSize: 12,
    color: '#EAEAEA',
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#EAEAEA',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  actionsLeft: {
    flexDirection: 'row',
    marginRight: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  actionButtonActive: {
    backgroundColor: '#E53935',
  },
  actionIcon: {
    fontSize: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#EAEAEA',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonActive: {
    backgroundColor: '#6C63FF',
  },
  sendButtonText: {
    fontSize: 20,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E53935',
    marginRight: 8,
  },
  recordingText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
