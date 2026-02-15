import { router } from "expo-router";
import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DatabaseService, Category } from "../services/DatabaseService";
import { Ionicons } from '@expo/vector-icons';

export default function CategorySelectionScreen() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await DatabaseService.getAllCategories();
            setCategories(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectCategory = (category?: Category) => {
        router.push({
            pathname: "/setup",
            params: { categoryId: category ? category.id.toString() : undefined }
        });
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Choose a Topic</Text>
                    <Text style={styles.subtitle}>What do you want to learn today?</Text>
                </View>

                <View style={styles.grid}>
                    {/* Mixed Option */}
                    <TouchableOpacity
                        style={[styles.card, styles.mixedCard]}
                        onPress={() => handleSelectCategory()}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
                            <Ionicons name="shuffle" size={32} color="#4F46E5" />
                        </View>
                        <Text style={styles.cardTitle}>Mixed</Text>
                        <Text style={styles.cardSubtitle}>All categories</Text>
                    </TouchableOpacity>

                    {/* Categories */}
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={styles.card}
                            onPress={() => handleSelectCategory(cat)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#F8FAFC' }]}>
                                <Text style={styles.iconText}>{cat.name.charAt(0)}</Text>
                            </View>
                            <Text style={styles.cardTitle}>{cat.name}</Text>
                            <Text style={styles.cardSubtitle}>{cat.word_count} words</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 24,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#64748B",
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    card: {
        width: '47%', // roughly half minus gap
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    mixedCard: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#475569',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
        textAlign: 'center',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
    }
});
