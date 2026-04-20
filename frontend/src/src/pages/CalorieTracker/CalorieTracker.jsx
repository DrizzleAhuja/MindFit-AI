import React, { useState, useEffect, useCallback, useMemo } from "react";
import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";
import { useTheme } from "../../context/ThemeContext";
import { Sparkles, Utensils, Droplet, Plus, Info, Coffee, Sun, Moon, Sunrise, Flame, Camera, X, Zap, Pencil, Trash2, Target, Activity, RefreshCw, Clock, RotateCcw } from "lucide-react";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { validateLength, LIMITS } from "../../utils/formValidation";

const MEAL_TYPES = [
  { id: "Breakfast", label: "Breakfast", icon: <Sunrise className="w-5 h-5 text-amber-400" /> },
  { id: "Lunch", label: "Lunch", icon: <Sun className="w-5 h-5 text-orange-400" /> },
  { id: "Evening Snack", label: "Evening Snack", icon: <Coffee className="w-5 h-5 text-amber-600" /> },
  { id: "Dinner", label: "Dinner", icon: <Moon className="w-5 h-5 text-indigo-400" /> },
];

const MEAL_INSIGHT_IDS = ["Breakfast", "Lunch", "Evening Snack", "Dinner"];

const RECENT_FOODS_KEY = "genfit_recent_foods_v1";
const PENDING_CAL_LOGS_KEY = "genfit_cal_pending_logs_v1";
const MEAL_NUDGE_DISMISS_KEY = "genfit_meal_nudge_dismiss_date";

function readRecentFoods() {
  try {
    const raw = localStorage.getItem(RECENT_FOODS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeRecentFoods(entries) {
  localStorage.setItem(RECENT_FOODS_KEY, JSON.stringify(entries.slice(0, 18)));
}

function pushRecentFoodNames(names, mealType) {
  const prev = readRecentFoods();
  for (const name of names) {
    const n = String(name || "").trim();
    if (!n) continue;
    const i = prev.findIndex((x) => String(x.name).toLowerCase() === n.toLowerCase());
    if (i >= 0) prev.splice(i, 1);
    prev.unshift({ name: n, mealType: mealType || "Breakfast", ts: Date.now() });
  }
  writeRecentFoods(prev);
}

function readPendingLogs() {
  try {
    const raw = localStorage.getItem(PENDING_CAL_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writePendingLogs(arr) {
  localStorage.setItem(PENDING_CAL_LOGS_KEY, JSON.stringify(arr.slice(0, 20)));
}

/** Calendar date YYYY-MM-DD in the user's local timezone (not UTC — avoids "today" bar showing 0 outside UTC). */
function localDateKey(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildWeekCalorieSeries(logs) {
  const series = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = localDateKey(d);
    let sum = 0;
    (logs || []).forEach((log) => {
      if (localDateKey(new Date(log.date)) === key) {
        sum += Number(log.totalCalories) || 0;
      }
    });
    series.push({
      key,
      label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
      kcal: sum,
    });
  }
  return series;
}

/** API may return legacy string per meal or { insight, suggestedFoods }. */
function normalizeInsightsByMeal(raw) {
  const out = {};
  for (const id of MEAL_INSIGHT_IDS) {
    const v = raw?.[id];
    if (v == null) {
      out[id] = { insight: "", suggestedFoods: [] };
      continue;
    }
    if (typeof v === "string") {
      out[id] = { insight: v.trim(), suggestedFoods: [] };
      continue;
    }
    const insight =
      typeof v.insight === "string"
        ? v.insight.trim()
        : typeof v.message === "string"
          ? v.message.trim()
          : "";
    let foods = v.suggestedFoods ?? v.foods ?? v.suggestions;
    if (!Array.isArray(foods)) foods = [];
    foods = foods.map((f) => String(f).trim()).filter(Boolean).slice(0, 8);
    out[id] = { insight, suggestedFoods: foods };
  }
  return out;
}

function inferLocalMacros(kcal) {
  const k = Number(kcal);
  if (!Number.isFinite(k) || k <= 0) return { p: 0, c: 0, f: 0 };
  const f = Math.max(Math.round((k * 0.3) / 9), 0);
  const p = Math.max(Math.round((k * 0.25) / 4), 0);
  const c = Math.max(Math.round((k - p * 4 - f * 9) / 4), 0);
  return { p, c, f };
}

function getItemMacroGrams(item) {
  const p = Number(item.proteinG);
  const c = Number(item.carbsG);
  const f = Number(item.fatG);
  const hasStored =
    Number.isFinite(p) &&
    (p > 0 || (Number.isFinite(c) && c > 0) || (Number.isFinite(f) && f > 0));
  if (hasStored) {
    return {
      p: Number.isFinite(p) ? p : 0,
      c: Number.isFinite(Number(item.carbsG)) ? Number(item.carbsG) : 0,
      f: Number.isFinite(Number(item.fatG)) ? Number(item.fatG) : 0,
    };
  }
  return inferLocalMacros(item.totalCalories);
}

function mapFoodItemToPayload(f, mealType, quantity = 1) {
  const cal = Number(f.estimated_calories) || 0;
  const q = Number(quantity) || 1;
  const lineCal = cal * q;
  const pg = Number(f.protein_g ?? f.proteinG);
  const cg = Number(f.carbs_g ?? f.carbsG);
  const fg = Number(f.fat_g ?? f.fatG);
  const hasAll =
    [pg, cg, fg].every((n) => Number.isFinite(n) && n >= 0) && pg + cg + fg > 0;
  const inf = inferLocalMacros(cal);
  const p0 = hasAll ? Math.round(pg) : inf.p;
  const c0 = hasAll ? Math.round(cg) : inf.c;
  const f0 = hasAll ? Math.round(fg) : inf.f;
  return {
    name: f.name,
    caloriesPerItem: cal,
    quantity: q,
    totalCalories: lineCal,
    mealType,
    proteinG: Math.round(p0 * q),
    carbsG: Math.round(c0 * q),
    fatG: Math.round(f0 * q),
  };
}

export default function CalorieTracker() {
  const { darkMode } = useTheme();
  const user = useSelector(selectUser);
  const navigate = useNavigate();

  // States
  const [history, setHistory] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [loadingMeals, setLoadingMeals] = useState({});
  const [inputs, setInputs] = useState({ Breakfast: "", Lunch: "", "Evening Snack": "", Dinner: "" });
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState("");

  // Image scanner states
  const [activeScanner, setActiveScanner] = useState(null); // stores the meal.id if a scanner is open
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageQuantity, setImageQuantity] = useState(1);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [editEntry, setEditEntry] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingKey, setDeletingKey] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [nutritionTargets, setNutritionTargets] = useState(null);
  const [insightsByMeal, setInsightsByMeal] = useState({});
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [recentFoods, setRecentFoods] = useState([]);
  const [pendingLogCount, setPendingLogCount] = useState(0);
  const [mealNudgeTick, setMealNudgeTick] = useState(0);

  const loadNutritionTargets = async () => {
    if (!user?._id) return;
    setLoadingTargets(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.CALORIE_INTAKE}/targets/${user._id}`
      );
      if (res.data?.success) setNutritionTargets(res.data);
      else setNutritionTargets(null);
    } catch (e) {
      console.error(e);
      setNutritionTargets(null);
    } finally {
      setLoadingTargets(false);
    }
  };

  const loadInsights = async () => {
    if (!user?._id) return;
    setLoadingInsights(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.CALORIE_INTAKE}/insights/${user._id}`
      );
      if (res.data?.success && res.data.insightsByMeal) {
        setInsightsByMeal(normalizeInsightsByMeal(res.data.insightsByMeal));
      } else {
        setInsightsByMeal(normalizeInsightsByMeal({}));
      }
    } catch (e) {
      console.error(e);
      setInsightsByMeal(normalizeInsightsByMeal({}));
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    setRecentFoods(readRecentFoods());
    setPendingLogCount(readPendingLogs().length);
  }, [user?._id]);

  useEffect(() => {
    if (user?._id) {
      loadHistory();
      loadNutritionTargets();
      loadInsights();
    }
  }, [user]);

  const flushPendingLogs = useCallback(async () => {
    if (!user?._id) return;
    const pending = readPendingLogs();
    if (pending.length === 0) return;
    const remaining = [];
    for (const entry of pending) {
      try {
        await axios.post(`${API_BASE_URL}${API_ENDPOINTS.CALORIE_INTAKE}/log`, entry.payload);
      } catch {
        remaining.push(entry);
      }
    }
    writePendingLogs(remaining);
    setPendingLogCount(remaining.length);
    if (remaining.length < pending.length) {
      setNotice({
        type: "success",
        text: `Synced ${pending.length - remaining.length} meal log(s) that were saved offline.`,
      });
      await loadHistory();
      loadInsights();
    }
  }, [user?._id]);

  useEffect(() => {
    const onOnline = () => {
      flushPendingLogs();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flushPendingLogs]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 8000);
    return () => clearTimeout(t);
  }, [notice]);



  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.CALORIE_INTAKE}/history/${user._id}?days=7`);
      if (res.data?.success) {
        const logs = res.data.logs || [];
        setHistory(logs);

        const today = localDateKey(new Date());
        const todayItems = logs.filter((l) => localDateKey(new Date(l.date)) === today);
        setTodayLogs(todayItems);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  const logMealText = async (mealType) => {
    const text = (inputs[mealType] ?? "").trim();
    if (!text) {
      setNotice({ type: "error", text: "Please enter what you ate." });
      return;
    }
    setLoadingMeals((prev) => ({ ...prev, [mealType]: true }));
    try {
      const estimateRes = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.CALORIE_INTAKE}/estimate`, { text, mealType });
      if (!estimateRes.data?.success) throw new Error("Failed to estimate calories");

      const { food_items, total_estimated_calories } = estimateRes.data.data;
      const itemsPayload = (food_items || []).map((f) => mapFoodItemToPayload(f, mealType, 1));
      const sumP = itemsPayload.reduce((s, it) => s + (it.proteinG || 0), 0);
      const sumC = itemsPayload.reduce((s, it) => s + (it.carbsG || 0), 0);
      const sumF = itemsPayload.reduce((s, it) => s + (it.fatG || 0), 0);

      const payload = {
        userId: user._id,
        mealType,
        totalCalories: total_estimated_calories || 0,
        source: "text",
        waterIntake: 0,
        items: itemsPayload,
      };

      try {
        await axios.post(`${API_BASE_URL}${API_ENDPOINTS.CALORIE_INTAKE}/log`, payload);
      } catch (saveErr) {
        const offline = typeof navigator !== "undefined" && !navigator.onLine;
        const networkFail = !saveErr.response && saveErr.message !== undefined;
        if (offline || networkFail) {
          const pending = readPendingLogs();
          pending.push({ payload, savedAt: Date.now() });
          writePendingLogs(pending);
          setPendingLogCount(pending.length);
          setNotice({
            type: "success",
            text: `Saved this meal on your device — we'll sync ${Math.round(total_estimated_calories)} kcal when you're back online. Tap "Sync pending logs" if needed.`,
          });
          setInputs((prev) => ({ ...prev, [mealType]: "" }));
          pushRecentFoodNames(itemsPayload.map((i) => i.name), mealType);
          setRecentFoods(readRecentFoods());
          return;
        }
        throw saveErr;
      }

      pushRecentFoodNames(itemsPayload.map((i) => i.name), mealType);
      setRecentFoods(readRecentFoods());

      let successText = `Logged ${Math.round(total_estimated_calories)} kcal for ${mealType} — about P ${sumP}g · C ${sumC}g · F ${sumF}g.`;
      if ((food_items || []).length === 0 || (total_estimated_calories || 0) < 80) {
        successText +=
          " If that seems off, edit the entry or re-log with a clearer description (portion size helps).";
      }
      setNotice({ type: "success", text: successText });
      setInputs((prev) => ({ ...prev, [mealType]: "" }));
      await loadHistory();
      loadInsights();
    } catch (err) {
      console.error(err);
      const apiMsg = err.response?.data?.error || err.response?.data?.details;
      setNotice({
        type: "error",
        text:
          typeof apiMsg === "string" && apiMsg.trim()
            ? apiMsg
            : "Failed to log meal. Please try again.",
      });
    } finally {
      setLoadingMeals((prev) => ({ ...prev, [mealType]: false }));
    }
  };

  // --- Image Scanner Logic ---
  const handleFileChange = (e) => {
    setImageError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Please upload a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
      setImageBase64(event.target.result);
    };
    reader.onerror = () => {
      setImageError("Failed to read image. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeImage = async (mealType) => {
    if (!imageBase64) return;
    
    setIsAnalyzingImage(true);
    setImageError("");

    try {
      // 1. Send image to scan endpoint
      const scanRes = await axios.post(`${API_BASE_URL}/api/auth/calorie-tracker/scan`, {
        imageBase64,
        userNote: `Meal type: ${mealType}`,
        userId: user._id
      });

      if (!scanRes.data?.success) throw new Error("Failed to scan image");

      const { food_items, total_estimated_calories } = scanRes.data.data;
      const q = Number(imageQuantity) || 1;
      const totalCaloriesForQuantity = total_estimated_calories * q;
      const itemsPayload = (food_items || []).map((f) => mapFoodItemToPayload(f, mealType, q));
      const sumP = itemsPayload.reduce((s, it) => s + (it.proteinG || 0), 0);
      const sumC = itemsPayload.reduce((s, it) => s + (it.carbsG || 0), 0);
      const sumF = itemsPayload.reduce((s, it) => s + (it.fatG || 0), 0);

      // 2. Save log to backend
      const payload = {
        userId: user._id,
        mealType,
        totalCalories: totalCaloriesForQuantity,
        source: "image",
        waterIntake: 0,
        items: itemsPayload,
      };

      try {
        await axios.post(`${API_BASE_URL}${API_ENDPOINTS.CALORIE_INTAKE}/log`, payload);
      } catch (saveErr) {
        const offline = typeof navigator !== "undefined" && !navigator.onLine;
        const networkFail = !saveErr.response && saveErr.message !== undefined;
        if (offline || networkFail) {
          const pending = readPendingLogs();
          pending.push({ payload, savedAt: Date.now() });
          writePendingLogs(pending);
          setPendingLogCount(pending.length);
          pushRecentFoodNames(itemsPayload.map((i) => i.name), mealType);
          setRecentFoods(readRecentFoods());
          closeScanner();
          setNotice({
            type: "success",
            text: `Photo meal saved on this device — will sync ~${Math.round(totalCaloriesForQuantity)} kcal when online.`,
          });
          return;
        }
        throw saveErr;
      }

      pushRecentFoodNames(itemsPayload.map((i) => i.name), mealType);
      setRecentFoods(readRecentFoods());

      let scanMsg = `Scanned and logged ${Math.round(totalCaloriesForQuantity)} kcal for ${mealType} — about P ${sumP}g · C ${sumC}g · F ${sumF}g.`;
      if ((food_items || []).length === 0 || totalCaloriesForQuantity < 70) {
        scanMsg +=
          " If this seems off, retake with better light, increase servings, or describe the meal in text.";
      }
      setNotice({ type: "success", text: scanMsg });

      closeScanner();
      await loadHistory();
      loadInsights();

    } catch (err) {
      console.error("Scan error:", err);
      if (err.response?.status === 403) {
        setLimitMessage(err.response.data?.error || "You have reached your free tier limit for Photo Scans. Please upgrade to Pro.");
        setShowLimitModal(true);
      } else {
        setImageError(err.response?.data?.error || "Failed to analyze image. Please try again.");
      }
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const openScanner = (mealId) => {
    closeScanner(); // reset previous
    setActiveScanner(mealId);
  };

  const closeScanner = () => {
    setActiveScanner(null);
    setImagePreview(null);
    setImageBase64(null);
    setImageQuantity(1);
    setImageError("");
  };

  const openEdit = (entry) => {
    setEditEntry({
      logId: entry.logId,
      itemId: entry.itemId,
      name: entry.name || "",
      quantity: entry.quantity ?? 1,
      caloriesPerItem: entry.caloriesPerItem ?? 0,
      mealType: entry.mealType || "Breakfast",
    });
  };

  const saveEdit = async () => {
    if (!editEntry || !user?._id) return;
    const nameTrim = (editEntry.name ?? "").trim();
    const nameErr = validateLength(nameTrim, 1, LIMITS.CALORIE_ITEM_NAME_MAX, "Food name");
    if (nameErr) {
      setNotice({ type: "error", text: nameErr });
      return;
    }
    const qty = Number(editEntry.quantity);
    if (!Number.isFinite(qty) || qty < LIMITS.CALORIE_QTY_MIN || qty > LIMITS.CALORIE_QTY_MAX) {
      setNotice({
        type: "error",
        text: `Quantity must be between ${LIMITS.CALORIE_QTY_MIN} and ${LIMITS.CALORIE_QTY_MAX}.`,
      });
      return;
    }
    const cpi = Math.max(0, Number(editEntry.caloriesPerItem) || 0);
    const totalCalories = Math.round(qty * cpi);
    setSavingEdit(true);
    try {
      await axios.put(
        `${API_BASE_URL}${API_ENDPOINTS.CALORIE_INTAKE}/log/${editEntry.logId}/item/${editEntry.itemId}`,
        {
          userId: user._id,
          name: nameTrim,
          quantity: qty,
          caloriesPerItem: cpi,
          mealType: editEntry.mealType,
          totalCalories,
        }
      );
      setNotice({ type: "success", text: "Food entry updated." });
      setEditEntry(null);
      loadHistory();
    } catch (err) {
      console.error(err);
      setNotice({
        type: "error",
        text: err.response?.data?.error || "Could not update entry.",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const requestDeleteFoodItem = (logId, itemId) => {
    if (!user?._id || !itemId) return;
    setPendingDelete({ logId, itemId });
  };

  const confirmDeleteFoodItem = async () => {
    if (!pendingDelete || !user?._id) return;
    const { logId, itemId } = pendingDelete;
    setPendingDelete(null);
    const key = `${logId}-${itemId}`;
    setDeletingKey(key);
    try {
      await axios.delete(
        `${API_BASE_URL}${API_ENDPOINTS.CALORIE_INTAKE}/log/${logId}/item/${itemId}`,
        { params: { userId: user._id } }
      );
      setNotice({ type: "success", text: "Food entry removed from your log." });
      loadHistory();
    } catch (err) {
      console.error(err);
      setNotice({
        type: "error",
        text: err.response?.data?.error || "Could not delete entry.",
      });
    } finally {
      setDeletingKey(null);
    }
  };

  // --- Aggregations ---
  const totalCaloriesToday = todayLogs.reduce((acc, log) => acc + (log.totalCalories || 0), 0);
  
  // Group items by meal (attach log + item ids for edit/delete)
  const mealItems = { Breakfast: [], Lunch: [], "Evening Snack": [], Dinner: [] };
  let hasItems = false;
  todayLogs.forEach((log) => {
    const logId = log._id;
    (log.items || []).forEach((item) => {
      const mt = item.mealType || "Other";
      if (!item._id) return;
      if (mealItems[mt]) {
        mealItems[mt].push({
          ...item,
          logId,
          itemId: item._id,
        });
        hasItems = true;
      }
    });
  });

  const getMealTotal = (mealType) => {
    return mealItems[mealType].reduce((sum, item) => sum + (item.totalCalories || 0), 0);
  };

  let totalProteinToday = 0;
  let totalCarbsToday = 0;
  let totalFatToday = 0;
  todayLogs.forEach((log) => {
    (log.items || []).forEach((item) => {
      const m = getItemMacroGrams(item);
      totalProteinToday += m.p;
      totalCarbsToday += m.c;
      totalFatToday += m.f;
    });
  });

  const targetCal = nutritionTargets?.hasBmi ? nutritionTargets.targetCalories : null;
  const maintCal = nutritionTargets?.hasBmi ? nutritionTargets.maintenanceCalories : null;
  const calPct =
    targetCal && targetCal > 0
      ? Math.min(100, Math.round((totalCaloriesToday / targetCal) * 100))
      : null;
  const macroBar = (label, current, goal, colorClass) => {
    const pct = goal && goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-gray-400">
          <span>{label}</span>
          <span>
            {Math.round(current)} / {goal ? `${goal}g` : "—"}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[#1F2937] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  const hasLoggedMealSlot = useMemo(() => {
    const out = { Breakfast: false, Lunch: false, "Evening Snack": false, Dinner: false };
    todayLogs.forEach((log) => {
      (log.items || []).forEach((item) => {
        const mt = item.mealType || "Other";
        if (mt in out && item._id) out[mt] = true;
      });
    });
    return out;
  }, [todayLogs]);

  const mealTimeNudge = useMemo(() => {
    void mealNudgeTick;
    const todayKey = localDateKey(new Date());
    if (typeof window !== "undefined" && localStorage.getItem(MEAL_NUDGE_DISMISS_KEY) === todayKey) {
      return null;
    }
    const h = new Date().getHours();
    if (h >= 6 && h < 11 && !hasLoggedMealSlot.Breakfast) {
      return { slot: "Breakfast", text: "Haven’t logged breakfast yet?" };
    }
    if (h >= 11 && h < 15 && !hasLoggedMealSlot.Lunch) {
      return { slot: "Lunch", text: "Time to log lunch while you remember portions." };
    }
    if (h >= 15 && h < 19 && !hasLoggedMealSlot["Evening Snack"]) {
      return { slot: "Evening Snack", text: "Quick snack log keeps your day accurate." };
    }
    if (h >= 19 && h < 23 && !hasLoggedMealSlot.Dinner) {
      return { slot: "Dinner", text: "Log dinner to close out your nutrition day." };
    }
    return null;
  }, [hasLoggedMealSlot, mealNudgeTick]);

  const weekCalorieSeries = useMemo(() => buildWeekCalorieSeries(history), [history]);
  const weekMaxKcal = useMemo(() => Math.max(...weekCalorieSeries.map((d) => d.kcal), 1), [weekCalorieSeries]);

  const dismissMealNudge = () => {
    localStorage.setItem(MEAL_NUDGE_DISMISS_KEY, localDateKey(new Date()));
    setMealNudgeTick((t) => t + 1);
  };

  const cardClass = `relative rounded-2xl border backdrop-blur-xl transition-all duration-300 ${darkMode ? 'border-[#1F2937] bg-[#020617]/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)] hover:border-[#22D3EE]/60' : 'border-gray-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-blue-400'}`;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? "bg-[#05010d] text-white" : "bg-gray-50 text-gray-900"}`}>
      <NavBar />
      <main className="flex-grow">
        <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10">
          {/* Background glows */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-16 w-72 h-72 bg-[#8B5CF6] rounded-full blur-3xl opacity-30" />
            <div className="absolute -bottom-28 right-0 w-80 h-80 bg-[#22D3EE] rounded-full blur-3xl opacity-25" />
          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <header className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#8B5CF6]/20 to-[#22D3EE]/20 border border-[#8B5CF6]/40 backdrop-blur-xl mb-4">
                <Utensils className="w-5 h-5 text-[#FACC15]" />
                <span className="text-sm font-semibold text-gray-100">Smart Diet Journal</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
                Daily <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE]">Nutrition</span> Log
              </h1>
              <p className="text-gray-400 text-sm max-w-2xl mx-auto">
                {
                  "Type what you ate or snap a picture, and we will estimate your calories instantly. Don't forget to track your hydration!"
                }
              </p>
            </header>


            {pendingLogCount > 0 && (
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-amber-500/35 bg-amber-950/25 px-4 py-3">
                <p className="text-sm text-amber-100/90">
                  <span className="font-semibold">{pendingLogCount} meal log(s)</span> waiting to sync — usually when you were offline.
                </p>
                <button
                  type="button"
                  onClick={() => flushPendingLogs()}
                  className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/30 min-h-[44px]"
                >
                  <RotateCcw className="w-4 h-4" />
                  Sync pending logs
                </button>
              </div>
            )}

            {mealTimeNudge && (
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-[#8B5CF6]/35 bg-[#8B5CF6]/10 px-4 py-3">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#C4B5FD] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-white font-medium">{mealTimeNudge.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Suggested: log <span className="text-[#22D3EE] font-semibold">{mealTimeNudge.slot}</span> below.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={dismissMealNudge}
                  className="text-xs font-semibold text-gray-400 hover:text-white self-end sm:self-center min-h-[44px] px-2"
                >
                  Not now
                </button>
              </div>
            )}

            <div className={`${cardClass} p-4 sm:p-5 mb-6`}>
              <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE]" />
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#22D3EE]" />
                Calories — last 7 days
              </h3>
              <div className="flex items-end justify-between gap-1 sm:gap-2 pl-1">
                {weekCalorieSeries.map((day) => {
                  const barPct = day.kcal > 0 ? Math.max(12, Math.round((day.kcal / weekMaxKcal) * 100)) : 4;
                  return (
                    <div key={day.key} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <span className="text-[9px] text-gray-500 tabular-nums h-3">{Math.round(day.kcal) || "—"}</span>
                      <div className="w-full max-w-[40px] h-24 flex flex-col justify-end mx-auto" title={`${day.label}: ${Math.round(day.kcal)} kcal`}>
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-[#8B5CF6] to-[#22D3EE] transition-all"
                          style={{ height: `${barPct}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-500 truncate w-full text-center">{day.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {notice && (
              <div
                className={`mb-6 rounded-2xl border px-4 py-3 flex items-start justify-between gap-3 shadow-lg ${
                  notice.type === "success"
                    ? "bg-emerald-950/40 border-emerald-500/35 text-emerald-100"
                    : "bg-red-950/40 border-red-500/35 text-red-100"
                }`}
                role="status"
              >
                <p className="text-sm leading-relaxed pr-2">{notice.text}</p>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className="shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4 opacity-80" />
                </button>
              </div>
            )}

            {/* BMI + workout-linked targets & macros */}
            {loadingTargets ? (
              <div className={`${cardClass} p-6 mb-6 text-center text-sm text-gray-400`}>
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE]" />
                Loading your nutrition targets…
              </div>
            ) : nutritionTargets?.hasBmi === false ? (
              <div className={`${cardClass} p-6 mb-6`}>
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-amber-500 to-orange-500" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Target className="w-10 h-10 text-amber-400 shrink-0" />
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">Personalize your targets</h3>
                      <p className="text-sm text-gray-400">{nutritionTargets.message}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/CurrentBMI")}
                    className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:opacity-95"
                  >
                    Open BMI calculator
                  </button>
                </div>
              </div>
            ) : nutritionTargets?.hasBmi ? (
              <div className={`${cardClass} p-6 mb-6`}>
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE]" />
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 text-[#22D3EE]">
                      <Activity className="w-5 h-5" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Plan-aware targets</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      <span className="text-white font-semibold">{nutritionTargets.goalLabel}</span>
                      {nutritionTargets.workoutSummary ? (
                        <span className="text-gray-500"> · {nutritionTargets.workoutSummary}</span>
                      ) : null}
                      {nutritionTargets.planName ? (
                        <span className="text-gray-500"> · {nutritionTargets.planName}</span>
                      ) : null}
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-[#0f172a] border border-[#1F2937] p-3">
                        <p className="text-gray-500 text-xs mb-0.5">Maintenance (TDEE est.)</p>
                        <p className="text-xl font-bold text-gray-200">{maintCal} kcal</p>
                      </div>
                      <div className="rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 p-3">
                        <p className="text-[#C4B5FD] text-xs mb-0.5">Your daily target</p>
                        <p className="text-xl font-bold text-white">{targetCal} kcal</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Based on BMI ({nutritionTargets.bmi}, {nutritionTargets.category}), age, weight, height, and workout
                      frequency/intensity. Not medical advice.
                    </p>
                  </div>
                  <div className="flex-1 space-y-4 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Calories today</span>
                      {calPct !== null ? (
                        <span className="text-xs font-semibold text-[#22D3EE]">{calPct}% of target</span>
                      ) : null}
                    </div>
                    <div className="h-3 rounded-full bg-[#1F2937] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] transition-all duration-500"
                        style={{ width: `${calPct ?? 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      {Math.round(totalCaloriesToday)} / {targetCal} kcal
                      {totalCaloriesToday > targetCal ? (
                        <span className="text-amber-400 ml-1">— over target for today</span>
                      ) : null}
                    </p>
                    <div className="space-y-3 pt-1">
                      {macroBar(
                        "Protein",
                        totalProteinToday,
                        nutritionTargets.proteinG,
                        "bg-gradient-to-r from-rose-500 to-orange-400"
                      )}
                      {macroBar(
                        "Carbs",
                        totalCarbsToday,
                        nutritionTargets.carbsG,
                        "bg-gradient-to-r from-amber-400 to-yellow-300"
                      )}
                      {macroBar(
                        "Fat",
                        totalFatToday,
                        nutritionTargets.fatG,
                        "bg-gradient-to-r from-sky-500 to-cyan-400"
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}


            {/* Meal Logging Grid */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1F2937] pb-2">
                <h2 className="text-xl font-bold">Log your meals</h2>
                <button
                  type="button"
                  onClick={() => loadInsights()}
                  disabled={loadingInsights || !user?._id}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-[#8B5CF6]/40 text-[#C4B5FD] hover:bg-[#8B5CF6]/10 disabled:opacity-40 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingInsights ? "animate-spin" : ""}`} />
                  Refresh meal tips
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {MEAL_TYPES.map((meal) => {
                  const items = mealItems[meal.id];
                  const total = getMealTotal(meal.id);
                  const isLoggingText = loadingMeals[meal.id];
                  const isThisScannerActive = activeScanner === meal.id;
                  const slotInsight = insightsByMeal[meal.id] || { insight: "", suggestedFoods: [] };
                  const mealInsightEmptyTip =
                    "Tips load automatically; use “Refresh meal tips” above if this stays empty.";

                  return (
                    <div key={meal.id} className={`${cardClass} overflow-hidden`}>
                      {/* Header */}
                      <div className="bg-[#1F2937]/30 px-5 py-4 flex items-center justify-between border-b border-[#1F2937]/50">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg border shadow-inner ${darkMode ? 'bg-[#020617] border-[#1F2937]' : 'bg-gray-100 border-gray-200'}`}>
                            {meal.icon}
                          </div>
                          <h3 className="text-lg font-bold text-white tracking-wide">{meal.label}</h3>
                        </div>
                        <div className="text-sm font-semibold text-[#22D3EE] bg-[#22D3EE]/10 px-3 py-1 rounded-full border border-[#22D3EE]/20">
                          {Math.round(total)} kcal
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        {/* Food List */}
                        {items && items.length > 0 && (
                          <div className="mb-4 space-y-2">
                            {items.map((item) => {
                              const rowKey = `${item.logId}-${item.itemId}`;
                              const busy = deletingKey === rowKey;
                              const mg = getItemMacroGrams(item);
                              return (
                                <div
                                  key={rowKey}
                                  className={`flex justify-between items-center gap-2 rounded-md px-3 py-2 border ${darkMode ? 'bg-[#020617]/50 border-[#1F2937]/50' : 'bg-gray-50 border-gray-200'}`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm text-gray-200 font-medium capitalize truncate">
                                      {item.name}
                                    </div>
                                    <div className="text-[10px] text-gray-500">
                                      Qty: {item.quantity || 1}
                                      <span className="text-gray-600 mx-1">·</span>
                                      <span className="text-[#22D3EE]/90">
                                        P {Math.round(mg.p)}g · C {Math.round(mg.c)}g · F {Math.round(mg.f)}g
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="text-sm font-bold text-gray-300 text-right">
                                      {Math.round(item.totalCalories || 0)}{" "}
                                      <span className="text-[10px] text-gray-500 font-normal">kcal</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => openEdit(item)}
                                      disabled={busy}
                                      className="p-1.5 rounded-lg text-[#22D3EE] hover:bg-[#22D3EE]/15 border border-transparent hover:border-[#22D3EE]/30 disabled:opacity-40"
                                      title="Edit"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => requestDeleteFoodItem(item.logId, item.itemId)}
                                      disabled={busy}
                                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 disabled:opacity-40"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {!isThisScannerActive ? (
                          // Text Input Area
                          <div className="mt-2 space-y-2">
                            {recentFoods.filter((r) => r.mealType === meal.id).length > 0 && (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                                  Log again
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {recentFoods
                                    .filter((r) => r.mealType === meal.id)
                                    .slice(0, 8)
                                    .map((r, ri) => (
                                      <button
                                        key={`${r.name}-${r.ts}-${ri}`}
                                        type="button"
                                        onClick={() => setInputs((prev) => ({ ...prev, [meal.id]: r.name }))}
                                        className="text-xs px-3 py-2 rounded-lg border border-[#1F2937] bg-[#020617]/80 text-[#A5B4FC] hover:border-[#8B5CF6]/60 hover:text-white transition-colors min-h-[44px]"
                                      >
                                        {r.name}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}
                          <div className="relative flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openScanner(meal.id)}
                              title="Scan food with camera"
                              aria-label={`Open camera scanner for ${meal.label}`}
                              className="group shrink-0 flex flex-col items-center justify-center gap-0.5 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 min-w-[4.25rem] sm:min-w-[4.75rem] bg-gradient-to-br from-[#8B5CF6]/45 via-[#7C3AED]/35 to-[#22D3EE]/25 text-white border-2 border-[#A855F7]/70 hover:border-[#22D3EE] hover:from-[#8B5CF6]/60 hover:via-[#7C3AED]/45 hover:to-[#22D3EE]/40 shadow-[0_0_22px_rgba(139,92,246,0.45)] hover:shadow-[0_0_28px_rgba(34,211,238,0.5)] transition-all duration-200 ring-2 ring-[#8B5CF6]/20 hover:ring-[#22D3EE]/35"
                            >
                              <Camera
                                className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] group-hover:scale-105 transition-transform"
                                strokeWidth={2.35}
                              />
                              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-white/95 leading-none">
                                Photo
                              </span>
                            </button>
                            <input
                              type="text"
                              value={inputs[meal.id] || ""}
                              onChange={(e) => setInputs(prev => ({ ...prev, [meal.id]: e.target.value }))}
                              placeholder={`E.g., "2 parathas with curd" or "1 chicken sandwich"`}
                              className={`w-full text-sm rounded-xl px-4 py-3 transition-colors shadow-inner focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] ${darkMode ? 'bg-[#020617]/80 text-white placeholder-gray-500 border border-gray-700' : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'}`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') logMealText(meal.id);
                              }}
                            />
                            <button
                              onClick={() => logMealText(meal.id)}
                              disabled={isLoggingText}
                              className={`shrink-0 flex items-center justify-center h-11 px-5 rounded-xl font-bold transition-all ${
                                isLoggingText 
                                  ? "bg-[#8B5CF6]/40 text-gray-400 cursor-wait"
                                  : "bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] text-white hover:opacity-90 shadow-md"
                              }`}
                            >
                              {isLoggingText ? "Analyzing..." : "Log"}
                            </button>
                          </div>
                          </div>
                        ) : (
                          // Image Scanner Area for this Meal
                          <div className="mt-2 p-4 bg-[#020617]/50 rounded-xl border border-[#8B5CF6]/30">
                            <div className="flex items-center justify-between mb-3 border-b border-[#1F2937] pb-2">
                              <h4 className="flex items-center gap-2 text-sm font-semibold text-[#A855F7]">
                                <Sparkles className="w-4 h-4" /> Scan Food for {meal.label}
                              </h4>
                              <button onClick={closeScanner} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="flex-1 space-y-3">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileChange}
                                  className="block w-full text-xs text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:font-semibold file:bg-[#8B5CF6]/20 file:text-[#8B5CF6] hover:file:bg-[#8B5CF6]/30 cursor-pointer"
                                />
                                {imagePreview && (
                                  <div className="rounded-lg overflow-hidden border border-[#1F2937] flex items-center justify-center bg-[#020617] h-32 w-full">
                                    <img src={imagePreview} alt="Preview" className="max-h-32 object-contain" />
                                  </div>
                                )}
                                {imageError && <p className="text-red-400 text-[11px]">{imageError}</p>}
                              </div>
                              
                              <div className="flex-1 flex flex-col justify-end space-y-3">
                                <div>
                                  <label className="text-xs text-gray-400 block mb-1">Servings</label>
                                  <input 
                                    type="number" 
                                    min="1" max="10" 
                                    value={imageQuantity} 
                                    onChange={e => setImageQuantity(Number(e.target.value) || 1)}
                                    className="w-full bg-[#020617]/80 text-sm text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#8B5CF6]"
                                  />
                                </div>
                                <button
                                  onClick={() => handleAnalyzeImage(meal.id)}
                                  disabled={isAnalyzingImage || !imageBase64}
                                  className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
                                    isAnalyzingImage || !imageBase64
                                      ? "bg-[#1F2937] text-gray-500 cursor-not-allowed"
                                      : "bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white hover:opacity-90 shadow-md"
                                  }`}
                                >
                                  {isAnalyzingImage ? "Scanning..." : "Analyze Image"}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-[#1F2937]/50">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#FACC15] shrink-0" />
                            <span className="text-xs font-semibold text-[#C4B5FD]">AI insight</span>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed min-h-[2.5rem]">
                            {loadingInsights
                              ? "Updating tip for this meal…"
                              : slotInsight.insight ||
                                (slotInsight.suggestedFoods?.length ? "" : mealInsightEmptyTip)}
                          </p>
                          {!loadingInsights && slotInsight.suggestedFoods?.length > 0 && (
                            <div className="mt-2.5">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                                Suggested foods
                              </p>
                              <ul className="space-y-1 text-xs text-[#A5B4FC] leading-snug">
                                {slotInsight.suggestedFoods.map((f, i) => (
                                  <li key={i} className="flex gap-2 pl-0.5">
                                    <span className="text-[#22D3EE] shrink-0 select-none">•</span>
                                    <span>{f}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {hasItems && (
              <div className="mt-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                <Info className="w-4 h-4" /> AI estimates are approximations based on typical portion sizes.
              </div>
            )}

          </div>
        </section>
      </main>
      <Footer />
      {/* Limit Modal */}
      {pendingDelete && (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${darkMode ? 'border-[#1F2937] bg-[#020617]' : 'border-gray-200 bg-white'}`}>
            <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Remove this food?</h3>
            <p className="text-sm text-gray-400 mb-6">It will be deleted from your nutrition log for today.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteFoodItem}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-red-600 to-red-500 text-white hover:opacity-95"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {editEntry && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${darkMode ? 'border-[#1F2937] bg-[#020617]' : 'border-gray-200 bg-white'}`}>
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit food entry</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Food name</label>
                <input
                  value={editEntry.name}
                  onChange={(e) => setEditEntry((p) => ({ ...p, name: e.target.value }))}
                  className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-[#0f172a] border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={editEntry.quantity}
                    onChange={(e) =>
                      setEditEntry((p) => ({ ...p, quantity: e.target.value }))
                    }
                    className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-[#0f172a] border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">kcal per unit</label>
                  <input
                    type="number"
                    min="0"
                    value={editEntry.caloriesPerItem}
                    onChange={(e) =>
                      setEditEntry((p) => ({ ...p, caloriesPerItem: e.target.value }))
                    }
                    className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-[#0f172a] border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Meal</label>
                <select
                  value={editEntry.mealType}
                  onChange={(e) =>
                    setEditEntry((p) => ({ ...p, mealType: e.target.value }))
                  }
                  className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-[#0f172a] border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                >
                  {MEAL_TYPES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>
              <p className="text-xs text-gray-500">
                Total:{" "}
                {Math.round(
                  (Number(editEntry.quantity) || 1) *
                    (Number(editEntry.caloriesPerItem) || 0)
                )}{" "}
                kcal
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditEntry(null)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={savingEdit || !editEntry.name?.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] text-black disabled:opacity-50"
              >
                {savingEdit ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLimitModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className={`relative p-6 max-w-sm w-full mx-4 rounded-2xl border text-center overflow-hidden ${darkMode ? 'border-[#1F2937] bg-[#020617]/90 shadow-[0_20px_60px_rgba(139,92,246,0.2)]' : 'border-gray-200 bg-white shadow-xl'}`}>
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
