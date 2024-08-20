import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  TextInput,
  Text,
  Button,
  View,
  StatusBar,
  FlatList,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import Markdown from 'react-native-markdown-display';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ChatExample = () => {
  const [text, onChangeText] = React.useState('');
  const [chatMessages, setChatMessages] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const flatListRef = React.useRef(null);
  const loadingAnimation = React.useRef(new Animated.Value(0)).current;
  const pulseAnimation = React.useRef(new Animated.Value(1)).current;

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  React.useEffect(() => {
    console.log('Current chatMessages:', chatMessages);
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [chatMessages]);

  React.useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(loadingAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.5,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      loadingAnimation.stopAnimation();
      pulseAnimation.stopAnimation();
    }
  }, [isLoading]);

  const handleSubmit = () => {
    const callOpenAI = async (messages) => {
      setIsLoading(true);
      try {

        console.log('chatMessagesOpenAI:', messages);
        const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + OPENAI_API_KEY,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
            max_tokens: 256,
            temperature: 0,
          }),
        });

        const data = await response.json();
        setIsLoading(false);

        if (data.choices && data.choices.length > 0) {

          const assistantMessage = {
            id: Math.random().toString(),
            role: 'assistant',
            content: data.choices[0].message.content,
          };

          setChatMessages(chatMessages => [...chatMessages, assistantMessage]);
          scrollToBottom();

        }
      } catch (error) {
        console.error('Error calling OpenAI API:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (text.trim()) {
      const newMessage = {
        id: Math.random().toString(),
        role: 'user',
        content: text,
      };
      console.log('newMessage: ', newMessage)

      setChatMessages(chatMessages => {
        const updatedMessages = [...chatMessages, newMessage];
        callOpenAI(updatedMessages); // Pass updated messages
        return updatedMessages;
      });

      onChangeText('');
    }
  };

  const Item = ({ content, role }) => (
    <View
      style={[
        styles.item,
        {
          backgroundColor: role === 'user' ? 'lightblue' : 'lightgreen',
          alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
        },
      ]}
    >
      <Markdown>{content}</Markdown>
    </View>
  );

  const renderItem = ({ item }) => (
    <Item role={item.role} content={item.content} />
  );

  const LoadingIndicator = () => (
    <Animated.View style={[styles.loadingIndicator, {
      transform: [
        {
          rotate: loadingAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          }),
        },
        {
          scale: pulseAnimation,
        },
      ],
    }]} />
  );

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.appTitleContainer}>
        <Text style={styles.appTitle}>Personal AI Chat</Text>
      </View>
      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          style={styles.chatView}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current.scrollToEnd({ animated: true })}
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          onChangeText={onChangeText}
          value={text}
          placeholder="Enter your message"
          keyboardType="default"
          clearButtonMode="while-editing"
        />
        <Button title="Submit" onPress={handleSubmit} disabled={isLoading} />
      </View>
      {isLoading && <LoadingIndicator />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  chatContainer: {
    height: SCREEN_HEIGHT * 0.7,
  },
  chatView: {
    flex: 1,
  },
  inputContainer: {
    padding: 10,
  },
  input: {
    height: 40,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  item: {
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  chatText: {
    fontSize: 16,
  },
  markdown: {
  },
  appTitleContainer: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 24,
  },
  loadingIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#0000ff',
    borderTopColor: '#3333ff',
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
  },
});

export default ChatExample;
