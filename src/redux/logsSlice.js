import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  logs: [],
};

const logsSlice = createSlice({
  name: "logs",
  initialState,
  reducers: {
    setLogs(state, action) {
      state.logs = action.payload;
    },
    addLog(state, action) {
      state.logs.push(action.payload);
    },
    deleteLog(state, action) {
      const logId = action.payload;
      if (logId) {
        state.logs = state.logs.filter(
          (log) => log && log._id && log._id !== logId
        );
      } else {
        console.error("Invalid logId:", logId);
      }
    },
    updateLog(state, action) {
      const updatedLog = action.payload;
      if (updatedLog && updatedLog._id) {
        const index = state.logs.findIndex(
          (log) => log && log._id === updatedLog._id
        );
        if (index !== -1) {
          state.logs[index] = updatedLog;
        } else {
          console.error("Log not found for update:", updatedLog._id);
        }
      } else {
        console.error("Invalid updatedLog:", updatedLog);
      }
    },
  },
});

export const { setLogs, addLog, deleteLog, updateLog } = logsSlice.actions;
export default logsSlice.reducer;
