import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_URL, // Thay bằng URL API của bạn
  timeout: 25000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
