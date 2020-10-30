import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { Audio } from 'expo-av';
import { FontAwesome } from '@expo/vector-icons';
import { addRecord } from '../../actions/record';
import { toggleFlashMessage } from '../../actions/general';
import {
  AUDIO_END_RECORDING_MODE,
  AUDIO_START_RECORDING_MODE,
  FLASH_MESSAGE_TYPE,
  recordingSettings,
} from '../../constants/general';
import getMMSSFromMillis from '../../utils/getMMSSFromMillis';
import FlashMessage from '../../components/FlashMessage/FlashMessage';

const Create = () => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
    },
    circleButton: {
      backgroundColor: '#e0f7fa',
      width: 100,
      height: 100,
      borderRadius: 150,
      justifyContent: 'center',
      alignItems: 'center',
    },
    recordContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    timeText: {
      fontSize: 25,
      marginTop: 10,
    },
  });

  useEffect(() => {
    Audio.requestPermissionsAsync();
  }, []);

  const dispatch = useDispatch();
  const { records } = useSelector((state) => state.record, shallowEqual);

  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState('00');
  const [timerMinutes, setTimerMinutes] = useState('00');

  const timerId = useRef(null);

  const startTimer = () => {
    let seconds = 0;
    let minutes = 0;
    timerId.current = setInterval(() => {
      if (seconds < 59) {
        seconds += 1;
        setTimerSeconds(String(seconds).padStart(2, '0'));
      } else if (seconds === 59) {
        seconds = 0;
        minutes += 1;
        setTimerSeconds(String(seconds).padStart(2, '0'));
        setTimerMinutes(String(minutes).padStart(2, '0'));
      }
    }, 1000);
  };
  const stopTimer = () => {
    clearInterval(timerId.current);
    setTimerMinutes('00');
    setTimerSeconds('00');
  };

  const startRecording = async () => {
    if (sound) {
      await sound.unloadAsync();
      sound.setOnPlaybackStatusUpdate(null);
      setSound(null);
    }

    await Audio.setAudioModeAsync(AUDIO_START_RECORDING_MODE);

    const newRecording = new Audio.Recording();
    try {
      await newRecording.prepareToRecordAsync(recordingSettings);
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
      startTimer();
    } catch (error) {
      dispatch(
        toggleFlashMessage(
          true,
          `START RECORDING ERROR: ${error}`,
          FLASH_MESSAGE_TYPE.error,
        ),
      );
    }
  };
  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
    } catch (error) {
      dispatch(
        toggleFlashMessage(
          true,
          `STOP RECORDING ERROR: ${error}`,
          FLASH_MESSAGE_TYPE.error,
        ),
      );
    }

    await Audio.setAudioModeAsync(AUDIO_END_RECORDING_MODE);
    const { sound: recordedSound } = await recording.createNewLoadedSoundAsync({
      isLooping: true,
      isMuted: false,
      volume: 1.0,
      rate: 1.0,
      shouldCorrectPitch: true,
    });
    const { durationMillis } = await recordedSound.getStatusAsync();
    dispatch(
      addRecord({
        id: records.length,
        name: `RECORD - ${records.length + 1}`,
        uri: recording.getURI(),
        duration: getMMSSFromMillis(durationMillis),
      }),
    );
    setSound(recordedSound);
    setIsRecording(false);
    stopTimer();
    dispatch(toggleFlashMessage(true, 'Record saved to your library'));
  };

  return (
    <View style={styles.container}>
      <View style={styles.recordContainer}>
        <Pressable
          onPress={() => {
            return isRecording ? stopRecording() : startRecording();
          }}
          style={styles.circleButton}>
          {isRecording ? (
            <FontAwesome name="stop" size={35} color="#7f0000" />
          ) : (
            <FontAwesome name="microphone" size={35} color="#0d47a1" />
          )}
        </Pressable>
        <Text style={styles.timeText}>
          {timerMinutes}:{timerSeconds}
        </Text>
      </View>
      <FlashMessage />
    </View>
  );
};

export default Create;