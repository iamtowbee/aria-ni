// src/hooks/useVoiceRecording.ts
/**
 * Voice Recording Hook
 * 
 * Handles voice input with speech recognition
 */

import { useState, useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';

export interface VoiceRecordingState {
  isRecording: boolean;
  transcript: string;
  error: string | null;
}

export const useVoiceRecording = () => {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    transcript: '',
    error: null,
  });

  const recordingRef = useRef<any>(null);

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        isRecording: true,
        error: null,
        transcript: '',
      }));

      // Note: In a real app, you'd use expo-speech-recognition
      // For now, we'll simulate it
      console.log('Voice recording started');
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRecording: false,
        error: error instanceof Error ? error.message : 'Failed to start recording',
      }));
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isRecording: false }));
      
      // Simulate transcription
      // In real app, this would come from speech recognition
      const mockTranscript = 'This is a voice message';
      
      setState(prev => ({
        ...prev,
        transcript: mockTranscript,
      }));

      return mockTranscript;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to stop recording',
      }));
      return '';
    }
  }, []);

  const cancelRecording = useCallback(() => {
    setState({
      isRecording: false,
      transcript: '',
      error: null,
    });
  }, []);

  const speak = useCallback((text: string) => {
    Speech.speak(text, {
      language: 'en',
      pitch: 1.0,
      rate: 1.0,
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
  }, []);

  return {
    isRecording: state.isRecording,
    transcript: state.transcript,
    error: state.error,
    startRecording,
    stopRecording,
    cancelRecording,
    speak,
    stopSpeaking,
  };
};
