import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import { Alert, StyleSheet } from "react-native";
import HomeScreen from "./src/screens/HomeScreen";
import ScanScreen from "./src/screens/ScanScreen";
const Stack = createNativeStackNavigator();

function MyStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Scan"
        component={ScanScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const checkForUpdates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(
          "Cập nhật mới",
          "Đã có phiên bản mới. Bạn có muốn cập nhật ngay không?",
          [
            {
              text: "Hủy",
              onPress: () => console.log("Người dùng từ chối cập nhật"),
              style: "cancel",
            },
            {
              text: "Cập nhật ngay",
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  Alert.alert(
                    "Cập nhật xong",
                    "Ứng dụng sẽ khởi động lại để áp dụng phiên bản mới.",
                    [{ text: "OK", onPress: () => Updates.reloadAsync() }]
                  );
                } catch (error) {
                  console.log("error: ", error);
                }
              },
            },
          ]
        );
      }
    } catch (e) {
      console.log("e: ", e);
    }
  };

  useEffect(() => {
    checkForUpdates();
  }, []);

  return (
    <NavigationContainer>
      <MyStack />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
