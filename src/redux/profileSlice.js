import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    user: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null,
    loading: false,
};

const profileSlice = createSlice({
    name: "profile",
    initialState: initialState,
    reducers: {
        setUser(state, value) {
            state.user = value.payload;
        },
    },
});

export const { setUser } = profileSlice.actions;
export default profileSlice.reducer;




// import { createSlice } from "@reduxjs/toolkit";

// const initialState = {
//   reports: [],
// };

// const reportSlice = createSlice({
//   name: "reports",
//   initialState,
//   reducers: {
//     setReports(state, action) {
//       state.reports = action.payload;
//     },
//     addReport(state, action) {
//       state.reports.push(action.payload);
//     },
//     deleteReport(state, action) {
//       state.reports = state.reports.filter(
//         (report) => report._id !== action.payload
//       );
//     },
//     updateReport(state, action) {
//       const index = state.reports.findIndex(
//         (report) => report._id === action.payload._id
//       );
//       if (index !== -1) {
//         state.reports[index] = action.payload;
//       }
//     },
//   },
// });




// export const { setReports, addReport, deleteReport, updateReport } =
//   reportSlice.actions;

// export default reportSlice.reducer;
