import { useState } from "react";
import { View } from "react-native";
import { Camera, CameraType } from "expo-camera";
import { GLView } from "expo-gl";
import Expo2DContext from "expo-2d-context";
import * as tf from "@tensorflow/tfjs";
import { cameraWithTensors } from "@tensorflow/tfjs-react-native";
import { preprocess } from "../utils/preprocess";
import { renderBoxes } from "../utils/renderBox";

const TensorCamera = cameraWithTensors(Camera);

const CameraView = ({
  type,
  model,
  inputTensorSize,
  config,
  children,
  onDetect,
}) => {
  const [ctx, setCTX] = useState(null);
  const typesMapper = { back: CameraType.back, front: CameraType.front };

  const cameraStream = (images) => {
    const detectFrame = async () => {
      tf.engine().startScope();
      try {
        const imageFrame = images.next().value;
        if (!imageFrame) {
          // no frame yet; skip processing this iteration
          return;
        }

        const [input, xRatio, yRatio] = preprocess(
          imageFrame,
          inputTensorSize[2],
          inputTensorSize[1]
        );

        const res = await model.executeAsync(input);
        const [boxes, scores, classes] = res.slice(0, 3);
        const boxes_data = boxes.dataSync();
        const scores_data = scores.dataSync();
        const classes_data = classes.dataSync();

        // Get detected objects above threshold
        const detected = [];
        for (let i = 0; i < scores_data.length; i++) {
          if (scores_data[i] >= config.threshold) {
            detected.push(classes_data[i]);
          }
        }
        // Map class indices to labels
        let labels = [];
        try {
          labels = require("../utils/labels.json");
        } catch (e) {
          labels = [];
        }
        const detectedLabels = detected
          .map((idx) => labels[idx])
          .filter(Boolean);
        if (onDetect) onDetect(detectedLabels);

        renderBoxes(
          ctx,
          config.threshold,
          boxes_data,
          scores_data,
          classes_data,
          [xRatio, yRatio]
        );
        tf.dispose([res, input]);
      } catch (err) {
        console.warn("Detection error:", err);
      } finally {
        // schedule next frame and close scope exactly once
        requestAnimationFrame(detectFrame);
        tf.engine().endScope();
      }
    };

    detectFrame();
  };

  return (
    <>
      {ctx && model && inputTensorSize && inputTensorSize.length && (
        <TensorCamera
          // Standard Camera props
          className="w-full h-full z-0"
          type={typesMapper[type]}
          // Tensor related props
          //use_custom_shaders_to_resize={true}
          resizeHeight={inputTensorSize[1]}
          resizeWidth={inputTensorSize[2]}
          resizeDepth={inputTensorSize[3]}
          onReady={cameraStream}
          autorender={true}
        />
      )}
      <View className="absolute left-0 top-0 w-full h-full flex items-center bg-transparent z-10">
        <GLView
          className="w-full h-full "
          onContextCreate={async (gl) => {
            const ctx2d = new Expo2DContext(gl);
            await ctx2d.initializeText();
            setCTX(ctx2d);
          }}
        />
      </View>
      {children}
    </>
  );
};

export default CameraView;
