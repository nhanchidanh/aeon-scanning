import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import Icon from "@expo/vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";

const HomeScreen = () => {
  const navigation = useNavigation<any>();

  const goToScanScreen = () => {
    navigation.navigate("Scan");
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#f5f5f5",
      }}
    >
      <View
        style={{
          backgroundColor: "#ff4081",
          paddingVertical: 16,
          paddingHorizontal: 20,
          elevation: 4,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: "#fff",
          }}
        >
          Home
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "500",
            marginBottom: 40,
            color: "#333",
          }}
        >
          Welcome to Aeon Scanning
        </Text>

        <TouchableOpacity
          onPress={goToScanScreen}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#ff4081",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 12,
            elevation: 3,
            shadowColor: "#ff4081",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
          }}
        >
          {/* <Icon name="qr-code-scanner" size={28} color="#fff" /> */}
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "600",
              marginLeft: 10,
            }}
          >
            Scan Now
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
