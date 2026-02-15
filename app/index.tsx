import { router } from "expo-router";
import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

export default function SetupScreen() {
    const [selectedLevel, setSelectedLevel] = useState("A1");
    const [cardCount, setCardCount] = useState("10");

    const handleStartSession = () => {
        const count = parseInt(cardCount, 10);

        if (isNaN(count) || count <= 0) {
            Alert.alert("Invalid Input", "Please enter a valid number of cards (minimum 1).");
            return;
        }

        router.push({
            pathname: "/study",
            params: { level: selectedLevel, limit: count.toString() }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoText}>Aa</Text>
                    </View>
                    <Text style={styles.title}>Session Setup</Text>
                    <Text style={styles.subtitle}>Customize your study session</Text>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.label}>Select Level</Text>
                    <View style={styles.levelContainer}>
                        {LEVELS.map((level) => (
                            <TouchableOpacity
                                key={level}
                                style={[
                                    styles.levelChip,
                                    selectedLevel === level && styles.selectedLevelChip,
                                ]}
                                onPress={() => setSelectedLevel(level)}
                            >
                                <Text
                                    style={[
                                        styles.levelText,
                                        selectedLevel === level && styles.selectedLevelText,
                                    ]}
                                >
                                    {level}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Number of Cards</Text>
                    <TextInput
                        style={styles.input}
                        value={cardCount}
                        onChangeText={setCardCount}
                        keyboardType="numeric"
                        placeholder="e.g. 10"
                        placeholderTextColor="#94A3B8"
                    />

                    <TouchableOpacity
                        onPress={handleStartSession}
                        activeOpacity={0.8}
                        style={styles.startButton}
                    >
                        <Text style={styles.startButtonText}>Start Session</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC", // slate-50
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    header: {
        marginBottom: 32,
        alignItems: "center",
    },
    logoContainer: {
        width: 64,
        height: 64,
        backgroundColor: "#4F46E5", // indigo-600
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        // Shadows
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        transform: [{ rotate: "-3deg" }],
    },
    logoText: {
        fontSize: 24,
        color: "#ffffff",
        fontWeight: "bold",
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#0F172A", // slate-900
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#64748B", // slate-500
        fontWeight: "500",
    },
    formContainer: {
        width: "100%",
        maxWidth: 400,
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 24,
        // Shadows
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: "#334155", // slate-700
        marginBottom: 12,
        marginTop: 8,
    },
    levelContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 24,
    },
    levelChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: "#F1F5F9", // slate-100
        borderWidth: 1,
        borderColor: "#E2E8F0", // slate-200
    },
    selectedLevelChip: {
        backgroundColor: "#E0E7FF", // indigo-50
        borderColor: "#4F46E5", // indigo-600
    },
    levelText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748B", // slate-500
    },
    selectedLevelText: {
        color: "#4F46E5", // indigo-600
    },
    input: {
        width: "100%",
        height: 50,
        backgroundColor: "#F8FAFC", // slate-50
        borderWidth: 1,
        borderColor: "#E2E8F0", // slate-200
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: "#0F172A", // slate-900
        marginBottom: 32,
    },
    startButton: {
        width: "100%",
        backgroundColor: "#4F46E5", // indigo-600
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        // Shadows
        shadowColor: "#4F46E5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    startButtonText: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "bold",
        letterSpacing: 0.5,
    },
});
