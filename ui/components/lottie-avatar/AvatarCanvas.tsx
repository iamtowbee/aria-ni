/**
 * AvatarCanvas — Interactive Avatar Overlay
 *
 * Renders Aria (blob) and Jow (owl) as draggable, animated beings that:
 *   - Float on screen as overlay
 *   - Speak with animated speech bubbles
 *   - React to touches/taps
 *   - Show emotions through color/shape
 *   - Can be positioned anywhere
 *   - Idle animations when inactive
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Animated, PanResponder, StyleSheet,
  Dimensions, Pressable, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Aria Blob (Mother) ────────────────────────────────────────────────────────

const AriaBlob = ({ emotion, size, color, onTap, speaking }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  const [blobPath, setBlobPath] = useState('');

  // Generate organic blob shape
  useEffect(() => {
    const generateBlob = () => {
      const points = 8;
      const angleStep = (Math.PI * 2) / points;
      const baseRadius = 60 * size;
      
      let pathData = '';
      for (let i = 0; i <= points; i++) {
        const angle = i * angleStep;
        const radiusVariation = baseRadius * (0.8 + Math.random() * 0.4);
        const x = Math.cos(angle) * radiusVariation;
        const y = Math.sin(angle) * radiusVariation;
        
        if (i === 0) {
          pathData += `M ${x} ${y} `;
        } else {
          // Smooth curves
          const prevAngle = (i - 1) * angleStep;
          const cpx1 = Math.cos(prevAngle + angleStep / 3) * radiusVariation * 0.9;
          const cpy1 = Math.sin(prevAngle + angleStep / 3) * radiusVariation * 0.9;
          const cpx2 = Math.cos(angle - angleStep / 3) * radiusVariation * 0.9;
          const cpy2 = Math.sin(angle - angleStep / 3) * radiusVariation * 0.9;
          pathData += `C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${x} ${y} `;
        }
      }
      pathData += 'Z';
      setBlobPath(pathData);
    };

    generateBlob();
    const interval = setInterval(generateBlob, 3000); // morph every 3s
    return () => clearInterval(interval);
  }, [size, emotion]);

  // Pulse when speaking
  useEffect(() => {
    if (speaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.1, duration: 400, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulse, { toValue: 1, duration: 400, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    } else {
      pulse.setValue(1);
    }
  }, [speaking]);

  const emotionColors = {
    calm: ['#4A9EFF', '#3A7FD5'],
    excited: ['#FF6B9D', '#E85878'],
    teaching: ['#9B8CFF', '#7B6FD9'],
    thinking: ['#1FD4E8', '#1AB4C8'],
    proud: ['#FFD700', '#FFA500'],
  };

  const [c1, c2] = emotionColors[emotion] || emotionColors.calm;

  return (
    <Pressable onPress={onTap} style={S.avatarWrap}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Svg width={140} height={140} viewBox="-70 -70 140 140">
          <Path
            d={blobPath}
            fill={`url(#ariaGradient)`}
            opacity={0.95}
          />
          <LinearGradient
            id="ariaGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
            colors={[c1, c2]}
          />
          
          {/* Core eye */}
          <Circle cx="0" cy="0" r="8" fill="#fff" opacity={0.9} />
          <Circle cx="0" cy="0" r="4" fill="#000" />
        </Svg>
      </Animated.View>
    </Pressable>
  );
};

// ── Jow Owl (Child) ───────────────────────────────────────────────────────────

const JowOwl = ({ emotion, size, color, onTap, onPet, speaking }) => {
  const wiggle = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const bounce = useRef(new Animated.Value(0)).current;

  // Wiggle animation (when pet)
  const doWiggle = useCallback(() => {
    Animated.sequence([
      Animated.timing(wiggle, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 5, duration: 100, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (emotion === 'excited') {
      doWiggle();
    }
  }, [emotion]);

  // Blink animation
  useEffect(() => {
    const blinkLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(Math.random() * 3000 + 2000),
        Animated.timing(blink, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 100, useNativeDriver: true }),
      ])
    );
    blinkLoop.start();
    return () => blinkLoop.stop();
  }, []);

  // Bounce when speaking
  useEffect(() => {
    if (speaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, { toValue: -5, duration: 300, useNativeDriver: true }),
          Animated.timing(bounce, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    } else {
      bounce.setValue(0);
    }
  }, [speaking]);

  const emotionColors = {
    curious: '#C968E8',
    thinking: '#9B8CFF',
    excited: '#FF6B9D',
    confused: '#E8A830',
    proud: '#20C9A0',
    sleepy: '#6A8BAD',
  };

  const owlColor = emotionColors[emotion] || emotionColors.curious;

  return (
    <Pressable onLongPress={onPet} onPress={onTap} style={S.avatarWrap}>
      <Animated.View style={{
        transform: [
          { rotate: wiggle.interpolate({ inputRange: [-10, 10], outputRange: ['-10deg', '10deg'] }) },
          { translateY: bounce },
        ]
      }}>
        <Svg width={100} height={100} viewBox="0 0 100 100">
          {/* Body */}
          <Ellipse cx="50" cy="60" rx="30" ry="35" fill={owlColor} />
          
          {/* Wings */}
          <Ellipse cx="20" cy="60" rx="12" ry="20" fill={owlColor} opacity={0.7} />
          <Ellipse cx="80" cy="60" rx="12" ry="20" fill={owlColor} opacity={0.7} />
          
          {/* Head */}
          <Circle cx="50" cy="35" r="25" fill={owlColor} />
          
          {/* Eyes */}
          <Animated.View style={{ opacity: blink }}>
            <Circle cx="40" cy="32" r="8" fill="#fff" />
            <Circle cx="60" cy="32" r="8" fill="#fff" />
            <Circle cx="40" cy="32" r="4" fill="#000" />
            <Circle cx="60" cy="32" r="4" fill="#000" />
          </Animated.View>
          
          {/* Beak */}
          <Path d="M 50 38 L 45 45 L 55 45 Z" fill="#FFA500" />
          
          {/* Feet */}
          <Path d="M 40 92 L 35 98 M 40 92 L 40 98 M 40 92 L 45 98" stroke="#FFA500" strokeWidth="2" />
          <Path d="M 60 92 L 55 98 M 60 92 L 60 98 M 60 92 L 65 98" stroke="#FFA500" strokeWidth="2" />
        </Svg>
      </Animated.View>
    </Pressable>
  );
};

// ── Speech Bubble ─────────────────────────────────────────────────────────────

const SpeechBubble = ({ text, tone, position }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.8, duration: 300, useNativeDriver: true }),
      ]).start();
    }, 4000);

    return () => clearTimeout(timer);
  }, [text]);

  const toneColors = {
    happy: '#20C9A0',
    proud: '#FFD700',
    gentle: '#4A9EFF',
    teaching: '#9B8CFF',
    thoughtful: '#1FD4E8',
    excited: '#FF6B9D',
    warm: '#FFA500',
    ambient: '#6A8BAD',
  };

  const bubbleColor = toneColors[tone] || '#4A9EFF';

  return (
    <Animated.View style={[
      S.speechBubble,
      {
        left: position.x * SCREEN_WIDTH - 80,
        top: position.y * SCREEN_HEIGHT - 120,
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
        borderColor: bubbleColor + '44',
      }
    ]}>
      <LinearGradient
        colors={['rgba(8,15,26,0.98)', 'rgba(12,21,37,0.98)']}
        style={S.bubbleGradient}
      >
        <Text style={S.bubbleText}>{text}</Text>
      </LinearGradient>
      {/* Tail */}
      <View style={[S.bubbleTail, { borderTopColor: bubbleColor + '44' }]} />
    </Animated.View>
  );
};

// ── Main Canvas ───────────────────────────────────────────────────────────────

export const AvatarCanvas = ({ avatarSystem, visible }) => {
  const [ariaPos, setAriaPos] = useState({ x: 0.3, y: 0.5 });
  const [jowPos, setJowPos] = useState({ x: 0.7, y: 0.5 });
  const [speeches, setSpeeches] = useState([]);
  const [ariaEmotion, setAriaEmotion] = useState('calm');
  const [jowEmotion, setJowEmotion] = useState('curious');
  const [ariaSpeaking, setAriaSpeaking] = useState(false);
  const [jowSpeaking, setJowSpeaking] = useState(false);

  const ariaPan = useRef(new Animated.ValueXY({ x: ariaPos.x * SCREEN_WIDTH, y: ariaPos.y * SCREEN_HEIGHT })).current;
  const jowPan = useRef(new Animated.ValueXY({ x: jowPos.x * SCREEN_WIDTH, y: jowPos.y * SCREEN_HEIGHT })).current;

  // Listen to avatar system events
  useEffect(() => {
    if (!avatarSystem) return;

    const handleSpeech = ({ avatar, text, tone }) => {
      const speech = {
        id: Date.now(),
        avatar,
        text,
        tone,
        position: avatar === 'aria' ? ariaPos : jowPos,
      };
      setSpeeches(prev => [...prev, speech]);

      if (avatar === 'aria') {
        setAriaSpeaking(true);
        setTimeout(() => setAriaSpeaking(false), text.length * 50);
      } else {
        setJowSpeaking(true);
        setTimeout(() => setJowSpeaking(false), text.length * 50);
      }

      setTimeout(() => {
        setSpeeches(prev => prev.filter(s => s.id !== speech.id));
      }, 5000);
    };

    const handleEmotion = ({ avatar, emotion }) => {
      if (avatar === 'aria') setAriaEmotion(emotion);
      else setJowEmotion(emotion);
    };

    avatarSystem.on('avatarSpeech', handleSpeech);
    avatarSystem.on('emotionChange', handleEmotion);

    return () => {
      avatarSystem.off('avatarSpeech', handleSpeech);
      avatarSystem.off('emotionChange', handleEmotion);
    };
  }, [avatarSystem, ariaPos, jowPos]);

  // Pan responders for dragging
  const ariaPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([null, { dx: ariaPan.x, dy: ariaPan.y }], { useNativeDriver: false }),
    onPanResponderRelease: () => {
      const x = Math.max(0, Math.min(1, ariaPan.x._value / SCREEN_WIDTH));
      const y = Math.max(0, Math.min(1, ariaPan.y._value / SCREEN_HEIGHT));
      setAriaPos({ x, y });
      avatarSystem?.moveAvatar('aria', x, y);
    },
  });

  const jowPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([null, { dx: jowPan.x, dy: jowPan.y }], { useNativeDriver: false }),
    onPanResponderRelease: () => {
      const x = Math.max(0, Math.min(1, jowPan.x._value / SCREEN_WIDTH));
      const y = Math.max(0, Math.min(1, jowPan.y._value / SCREEN_HEIGHT));
      setJowPos({ x, y });
      avatarSystem?.moveAvatar('jow', x, y);
    },
  });

  if (!visible) return null;

  return (
    <View style={S.overlay} pointerEvents="box-none">
      {/* Aria */}
      <Animated.View
        {...ariaPanResponder.panHandlers}
        style={[S.avatar, { transform: ariaPan.getTranslateTransform() }]}
      >
        <AriaBlob
          emotion={ariaEmotion}
          size={1}
          color="#4A9EFF"
          onTap={() => avatarSystem?.tapAria()}
          speaking={ariaSpeaking}
        />
      </Animated.View>

      {/* Jow */}
      <Animated.View
        {...jowPanResponder.panHandlers}
        style={[S.avatar, { transform: jowPan.getTranslateTransform() }]}
      >
        <JowOwl
          emotion={jowEmotion}
          size={0.8}
          color="#C968E8"
          onTap={() => avatarSystem?.tapJow?.()}
          onPet={() => avatarSystem?.petJow()}
          speaking={jowSpeaking}
        />
      </Animated.View>

      {/* Speech bubbles */}
      {speeches.map(speech => (
        <SpeechBubble
          key={speech.id}
          text={speech.text}
          tone={speech.tone}
          position={speech.position}
        />
      ))}
    </View>
  );
};

const S = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  avatar: {
    position: 'absolute',
    width: 140,
    height: 140,
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  speechBubble: {
    position: 'absolute',
    width: 160,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bubbleGradient: {
    padding: 12,
  },
  bubbleText: {
    fontSize: 13,
    color: '#D4E8FA',
    lineHeight: 18,
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

export default AvatarCanvas;
