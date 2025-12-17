import { bundleResourceIO } from "@tensorflow/tfjs-react-native";

// model path
const modelJson = require("../../assets/model/my_tfjs_model/model.json");
const modelWeights = [
  require("../../assets/model/my_tfjs_model/group1-shard1of2.bin"),
  require("../../assets/model/my_tfjs_model/group1-shard2of2.bin"),
];

/**
 * loadModel for Android and IOS
 * loading model via bundleResourceIO and assets
 */
export const modelURI = bundleResourceIO(modelJson, modelWeights);
