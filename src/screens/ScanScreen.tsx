import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useRef, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Spinner from "react-native-loading-spinner-overlay";

import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import TextRecognition, {
  TextRecognitionScript,
} from "@react-native-ml-kit/text-recognition";
import { scanDate4 } from "../services/ScanService";
// import TextRecognition...

const ScanScreen = () => {
  const navigation = useNavigation<any>();

  const [mfgDate, setMfgDate] = useState("");
  const [expDate, setExpDate] = useState("");
  const [isMfgDatePickerVisible, setMfgDatePickerVisible] = useState(false);
  const [isExpDatePickerVisible, setExpDatePickerVisible] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastDetectedDate, setLastDetectedDate] = useState<string | null>(null); // Lưu ngày đã nhận diện
  const [angle, setAngle] = useState(0); // Lưu góc xoay của ảnh

  const showMfgDatePicker = () => {
    setMfgDatePickerVisible(true);
  };

  const hideMfgDatePicker = () => {
    setMfgDatePickerVisible(false);
  };

  const handleMfgDateConfirm = (date: Date) => {
    const formattedDate = formatDate(date);
    setMfgDate(formattedDate);
    hideMfgDatePicker();
  };

  const showExpDatePicker = () => {
    setExpDatePickerVisible(true);
  };

  const hideExpDatePicker = () => {
    setExpDatePickerVisible(false);
  };

  const handleExpDateConfirm = (date: Date) => {
    const formattedDate = formatDate(date);
    setExpDate(formattedDate);
    hideExpDatePicker();
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getFirstTextAngle = (blocks: any[]): number => {
    try {
      const firstLine = blocks?.[0]?.lines?.[0];
      const points = firstLine?.cornerPoints;
      if (!points || points.length < 2) return 0;

      const [p1, p2] = points;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;

      const radians = Math.atan2(dy, dx);
      const degrees = radians * (180 / Math.PI);
      return degrees;
    } catch (e) {
      console.log("Không thể tính góc:", e);
      return 0;
    }
  };

  const rotateImage = async (uri: string, angle: number): Promise<string> => {
    try {
      const result: any = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }, { rotate: -angle }], // Xoay ngược lại để cân bằng
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return result;
    } catch (e) {
      console.error("Lỗi xoay ảnh:", e);
      return uri;
    }
  };

  const processDetectedDates = (data: any) => {
    console.log("data: ", data);
    if (data && data.full_date && data.full_date.length > 0) {
      const { full_date, shelf_life } = data; // Lấy dữ liệu từ detectedDates
      const { date, month, year, type_date } = full_date[0]; // Lấy phần tử đầu tiên trong full_date
      console.log("{ date, month, year, type_date }: ", {
        date,
        month,
        year,
        type_date,
      });

      const baseDate = new Date(year, month - 1, date); // Tạo đối tượng Date từ ngày, tháng, năm
      console.log("baseDate: ", baseDate);

      if (type_date === "NSX" && shelf_life) {
        // Nếu là NSX, tính HSD bằng cách cộng shelf_life (số tháng)
        const hsdDate = new Date(baseDate);
        console.log("hsdDate: ", hsdDate);
        hsdDate.setMonth(hsdDate.getMonth() + shelf_life);

        console.log("HSD:", hsdDate);
        setExpDate(
          `${hsdDate.getDate()}-${
            hsdDate.getMonth() + 1
          }-${hsdDate.getFullYear()}`
        );
        setMfgDate(`${date}-${month}-${year}`);
      } else if (type_date === "HSD" && shelf_life) {
        // Nếu là HSD, tính NSX bằng cách trừ shelf_life (số tháng)
        const nsxDate = new Date(baseDate);
        nsxDate.setMonth(nsxDate.getMonth() - shelf_life);

        console.log("NSX:", nsxDate);
        setMfgDate(
          `${nsxDate.getDate()}-${
            nsxDate.getMonth() + 1
          }-${nsxDate.getFullYear()}`
        );
        setExpDate(`${date}-${month}-${year}`);
      }
    }
  };

  const pickImage = async (prevDetectedDate?: string) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      let uri = result.assets[0].uri;
      setImageUri(uri);
      console.log("uri: ", uri);

      const initialBlocks = await TextRecognition.recognize(
        uri,
        TextRecognitionScript.LATIN
      );
      console.log("initialBlocks: ", initialBlocks);
      const angle = getFirstTextAngle(initialBlocks?.blocks);

      let blocks;
      console.log("Rotating image by angle:", Math.abs(angle));
      setAngle(angle); // Lưu góc xoay vào state

      if (!isNaN(angle) && Math.abs(angle) > 5) {
        const rotated: any = await rotateImage(uri, angle);
        uri = rotated.uri;
        blocks = await TextRecognition.recognize(
          uri,
          TextRecognitionScript.LATIN
        );
      } else {
        blocks = initialBlocks;
      }

      setImageUri(uri);

      const text = blocks?.blocks.map((block) => block.text).join("\n");
      let lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      // Nếu có prevDetectedDate thì thêm vào lines
      if (prevDetectedDate && !lines.includes(prevDetectedDate)) {
        lines.push(prevDetectedDate);
      }

      console.log("lines: ", JSON.stringify(lines, null, 2));
      if (!lines || lines.length === 0) {
        Alert.alert("Không tìm thấy văn bản trong ảnh.");
        setMfgDate("");
        setExpDate("");
        return;
      }

      try {
        const response = await scanDate4(lines);
        console.log("response: ", response);

        if (response?.data?.full_date?.length === 0) {
          Alert.alert("Không tìm thấy ngày tháng trong ảnh.");
          setMfgDate("");
          setExpDate("");
          return;
        }
        if (
          response.data.shelf_life &&
          response?.data?.full_date?.length === 1
        ) {
          return processDetectedDates(response.data);
        }

        // Nếu chỉ nhận diện ra 1 date, hỏi người dùng có muốn nhận diện tiếp không
        if (
          response?.data?.full_date?.length > 0 &&
          !response.data.shelf_life &&
          !prevDetectedDate
        ) {
          const firstDate = response.data.full_date[0];
          const detected =
            (firstDate.type_date || "") +
            ": " +
            `${firstDate.date || 1}-${firstDate.month}-${
              firstDate.year < 100 ? 2000 + firstDate.year : firstDate.year
            }`;

          Alert.alert(
            "Chỉ nhận diện được một ngày",
            "Bạn có muốn nhận diện tiếp ngày còn lại không?",
            [
              {
                text: "Không",
                style: "cancel",
              },
              {
                text: "Có",
                onPress: () => {
                  // Gọi lại pickImage, truyền detected date vào
                  pickImage(detected);
                },
              },
            ]
          );
          // Không xử lý tiếp cho đến khi người dùng chọn
          return;
        }

        // Chỉ gọi processDetectedDates khi có shelf_life

        const data = response.data?.full_date;
        let hasNSX = false;
        let hasHSD = false;

        if (Array.isArray(data)) {
          data.forEach((item) => {
            if (item.type_date === "NSX" && item.month && item.year) {
              const mfgDateValue = `${item.date || 1}-${item.month}-${
                item.year < 100 ? 2000 + item.year : item.year
              }`;
              setMfgDate(mfgDateValue);
              hasNSX = true;
              if (!hasHSD) setLastDetectedDate(`NSX: ${mfgDateValue}`);
            } else if (item.type_date === "HSD" && item.month && item.year) {
              const expDateValue = `${item.date || 1}-${item.month}-${
                item.year < 100 ? 2000 + item.year : item.year
              }`;
              setExpDate(expDateValue);
              hasHSD = true;
              if (!hasNSX) setLastDetectedDate(`HSD: ${expDateValue}`);
            }
          });

          if (hasNSX && !hasHSD) {
            setExpDate("");
          } else if (!hasNSX && hasHSD) {
            setMfgDate("");
          }
        }
      } catch (error) {
        console.error("❌ Lỗi khi xử lý ảnh:", error);
        Alert.alert("Lỗi", "Không thể xử lý ảnh. Vui lòng thử lại.");
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: "#ff4081",
            paddingVertical: 16,
            paddingHorizontal: 20,
            elevation: 4,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={{
              padding: 8,
              marginRight: 10,
            }}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: "#fff",
            }}
          >
            Product Scan
          </Text>
        </View>

        {/* Content */}
        <View style={{ padding: 20 }}>
          {/* Image Preview */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 12,
                color: "#333",
              }}
            >
              Image Preview
            </Text>
            <Image
              source={{
                uri:
                  imageUri ||
                  "https://brandslogos.com/wp-content/uploads/images/large/aeon-logo.png",
              }}
              style={{
                width: "100%",
                height: 200,
                borderRadius: 8,
              }}
              resizeMode="cover"
            />
          </View>

          {/* MFG Date */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 12,
                color: "#333",
              }}
            >
              Manufacturing Date
            </Text>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#e0e0e0",
                borderRadius: 8,
                padding: 12,
                backgroundColor: "#F8F8F8",
              }}
              onPress={showMfgDatePicker}
            >
              <MaterialIcons
                name="calendar-today"
                size={22}
                color="#ff4081"
                style={{ marginRight: 10 }}
              />
              <Text
                style={{
                  flex: 1,
                  color: mfgDate ? "#333" : "#999",
                  fontSize: 16,
                }}
              >
                {mfgDate || "Select manufacturing date"}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isMfgDatePickerVisible}
              mode="date"
              onConfirm={handleMfgDateConfirm}
              onCancel={hideMfgDatePicker}
            />
          </View>

          {/* EXP Date */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 12,
                color: "#333",
              }}
            >
              Expiration Date
            </Text>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#e0e0e0",
                borderRadius: 8,
                padding: 12,
                backgroundColor: "#F8F8F8",
              }}
              onPress={showExpDatePicker}
            >
              <MaterialIcons
                name="calendar-today"
                size={22}
                color="#ff4081"
                style={{ marginRight: 10 }}
              />
              <Text
                style={{
                  flex: 1,
                  color: expDate ? "#333" : "#999",
                  fontSize: 16,
                }}
              >
                {expDate || "Select expiration date"}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isExpDatePickerVisible}
              mode="date"
              onConfirm={handleExpDateConfirm}
              onCancel={hideExpDatePicker}
            />
          </View>

          {/* Angle Display */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 12,
                color: "#333",
              }}
            >
              Rotation Angle
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#e0e0e0",
                borderRadius: 8,
                padding: 12,
                backgroundColor: "#F8F8F8",
              }}
            >
              <MaterialIcons
                name="rotate-right"
                size={22}
                color="#ff4081"
                style={{ marginRight: 10 }}
              />
              <Text
                style={{
                  flex: 1,
                  color: "#333",
                  fontSize: 16,
                }}
              >
                {angle ? `${angle.toFixed(2)}°` : "No rotation detected"}
              </Text>
            </View>
          </View>

          {/* Scan Button */}
          <TouchableOpacity
            style={{
              backgroundColor: "#ff4081",
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
              elevation: 3,
              flexDirection: "row",
              shadowColor: "#ff4081",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              marginBottom: 20,
            }}
            disabled={loading}
            onPress={() => {
              pickImage();
            }}
          >
            <MaterialIcons
              name="camera-alt"
              size={24}
              color="#fff"
              style={{ marginRight: 10 }}
            />
            <Text style={{ color: "white", fontWeight: "600", fontSize: 18 }}>
              Scan Date
            </Text>
          </TouchableOpacity>

          {/* Save Button */}
          {/* <TouchableOpacity
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
              elevation: 3,
              borderWidth: 2,
              borderColor: "#ff4081",
              flexDirection: "row",
              marginBottom: 40,
            }}
          >
            <MaterialIcons
              name="save"
              size={24}
              color="#ff4081"
              style={{ marginRight: 10 }}
            />
            <Text style={{ color: "#ff4081", fontWeight: "600", fontSize: 18 }}>
              Save Product
            </Text>
          </TouchableOpacity> */}
        </View>
      </ScrollView>

      <Spinner
        visible={loading}
        textContent={"Processing..."}
        textStyle={{ color: "#FFF" }}
        overlayColor="rgba(0, 0, 0, 0.7)"
      />
    </SafeAreaView>
  );
};

export default ScanScreen;
