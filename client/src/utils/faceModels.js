import * as faceapi from "@vladmandic/face-api";

const MODELS_URL = "/models";

let modelsReady = false;
let modelsPromise = null;

export function loadFaceModels() {
  if (modelsReady) return Promise.resolve(true);
  if (modelsPromise) return modelsPromise;

  modelsPromise = (async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
      ]);
      modelsReady = true;
      return true;
    } catch (err) {
      console.error("Failed to load face-api models:", err);
      modelsPromise = null;
      throw err;
    }
  })();

  return modelsPromise;
}

export function areFaceModelsReady() {
  return modelsReady;
}
