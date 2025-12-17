import React, { useEffect, useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
  SafeAreaView,
} from "react-native";
import Constants from "expo-constants";
import { Camera } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import { modelURI } from "./modelHandler";
import CameraView from "./CameraView";

const App = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState("back");
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState({ loading: true, progress: 0 }); // loading state
  const [inputTensor, setInputTensor] = useState([]);
  const [detecting, setDetecting] = useState(true); // camera running state
  const [detectedObjects, setDetectedObjects] = useState([]); // store valid detected objects
  const [recipe, setRecipe] = useState(null); // recipe result
  const [recipeLoading, setRecipeLoading] = useState(false);

  // Load valid labels
  const validLabels = require("./utils/labels.json");

  // model configuration
  const configurations = { threshold: 0.25 };

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
      tf.ready().then(async () => {
        const yolov5 = await tf.loadGraphModel(modelURI, {
          onProgress: (fractions) => {
            setLoading({ loading: true, progress: fractions }); // set loading fractions
          },
        }); // load model

        // warming up model
        const dummyInput = tf.ones(yolov5.inputs[0].shape);
        await yolov5.executeAsync(dummyInput);
        tf.dispose(dummyInput);

        // set state
        setInputTensor(yolov5.inputs[0].shape);
        setModel(yolov5);
        setLoading({ loading: false, progress: 1 });
      });
    })();
  }, []);

  // Handle detected objects from CameraView
  const handleDetectedObjects = (objects) => {
    if (!objects || objects.length === 0) return;
    // dedupe within the reported objects for this frame
    const uniqueFrame = [...new Set(objects)];
    // Only add objects that are in validLabels and not already stored
    const newObjects = uniqueFrame.filter(
      (obj) => validLabels.includes(obj) && !detectedObjects.includes(obj)
    );
    if (newObjects.length > 0) {
      setDetectedObjects((prev) => {
        const merged = [...prev, ...newObjects];
        return [...new Set(merged)];
      });
    }
  };

  // Send detected objects to backend
  const sendToBackend = async () => {
    // Determine backend host depending on environment
    // const getBackendHost = () => {
    //   // If running through Expo, try to extract host from debuggerHost
    //   try {
    //     const dbg = Constants.manifest && Constants.manifest.debuggerHost;
    //     if (dbg) return dbg.split(":")[0];
    //   } catch (e) {
    //     // ignore
    //   }

    //   // Platform fallbacks
    //   if (Platform.OS === "android") {
    //     // Android emulator (default) maps localhost to 10.0.2.2
    //     return "10.0.2.2";
    //   }
    //   // iOS simulator and web can use localhost
    //   return "127.0.0.1";
    // };

    const url = `https://0e747b553942.ngrok-free.app/generate-recipe`;

    try {
      setRecipeLoading(true);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: detectedObjects.join(", ") }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.warn("Backend returned non-OK status", response.status, text);
        setRecipe(`Server error ${response.status}: ${text}`);
        return;
      }

      const data = await response.json();
      setRecipe(data.recipe || data.error || "No recipe found.");
    } catch (err) {
      console.warn("Network error sending to backend:", err);
      setRecipe("Network error: " + err.message + `. Tried ${url}`);
    } finally {
      setRecipeLoading(false);
    }
  };

  // Stop camera and send objects
  const handleStop = () => {
    setDetecting(false);
    sendToBackend();
  };

  const handleStart = () => {
    setRecipe(null);
    setDetecting(true);
  };

  const handleClear = () => {
    setDetectedObjects([]);
    setRecipe(null);
  };

  return (
    <View className="flex-1 items-center justify-center bg-white">
      {hasPermission ? (
        <>
          {loading.loading ? (
            <Text className="text-lg">
              Loading model... {(loading.progress * 100).toFixed(2)}%
            </Text>
          ) : (
            <View className="flex-1 w-full h-full">
              <View className="flex-1 w-full h-full items-center justify-center">
                {detecting ? (
                  <CameraView
                    type={type}
                    model={model}
                    inputTensorSize={inputTensor}
                    config={configurations}
                    onDetect={handleDetectedObjects}
                  >
                    <View className="absolute left-0 top-0 w-full h-full flex justify-end items-center bg-transparent z-20">
                      <View className="flex-row items-center space-x-2 mb-4">
                        <TouchableOpacity
                          className="flex flex-row items-center bg-transparent border-2 border-white p-3 rounded-lg"
                          onPress={() =>
                            setType((current) =>
                              current === "back" ? "front" : "back"
                            )
                          }
                        >
                          <MaterialCommunityIcons
                            className="mx-2"
                            name="camera-flip"
                            size={26}
                            color="white"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex flex-row items-center bg-red-600 border-2 border-white p-3 rounded-lg"
                          onPress={handleStop}
                        >
                          <MaterialCommunityIcons
                            className="mx-2"
                            name="stop-circle"
                            size={26}
                            color="white"
                          />
                        </TouchableOpacity>
                      </View>

                      {/* detected objects chips */}
                      <View className="mb-6 flex-row flex-wrap justify-center px-4">
                        {detectedObjects.slice(0, 10).map((o) => (
                          <View
                            key={o}
                            className="bg-black bg-opacity-60 px-3 py-1 rounded-full m-1"
                          >
                            <Text className="text-white">{o}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </CameraView>
                ) : (
                  <SafeAreaView className="w-full h-full pt-2">
                    <ScrollView className="w-full h-full p-4">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-lg font-bold mb-2">
                          Detected Objects ({detectedObjects.length}):
                        </Text>
                        <View className="flex-row">
                          <TouchableOpacity
                            onPress={handleStart}
                            className="bg-green-600 px-3 py-1 rounded-lg mr-2"
                          >
                            <Text className="text-white">Start</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={handleClear}
                            className="bg-gray-300 px-3 py-1 rounded-lg"
                          >
                            <Text>Clear</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View className="flex-row flex-wrap mb-4">
                        {detectedObjects.length === 0 ? (
                          <Text>None</Text>
                        ) : (
                          detectedObjects.map((o) => (
                            <View
                              key={o}
                              className="bg-gray-200 px-3 py-1 rounded-full m-1"
                            >
                              <Text>{o}</Text>
                            </View>
                          ))
                        )}
                      </View>

                      <Text className="text-lg font-bold mt-4 mb-2">
                        Recipe:
                      </Text>
                      {recipeLoading ? (
                        <Text>Loading recipe...</Text>
                      ) : recipe ? (
                        (() => {
                          // parse recipe string into sections
                          const parseRecipe = (text) => {
                            const lines = text
                              .split(/\r?\n/)
                              .map((l) => l.trim())
                              .filter(Boolean);
                            const result = {
                              title: null,
                              ingredients: [],
                              directions: [],
                            };
                            for (const line of lines) {
                              const lower = line.toLowerCase();
                              if (lower.startsWith("title:")) {
                                result.title = line
                                  .split(/:/)
                                  .slice(1)
                                  .join(":")
                                  .trim();
                              } else if (lower.startsWith("ingredients:")) {
                                let rest = line
                                  .split(/:/)
                                  .slice(1)
                                  .join(":")
                                  .trim();
                                // split by -- or ,
                                const parts = rest
                                  .split(/--|,/)
                                  .map((s) => s.trim())
                                  .filter(Boolean);
                                result.ingredients = parts;
                              } else if (lower.startsWith("directions:")) {
                                let rest = line
                                  .split(/:/)
                                  .slice(1)
                                  .join(":")
                                  .trim();
                                const parts = rest
                                  .split(/--/)
                                  .map((s) => s.trim())
                                  .filter(Boolean);
                                result.directions = parts;
                              } else {
                                // fallback: if directions already started, append more
                                if (result.directions.length > 0) {
                                  const parts = line
                                    .split(/--/)
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                                  result.directions.push(...parts);
                                }
                              }
                            }
                            return result;
                          };

                          const parsed = parseRecipe(recipe);

                          return (
                            <View>
                              {parsed.title ? (
                                <Text className="text-2xl font-bold mb-2">
                                  {parsed.title}
                                </Text>
                              ) : null}

                              {parsed.ingredients &&
                              parsed.ingredients.length > 0 ? (
                                <View className="mb-3">
                                  <Text className="font-semibold mb-1">
                                    Ingredients
                                  </Text>
                                  <View className="flex-row flex-wrap">
                                    {parsed.ingredients.map((ing, idx) => (
                                      <View
                                        key={idx}
                                        className="bg-yellow-100 px-3 py-1 rounded-full m-1"
                                      >
                                        <Text>{ing}</Text>
                                      </View>
                                    ))}
                                  </View>
                                </View>
                              ) : null}

                              {parsed.directions &&
                              parsed.directions.length > 0 ? (
                                <View>
                                  <Text className="font-semibold mb-1">
                                    Directions
                                  </Text>
                                  {parsed.directions.map((step, i) => (
                                    <View key={i} className="flex-row mb-2">
                                      <Text className="mr-2 font-bold">
                                        {i + 1}.
                                      </Text>
                                      <Text className="flex-1">{step}</Text>
                                    </View>
                                  ))}
                                </View>
                              ) : (
                                <Text>{recipe}</Text>
                              )}
                            </View>
                          );
                        })()
                      ) : (
                        <Text>{"No recipe yet."}</Text>
                      )}
                    </ScrollView>
                  </SafeAreaView>
                )}
              </View>
            </View>
          )}
        </>
      ) : (
        <View>
          <Text className="text-lg">Permission not granted!</Text>
        </View>
      )}
      <StatusBar style="auto" />
    </View>
  );
};

export default App;
