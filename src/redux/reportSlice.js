import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  reports: [],
};

const reportSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    setReports(state, action) {
      state.reports = action.payload;
    },
    addReport(state, action) {
      state.reports.push(action.payload);
    },
    deleteReport(state, action) {
      const reportId = action.payload;
      if (reportId) {
        state.reports = state.reports.filter(
          (report) => report && report._id && report._id !== reportId
        );
      } else {
        console.error("Invalid reportId:", reportId);
      }
    },
    updateReport(state, action) {
      const updatedReport = action.payload;
      if (updatedReport && updatedReport._id) {
        const index = state.reports.findIndex(
          (report) => report && report._id === updatedReport._id
        );
        if (index !== -1) {
          state.reports[index] = updatedReport;
        } else {
          console.error("Report not found for update:", updatedReport._id);
        }
      } else {
        console.error("Invalid updatedReport:", updatedReport);
      }
    },
  },
});

export const { setReports, addReport, deleteReport, updateReport } = reportSlice.actions;
export default reportSlice.reducer;

