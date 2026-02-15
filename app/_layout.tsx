import { Slot } from "expo-router";
import { View, StyleSheet, StatusBar as RNStatusBar } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function Layout() {
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
