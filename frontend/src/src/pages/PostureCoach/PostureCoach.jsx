import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { API_BASE_URL } from "../../../config/api";
import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";
import { useTheme } from '../../context/ThemeContext';
import { Sparkles, ChevronDown, ChevronRight, Video, Activity, Zap } from 'lucide-react';
import { analyzePosture } from "../../utils/postureService";
import { RepCounter, calculateCaloriesBurned } from "../../utils/repCounter";

// Map workout plan exercise names (from Gemini) to PostureCoach exercise ids.
// Order matters: more specific keyword sets first. Covers all common AI-generated exercises.
const WORKOUT_NAME_TO_EXERCISE_ID = [
  // Bicep
  { keywords: ["bicep", "curl", "dumbbell curl", "hammer curl", "preacher curl", "concentration curl", "cable curl", "barbell curl"], id: "bicep_curl" },
  // Lateral / delts
  { keywords: ["lateral raise", "side raise", "lateral delt", "reverse fly", "face pull"], id: "lateral_raise" },
  // Shoulder press / overhead
  { keywords: ["shoulder press", "overhead press", "military press", "arnold press", "front raise", "shoulder raise", "push press", "strict press"], id: "shoulder_press" },
  // Triceps
  { keywords: ["tricep", "triceps", "kickback", "extension", "pushdown", "skull crusher", "lying tricep", "overhead extension", "dip"], id: "tricep_extension" },
  // Push-up / chest (bench, press, fly)
  { keywords: ["bench press", "push-up", "push up", "press up", "incline press", "decline press", "chest press", "cable fly", "pec deck", "chest fly", "dumbbell fly", "pushup", "press-up", "diamond push"], id: "pushup" },
  // Rows / back pull
  { keywords: ["bent over row", "bent-over row", "barbell row", "dumbbell row", "t-bar row", "lat pulldown", "cable row", "seated row", "single arm row", "pendlay row", "inverted row", "pull-up", "chin-up", "pullup", "pulldown"], id: "bent_over_row" },
  // Deadlift variants
  { keywords: ["romanian deadlift", "rdl", "stiff leg", "sumo deadlift", "deadlift", "hip hinge"], id: "deadlift" },
  // Lunge variants (before squat so "split squat" matches lunge)
  { keywords: ["bulgarian split", "split squat", "walking lunge", "reverse lunge", "lunge", "curtsy lunge", "lateral lunge"], id: "lunge" },
  // Squat variants
  { keywords: ["goblet squat", "front squat", "box squat", "hack squat", "leg press", "squat", "pistol squat", "jump squat", "sissy squat"], id: "squat" },
  // Calf / legs (map to squat for lower-body pose analysis)
  { keywords: ["calf raise", "leg extension", "leg curl", "hip thrust", "glute bridge"], id: "squat" },
  // Plank
  { keywords: ["plank", "front plank", "forearm plank", "hollow hold", "dead bug"], id: "plank" },
  { keywords: ["side plank"], id: "side_plank" },
  // Cardio / bodyweight
  { keywords: ["high knees", "knee raise", "knee up"], id: "high_knees" },
  { keywords: ["jumping jack", "star jump", "jump jack"], id: "jumping_jack" },
  { keywords: ["mountain climber", "mountains"], id: "mountain_climber" },
  // Posture / standing
  { keywords: ["posture", "standing", "stance"], id: "posture" },
];

function mapWorkoutExerciseNameToId(name) {
  if (!name || typeof name !== "string") return "squat";
  const lower = name.toLowerCase();
  for (const { keywords, id } of WORKOUT_NAME_TO_EXERCISE_ID) {
    if (keywords.some((kw) => lower.includes(kw))) return id;
  }
  return "squat";
}

/** Find the best-matching option label for a plan exercise name so the correct option is highlighted (e.g. "Lat Pulldown" not "Bent-over Row"). */
function getBestMatchingLabel(planName, mappedId, exercisesFlat) {
  if (!planName || !mappedId || !exercisesFlat?.length) return null;
  const planLower = planName.toLowerCase().trim();
  const sameId = exercisesFlat.filter((e) => e.id === mappedId);
  // Prefer exact label match, then plan name contains label, then label contains plan name
  const exact = sameId.find((e) => e.label.toLowerCase() === planLower);
  if (exact) return exact.label;
  const planContainsLabel = sameId.filter((e) =>
    planLower.includes(e.label.toLowerCase())
  );
  if (planContainsLabel.length > 0)
    return planContainsLabel.sort((a, b) => b.label.length - a.label.length)[0].label;
  const labelContainsPlan = sameId.filter((e) =>
    e.label.toLowerCase().includes(planLower)
  );
  if (labelContainsPlan.length > 0) return labelContainsPlan[0].label;
  return sameId[0]?.label ?? null;
}

/** Parse target total reps from sets (number) and reps (string e.g. "8-12", "10", "to failure") */
function parseTargetTotalReps(sets, repsStr) {
  const setsNum = typeof sets === "number" ? sets : parseInt(sets, 10) || 1;
  if (!repsStr || typeof repsStr !== "string") return setsNum * 10;
  const s = repsStr.toLowerCase().trim();
  if (s.includes("failure") || s.includes("max")) return null; // no numeric target
  const rangeMatch = s.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    const high = Math.max(parseInt(rangeMatch[1], 10), parseInt(rangeMatch[2], 10));
    return setsNum * high;
  }
  const single = parseInt(s.replace(/\D/g, ""), 10);
  if (!isNaN(single)) return setsNum * single;
  return setsNum * 10;
}

// At least 7 exercises per body part. Each uses an existing pose analyzer (id).
const EXERCISE_GROUPS = [
  {
    bodyPart: "Chest",
    exercises: [
      { id: "pushup", label: "Bench Press" },
      { id: "pushup", label: "Incline Dumbbell Press" },
      { id: "pushup", label: "Decline Press" },
      { id: "pushup", label: "Push-up" },
      { id: "pushup", label: "Cable Fly" },
      { id: "pushup", label: "Pec Deck" },
      { id: "pushup", label: "Chest Press" },
      { id: "pushup", label: "Diamond Push-up" },
    ],
  },
  {
    bodyPart: "Back",
    exercises: [
      { id: "bent_over_row", label: "Bent-over Row" },
      { id: "bent_over_row", label: "Barbell Row" },
      { id: "bent_over_row", label: "Lat Pulldown" },
      { id: "bent_over_row", label: "Pull-up" },
      { id: "bent_over_row", label: "Cable Row" },
      { id: "bent_over_row", label: "Single-Arm Row" },
      { id: "bent_over_row", label: "T-Bar Row" },
      { id: "bent_over_row", label: "Chin-up" },
    ],
  },
  {
    bodyPart: "Shoulders",
    exercises: [
      { id: "shoulder_press", label: "Overhead Press" },
      { id: "shoulder_press", label: "Military Press" },
      { id: "shoulder_press", label: "Arnold Press" },
      { id: "shoulder_press", label: "Front Raise" },
      { id: "lateral_raise", label: "Lateral Raise" },
      { id: "lateral_raise", label: "Reverse Fly" },
      { id: "lateral_raise", label: "Face Pull" },
      { id: "lateral_raise", label: "Upright Row" },
    ],
  },
  {
    bodyPart: "Biceps",
    exercises: [
      { id: "bicep_curl", label: "Bicep Curl" },
      { id: "bicep_curl", label: "Hammer Curl" },
      { id: "bicep_curl", label: "Preacher Curl" },
      { id: "bicep_curl", label: "Concentration Curl" },
      { id: "bicep_curl", label: "Cable Curl" },
      { id: "bicep_curl", label: "Barbell Curl" },
      { id: "bicep_curl", label: "Incline Curl" },
    ],
  },
  {
    bodyPart: "Triceps",
    exercises: [
      { id: "tricep_extension", label: "Tricep Extension" },
      { id: "tricep_extension", label: "Tricep Pushdown" },
      { id: "tricep_extension", label: "Skull Crusher" },
      { id: "tricep_extension", label: "Overhead Extension" },
      { id: "tricep_extension", label: "Kickback" },
      { id: "tricep_extension", label: "Close-Grip Bench" },
      { id: "tricep_extension", label: "Dips" },
    ],
  },
  {
    bodyPart: "Legs",
    exercises: [
      { id: "squat", label: "Back Squat" },
      { id: "squat", label: "Front Squat" },
      { id: "squat", label: "Leg Press" },
      { id: "squat", label: "Goblet Squat" },
      { id: "lunge", label: "Walking Lunge" },
      { id: "lunge", label: "Reverse Lunge" },
      { id: "lunge", label: "Bulgarian Split Squat" },
      { id: "deadlift", label: "Romanian Deadlift" },
      { id: "deadlift", label: "Deadlift" },
      { id: "squat", label: "Calf Raise" },
    ],
  },
  {
    bodyPart: "Core",
    exercises: [
      { id: "plank", label: "Plank" },
      { id: "side_plank", label: "Side Plank" },
      { id: "mountain_climber", label: "Mountain Climber" },
      { id: "high_knees", label: "High Knees" },
      { id: "plank", label: "Forearm Plank" },
      { id: "plank", label: "Hollow Hold" },
      { id: "plank", label: "Dead Bug" },
      { id: "jumping_jack", label: "Jumping Jack" },
    ],
  },
  {
    bodyPart: "General",
    exercises: [{ id: "posture", label: "Posture" }],
  },
];

// Flat list for lookups (first occurrence per id for display fallback)
const EXERCISES = EXERCISE_GROUPS.flatMap((g) => g.exercises);

const EXERCISE_ANIMATIONS = {
  // Base IDs fallback
  squat: "https://fitnessprogramer.com/wp-content/uploads/2021/02/BARBELL-SQUAT.gif",
  pushup: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Push-Up.gif",
  lunge: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lunge.gif",
  bicep_curl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Curl.gif",
  shoulder_press: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Shoulder-Press.gif",
  lateral_raise: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lateral-Raise.gif",
  deadlift: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Deadlift.gif",
  bent_over_row: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bent-Over-Row.gif",
  tricep_extension: "https://www.spotebi.com/wp-content/uploads/2014/10/dumbbell-triceps-extension-exercise-illustration.gif",
  plank: "https://www.spotebi.com/wp-content/uploads/2014/10/plank-exercise-illustration.gif",
  side_plank: "https://www.spotebi.com/wp-content/uploads/2014/10/side-plank-exercise-illustration.gif",
  high_knees: "https://www.spotebi.com/wp-content/uploads/2014/10/high-knees-exercise-illustration.gif",
  jumping_jack: "https://www.spotebi.com/wp-content/uploads/2014/10/jumping-jacks-exercise-illustration.gif",
  mountain_climber: "https://media.tenor.com/21qUJXduNeQAAAAM/working-out-deshun-murrell.gif",
  posture: "https://media.tenor.com/ShX1lf_iH5IAAAAM/chair-posture-stretching.gif",

  // Specific Labels for EXACT mapping (covering all dropdown items)
  "Bench Press": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bench-Press.gif",
  "Incline Dumbbell Press": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Incline-Dumbbell-Press.gif",
  "Decline Press": "https://media.tenor.com/zKtCGjSzP6oAAAAM/chest-bench.gif",
  "Push-up": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Push-Up.gif",
  "Cable Fly": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Cable-Crossover.gif",
  "Pec Deck": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Pec-Deck-Fly.gif",
  "Chest Press": "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExamYzcHd0ZTlrOWtoOTRjeTNkbnRlM2lqdm1mOHB3b3QzM3V4NmE3NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/cKPsQVloxwsPgbpamd/giphy.gif",
  "Diamond Push-up": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Diamond-Push-up.gif",

  "Bent-over Row": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bent-Over-Row.gif",
  "Barbell Row": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bent-Over-Row.gif",
  "Lat Pulldown": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Lat-Pulldown.gif",
  "Pull-up": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Pull-up.gif",
  "Cable Row": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Seated-Cable-Row.gif",
  "Single-Arm Row": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Row.gif",
  "T-Bar Row": "https://media.tenor.com/VSPMzd4wbskAAAAM/t1e1-t-bar-row.gif",
  "Chin-up": "https://media.tenor.com/AoUKUekRRIsAAAAM/pull-ups-this-is-happening.gif",

  "Overhead Press": "https://media.tenor.com/411tsEoTwCoAAAAM/akim-williams.gif",
  "Military Press": "https://media.tenor.com/vFJSvh8AvhAAAAAM/a1.gif",
  "Arnold Press": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Arnold-Press.gif",
  "Front Raise": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Front-Raise.gif",
  "Lateral Raise": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lateral-Raise.gif",
  "Reverse Fly": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Reverse-Fly.gif",
  "Face Pull": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Face-Pull.gif",
  "Upright Row": "https://media.tenor.com/StZ4pCYVM_AAAAAM/uppright-row-z-bar.gif",

  "Bicep Curl": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Curl.gif",
  "Hammer Curl": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Hammer-Curl.gif",
  "Preacher Curl": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Z-Bar-Preacher-Curl.gif",
  "Concentration Curl": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Concentration-Curl.gif",
  "Cable Curl": "https://media.tenor.com/rkexMgK5nn8AAAAM/reverse-cable-arm-curl.gif",
  "Barbell Curl": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Curl.gif",
  "Incline Curl": "https://media.tenor.com/OnedKDo8TeYAAAAM/girl-muscle-girl-biceps.gif",

  "Tricep Extension": "https://www.spotebi.com/wp-content/uploads/2014/10/dumbbell-triceps-extension-exercise-illustration.gif",
  "Tricep Pushdown": "https://media.tenor.com/GpvUxIvyOZ0AAAAM/tr%C3%ADceps-pulley-corda.gif",
  "Skull Crusher": "https://media.tenor.com/y_Z2oZ35sP8AAAAM/skull-crusher-dumbells.gif",
  "Overhead Extension": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Triceps-Extension.gif",
  "Kickback": "https://media.tenor.com/jqwaOmRs-7gAAAAM/tricep-kick-back-tricep.gif",
  "Close-Grip Bench": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Close-Grip-Bench-Press.gif",
  "Dips": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Triceps-Dips.gif",

  "Back Squat": "https://fitnessprogramer.com/wp-content/uploads/2021/02/BARBELL-SQUAT.gif",
  "Front Squat": "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExd3djenVjc2ZpOXV3cHJ0Mzl3dXhueTJoc3AxaWdqMXFhMHp2Z3FsbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/UeCwB3u5BDzHH2autL/giphy.gif",
  "Leg Press": "https://media.tenor.com/FoIEqZY1mSgAAAAM/leg-press-workout.gif",
  "Goblet Squat": "https://media.tenor.com/ovqOi2o9B08AAAAM/squat-goblet-squat.gif",
  "Walking Lunge": "https://media.tenor.com/fWiC9Ze5eUMAAAAM/lunges-exercise.gif",
  "Reverse Lunge": "https://media.tenor.com/fWiC9Ze5eUMAAAAM/lunges-exercise.gif",
  "Bulgarian Split Squat": "https://media.tenor.com/Xc3PcubNYHkAAAAM/sam-mandigo-sam-gainss.gif",
  "Romanian Deadlift": "https://media.tenor.com/VSY6K8y4zEIAAAAM/romanian-deadlift-exercise.gif",
  "Deadlift": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Deadlift.gif",
  "Calf Raise": "https://media.tenor.com/JYsGi3a3Y_4AAAAM/single-leg-calf-raise.gif",

  "Plank": "https://www.spotebi.com/wp-content/uploads/2014/10/plank-exercise-illustration.gif",
  "Side Plank": "https://www.spotebi.com/wp-content/uploads/2014/10/side-plank-exercise-illustration.gif",
  "Mountain Climber": "https://media.tenor.com/21qUJXduNeQAAAAM/working-out-deshun-murrell.gif",
  "High Knees": "https://www.spotebi.com/wp-content/uploads/2014/10/high-knees-exercise-illustration.gif",
  "Forearm Plank": "https://www.spotebi.com/wp-content/uploads/2014/10/plank-exercise-illustration.gif",
  "Hollow Hold": "https://media.tenor.com/q7r6mjrFVh0AAAAM/hand-raised-balance.gif",
  "Dead Bug": "https://media.tenor.com/DN23029huGsAAAAM/deadbug-core.gif",
  "Jumping Jack": "https://www.spotebi.com/wp-content/uploads/2014/10/jumping-jacks-exercise-illustration.gif",

  "Posture": "https://media.tenor.com/ShX1lf_iH5IAAAAM/chair-posture-stretching.gif"
};

const DEFAULT_FRONTEND_THRESHOLDS = {
  keypointScoreVisible: 0.3,
  keypointConfidenceThreshold: 0.5,
  minKeypointsForConfFilter: 8,
  minVisibilityRatio: 0.5,
  smoothLandmarkWindow: 15,
  requiredTrackingZones: ["shoulders", "hips", "knees"],
};

const FRONTEND_EXERCISE_THRESHOLDS = {
  squat: { ...DEFAULT_FRONTEND_THRESHOLDS },
  pushup: { ...DEFAULT_FRONTEND_THRESHOLDS, requiredTrackingZones: ["shoulders", "hips", "ankles", "elbows"] },
  lunge: { ...DEFAULT_FRONTEND_THRESHOLDS, requiredTrackingZones: ["shoulders", "hips", "knees", "ankles"] },
  bicep_curl: { ...DEFAULT_FRONTEND_THRESHOLDS, minVisibilityRatio: 0.45, requiredTrackingZones: ["shoulders", "elbows", "wrists"] },
  shoulder_press: { ...DEFAULT_FRONTEND_THRESHOLDS, requiredTrackingZones: ["shoulders", "elbows", "wrists"] },
  lateral_raise: { ...DEFAULT_FRONTEND_THRESHOLDS, requiredTrackingZones: ["shoulders", "elbows", "wrists", "hips"] },
  deadlift: { ...DEFAULT_FRONTEND_THRESHOLDS, requiredTrackingZones: ["shoulders", "hips", "knees"] },
  bent_over_row: { ...DEFAULT_FRONTEND_THRESHOLDS, requiredTrackingZones: ["shoulders", "hips", "elbows", "wrists"] },
  tricep_extension: { ...DEFAULT_FRONTEND_THRESHOLDS, minVisibilityRatio: 0.45, requiredTrackingZones: ["shoulders", "elbows", "wrists"] },
  plank: { ...DEFAULT_FRONTEND_THRESHOLDS, requiredTrackingZones: ["shoulders", "hips", "ankles"] },
  side_plank: { ...DEFAULT_FRONTEND_THRESHOLDS, requiredTrackingZones: ["shoulders", "hips", "ankles"] },
  high_knees: { ...DEFAULT_FRONTEND_THRESHOLDS, requiredTrackingZones: ["hips", "knees", "ankles"] },
  jumping_jack: { ...DEFAULT_FRONTEND_THRESHOLDS, minVisibilityRatio: 0.55, requiredTrackingZones: ["shoulders", "hips", "ankles", "wrists"] },
  mountain_climber: { ...DEFAULT_FRONTEND_THRESHOLDS, requiredTrackingZones: ["shoulders", "hips", "knees", "ankles"] },
  posture: { ...DEFAULT_FRONTEND_THRESHOLDS, requiredTrackingZones: ["nose", "shoulders", "hips", "knees", "ankles"] },
};

function getFrontendExerciseThresholds(exerciseType) {
  return FRONTEND_EXERCISE_THRESHOLDS[exerciseType] || DEFAULT_FRONTEND_THRESHOLDS;
}

function isFullBodyVisibleFromPose(pose, exerciseType, thresholds) {
  if (!pose?.keypoints?.length) return false;

  const th = thresholds || getFrontendExerciseThresholds(exerciseType);
  const keypointsByName = new Map();
  for (const kp of pose.keypoints) {
    if (!kp) continue;
    const name = kp.name || kp.part || kp.id;
    if (!name) continue;
    if ((kp.score || 0) < th.keypointScoreVisible) continue;
    keypointsByName.set(String(name).toLowerCase(), kp);
  }

  const has = (n) => keypointsByName.has(n);
  const zoneCheck = {
    shoulders: has("left_shoulder") || has("right_shoulder"),
    hips: has("left_hip") || has("right_hip"),
    knees: has("left_knee") || has("right_knee"),
    ankles: has("left_ankle") || has("right_ankle"),
    elbows: has("left_elbow") || has("right_elbow"),
    wrists: has("left_wrist") || has("right_wrist"),
    nose: has("nose"),
  };

  return (th.requiredTrackingZones || []).every((zone) => Boolean(zoneCheck[zone]));
}

// -------- Narration + accuracy helpers (practical improvements) --------
// 1) Temporal smoothing: average landmarks over last frames
// 4) Confidence filtering: ignore low-confidence keypoints
function toLandmarksFromPoseKeypoints(keypoints) {
  return (keypoints || []).map((kp) => ({
    name: kp?.name || kp?.part || kp?.id,
    x: kp?.x,
    y: kp?.y,
    score: kp?.score,
  }));
}

function filterLandmarksByConfidence(landmarks, confidenceThreshold) {
  return (landmarks || []).filter((kp) => (kp?.score || 0) >= confidenceThreshold);
}

function shouldUseFilteredLandmarks(landmarks, confidenceThreshold, minKeypointsForConfFilter) {
  return (landmarks || []).filter((kp) => (kp?.score || 0) >= confidenceThreshold).length >=
    minKeypointsForConfFilter;
}

function averageLandmarksFromFrames(frames) {
  // frames: Array<Array<{name,x,y,score}>>
  const accum = new Map();

  for (const frame of frames || []) {
    if (!Array.isArray(frame)) continue;
    for (const kp of frame) {
      if (!kp?.name || typeof kp.x !== "number" || typeof kp.y !== "number") continue;
      const name = String(kp.name).toLowerCase();
      const score = typeof kp.score === "number" ? kp.score : 0.5;

      if (!accum.has(name)) {
        accum.set(name, { xSum: 0, ySum: 0, scoreSum: 0, scoreCount: 0 });
      }
      const a = accum.get(name);
      a.xSum += kp.x * score;
      a.ySum += kp.y * score;
      a.scoreSum += score;
      a.scoreCount += 1;
    }
  }

  const averaged = [];
  for (const [name, a] of accum.entries()) {
    const scoreDiv = a.scoreSum > 0 ? a.scoreSum : Math.max(1, a.scoreCount);
    averaged.push({
      name,
      x: a.xSum / scoreDiv,
      y: a.ySum / scoreDiv,
      score: a.scoreSum / Math.max(1, a.scoreCount),
    });
  }

  return averaged;
}

export default function PostureCoach() {
  const { darkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const repCounterRef = useRef(null);
  const sessionStartTimeRef = useRef(null);
  const lastGoodScoreRef = useRef(false);
  const analysisRef = useRef(null);
  const repCountRef = useRef(0);
  const lastRepTimeRef = useRef(null);
  const lastSpokenRepRef = useRef(0);
  const lastPostureSpeechTimeRef = useRef(0);
  const currentFrameVisibilityRef = useRef({
    bodyVisible: false,
    fullBodyVisible: false,
  });
  // Temporal smoothing buffer for live analysis
  const landmarkHistoryRef = useRef([]);
  // Motion tracking buffer for each rep (start -> mid -> end)
  const repMotionFramesRef = useRef([]);
  const isCollectingRepFramesRef = useRef(false);
  const user = useSelector(selectUser);
  // Linkage with Workout Plan: MyWorkoutPlan passes state { fromWorkoutPlan: true, exercise: { name, sets, reps, weight }, dayIndex, weekNumber, workoutPlanId }. Keep in sync when changing either page.
  const workoutFromPlan = location.state?.fromWorkoutPlan ? location.state : null;
  const [exercise, setExercise] = useState("pushup");
  const [selectedExerciseLabel, setSelectedExerciseLabel] = useState(() =>
    EXERCISES.find((e) => e.id === "pushup")?.label || "Bench Press"
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [reps, setReps] = useState(0);
  const [calories, setCalories] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [newRepAnimation, setNewRepAnimation] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [visibilityMessage, setVisibilityMessage] = useState("");
  const [angleGuidanceMessage, setAngleGuidanceMessage] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [sessionHistory, setSessionHistory] = useState([]);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [expandedGroups, setExpandedGroups] = useState(() =>
    EXERCISE_GROUPS.reduce((acc, g) => ({ ...acc, [g.bodyPart]: ["Chest", "Back", "Legs"].includes(g.bodyPart) }), {})
  );
  const [showDemo, setShowDemo] = useState(false);

  // When opened from workout plan, pre-select the matching exercise so the correct option is highlighted (e.g. Lat Pulldown, not Bent-over Row)
  useEffect(() => {
    if (workoutFromPlan?.exercise?.name) {
      const mappedId = mapWorkoutExerciseNameToId(workoutFromPlan.exercise.name);
      setExercise(mappedId);
      const bestLabel = getBestMatchingLabel(workoutFromPlan.exercise.name, mappedId, EXERCISES);
      setSelectedExerciseLabel(bestLabel || workoutFromPlan.exercise.name);
    }
  }, [workoutFromPlan?.exercise?.name]);

  // Initialize rep counter and reset when exercise changes
  useEffect(() => {
    if (!repCounterRef.current) {
      repCounterRef.current = new RepCounter(exercise);
    } else {
      repCounterRef.current.setExerciseType(exercise);
    }
    // Reset reps when exercise changes
    setReps(0);
    repCountRef.current = 0;
    setCalories(0);
    analysisRef.current = null;
    landmarkHistoryRef.current = [];
    repMotionFramesRef.current = [];
    isCollectingRepFramesRef.current = false;
    lastRepTimeRef.current = null;
    lastSpokenRepRef.current = 0;
    lastPostureSpeechTimeRef.current = 0;
    currentFrameVisibilityRef.current = { bodyVisible: false, fullBodyVisible: false };
    lastGoodScoreRef.current = false;
  }, [exercise]);

  // Simple, practical camera guidance (helps MoveNet keypoints + backend angle rules).
  useEffect(() => {
    if (!isRunning) {
      setAngleGuidanceMessage("");
      return;
    }

    switch (exercise) {
      case "posture":
      case "bent_over_row":
      case "deadlift":
      case "lunge":
        setAngleGuidanceMessage(
          "For best accuracy, stand side-on to the camera (keep full body in frame)."
        );
        break;
      default:
        setAngleGuidanceMessage("");
        break;
    }
  }, [exercise, isRunning]);

  // Track session duration and update calories
  useEffect(() => {
    let intervalId = null;
    
    if (isRunning) {
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = Date.now();
      }
      intervalId = setInterval(() => {

        const duration = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
        setSessionDuration(duration);
        
        // Only calculate calories if we have reps OR if it's a time-based exercise
        if (exercise === 'plank' || exercise === 'side_plank') {
          // For time-based exercises, use duration
          const caloriesBurned = calculateCaloriesBurned(
            exercise,
            0,
            duration
          );
          setCalories(caloriesBurned);
        } else {
          // For rep-based exercises, only count calories when reps are done
          // Use reps to estimate calories (more accurate than time alone)
          if (reps > 0) {
            const caloriesBurned = calculateCaloriesBurned(
              exercise,
              reps,
              0 // Let it calculate from reps
            );
            setCalories(caloriesBurned);
          } else {
            // No reps yet, don't count calories
            setCalories(0);
          }
        }
      }, 1000); // Update every second
    } else {
      // Reset when stopped
      if (sessionStartTimeRef.current) {
        sessionStartTimeRef.current = null;
      }
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, exercise, reps]);

  // Load pose detector once, ensuring TF backend is ready
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Force a known backend to avoid webgpu init issues
        setIsModelLoading(true);
        await tf.setBackend("webgl");
        await tf.ready();

        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: "SinglePose.Thunder" }
        );

        if (!cancelled) {
          detectorRef.current = detector;
          setIsModelLoading(false);
        }
      } catch (e) {
        console.error("Failed to load pose detector", e);
        setLastError(
          "Failed to load pose detector. Check browser support or try refreshing the page."
        );
        setIsModelLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch last 15 days of posture/virtual training sessions for logged-in user
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?._id) {
        setSessionHistory([]);
        return;
      }
      setHistoryLoading(true);
      setHistoryError("");
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/posture/sessions/${user._id}?days=15`
        );
        if (!res.ok) {
          throw new Error("Failed to load session history");
        }
        const data = await res.json();
        if (data?.success) {
          setSessionHistory(data.sessions || []);
        } else {
          setHistoryError("Failed to load session history");
        }
      } catch (err) {
        console.error("Posture history fetch error:", err);
        setHistoryError(
          err.message || "Failed to load session history"
        );
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [user?._id]);

  // Enumerate available cameras and prefer back camera on phones
  useEffect(() => {
    async function loadCameras() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          return;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setCameras(videoInputs);

        if (!selectedCameraId && videoInputs.length > 0) {
          const backCam =
            videoInputs.find((d) =>
              /back|rear|environment/i.test(d.label || "")
            ) || videoInputs[0];
          setSelectedCameraId(backCam.deviceId);
        }
      } catch (err) {
        console.error("Failed to enumerate cameras", err);
      }
    }

    loadCameras();
  }, [selectedCameraId]);

  const drawSkeleton = useCallback((pose, ctx, width, height, exerciseType, repCounter) => {
    if (!pose || !pose.keypoints) return;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw skeleton connections
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const adjacentPairs = poseDetection.util.getAdjacentPairs(
      poseDetection.SupportedModels.MoveNet
    );
    
    adjacentPairs.forEach(([i, j]) => {
      const kp1 = pose.keypoints[i];
      const kp2 = pose.keypoints[j];
      if (kp1 && kp2 && kp1.score > 0.3 && kp2.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.stroke();
      }
    });

    // Draw keypoints
    ctx.fillStyle = "#22c55e";
    pose.keypoints.forEach((kp) => {
      if (kp && kp.score > 0.3) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // ---- General joint angle annotations (for visual richness on all exercises) ----
    const toNamed = {};
    pose.keypoints.forEach((kp) => {
      const rawName = kp?.name || kp?.part || kp?.id;
      if (!rawName) return;
      toNamed[String(rawName).toLowerCase()] = kp;
    });

    const getKp = (name) => toNamed[name.toLowerCase()];

    const angleAt = (a, b, c) => {
      if (!a || !b || !c) return null;
      const v1 = { x: a.x - b.x, y: a.y - b.y };
      const v2 = { x: c.x - b.x, y: c.y - b.y };
      const dot = v1.x * v2.x + v1.y * v2.y;
      const mag1 = Math.hypot(v1.x, v1.y);
      const mag2 = Math.hypot(v2.x, v2.y);
      if (!mag1 || !mag2) return null;
      const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
      return (Math.acos(cos) * 180) / Math.PI;
    };

    const jointConfigs = [
      { label: "L Knee", a: "left_hip", b: "left_knee", c: "left_ankle" },
      { label: "R Knee", a: "right_hip", b: "right_knee", c: "right_ankle" },
      { label: "L Elbow", a: "left_shoulder", b: "left_elbow", c: "left_wrist" },
      { label: "R Elbow", a: "right_shoulder", b: "right_elbow", c: "right_wrist" },
      { label: "L Hip", a: "left_shoulder", b: "left_hip", c: "left_knee" },
      { label: "R Hip", a: "right_shoulder", b: "right_hip", c: "right_knee" },
      { label: "Neck", a: "left_shoulder", b: "nose", c: "right_shoulder" },
    ];

    ctx.font = "10px system-ui";
    ctx.fillStyle = "#e5e7eb"; // light gray text

    jointConfigs.forEach((joint) => {
      const a = getKp(joint.a);
      const b = getKp(joint.b);
      const c = getKp(joint.c);
      if (!a || !b || !c) return;
      if ((a.score || 0) < 0.3 || (b.score || 0) < 0.3 || (c.score || 0) < 0.3) return;

      const angle = angleAt(a, b, c);
      if (!angle) return;

      // Small subtle marker at the joint plus angle value
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, 2 * Math.PI);
      ctx.strokeStyle = "#a855f7"; // violet accent
      ctx.lineWidth = 1;
      ctx.stroke();

      const text = `${Math.round(angle)}°`;
      const textX = b.x + 6;
      const textY = b.y - 6;

      ctx.fillStyle = "rgba(15, 23, 42, 0.85)"; // dark backdrop
      const padding = 2;
      const metrics = ctx.measureText(text);
      const boxWidth = metrics.width + padding * 2;
      const boxHeight = 10 + padding * 2;

      ctx.fillRect(textX - padding, textY - boxHeight + padding, boxWidth, boxHeight);
      ctx.fillStyle = "#e5e7eb";
      ctx.fillText(text, textX, textY);
    });

    // Draw exercise-specific angle lines and measurements
    if (repCounter && exerciseType !== 'posture' && exerciseType !== 'plank' && exerciseType !== 'side_plank') {
      const keypoints = pose.keypoints.map((kp) => ({
        name: kp.name || kp.part || kp.id,
        x: kp.x,
        y: kp.y,
        score: kp.score,
      }));

      ctx.strokeStyle = "#fbbf24"; // Yellow for angle lines
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      // Draw angle lines based on exercise type
      const getKp = (name) => {
        return keypoints.find(kp => {
          const kpName = (kp.name || kp.part || kp.id || '').toLowerCase();
          return kpName.includes(name.toLowerCase());
        });
      };

      if (exerciseType === 'squat' || exerciseType === 'deadlift' || exerciseType === 'high_knees' || exerciseType === 'jumping_jack' || exerciseType === 'mountain_climber') {
        const leftHip = getKp('left_hip');
        const leftKnee = getKp('left_knee');
        const leftAnkle = getKp('left_ankle');
        const rightHip = getKp('right_hip');
        const rightKnee = getKp('right_knee');
        const rightAnkle = getKp('right_ankle');

        // Draw left leg angle
        if (leftHip && leftKnee && leftAnkle && 
            leftHip.score > 0.3 && leftKnee.score > 0.3 && leftAnkle.score > 0.3) {
          ctx.beginPath();
          ctx.moveTo(leftHip.x, leftHip.y);
          ctx.lineTo(leftKnee.x, leftKnee.y);
          ctx.lineTo(leftAnkle.x, leftAnkle.y);
          ctx.stroke();
        }

        // Draw right leg angle
        if (rightHip && rightKnee && rightAnkle &&
            rightHip.score > 0.3 && rightKnee.score > 0.3 && rightAnkle.score > 0.3) {
          ctx.beginPath();
          ctx.moveTo(rightHip.x, rightHip.y);
          ctx.lineTo(rightKnee.x, rightKnee.y);
          ctx.lineTo(rightAnkle.x, rightAnkle.y);
          ctx.stroke();
        }
      } else if (
        exerciseType === 'pushup' ||
        exerciseType === 'bicep_curl' ||
        exerciseType === 'shoulder_press' ||
        exerciseType === 'lateral_raise' ||
        exerciseType === 'bent_over_row' ||
        exerciseType === 'tricep_extension'
      ) {
        const leftShoulder = getKp('left_shoulder');
        const leftElbow = getKp('left_elbow');
        const leftWrist = getKp('left_wrist');
        const rightShoulder = getKp('right_shoulder');
        const rightElbow = getKp('right_elbow');
        const rightWrist = getKp('right_wrist');

        // Draw left arm angle
        if (leftShoulder && leftElbow && leftWrist &&
            leftShoulder.score > 0.3 && leftElbow.score > 0.3 && leftWrist.score > 0.3) {
          ctx.beginPath();
          ctx.moveTo(leftShoulder.x, leftShoulder.y);
          ctx.lineTo(leftElbow.x, leftElbow.y);
          ctx.lineTo(leftWrist.x, leftWrist.y);
          ctx.stroke();
        }

        // Draw right arm angle
        if (rightShoulder && rightElbow && rightWrist &&
            rightShoulder.score > 0.3 && rightElbow.score > 0.3 && rightWrist.score > 0.3) {
          ctx.beginPath();
          ctx.moveTo(rightShoulder.x, rightShoulder.y);
          ctx.lineTo(rightElbow.x, rightElbow.y);
          ctx.lineTo(rightWrist.x, rightWrist.y);
          ctx.stroke();
        }
      } else if (exerciseType === 'lunge') {
        const leftHip = getKp('left_hip');
        const leftKnee = getKp('left_knee');
        const leftAnkle = getKp('left_ankle');

        if (leftHip && leftKnee && leftAnkle &&
            leftHip.score > 0.3 && leftKnee.score > 0.3 && leftAnkle.score > 0.3) {
          ctx.beginPath();
          ctx.moveTo(leftHip.x, leftHip.y);
          ctx.lineTo(leftKnee.x, leftKnee.y);
          ctx.lineTo(leftAnkle.x, leftAnkle.y);
          ctx.stroke();
        }
      }

      ctx.setLineDash([]); // Reset line dash
    }
  }, []);

  const loopRef = useRef(null);
  const lastSentRef = useRef(0);

  const logSession = useCallback(
    async (snapshot) => {
      try {
        if (!user?._id) {
          return;
        }
        const payload = {
          userId: user._id,
          exerciseType: snapshot.exercise,
          reps: snapshot.reps,
          calories: snapshot.calories,
          durationSeconds: snapshot.sessionDuration,
          date: new Date().toISOString(),
        };

        const res = await fetch(`${API_BASE_URL}/api/posture/session-log`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          console.error("Failed to log posture session");
          return;
        }
        const data = await res.json();
        if (data?.success && data.session) {
          setSessionHistory((prev) => [data.session, ...prev].slice(0, 200));
        }
      } catch (err) {
        console.error("Error logging posture session:", err);
      }
    },
    [user]
  );

  const stopNarration = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
  }, []);

  const speakText = useCallback(
    (text, rate = 1.25) => {
      if (typeof window === "undefined") return;
      if (!window.speechSynthesis) return;
      if (!text || typeof text !== "string") return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.25;
      utterance.pitch = 0.95;
      utterance.volume = 1;

      // Replace any ongoing speech so it stays synced to reps.
      stopNarration();
      window.speechSynthesis.speak(utterance);
    },
    [stopNarration]
  );

  const speakStartNarration = useCallback(() => {
    speakText(
      "Coaching started. Keep slow, controlled reps. I will give feedback after each rep.",
      1.25
    );
  }, [speakText]);

  const speakRepNarration = useCallback(
    (repNumber, opts = {}) => {
      const { analysisOverride = null, fullBodyVisibleOverride, rateOverride } = opts;

      if (repNumber <= lastSpokenRepRef.current) return;
      lastSpokenRepRef.current = repNumber;

      const a = analysisOverride ?? analysisRef.current;
      const fullBodyVisible =
        typeof fullBodyVisibleOverride === "boolean"
          ? fullBodyVisibleOverride
          : currentFrameVisibilityRef.current.fullBodyVisible;

      // Sync speech pace to your rep pace (slower reps => slightly faster voice).
      let rate = rateOverride;
      if (typeof rate !== "number") {
        const now = Date.now();
        const intervalMs = lastRepTimeRef.current
          ? now - lastRepTimeRef.current
          : 3000;
        lastRepTimeRef.current = now;
        rate = Math.max(0.65, Math.min(0.9, (intervalMs / 3000) * 0.75));
      }

      const isCorrect = Boolean(a?.isCorrect);
      const issues = Array.isArray(a?.issues) ? a.issues : [];

      let text;
      if (!a) {
        text = `Rep ${repNumber} for ${selectedExerciseLabel}. Keep going slowly.`;
      } else if (fullBodyVisible) {
        if (isCorrect) {
          text = `Rep ${repNumber} for ${selectedExerciseLabel}. Good rep. Great control.`;
        } else {
          const firstIssue = issues[0];
          text = firstIssue
            ? `Rep ${repNumber} for ${selectedExerciseLabel}. Fix: ${firstIssue}`
            : `Rep ${repNumber} for ${selectedExerciseLabel}. Needs adjustment.`;
        }
      } else {
        // If only the target body part is visible, do not read issue details.
        // Avoid saying "good/bad" from possibly stale analysis; just keep you moving.
        text = `Rep ${repNumber} for ${selectedExerciseLabel}. I cannot validate form until full body is visible.`;
      }

      speakText(text, rate);
    },
    [selectedExerciseLabel, speakText]
  );

  const captureLoop = useCallback(async () => {
    if (!detectorRef.current || !webcamRef.current || !canvasRef.current) return;
    if (!isRunning) return;

    const video = webcamRef.current.video;
    if (!video || video.readyState !== 4) {
      loopRef.current = requestAnimationFrame(captureLoop);
      return;
    }

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    video.width = videoWidth;
    video.height = videoHeight;

    const canvas = canvasRef.current;
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    try {
      const poses = await detectorRef.current.estimatePoses(video);
      const pose = poses[0];
      if (pose) {
        const exerciseThresholds = getFrontendExerciseThresholds(exercise);
        // Check overall body visibility based on keypoint confidence
        const visibleKeypoints = pose.keypoints.filter(
          (kp) => kp && (kp.score || 0) >= exerciseThresholds.keypointScoreVisible
        );
        const visibilityRatio =
          pose.keypoints.length > 0
            ? visibleKeypoints.length / pose.keypoints.length
            : 0;

        const bodyVisible = visibilityRatio >= exerciseThresholds.minVisibilityRatio;

        const fullBodyVisible = isFullBodyVisibleFromPose(pose, exercise, exerciseThresholds);
        currentFrameVisibilityRef.current = { bodyVisible, fullBodyVisible };

        const ctx = canvas.getContext("2d");
        drawSkeleton(pose, ctx, videoWidth, videoHeight, exercise, repCounterRef.current);

        if (!bodyVisible) {
          setVisibilityMessage(
            "Human body not clearly visible. Step back and make sure your full body is in the frame."
          );
        } else {
          setVisibilityMessage("");

          // Update rep counter only when body is visible
          // Build landmarks and apply confidence filtering
          const rawLandmarks = toLandmarksFromPoseKeypoints(pose.keypoints);
          const highConfLandmarks = filterLandmarksByConfidence(
            rawLandmarks,
            exerciseThresholds.keypointConfidenceThreshold
          );
          const repLandmarks = shouldUseFilteredLandmarks(
            rawLandmarks,
            exerciseThresholds.keypointConfidenceThreshold,
            exerciseThresholds.minKeypointsForConfFilter
          )
            ? highConfLandmarks
            : rawLandmarks.filter(
                (kp) => (kp?.score || 0) >= exerciseThresholds.keypointScoreVisible
              );

          // 1) Temporal smoothing: keep last N frames of (filtered) landmarks
          landmarkHistoryRef.current.push(repLandmarks);
          if (landmarkHistoryRef.current.length > exerciseThresholds.smoothLandmarkWindow) {
            landmarkHistoryRef.current.shift();
          }
          const smoothedLandmarks = averageLandmarksFromFrames(landmarkHistoryRef.current);

          // Update rep counter only when body is visible
          if (repCounterRef.current && isRunning) {
            const prevRepState = repCounterRef.current.state;
            const repResult = repCounterRef.current.update(repLandmarks);
            const nextRepState = repCounterRef.current.state;

            // 2) Full-motion tracking: collect frames from rep start (down) -> end (up)
            if (nextRepState === "down" && (prevRepState === "rest" || prevRepState === "up")) {
              repMotionFramesRef.current = [repLandmarks];
              isCollectingRepFramesRef.current = true;
            } else if (isCollectingRepFramesRef.current) {
              repMotionFramesRef.current.push(repLandmarks);
            }

            if (repResult.newRep) {
              const attemptedRep = repCountRef.current + 1;
              const fullBodyVisibleSnapshot = currentFrameVisibilityRef.current.fullBodyVisible;

              // Pace: compute rep pace right at the moment the rep is detected.
              const nowForRate = Date.now();
              const intervalMs = lastRepTimeRef.current
                ? nowForRate - lastRepTimeRef.current
                : 3000;
              lastRepTimeRef.current = nowForRate;
              const rate = Math.max(0.65, Math.min(0.9, (intervalMs / 3000) * 0.75));

              const repFrames = repMotionFramesRef.current || [];
              const repAveragedLandmarks = averageLandmarksFromFrames(repFrames);

              // Stop collecting for next rep
              repMotionFramesRef.current = [];
              isCollectingRepFramesRef.current = false;

              if (fullBodyVisibleSnapshot) {
                // Narration should reflect this rep, using start->mid->end averaged landmarks.
                lastSentRef.current = nowForRate;
                const landmarksForBackend =
                  repAveragedLandmarks?.length ? repAveragedLandmarks : repLandmarks;

                analyzePosture(exercise, landmarksForBackend, user?._id)
                  .then((res) => {
                    if (res?.success && res.analysis) {
                      analysisRef.current = res.analysis;
                      setAnalysis(res.analysis);
                      // Count only correct reps after posture validation.
                      if (res.analysis.isCorrect) {
                        repCountRef.current += 1;
                        setReps(repCountRef.current);
                        setNewRepAnimation(true);
                        setTimeout(() => setNewRepAnimation(false), 500);
                        speakRepNarration(repCountRef.current, {
                          analysisOverride: res.analysis,
                          fullBodyVisibleOverride: true,
                          rateOverride: rate,
                        });
                      } else {
                        const issue =
                          Array.isArray(res.analysis.issues) && res.analysis.issues[0]
                            ? res.analysis.issues[0]
                            : "Form is not correct.";
                        speakText(
                          `Rep ${attemptedRep} for ${selectedExerciseLabel} not counted. ${issue}`,
                          rate
                        );
                      }
                    } else {
                      speakText(
                        `Rep ${attemptedRep} for ${selectedExerciseLabel} not counted. I could not validate posture.`,
                        rate
                      );
                    }
                  })
                  .catch(() => {
                    speakText(
                      `Rep ${attemptedRep} for ${selectedExerciseLabel} not counted. I could not validate posture.`,
                      rate
                    );
                  });
              } else {
                // If full body isn't visible, do not count the rep.
                speakText(
                  `Rep ${attemptedRep} for ${selectedExerciseLabel} not counted. Show full body in frame.`,
                  rate
                );
              }
            }
          }

          const now = Date.now();
          if (now - lastSentRef.current > 500) {
            lastSentRef.current = now;
            const landmarksForBackend =
              smoothedLandmarks?.length ? smoothedLandmarks : repLandmarks;
            analyzePosture(exercise, landmarksForBackend, user?._id)
              .then((res) => {
                if (res?.success && res.analysis) {
                  analysisRef.current = res.analysis;
                  setAnalysis(res.analysis);
                  // Reps are counted only by RepCounter (pose-based) to avoid double count or count jumping down
                  const score = res.analysis.score || 0;
                  const isTimeBased =
                    exercise === "plank" ||
                    exercise === "posture" ||
                    exercise === "side_plank";
                  if (!isTimeBased) {
                    lastGoodScoreRef.current = score > 60;
                  } else {
                    lastGoodScoreRef.current = false;
                  }

                  // Handle narration for ALL workouts if form is incorrect, or if posture is correct
                  if (isRunning && res.analysis) {
                    const nowTime = Date.now();
                    if (nowTime - (lastPostureSpeechTimeRef.current || 0) > 4000) {
                      if (!res.analysis.isCorrect) {
                        lastPostureSpeechTimeRef.current = nowTime;
                        const issue = Array.isArray(res.analysis.issues) && res.analysis.issues.length 
                          ? res.analysis.issues[0] 
                          : "Needs adjustment.";
                        const prefix = exercise === 'posture' ? "Posture is incorrect. " : "";
                        speakText(`${prefix}${issue}`, 1.25);
                      } else if (exercise === 'posture') {
                        lastPostureSpeechTimeRef.current = nowTime;
                        speakText("Posture is correct.", 1.25);
                      }
                    }
                  }
                }
              })
              .catch((err) => {
                console.error("Posture analysis error", err);
              });
          }
        }
      } else {
        // No pose detected at all
        setVisibilityMessage(
          "No human body detected. Step back and ensure your body is clearly visible to the camera."
        );
      }
    } catch (err) {
      console.error("Pose detection error", err);
    }

    loopRef.current = requestAnimationFrame(captureLoop);
  }, [drawSkeleton, exercise, isRunning, selectedExerciseLabel, speakRepNarration, speakText, user?._id]);

  useEffect(() => {
    if (isRunning) {
      loopRef.current = requestAnimationFrame(captureLoop);
    } else if (loopRef.current) {
      cancelAnimationFrame(loopRef.current);
    }
    return () => {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
    };
  }, [isRunning, captureLoop]);
  const toggleGroup = (bodyPart) => {
    setExpandedGroups((prev) => ({ ...prev, [bodyPart]: !prev[bodyPart] }));
  };

  const toggleRunning = async () => {
    if (isRunning) {
      const snapshot = {
        exercise,
        reps,
        calories,
        sessionDuration,
      };
      if (snapshot.reps > 0 || snapshot.sessionDuration > 0) {
        logSession(snapshot);
      }
      // Reset counters when stopping
      if (repCounterRef.current) {
        repCounterRef.current.reset();
      }
      repCountRef.current = 0;
      lastRepTimeRef.current = null;
      lastSpokenRepRef.current = 0;
      analysisRef.current = null;
      currentFrameVisibilityRef.current = { bodyVisible: false, fullBodyVisible: false };
      landmarkHistoryRef.current = [];
      repMotionFramesRef.current = [];
      isCollectingRepFramesRef.current = false;
      stopNarration();
      setReps(0);
      setCalories(0);
      setSessionDuration(0);
      lastGoodScoreRef.current = false;
      setIsRunning(false);
    } else {
      // Optimistically start the session immediately to prevent UI lag
      setIsRunning(true);
      
      // Start speaking right after coaching begins
      speakStartNarration();

      // Check limits for Free tier in the background
      if (!user?.plan || user?.plan === "free") {
        fetch(`${API_BASE_URL}/api/posture/start-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user?._id }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const data = await res.json();
              setLimitMessage(data.error || "You have reached your free tier limit for Virtual Training. Please upgrade to Pro.");
              // Limit exceeded: stop the session retroactively
              setIsRunning(false);
              stopNarration();
              setShowLimitModal(true);
            }
          })
          .catch((err) => {
            console.error("Error starting VTA session:", err);
            setLimitMessage("Error verifying session limits. Please try again.");
            setIsRunning(false);
            stopNarration();
            setShowLimitModal(true);
          });
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      darkMode ? 'bg-[#05010d] text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <NavBar />
      <main className="flex-grow">
        <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10">
          {/* Background blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-16 w-72 h-72 bg-[#8B5CF6] rounded-full blur-3xl opacity-30" />
            <div className="absolute -bottom-28 right-0 w-80 h-80 bg-[#22D3EE] rounded-full blur-3xl opacity-25" />
          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl mb-6 sm:mb-8 lg:mb-10">
            {/* Header */}
            <header className="text-center">
              <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-[#8B5CF6]/20 to-[#22D3EE]/20 border border-[#8B5CF6]/40 backdrop-blur-xl mb-4">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#FACC15]" />
                <span className="text-xs sm:text-sm font-semibold text-gray-100">
                  Real-time Form Analysis
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4">
                Virtual{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]">
                  Training Assistant
                </span>
              </h1>

              <p className="max-w-3xl mx-auto text-sm sm:text-base lg:text-lg text-gray-300">
                Real-time posture analysis and exercise form correction powered by computer vision.
              </p>
            </header>



            {workoutFromPlan && workoutFromPlan.exercise && (
              <div className="mt-4 mx-auto max-w-3xl rounded-xl bg-cyan-500/20 border border-cyan-400/50 backdrop-blur p-4 text-center">
                <p className="text-cyan-100 font-semibold">
                  Training: {workoutFromPlan.exercise.name}
                </p>
                <p className="text-cyan-200/90 text-sm mt-1">
                  {workoutFromPlan.exercise.sets} sets × {workoutFromPlan.exercise.reps} reps — complete all reps here to mark this exercise as done in your plan.
                </p>
              </div>
            )}

          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-4 pb-8 lg:pb-12">
            {/* Full-page grid: Exercises sidebar + Main camera area */}
            <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
              {/* Exercise selector - show FIRST on mobile, left sidebar on desktop */}
              <aside className="xl:col-span-4 order-1 flex flex-col gap-6">
                <div className={`relative rounded-2xl border backdrop-blur-xl shadow-lg overflow-hidden transition-all duration-300 ${darkMode ? 'border-[#1F2937] bg-[#020617]/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)] hover:border-[#22D3EE]/60' : 'border-gray-200 bg-white hover:border-blue-400'}`}>
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                  <div className="p-4 sm:p-5">
                    <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold text-white mb-4">
                      <Activity className="w-5 h-5 text-[#22D3EE]" />
                      Select Exercise
                    </h2>
                    <div className="space-y-2 max-h-[50vh] xl:max-h-[65vh] overflow-y-auto pr-1 custom-scrollbar">
                      {EXERCISE_GROUPS.map((group) => {
                        const isExpanded = expandedGroups[group.bodyPart];
                        return (
                          <div
                            key={group.bodyPart}
                            className={`rounded-xl border overflow-hidden ${darkMode ? 'border-[#1F2937] bg-[#020617]/40' : 'border-gray-200 bg-gray-50'}`}
                          >
                            <button
                              onClick={() => toggleGroup(group.bodyPart)}
                              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${darkMode ? 'hover:bg-[#020617]/60' : 'hover:bg-gray-100'}`}
                            >
                              <span className="text-sm font-semibold text-gray-100">{group.bodyPart}</span>
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="px-3 pb-3 pt-0 flex flex-wrap gap-2 border-t border-[#1F2937]">
                                {group.exercises.map((ex) => (
                                  <button
                                    key={`${group.bodyPart}-${ex.label}`}
                                    onClick={() => {
                                      setExercise(ex.id);
                                      setSelectedExerciseLabel(ex.label);
                                    }}
                                    className={`px-3 py-2 rounded-lg text-xs sm:text-sm border transition-all ${
                                      exercise === ex.id && selectedExerciseLabel === ex.label
                                        ? "bg-gradient-to-r from-purple-500 to-blue-600 border-transparent text-white shadow-lg"
                                        : (darkMode ? "border-[#1F2937] text-gray-200 hover:bg-[#020617]/80 hover:border-[#22D3EE]/40" : "border-gray-200 text-gray-700 hover:bg-gray-100")
                                    }`}
                                  >
                                    {ex.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {cameras.length > 0 && (
                      <div className="mt-4 flex items-center gap-2">
                        <Video className="w-4 h-4 text-gray-400" />
                        <select
                          className={`flex-1 backdrop-blur-sm border rounded-lg px-3 py-2 text-sm ${darkMode ? 'bg-[#020617]/80 border-[#1F2937] text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                          value={selectedCameraId || ""}
                          onChange={(e) => setSelectedCameraId(e.target.value || null)}
                        >
                          {cameras.map((cam, idx) => (
                            <option key={cam.deviceId || idx} value={cam.deviceId}>
                              {cam.label || `Camera ${idx + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                

              </aside>

              {/* Camera + controls + stats + feedback - show AFTER exercises on mobile */}
              <div className="xl:col-span-8 order-2 space-y-6">
                {/* Controls + Camera */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 relative z-50">
                    <p className="text-sm text-gray-300">
                      Selected: <span className="font-semibold text-emerald-400">{selectedExerciseLabel}</span>
                    </p>
                    
                    {/* The popup trigger */}
                    <div className="relative">
                      <button 
                        onClick={() => setShowDemo(!showDemo)}
                        className="flex items-center gap-2 text-sm text-[#22D3EE] font-semibold hover:text-[#22D3EE]/80 transition-colors"
                      >
                        <Video className="w-4 h-4" />
                        Don't know how to workout?
                        {showDemo ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      
                      {/* The dropdown demo box */}
                      {showDemo && (
                        <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 md:w-80 border rounded-2xl shadow-xl p-4 backdrop-blur-2xl z-50 ${darkMode ? 'bg-[#020617]/95 border-[#1F2937] shadow-[0_20px_60px_rgba(15,23,42,0.9)]' : 'bg-white/95 border-gray-200'}`}>
                          <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                          <span className="block text-xs text-gray-400 mb-3 font-medium text-center">Form Demo: {selectedExerciseLabel}</span>
                          <div className={`w-full h-44 rounded-xl overflow-hidden border flex items-center justify-center p-2 ${darkMode ? 'bg-[#020617]/50 border-[#1F2937]/50' : 'bg-gray-50 border-gray-200'}`}>
                            <img 
                              src={EXERCISE_ANIMATIONS[selectedExerciseLabel] || EXERCISE_ANIMATIONS[exercise] || "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjM0NzgwMjM0NzgwMjM0NzgwMjM0NzgwMjM0NzgwMjM0NzgwMjM0NyZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/3o7TqtH1jJ1A2v25sQ/giphy.gif"} 
                              alt={selectedExerciseLabel}
                              className="object-contain w-full h-full max-h-40 rounded-lg mix-blend-lighten"
                              onError={(e) => {
                                e.target.onerror = null; 
                                e.target.src = "https://cdn-icons-png.flaticon.com/512/2964/2964514.png"; 
                                e.target.className = "w-16 h-16 opacity-30 object-contain mx-auto";
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={toggleRunning}
                      disabled={isModelLoading || !!lastError}
                      className={`px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-lg ${
                        isRunning
                          ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
                          : "bg-gradient-to-r from-[#22D3EE] via-[#0EA5E9] to-[#8B5CF6] text-white hover:opacity-95"
                      } ${isModelLoading || lastError ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      {isModelLoading ? "Loading AI model..." : isRunning ? "Stop Coaching" : "Start Coaching"}
                    </button>
                  </div>

                  <div className={`relative rounded-2xl overflow-hidden border backdrop-blur-xl aspect-video flex items-center justify-center transition-all duration-300 ${darkMode ? 'border-[#1F2937] bg-[#020617]/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)] hover:border-[#22D3EE]/60' : 'border-gray-200 bg-black/5 hover:border-blue-400 shadow-md'}`}>
              <Webcam
                ref={webcamRef}
                audio={false}
                mirrored={true}
                onUserMedia={() => {
                  setCameraError("");
                  setLastError(null);
                }}
                onUserMediaError={(err) => {
                  console.error("Camera access error:", err);
                  setCameraError(
                    "Unable to access camera. Please allow camera permission for this site in your browser settings and reload."
                  );
                  setLastError(
                    "Camera access was blocked. Check browser permission for this site and try again."
                  );
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
                videoConstraints={{
                  deviceId: selectedCameraId || undefined,
                  facingMode: selectedCameraId ? undefined : "user",
                  width: { ideal: 640 },
                  height: { ideal: 480 },
                }}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ 
                  objectFit: "contain",
                  transform: "scaleX(-1)"
                }}
              />
              {cameraError && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-[11px] md:text-xs px-3 py-1 rounded-full shadow-lg max-w-full text-center">
                  {cameraError}
                </div>
              )}
              {visibilityMessage && !isModelLoading && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-red-500/80 text-white text-[11px] md:text-xs px-3 py-1 rounded-full shadow-lg">
                  {visibilityMessage}
                </div>
              )}
              {!visibilityMessage && angleGuidanceMessage && isRunning && !isModelLoading && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-cyan-500/80 text-white text-[11px] md:text-xs px-3 py-1 rounded-full shadow-lg max-w-[90%] text-center">
                  {angleGuidanceMessage}
                </div>
              )}
              {isModelLoading && (
                <div className={`absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm text-sm z-10 ${darkMode ? 'bg-[#020617]/80 text-gray-100' : 'bg-white/80 text-gray-900'}`}>
                  <div className="mb-2 h-6 w-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <p>AI model loading, please wait…</p>
                </div>
              )}
              {!isModelLoading && !isRunning && (
                <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm text-sm z-10 ${darkMode ? 'bg-[#020617]/60 text-gray-100' : 'bg-white/60 text-gray-900'}`}>
                  Press <span className="mx-1 font-semibold">Start Coaching</span> to begin.
                </div>
              )}
                  </div>
                  {lastError && (
                    <p className="text-xs text-red-400 mt-1">{lastError}</p>
                  )}
                </div>

                {/* Stats strip - horizontal, sleek, right below camera */}
                {exercise !== 'posture' ? (
                  <div className={`rounded-2xl border backdrop-blur-xl overflow-hidden shadow-lg ${darkMode ? 'border-[#1F2937] bg-[#020617]/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)]' : 'border-gray-200 bg-white'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
                      <div className="flex items-center gap-6 sm:gap-10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                            <span className={`text-lg font-bold text-emerald-400 ${newRepAnimation ? 'scale-110' : ''}`}>{reps}</span>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Reps</div>
                            <div className="text-sm font-semibold text-white">Count</div>
                          </div>
                        </div>
                        <div className="w-px h-10 bg-[#1F2937]" />
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                            <span className="text-lg font-bold text-cyan-400">{calories.toFixed(1)}</span>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Calories</div>
                            <div className="text-sm font-semibold text-white">Burned</div>
                          </div>
                        </div>
                        <div className="w-px h-10 bg-[#1F2937]" />
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-400">{formatTime(sessionDuration)}</span>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Time</div>
                            <div className="text-sm font-semibold text-white">Session</div>
                          </div>
                        </div>
                      </div>
                      {(exercise === 'plank' || exercise === 'side_plank') && (
                        <span className="text-xs text-gray-400 px-3 py-1 rounded-full bg-white/5">Time-based</span>
                      )}
                    </div>
                    {workoutFromPlan && workoutFromPlan.exercise && (() => {
                      const targetTotal = parseTargetTotalReps(workoutFromPlan.exercise.sets, workoutFromPlan.exercise.reps);
                      const isToFailure = targetTotal === null;
                      const canMarkComplete = isToFailure ? reps >= 1 : reps >= targetTotal;
                      return (
                        <div className="border-t border-[#1F2937] px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <p className="text-sm text-cyan-200">
                            {isToFailure
                              ? `Reps done: ${reps}. When finished, mark complete below.`
                              : `Reps: ${reps} / ${targetTotal} — ${canMarkComplete ? "Ready!" : "Keep training."}`}
                          </p>
                          <button
                            onClick={async () => {
                              const snapshot = {
                                exercise,
                                reps,
                                calories,
                                sessionDuration,
                              };
                              await logSession(snapshot);
                              navigate("/my-workout-plan", {
                                state: {
                                  markExerciseComplete: true,
                                  exerciseName: workoutFromPlan.exercise.name,
                                  sets: workoutFromPlan.exercise.sets,
                                  reps: workoutFromPlan.exercise.reps,
                                  weight: workoutFromPlan.exercise.weight,
                                  dayIndex: workoutFromPlan.dayIndex,
                                  weekNumber: workoutFromPlan.weekNumber,
                                  durationMinutes: Math.round(sessionDuration / 60) || 1,
                                  calories: Math.round(calories || 0),
                                },
                              });
                            }}
                            disabled={!canMarkComplete}
                            className={`shrink-0 py-2.5 px-5 rounded-xl font-semibold text-sm transition-all ${
                              canMarkComplete
                                ? "bg-cyan-500 hover:bg-cyan-600 text-gray-900"
                                : "bg-gray-600/60 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            Mark exercise complete
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className={`rounded-2xl border backdrop-blur-xl overflow-hidden shadow-lg p-4 sm:p-5 flex items-center justify-between ${darkMode ? 'border-[#1F2937] bg-[#020617]/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)]' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center gap-4">
                      {analysis ? (
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${analysis.isCorrect ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-amber-500/20 border-amber-500/40 text-amber-500'}`}>
                           <Activity className="w-6 h-6" />
                         </div>
                      ) : (
                         <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-gray-500/20 border-gray-500/40 text-gray-400">
                           <Activity className="w-6 h-6" />
                         </div>
                      )}
                      <div>
                        <div className="text-[11px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          <Zap className="w-3 h-3 text-yellow-400" />
                          Posture Status
                        </div>
                        {analysis ? (
                           <div className={`text-base font-bold ${analysis.isCorrect ? 'text-emerald-400' : 'text-amber-400'}`}>
                             {analysis.isCorrect ? "Correct Posture" : "Incorrect Posture"}
                           </div>
                        ) : (
                           <div className="text-sm font-semibold text-gray-300">Awaiting analysis...</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Feedback + History - clean 2-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xl:gap-8">
                  {/* Live Feedback - primary */}
                  <div className={`relative rounded-2xl border backdrop-blur-xl p-5 shadow-lg transition-all ${darkMode ? 'border-[#1F2937] bg-[#020617]/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)] hover:border-[#22D3EE]/60' : 'border-gray-200 bg-white hover:border-blue-400'}`}>
                    <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                    <h2 className="text-sm font-semibold text-white mb-2">Live Feedback</h2>
                    {analysis ? (
                      <div className="space-y-2 text-xs text-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="uppercase tracking-wide text-[11px] text-gray-400">
                            {analysis.exerciseType}
                          </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] ${
                            analysis.isCorrect
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          }`}
                        >
                          {analysis.isCorrect ? "Good form" : "Needs adjustment"}
                        </span>
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Score: <span className="font-semibold text-gray-100">{Math.round(analysis.score || 0)}/100</span>
                        </div>
                        {analysis.issues?.length ? (
                          <div className="mt-2">
                            <p className="font-semibold text-[11px] text-amber-300 mb-1">Issues detected:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {analysis.issues.map((msg, idx) => (
                                <li key={idx}>{msg}</li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p className="mt-2 text-[11px] text-emerald-300">
                            Looking solid! Keep repeating reps with the same control.
                          </p>
                        )}
                        {analysis.tips?.length && (
                          <div className="mt-3 border-t border-gray-700 pt-2">
                            <p className="font-semibold text-[11px] text-gray-300 mb-1">Coaching tips:</p>
                            <ul className="list-disc list-inside space-y-1 text-[11px]">
                              {analysis.tips.map((tip, idx) => (
                                <li key={idx}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">
                        Start the camera and perform a {selectedExerciseLabel} to see feedback here.
                      </p>
                    )}
                  </div>

                  {/* Right column: History + How to use stacked */}
                  <div className="space-y-4">
                    {/* History Card */}
                    <div className={`relative rounded-2xl border backdrop-blur-xl p-5 shadow-lg transition-all h-fit ${darkMode ? 'border-[#1F2937] bg-[#020617]/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)] hover:border-[#22D3EE]/60' : 'border-gray-200 bg-white hover:border-blue-400'}`}>
                    <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                      <h2 className="text-sm font-semibold text-white mb-3">Session History</h2>
                    {!user && (
                      <p className="text-xs text-gray-400">Sign in to save your coaching sessions and see history here.</p>
                    )}
                    {user && historyLoading && <p className="text-xs text-gray-400">Loading history…</p>}
                    {user && !historyLoading && historyError && <p className="text-xs text-red-400">{historyError}</p>}
              {user &&
                !historyLoading &&
                !historyError &&
                sessionHistory.length === 0 && (
                  <p className="text-xs text-gray-400">
                    No sessions logged yet. Finish a coaching session and tap
                    “Stop Coaching” to save it.
                  </p>
                )}
                    {user &&
                      !historyLoading &&
                      !historyError &&
                      sessionHistory.length > 0 && (
                        <ul className="mt-2 space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                          {sessionHistory.map((s) => {
                            const d = new Date(s.date);
                            return (
                              <li
                                key={s._id}
                                className={`text-[11px] border rounded-lg px-3 py-2 backdrop-blur-sm ${darkMode ? 'text-gray-200 border-[#1F2937] bg-[#020617]/60' : 'text-gray-800 border-gray-200 bg-gray-50'}`}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-semibold capitalize">
                                    {s.exerciseType.replace(/_/g, " ")}
                                  </span>
                                  <span className="text-gray-400">
                                    {d.toLocaleDateString()}{" "}
                                    {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-3 text-[10px] text-gray-300">
                                  <span>Reps: <span className="font-semibold">{s.reps ?? 0}</span></span>
                                  <span>Calories: <span className="font-semibold">{typeof s.calories === "number" ? s.calories.toFixed(1) : "0.0"}</span></span>
                                  <span>Time: <span className="font-semibold">{formatTime(s.durationSeconds || 0)}</span></span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
            </div>

            <div className="relative rounded-2xl border border-[#1F2937] bg-gradient-to-br from-[#8B5CF6]/10 to-[#22D3EE]/10 backdrop-blur-xl p-5 shadow-[0_18px_45px_rgba(15,23,42,0.8)] hover:border-[#22D3EE]/60 transition-all">
              <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE] text-xs font-bold">?</span>
                How to use
              </h2>
              <ol className="space-y-2 text-sm text-gray-300">
                <li className="flex gap-2"><span className="text-[#22D3EE] font-semibold shrink-0">1.</span>Position your phone so your full body is visible.</li>
                <li className="flex gap-2"><span className="text-[#22D3EE] font-semibold shrink-0">2.</span>Pick an exercise, tap “Start Coaching”.</li>
                <li className="flex gap-2"><span className="text-[#22D3EE] font-semibold shrink-0">3.</span>Perform reps and follow the live feedback.</li>
              </ol>
              <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-[#1F2937]">
                Works in modern browsers with camera access.
              </p>
            </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>
      <Footer />
      {/* Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className={`relative p-6 max-w-sm w-full mx-4 rounded-2xl border text-center shadow-2xl overflow-hidden z-50 ${darkMode ? 'border-[#1F2937] bg-[#020617]/90 shadow-[0_20px_60px_rgba(139,92,246,0.2)]' : 'border-gray-200 bg-white'}`}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-500/20 rounded-full blur-2xl" />
            
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-yellow-500/10 rounded-full border border-yellow-500/30">
                <Zap className="w-8 h-8 text-yellow-500 animate-pulse" />
              </div>
            </div>
            
            <h3 className="text-xl font-extrabold text-white mb-2">Limit Reached!</h3>
            <p className="text-xs text-gray-400 mb-6">{limitMessage}</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => navigate('/')} 
                className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-lg hover:scale-105 transition-transform"
              >
                Upgrade to PRO (₹199)
              </button>
              <button 
                onClick={() => setShowLimitModal(false)} 
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


