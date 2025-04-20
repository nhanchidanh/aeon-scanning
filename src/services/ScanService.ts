import axios from "axios";
import apiClient from "../configs/axios";

export const saveProduct = async (data: any) => {
  try {
    const response = await apiClient.post("/api/v1/save_product", data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        error: error?.response?.data,
      };
    }
  }
};
export const getProductDetailsByBarcode = async (barcode: string) => {
  try {
    const response = await apiClient.get(`/get_detail?barcode=${barcode}`, {
      headers: {
        accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        error: error?.response?.data,
      };
    }
    return {
      error: "Failed to fetch product details",
    };
  }
};

// transcribe voice to text
export const transcribeVoiceToText = async (formData: any) => {
  try {
    const response = await axios.post(
      "https://api.mekong-connector.co/rs/transcribe",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        error: error?.response?.data,
      };
    }
  }
};

export const convertTexttoDate = async (text: string) => {
  try {
    const response = await axios.post(
      "https://api.mekong-connector.co/aeon/api/v1/text_to_date",
      {
        text: text,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("response: ", response);
    return response.data;
  } catch (error) {
    console.log("error: ", error);
    if (axios.isAxiosError(error)) {
      return {
        error: error?.response?.data,
      };
    }
  }
};

export const scanDate = async (formData: any) => {
  console.log("formData: ", formData);
  try {
    const response = await apiClient.post(
      "/api/v1/computer_vision_3",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    // console.error("error:", error);
    if (axios.isAxiosError(error)) {
      return {
        error: error?.response?.data,
      };
    }
  }
};

export const scanDate4 = async (texts: any) => {
  try {
    const response = await apiClient.post(
      "/api/v1/computer_vision_4",
      { texts: texts },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    // console.error("error:", error);
    if (axios.isAxiosError(error)) {
      return {
        error: error?.response?.data,
      };
    }
  }
};

export const scanDate2 = async (formData: any) => {
  try {
    const response = await apiClient.post(
      "/api/v1/computer_vision_2",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log("error: ", error);
    if (axios.isAxiosError(error)) {
      return {
        error: error?.response?.data,
      };
    }
  }
};

export const addProduct = async (productData: {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  manufacturer: string;
  description: string;
  image_url: string;
}) => {
  try {
    const response = await apiClient.post("/api/v1/add_product", productData, {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        error: error?.response?.data,
      };
    }
    return {
      error: "Failed to add product",
    };
  }
};

export const googleVision = async (base64Image: any) => {
  try {
    const requestBody = {
      requests: [
        {
          image: { content: base64Image },
          features: [{ type: "TEXT_DETECTION" }],
        },
      ],
    };

    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY}`,
      requestBody
    );

    const textAnnotations = response.data.responses[0].textAnnotations;
    if (textAnnotations && textAnnotations.length > 0) {
      const extractedText = textAnnotations[0].description;
      const lines = extractedText
        .split("\n")
        .map((l: any) => l.trim())
        .filter(Boolean);

      return lines.join("\n");
    } else {
      return [];
    }
  } catch (error) {
    console.log("error: ", error);
    if (axios.isAxiosError(error)) {
      return {
        error: error?.response?.data,
      };
    }
  }
};
