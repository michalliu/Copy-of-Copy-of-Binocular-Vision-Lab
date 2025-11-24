export const DEFAULT_PARAMS = {
  ipd: 64, // mm
  focalLength: 50, // mm
  targetDistance: 2.5, // meters
  vergenceAngle: 0,
  objectType: 'torus' as const,
  wireframe: false,
  cameraSize: 0.15,
  objectScale: 0.5,
  isPaused: false,
  isViewLocked: false,
  showBoundingBox: false,
  showBackgroundBoundingBox: false,
  showCameraBoundingBox: false,
  showFOV: true,
  customModelUrl: null,
};

export const MIN_IPD = 0; // Cyclops!
export const MAX_IPD = 20000; // Hammerhead shark simulation
export const MIN_DISTANCE = 0.5;
export const MAX_DISTANCE = 10.0;

export const GEMINI_MODEL_FLASH = 'gemini-2.5-flash';

export const AI_SYSTEM_INSTRUCTION = `你是一位光学、计算机视觉和眼科领域的专家教授。
你的目标是根据用户的模拟设置解释双目视觉概念。
解释要简洁、具有教育意义，并专注于立体视觉、视差和深度感知的物理原理。
除非必须使用数学公式，否则避免使用 markdown 代码块。对关键术语使用加粗。
请使用中文回答。`;