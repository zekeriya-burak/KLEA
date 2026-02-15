import { Slot } from "expo-router";
import { View, StyleSheet, StatusBar as RNStatusBar } from "react-native";
import { StatusBar } from "expo-status-bar";

import { useEffect } from "react";
import { DatabaseService } from "../services/DatabaseService";

export default function Layout() {
    useEffect(() => {
        DatabaseService.initDatabase().catch(console.error);
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <Slot />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC", // slate-50
    },
});
