// Rep counting and calorie burn calculation utilities

// MET (Metabolic Equivalent of Task) values for different exercises
// MET = calories burned per kg per hour / 1 MET = 1 kcal/kg/hour
const EXERCISE_MET_VALUES = {
  squat: 5.0,
  pushup: 8.0,
  lunge: 4.5,
  plank: 3.0,
  bicep_curl: 3.0,
  posture: 1.0, // Standing posture is minimal
  shoulder_press: 6.0,
  lateral_raise: 4.0,
  deadlift: 6.0,
  bent_over_row: 5.5,
  tricep_extension: 3.5,
  side_plank: 3.5,
  high_knees: 7.0,
  jumping_jack: 8.0,
  mountain_climber: 8.0,
};

// Average person weight in kg (can be customized)
const DEFAULT_WEIGHT_KG = 70;

/**
 * Calculate calories burned for an exercise
 * Formula: Calories = MET × weight (kg) × time (hours)
 * For per-rep: Calories = (MET × weight × time_per_rep_in_hours)
 */
export function calculateCaloriesBurned(exerciseType, reps, durationSeconds = 0, weightKg = DEFAULT_WEIGHT_KG) {
  const met = EXERCISE_MET_VALUES[exerciseType] || 3.0;
  
  // If we have duration, use that (more accurate)
  if (durationSeconds > 0) {
    const hours = durationSeconds / 3600;
    return Math.round(met * weightKg * hours * 10) / 10; // Round to 1 decimal
  }
  
  // Otherwise estimate based on reps (average time per rep)
  const avgSecondsPerRep = {
    squat: 3,
    pushup: 2,
    lunge: 3,
    plank: 30, // plank is time-based, not rep-based
    bicep_curl: 2,
    posture: 1,
    shoulder_press: 3,
    lateral_raise: 3,
    deadlift: 4,
    bent_over_row: 3,
    tricep_extension: 2.5,
    side_plank: 30, // time-based
    high_knees: 1.5,
    jumping_jack: 2,
    mountain_climber: 1.5,
  };
  
  const secondsPerRep = avgSecondsPerRep[exerciseType] || 2;
  const totalSeconds = reps * secondsPerRep;
  const hours = totalSeconds / 3600;
  
  return Math.round(met * weightKg * hours * 10) / 10;
}

/**
 * Rep counter class to track exercise repetitions
 */
export class RepCounter {
  constructor(exerciseType) {
    this.exerciseType = exerciseType;
    this.reps = 0;
    this.state = 'rest'; // 'rest', 'down', 'up'
    this.threshold = this.getThresholds();
    this.lastKeypoints = null;
    this.repStartTime = null;
    this.lastStateChangeTime = 0;
  }

  getThresholds() {
    // Thresholds for detecting rep phases based on exercise type
    // Values are normalized angles (0-1) where lower = more bent/down, higher = more extended/up
    const thresholds = {
      squat: {
        down: 0.5, // More bent knee (deeper squat)
        up: 0.85,  // More extended knee (standing)
      },
      pushup: {
        down: 0.4, // Lower body (elbow more bent)
        up: 0.8,   // Higher body (arms extended)
      },
      lunge: {
        down: 0.5, // Deeper lunge
        up: 0.85,  // Standing position
      },
      bicep_curl: {
        down: 0.3, // Arm extended down
        up: 0.85,  // Arm curled up
      },
      plank: {
        // Plank doesn't have reps, it's time-based
        down: 0.5,
        up: 0.5,
      },
      posture: {
        // Posture doesn't have reps
        down: 0.5,
        up: 0.5,
      },
      shoulder_press: {
        down: 0.4, // Bar lowered
        up: 0.8,   // Bar overhead
      },
      lateral_raise: {
        down: 0.3, // Arms down
        up: 0.8,   // Arms at shoulder height
      },
      deadlift: {
        down: 0.4, // Hips back, torso hinged
        up: 0.8,   // Standing tall
      },
      bent_over_row: {
        down: 0.4, // Arms extended
        up: 0.8,   // Elbows pulled back
      },
      tricep_extension: {
        down: 0.4, // Elbows more flexed
        up: 0.85,  // Elbows extended
      },
      side_plank: {
        // Time-based, no reps
        down: 0.5,
        up: 0.5,
      },
      high_knees: {
        down: 0.4, // Knee lower
        up: 0.8,   // Knee higher toward hip
      },
      jumping_jack: {
        // Tuned for distance-ratio metric so open phase is reachable in practice
        down: 0.32, // Arms and legs closer
        up: 0.62,   // Arms and legs wider
      },
      mountain_climber: {
        down: 0.4, // Knee toward chest
        up: 0.8,   // Leg extended back
      },
    };
    
    return thresholds[this.exerciseType] || { down: 0.5, up: 0.85 };
  }

  /**
   * Calculate angle between three points (point2 is the vertex)
   * Returns normalized angle where lower = more bent (down), higher = more extended (up)
   * For squat: bent knee = smaller angle (~60°) = ~0.33, straight = larger angle (~170°) = ~0.94
   */
  calculateAngle(point1, point2, point3) {
    if (!point1 || !point2 || !point3) return null;
    
    // Calculate vectors from vertex (point2) to the other two points
    const v1 = { x: point1.x - point2.x, y: point1.y - point2.y };
    const v2 = { x: point3.x - point2.x, y: point3.y - point2.y };
    
    // Calculate angle using dot product: cos(θ) = (v1·v2) / (|v1||v2|)
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    if (mag1 === 0 || mag2 === 0) return null;
    
    const cosAngle = dot / (mag1 * mag2);
    // Clamp to [-1, 1] to avoid NaN from floating point errors
    const clampedCos = Math.max(-1, Math.min(1, cosAngle));
    const angleDegrees = Math.acos(clampedCos) * (180.0 / Math.PI);
    
    // Normalize: angle ranges from 0° (collinear, same direction) to 180° (collinear, opposite)
    // For joints: smaller angle = more bent (down), larger angle = more extended (up)
    // Normalize to 0-1 range: 60° = 0.33, 170° = 0.94
    return angleDegrees / 180.0;
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(point1, point2) {
    if (!point1 || !point2) return null;
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get keypoint by name (MoveNet uses specific keypoint names)
   * MoveNet keypoint names: nose, left_eye, right_eye, left_ear, right_ear,
   * left_shoulder, right_shoulder, left_elbow, right_elbow, left_wrist, right_wrist,
   * left_hip, right_hip, left_knee, right_knee, left_ankle, right_ankle
   */
  getKeypoint(keypoints, name) {
    // MoveNet uses these exact keypoint names
    const searchName = name.toLowerCase();
    
    return keypoints.find(kp => {
      const kpName = (kp.name || kp.part || kp.id || '').toLowerCase();
      // Exact match or contains the search term
      return kpName === searchName || 
             kpName.includes(searchName) ||
             searchName.includes(kpName);
    });
  }

  /**
   * Calculate exercise-specific metric to detect rep phases
   */
  calculateExerciseMetric(keypoints) {
    const getKp = (name) => this.getKeypoint(keypoints, name);
    
    // Filter keypoints with good confidence
    const validKeypoints = keypoints.filter(kp => (kp.score || 0) > 0.3);
    if (validKeypoints.length < 3) return null;
    
    switch (this.exerciseType) {
      case 'squat': {
        // Use hip-knee-ankle angle to detect squat depth
        const leftHip = getKp('left_hip');
        const leftKnee = getKp('left_knee');
        const leftAnkle = getKp('left_ankle');
        const rightHip = getKp('right_hip');
        const rightKnee = getKp('right_knee');
        const rightAnkle = getKp('right_ankle');
        
        // Try left side first, fallback to right
        if (leftHip && leftKnee && leftAnkle && 
            leftHip.score > 0.3 && leftKnee.score > 0.3 && leftAnkle.score > 0.3) {
          const angle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
          if (angle !== null) return angle;
        }
        
        if (rightHip && rightKnee && rightAnkle &&
            rightHip.score > 0.3 && rightKnee.score > 0.3 && rightAnkle.score > 0.3) {
          const angle = this.calculateAngle(rightHip, rightKnee, rightAnkle);
          if (angle !== null) return angle;
        }
        
        // Fallback: use hip-knee distance (normalized)
        if (leftHip && leftKnee) {
          const dist = this.calculateDistance(leftHip, leftKnee);
          return dist ? Math.min(dist * 2, 1) : null; // Normalize roughly
        }
        return null;
      }
      
      case 'pushup': {
        // Use shoulder-elbow-wrist angle or shoulder-wrist distance
        const leftShoulder = getKp('left_shoulder');
        const leftElbow = getKp('left_elbow');
        const leftWrist = getKp('left_wrist');
        const rightShoulder = getKp('right_shoulder');
        const rightElbow = getKp('right_elbow');
        const rightWrist = getKp('right_wrist');
        
        // Try left side first
        if (leftShoulder && leftElbow && leftWrist &&
            leftShoulder.score > 0.3 && leftElbow.score > 0.3 && leftWrist.score > 0.3) {
          const angle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
          if (angle !== null) return angle;
        }
        
        if (rightShoulder && rightElbow && rightWrist &&
            rightShoulder.score > 0.3 && rightElbow.score > 0.3 && rightWrist.score > 0.3) {
          const angle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
          if (angle !== null) return angle;
        }
        
        // Fallback: use shoulder-wrist distance
        if (leftShoulder && leftWrist) {
          const dist = this.calculateDistance(leftShoulder, leftWrist);
          return dist ? Math.min(dist * 3, 1) : null;
        }
        return null;
      }
      
      case 'lunge': {
        // Similar to squat but for lunge position
        const leftHip = getKp('left_hip');
        const leftKnee = getKp('left_knee');
        const leftAnkle = getKp('left_ankle');
        
        if (leftHip && leftKnee && leftAnkle &&
            leftHip.score > 0.3 && leftKnee.score > 0.3 && leftAnkle.score > 0.3) {
          return this.calculateAngle(leftHip, leftKnee, leftAnkle);
        }
        return null;
      }
      
      case 'bicep_curl': {
        // Use shoulder-elbow-wrist angle. Smaller angle = bent (active curl)
        const leftShoulder = getKp('left_shoulder');
        const leftElbow = getKp('left_elbow');
        const leftWrist = getKp('left_wrist');
        const rightShoulder = getKp('right_shoulder');
        const rightElbow = getKp('right_elbow');
        const rightWrist = getKp('right_wrist');
        
        let minAngle = null;
        if (leftShoulder && leftElbow && leftWrist && leftShoulder.score > 0.3 && leftElbow.score > 0.3 && leftWrist.score > 0.3) {
          minAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
        }
        if (rightShoulder && rightElbow && rightWrist && rightShoulder.score > 0.3 && rightElbow.score > 0.3 && rightWrist.score > 0.3) {
          const rAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
          if (minAngle === null || rAngle < minAngle) minAngle = rAngle;
        }
        return minAngle;
      }
      
      case 'shoulder_press': {
        // Use shoulder-elbow-wrist angle. Larger angle = arms extended (active press)
        const leftShoulder = getKp('left_shoulder');
        const leftElbow = getKp('left_elbow');
        const leftWrist = getKp('left_wrist');
        const rightShoulder = getKp('right_shoulder');
        const rightElbow = getKp('right_elbow');
        const rightWrist = getKp('right_wrist');

        let maxAngle = null;
        if (leftShoulder && leftElbow && leftWrist && leftShoulder.score > 0.3 && leftElbow.score > 0.3 && leftWrist.score > 0.3) {
          maxAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
        }
        if (rightShoulder && rightElbow && rightWrist && rightShoulder.score > 0.3 && rightElbow.score > 0.3 && rightWrist.score > 0.3) {
          const rAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
          if (maxAngle === null || rAngle > maxAngle) maxAngle = rAngle;
        }
        return maxAngle;
      }

      case 'lateral_raise': {
        // Use torso‑shoulder‑wrist angle. Larger angle = arms raised out (active raise)
        const leftHip = getKp('left_hip');
        const leftShoulder = getKp('left_shoulder');
        const leftWrist = getKp('left_wrist');
        const rightHip = getKp('right_hip');
        const rightShoulder = getKp('right_shoulder');
        const rightWrist = getKp('right_wrist');

        let maxAngle = null;
        if (leftHip && leftShoulder && leftWrist && leftHip.score > 0.3 && leftShoulder.score > 0.3 && leftWrist.score > 0.3) {
          maxAngle = this.calculateAngle(leftHip, leftShoulder, leftWrist);
        }
        if (rightHip && rightShoulder && rightWrist && rightHip.score > 0.3 && rightShoulder.score > 0.3 && rightWrist.score > 0.3) {
          const rAngle = this.calculateAngle(rightHip, rightShoulder, rightWrist);
          if (maxAngle === null || rAngle > maxAngle) maxAngle = rAngle;
        }
        return maxAngle;
      }

      case 'deadlift': {
        // Use shoulder‑hip‑knee angle as hinge metric
        const leftShoulder = getKp('left_shoulder');
        const leftHip = getKp('left_hip');
        const leftKnee = getKp('left_knee');
        const rightShoulder = getKp('right_shoulder');
        const rightHip = getKp('right_hip');
        const rightKnee = getKp('right_knee');

        if (leftShoulder && leftHip && leftKnee &&
            leftShoulder.score > 0.3 && leftHip.score > 0.3 && leftKnee.score > 0.3) {
          return this.calculateAngle(leftShoulder, leftHip, leftKnee);
        }

        if (rightShoulder && rightHip && rightKnee &&
            rightShoulder.score > 0.3 && rightHip.score > 0.3 && rightKnee.score > 0.3) {
          return this.calculateAngle(rightShoulder, rightHip, rightKnee);
        }
        return null;
      }

      case 'bent_over_row': {
        // Use shoulder‑elbow‑wrist. Smaller angle = pulled towards body (active row)
        const leftShoulder = getKp('left_shoulder');
        const leftElbow = getKp('left_elbow');
        const leftWrist = getKp('left_wrist');
        const rightShoulder = getKp('right_shoulder');
        const rightElbow = getKp('right_elbow');
        const rightWrist = getKp('right_wrist');

        let minAngle = null;
        if (leftShoulder && leftElbow && leftWrist && leftShoulder.score > 0.3 && leftElbow.score > 0.3 && leftWrist.score > 0.3) {
          minAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
        }
        if (rightShoulder && rightElbow && rightWrist && rightShoulder.score > 0.3 && rightElbow.score > 0.3 && rightWrist.score > 0.3) {
          const rAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
          if (minAngle === null || rAngle < minAngle) minAngle = rAngle;
        }
        return minAngle;
      }

      case 'tricep_extension': {
        // Shoulder‑elbow‑wrist. Larger angle = extended (active extension)
        const leftShoulder = getKp('left_shoulder');
        const leftElbow = getKp('left_elbow');
        const leftWrist = getKp('left_wrist');
        const rightShoulder = getKp('right_shoulder');
        const rightElbow = getKp('right_elbow');
        const rightWrist = getKp('right_wrist');

        let maxAngle = null;
        if (leftShoulder && leftElbow && leftWrist && leftShoulder.score > 0.3 && leftElbow.score > 0.3 && leftWrist.score > 0.3) {
          maxAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
        }
        if (rightShoulder && rightElbow && rightWrist && rightShoulder.score > 0.3 && rightElbow.score > 0.3 && rightWrist.score > 0.3) {
          const rAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
          if (maxAngle === null || rAngle > maxAngle) maxAngle = rAngle;
        }
        return maxAngle;
      }

      case 'high_knees': {
        // Hip‑knee‑ankle angle: more bent when knee is high
        const leftHip = getKp('left_hip');
        const leftKnee = getKp('left_knee');
        const leftAnkle = getKp('left_ankle');
        const rightHip = getKp('right_hip');
        const rightKnee = getKp('right_knee');
        const rightAnkle = getKp('right_ankle');

        if (leftHip && leftKnee && leftAnkle &&
            leftHip.score > 0.3 && leftKnee.score > 0.3 && leftAnkle.score > 0.3) {
          return this.calculateAngle(leftHip, leftKnee, leftAnkle);
        }

        if (rightHip && rightKnee && rightAnkle &&
            rightHip.score > 0.3 && rightKnee.score > 0.3 && rightAnkle.score > 0.3) {
          return this.calculateAngle(rightHip, rightKnee, rightAnkle);
        }
        return null;
      }

      case 'jumping_jack': {
        // Use distance between ankles as proxy for spread (normalized)
        const leftAnkle = getKp('left_ankle');
        const rightAnkle = getKp('right_ankle');
        const leftHip = getKp('left_hip');
        const rightHip = getKp('right_hip');

        if (leftAnkle && rightAnkle && leftHip && rightHip &&
            leftAnkle.score > 0.3 && rightAnkle.score > 0.3 &&
            leftHip.score > 0.3 && rightHip.score > 0.3) {
          const ankleDist = this.calculateDistance(leftAnkle, rightAnkle);
          const hipDist = this.calculateDistance(leftHip, rightHip) || 1;
          const ratio = ankleDist / hipDist;
          // Map reasonable range [1, 2] to [0.4, 0.9]
          return Math.max(0, Math.min(1, 0.2 + (ratio - 1) * 0.5));
        }
        return null;
      }

      case 'mountain_climber': {
        // Knee drive distance toward chest vs extended plank
        const shoulder = getKp('left_shoulder') || getKp('right_shoulder');
        const hip = getKp('left_hip') || getKp('right_hip');
        const knee = getKp('left_knee') || getKp('right_knee');
        const ankle = getKp('left_ankle') || getKp('right_ankle');

        if (shoulder && hip && knee && ankle &&
            shoulder.score > 0.3 && hip.score > 0.3 &&
            knee.score > 0.3 && ankle.score > 0.3) {
          const kneeToChest = this.calculateDistance(knee, shoulder);
          const hipToAnkle = this.calculateDistance(hip, ankle) || 1;
          const ratio = kneeToChest / hipToAnkle;
          // Higher ratio = knee closer to chest (down phase)
          return Math.max(0, Math.min(1, 0.2 + ratio * 0.4));
        }
        return null;
      }

      default:
        return null;
    }
  }

  /**
   * Update rep count based on current pose
   */
  update(keypoints) {
    // Skip rep counting for exercises that don't have reps
    if (this.exerciseType === 'plank' || this.exerciseType === 'posture' || this.exerciseType === 'side_plank') {
      return { reps: this.reps, newRep: false };
    }

    const metric = this.calculateExerciseMetric(keypoints);
    if (metric === null) {
      this.lastKeypoints = keypoints;
      return { reps: this.reps, newRep: false };
    }

    const { down, up } = this.threshold;
    let newRep = false;

    const now = Date.now();

    // State machine for rep counting with debounce to prevent rapid jumps
    if (this.state === 'rest' || this.state === 'up') {
      if (metric < down) {
        if (now - this.lastStateChangeTime > 300) {
          this.state = 'down';
          this.repStartTime = now;
          this.lastStateChangeTime = now;
        }
      }
    } else if (this.state === 'down') {
      if (metric > up) {
        if (now - this.lastStateChangeTime > 300) {
          this.state = 'up';
          // Rep completed!
          this.reps++;
          newRep = true;
          this.lastStateChangeTime = now;
        }
      }
    }

    this.lastKeypoints = keypoints;
    return { reps: this.reps, newRep };
  }

  /**
   * Reset rep counter
   */
  reset() {
    this.reps = 0;
    this.state = 'rest';
    this.lastKeypoints = null;
    this.repStartTime = null;
    this.lastStateChangeTime = 0;
  }

  /**
   * Change exercise type
   */
  setExerciseType(exerciseType) {
    if (this.exerciseType !== exerciseType) {
      this.reset();
      this.exerciseType = exerciseType;
      this.threshold = this.getThresholds();
    }
  }
}

