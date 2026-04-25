// import React, { useState } from "react";
// import axios from "axios";
// import { useSelector } from "react-redux";
// import { selectUser } from "../../redux/userSlice";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// const ContactUs = ({ darkMode }) => {
//   const user = useSelector(selectUser);

//   const [formData, setFormData] = useState({
//     name: user?.name || "",
//     rollNo: "",
//     email: user?.email || "",
//     item: "",
//     description: "",
//     fakeClaim: false,
//     reportId: "", // New state for report ID
//   });

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleCheckboxChange = () => {
//     setFormData((prevState) => ({
//       ...prevState,
//       fakeClaim: !prevState.fakeClaim,
//       description: !prevState.fakeClaim
//         ? `${prevState.description}\n\n* Fake Claim: Please visit the security office for your issue.`
//         : prevState.description.replace(
//             /\n\n\* Fake Claim: Please visit the security office for your issue\./,
//             ""
//           ),
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       await axios.post("http://localhost:8000/api/contact", formData, {
//         headers: {
//           Email: user.email,
//         },
//       });
//       toast.success("Your issue has been sent. Please visit the security office for reporting the issue.", {
//         position: "top-center",
//         autoClose: 5000,
//       });
//       setFormData({ ...formData, rollNo: "", item: "", description: "", fakeClaim: false, reportId: "" });
//     } catch (error) {
//       toast.error("Failed to send message.", {
//         position: "top-center",
//         autoClose: 2000,
//       });
//     }
//   };

//   return (
//     <div
//       className={`
//         flex flex-col items-center py-10 px-4 w-full ${
//           darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
//         }
//       `}
//     >
//       <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
//       <div className="w-full max-w-md mb-8">
//         <button
//           onClick={() => setFormData((prevState) => ({ ...prevState, fakeClaim: false }))}
//           className={`p-3 bg-indigo-500 text-white rounded-md w-full mb-4 hover:bg-indigo-600 ${
//             !formData.fakeClaim ? "opacity-100" : "opacity-50"
//           }`}
//         >
//           Report Another Issue
//         </button>
//         <button
//           onClick={() => setFormData((prevState) => ({ ...prevState, fakeClaim: true }))}
//           className={`p-3 bg-red-500 text-white rounded-md w-full hover:bg-red-600 ${
//             formData.fakeClaim ? "opacity-100" : "opacity-50"
//           }`}
//         >
//           Fake Claim
//         </button>
//       </div>
//       <form onSubmit={handleSubmit} className="w-full max-w-md">
//         <div className="mb-4">
//           <label className="block mb-2">Name</label>
//           <input
//             type="text"
//             name="name"
//             value={formData.name}
//             onChange={handleChange}
//             className={`p-2 rounded-md w-full ${
//               darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"
//             }`}
//             required
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block mb-2">Roll No</label>
//           <input
//             type="text"
//             name="rollNo"
//             value={formData.rollNo}
//             onChange={handleChange}
//             className={`p-2 rounded-md w-full ${
//               darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"
//             }`}
//             required
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block mb-2">Email</label>
//           <input
//             type="email"
//             name="email"
//             value={formData.email}
//             onChange={handleChange}
//             className={`p-2 rounded-md w-full ${
//               darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"
//             }`}
//             readOnly
//             required
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block mb-2">Item Lost/Found</label>
//           <input
//             type="text"
//             name="item"
//             value={formData.item}
//             onChange={handleChange}
//             className={`p-2 rounded-md w-full ${
//               darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"
//             }`}
//             required
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block mb-2">Description of Problem</label>
//           <textarea
//             name="description"
//             value={formData.description}
//             onChange={handleChange}
//             className={`p-2 rounded-md w-full h-32 ${
//               darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"
//             }`}
//             required
//           ></textarea>
//         </div>
//         <div className="mb-4">
//           <label className="block mb-2">Report ID (Optional)</label>
//           <input
//             type="text"
//             name="reportId"
//             value={formData.reportId}
//             onChange={handleChange}
//             className={`p-2 rounded-md w-full ${
//               darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"
//             }`}
//           />
//         </div>
//         <button
//           type="submit"
//           className="p-3 bg-indigo-500 text-white rounded-md w-full hover:bg-indigo-600"
//         >
//           Send Message
//         </button>
//       </form>
//       <ToastContainer />
//     </div>
//   );
// };

// export default ContactUs;

import React, { useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { validateLength, LIMITS } from "../../utils/formValidation";
import { useTheme } from "../../context/ThemeContext";

const ContactUs = () => {
  const { darkMode } = useTheme();
  const user = useSelector(selectUser);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    rollNo: "",
    email: user?.email || "",
    item: "",
    description: "",
    fakeClaim: false,
    reportId: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = () => {
    setFormData((prevState) => ({
      ...prevState,
      fakeClaim: !prevState.fakeClaim,
      description: !prevState.fakeClaim
        ? `${prevState.description}\n\n* Fake Claim: Please visit the security office for your issue.`
        : prevState.description.replace(
            /\n\n\* Fake Claim: Please visit the security office for your issue\./,
            ""
          ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.email) {
      toast.error("You must be signed in to submit.", { position: "top-center" });
      return;
    }

    const name = formData.name.trim();
    const rollNo = formData.rollNo.trim();
    const item = formData.item.trim();
    const description = formData.description.trim();
    const reportId = formData.reportId.trim();

    const nameErr = validateLength(name, 1, LIMITS.CONTACT_NAME_MAX, "Name");
    if (nameErr) return toast.error(nameErr, { position: "top-center" });
    const rollErr = validateLength(rollNo, 1, LIMITS.CONTACT_ROLL_MAX, "Roll number");
    if (rollErr) return toast.error(rollErr, { position: "top-center" });
    const itemErr = validateLength(item, 1, LIMITS.CONTACT_ITEM_MAX, "Item");
    if (itemErr) return toast.error(itemErr, { position: "top-center" });
    const descErr = validateLength(description, LIMITS.CONTACT_DESC_MIN, LIMITS.CONTACT_DESC_MAX, "Description");
    if (descErr) return toast.error(descErr, { position: "top-center" });
    const ridErr = validateLength(reportId, 0, LIMITS.CONTACT_REPORT_ID_MAX, "Report ID");
    if (ridErr) return toast.error(ridErr, { position: "top-center" });

    const payload = {
      ...formData,
      name,
      rollNo,
      item,
      description,
      reportId,
    };

    try {
      await axios.post(`${API_BASE_URL}/api/contact`, payload, {
        headers: {
          Email: user.email,
        },
      });
      toast.success(
        "Your issue has been sent. Please visit the security office for reporting the issue.",
        {
          position: "top-center",
          autoClose: 5000,
        }
      );
      setFormData({
        ...formData,
        rollNo: "",
        item: "",
        description: "",
        fakeClaim: false,
        reportId: "",
      });
    } catch (error) {
      toast.error("Failed to send message.", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  return (
    <div className={`flex flex-col items-center py-10 px-4 w-full ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Feedback Form Link */}
      <div className="w-full max-w-md mb-6">
        <a
          href="https://forms.gle/Xw1jKPiX4wqfr1My9"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center bg-yellow-500 text-white p-3 rounded-md hover:bg-yellow-600"
        >
          Give Feedback to Improve Our Website
        </a>
      </div>

      <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
      <div className="w-full max-w-md mb-8">
        <button
          onClick={() =>
            setFormData((prevState) => ({ ...prevState, fakeClaim: false }))
          }
          className={`p-3 bg-indigo-500 text-white rounded-md w-full mb-4 hover:bg-indigo-600 ${
            !formData.fakeClaim ? "opacity-100" : "opacity-50"
          }`}
        >
          Report Another Issue
        </button>
        <button
          onClick={() =>
            setFormData((prevState) => ({ ...prevState, fakeClaim: true }))
          }
          className={`p-3 bg-red-500 text-white rounded-md w-full hover:bg-red-600 ${
            formData.fakeClaim ? "opacity-100" : "opacity-50"
          }`}
        >
          Fake Claim
        </button>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        {/* Form Fields */}
        <div className="mb-4">
          <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
          <input
            type="text"
            name="name"
            maxLength={LIMITS.CONTACT_NAME_MAX}
            value={formData.name}
            onChange={handleChange}
            className={`p-2 rounded-md w-full border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            required
          />
        </div>
        <div className="mb-4">
          <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Roll No</label>
          <input
            type="text"
            name="rollNo"
            maxLength={LIMITS.CONTACT_ROLL_MAX}
            value={formData.rollNo}
            onChange={handleChange}
            className={`p-2 rounded-md w-full border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            required
          />
        </div>
        <div className="mb-4">
          <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`p-2 rounded-md w-full border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            readOnly
            required
          />
        </div>
        <div className="mb-4">
          <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Item Lost/Found</label>
          <input
            type="text"
            name="item"
            maxLength={LIMITS.CONTACT_ITEM_MAX}
            value={formData.item}
            onChange={handleChange}
            className={`p-2 rounded-md w-full border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            required
          />
        </div>
        <div className="mb-4">
          <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Description of Problem
          </label>
          <textarea
            name="description"
            maxLength={LIMITS.CONTACT_DESC_MAX}
            value={formData.description}
            onChange={handleChange}
            className="p-2 rounded-md w-full h-32 bg-gray-800 border-gray-600 text-white"
            required
          ></textarea>
        </div>
        <div className="mb-4">
          <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Report ID (Optional)
          </label>
          <input
            type="text"
            name="reportId"
            maxLength={LIMITS.CONTACT_REPORT_ID_MAX}
            value={formData.reportId}
            onChange={handleChange}
            className={`p-2 rounded-md w-full border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          />
        </div>
        <button
          type="submit"
          className="p-3 bg-indigo-600 text-white rounded-md w-full hover:bg-indigo-700"
        >
          Send Message
        </button>
      </form>
      <ToastContainer theme={darkMode ? "dark" : "light"} />
    </div>
  );
};

export default ContactUs;
