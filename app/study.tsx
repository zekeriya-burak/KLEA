import { useState, useRef, useEffect, useMemo } from 'react';
import { DatabaseService, Word } from '../services/DatabaseService';
import { View, Text, StyleSheet, Dimensions, Animated, PanResponder, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 120;
const REVEAL_THRESHOLD = -100;


export default function StudyScreen() {
  const { level, limit, categoryId } = useLocalSearchParams();
  const selectedLevel = Array.isArray(level) ? level[0] : level || "A1";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const [filteredVocabulary, setFilteredVocabulary] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reset state when level changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  }, [selectedLevel]);

  // Fetch words from DB
  useEffect(() => {
    const loadWords = async () => {
      setIsLoading(true);
      try {
        // Use DatabaseService to get due words (prioritizing reviews)
        const catId = categoryId ? parseInt(Array.isArray(categoryId) ? categoryId[0] : categoryId, 10) : undefined;
        // Parse limit from params, default to 10 if missing/invalid
        const limitVal = limit ? parseInt(Array.isArray(limit) ? limit[0] : limit, 10) : 10;

        const words = await DatabaseService.getDueWords(selectedLevel as string, limitVal, catId);

        // No shuffle? 
        // SRS usually presents due words in order (most overdue first), or random among due.
        // My getDueWords sorts by next_review_at ASC (oldest due first).
        // So we should NOT shuffle if we want to respect priority. 
        // But for "new" words (null next_review), order matches insertion (id).
        // Let's shuffle ONLY if they are all new? 
        // Or just keep it sorted by due date. 
        // Result is `words`.

        // If we have very few due words, we might want to fetch more random words?
        // For now, let's just use what we get.

        setFilteredVocabulary(words);
        // const targetLimit ... logic is now handled by SQL limit.
      } catch (error) {
        console.error("Failed to load words:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWords();
  }, [selectedLevel, limit, categoryId]);

  // Animation Values
  const pan = useRef(new Animated.ValueXY()).current;

  // Refs for PanResponder to access current state without re-creating
  const currentIndexRef = useRef(currentIndex);
  const isFlippedRef = useRef(isFlipped);
  // We also need ref for filteredVocabulary to access length correctly in PanResponder
  const filteredVocabularyRef = useRef(filteredVocabulary);

  // Update refs whenever state changes
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    isFlippedRef.current = isFlipped;
  }, [isFlipped]);

  useEffect(() => {
    filteredVocabularyRef.current = filteredVocabulary;
  }, [filteredVocabulary]);

  // Use specific card based on index
  const currentCard = filteredVocabulary[currentIndex];

  // Reset position when card changes
  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
    setIsFlipped(false);
  }, [currentIndex]);

  // Reset everything when level changes - REMOVED
  // const handleLevelChange = (level: string) => { ... }

  const handleNextCard = async (isCorrect: boolean) => {
    console.log(isCorrect ? "Correct" : "Incorrect");
    const currentIndex = currentIndexRef.current;
    const currentList = filteredVocabularyRef.current;

    // Safety check
    if (!currentList || currentIndex >= currentList.length) {
      console.warn("Invalid index or list");
      return;
    }

    const word = currentList[currentIndex];

    // Fire and forget update stats
    if (word) {
      DatabaseService.markWordResult(word.id, isCorrect).catch(console.error);
    }

    // Use ref for current index check against CURRENT filtered list
    if (currentIndex >= currentList.length - 1) {
      setIsCompleted(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsCompleted(false);
    setIsFlipped(false);
    pan.setValue({ x: 0, y: 0 });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        // Access current state via refs
        if (isFlippedRef.current) {
          // Vote Mode: Horizontal Only
          pan.setValue({ x: gesture.dx, y: 0 });
        } else {
          // Reveal Mode: Vertical Only
          pan.setValue({ x: 0, y: gesture.dy });
        }
      },
      onPanResponderRelease: (_, gesture) => {
        // Access current state via refs
        if (!isFlippedRef.current) {
          // Logic for pre-flip: Swipe Up to reveal
          if (gesture.dy < REVEAL_THRESHOLD) {
            // Swiped Up significantly -> Reveal
            setIsFlipped(true);
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
              friction: 5
            }).start();
          } else {
            // Return to center
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }).start();
          }
        } else {
          // Logic for post-flip: Swipe Left/Right to vote
          if (gesture.dx > SWIPE_THRESHOLD) {
            // Swipe Right (Correct)
            Animated.timing(pan, {
              toValue: { x: SCREEN_WIDTH + 100, y: 0 },
              duration: 200,
              useNativeDriver: false
            }).start(() => {
              handleNextCard(true);
              pan.setValue({ x: 0, y: 0 });
            });
          } else if (gesture.dx < -SWIPE_THRESHOLD) {
            // Swipe Left (Incorrect)
            Animated.timing(pan, {
              toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
              duration: 200,
              useNativeDriver: false
            }).start(() => {
              handleNextCard(false);
              pan.setValue({ x: 0, y: 0 });
            });
          } else {
            // Return to center
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }).start();
          }
        }
      }
    })
  ).current;

  // Interpolations
  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp'
  });

  const correctOpacity = pan.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 2],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const incorrectOpacity = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const revealOpacity = pan.y.interpolate({
    inputRange: [REVEAL_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const cardStyle = {
    transform: [
      { translateX: pan.x },
      { translateY: pan.y },
      { rotate: rotate }
    ]
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.mainContent, { justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={[styles.instructionText, { marginTop: 20 }]}>Loading words...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Study Mode</Text>
          <View style={styles.levelFilterContainer}>
            {/* Filter removed for session mode */}
          </View>
        </View>
        <View style={styles.completedContainer}>
          <Ionicons name="trophy" size={80} color="#F59E0B" />
          <Text style={styles.completedTitle}>{selectedLevel} Completed!</Text>
          <Text style={styles.completedSubtitle}>You've reviewed all cards in this level.</Text>
          <TouchableOpacity style={styles.restartButton} onPress={() => router.back()}>
            <Text style={styles.restartButtonText}>Back to Setup</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Safety check if level has no words
  if (!currentCard) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Study Mode</Text>
          <View style={styles.levelFilterContainer}>
            {/* Filter removed */}
          </View>
        </View>
        <View style={styles.mainContent}>
          <Text style={styles.instructionText}>No words found for level {selectedLevel}</Text>
          <TouchableOpacity
            style={[styles.restartButton, { marginTop: 20, backgroundColor: '#64748B' }]}
            onPress={() => router.back()}
          >
            <Text style={styles.restartButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Study Mode</Text>
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {filteredVocabulary.length}
            </Text>
          </View>
        </View>

        {/* Level Filter Bar Removed */}
      </View>

      <View style={styles.mainContent}>
        <View style={styles.cardContainer}>
          {/* Background Card for stack effect */}
          <View style={[styles.card, styles.cardBackground]} />

          {/* Active Card */}
          <Animated.View
            style={[styles.card, cardStyle]}
            {...panResponder.panHandlers}
          >
            {/* Overlays */}
            {isFlipped && (
              <>
                <Animated.View style={[styles.overlay, styles.correctOverlay, { opacity: correctOpacity }]}>
                  <Ionicons name="checkmark-circle" size={100} color="white" />
                  <Text style={styles.overlayText}>Correct</Text>
                </Animated.View>
                <Animated.View style={[styles.overlay, styles.incorrectOverlay, { opacity: incorrectOpacity }]}>
                  <Ionicons name="close-circle" size={100} color="white" />
                  <Text style={styles.overlayText}>Incorrect</Text>
                </Animated.View>
              </>
            )}

            {!isFlipped && (
              <Animated.View style={[styles.overlay, styles.revealOverlay, { opacity: revealOpacity }]}>
                <Text style={styles.revealText}>Release to Reveal</Text>
                <Ionicons name="arrow-up" size={50} color="white" />
              </Animated.View>
            )}

            <View style={styles.cardInner}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{currentCard.difficulty_level}</Text>
              </View>

              <Text style={styles.wordText}>{currentCard.word}</Text>

              <View style={styles.separator} />

              {isFlipped ? (
                <Text style={styles.answerText}>{currentCard.translation}</Text>
              ) : (
                <View style={styles.hiddenAnswerContainer}>
                  <Text style={styles.hintText}>Swipe Up to Reveal</Text>
                  <Ionicons name="chevron-up" size={24} color="#94A3B8" />
                </View>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Instructions / Footer */}
        <View style={styles.footer}>
          {!isFlipped ? (
            <Text style={styles.instructionText}>Swipe UP to see answer</Text>
          ) : (
            <View style={styles.controlsRow}>
              <View style={styles.controlItem}>
                <Ionicons name="arrow-back" size={24} color="#EF4444" />
                <Text style={[styles.instructionText, { color: '#EF4444' }]}>Left: Incorrect</Text>
              </View>
              <View style={styles.controlItem}>
                <Text style={[styles.instructionText, { color: '#22C55E' }]}>Right: Correct</Text>
                <Ionicons name="arrow-forward" size={24} color="#22C55E" />
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  counterContainer: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  levelFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: SCREEN_WIDTH - 48,
    height: SCREEN_WIDTH * 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardBackground: {
    transform: [{ scale: 0.95 }, { translateY: 10 }],
    zIndex: -1,
    backgroundColor: '#F1F5F9',
  },
  cardInner: {
    alignItems: 'center',
    padding: 24,
    width: '100%',
  },
  levelBadge: {
    position: 'absolute',
    top: 24,
    right: 24,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  wordText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 40,
  },
  separator: {
    height: 1,
    width: 100,
    backgroundColor: '#E2E8F0',
    marginBottom: 32,
  },
  answerText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#4F46E5',
    textAlign: 'center',
  },
  hiddenAnswerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
    gap: 8,
  },
  hintText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    zIndex: 10,
  },
  correctOverlay: {
    backgroundColor: 'rgba(34, 197, 94, 0.8)', // Green
  },
  incorrectOverlay: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red
  },
  revealOverlay: {
    backgroundColor: 'rgba(79, 70, 229, 0.9)', // Indigo
  },
  overlayText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
  },
  revealText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  footer: {
    marginTop: 40,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 32,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  completedTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 24,
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 18,
    color: '#64748B',
    marginBottom: 48,
    textAlign: 'center',
  },
  restartButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    maxWidth: 250,
  },
  restartButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});
