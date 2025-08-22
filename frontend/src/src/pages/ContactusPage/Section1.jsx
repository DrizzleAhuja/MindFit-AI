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

const ContactUs = ({ darkMode }) => {
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
    try {
      await axios.post("https://mindfitaibackend.vercel.app/api/contact", formData, {
        headers: {
          Email: user.email,
        },
      });
      toast.success("Your issue has been sent. Please visit the security office for reporting the issue.", {
        position: "top-center",
        autoClose: 5000,
      });
      setFormData({ ...formData, rollNo: "", item: "", description: "", fakeClaim: false, reportId: "" });
    } catch (error) {
      toast.error("Failed to send message.", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  return (
    <div
      className={`
        flex flex-col items-center py-10 px-4 w-full ${
          darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
        }
      `}
    >
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
          onClick={() => setFormData((prevState) => ({ ...prevState, fakeClaim: false }))}
          className={`p-3 bg-indigo-500 text-white rounded-md w-full mb-4 hover:bg-indigo-600 ${
            !formData.fakeClaim ? "opacity-100" : "opacity-50"
          }`}
        >
          Report Another Issue
        </button>
        <button
          onClick={() => setFormData((prevState) => ({ ...prevState, fakeClaim: true }))}
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
          <label className="block mb-2">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`p-2 rounded-md w-full ${
              darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"
            }`}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Roll No</label>
          <input
            type="text"
            name="rollNo"
            value={formData.rollNo}
            onChange={handleChange}
            className={`p-2 rounded-md w-full ${
              darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"
            }`}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`p-2 rounded-md w-full ${
              darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"
            }`}
            readOnly
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Item Lost/Found</label>
          <input
            type="text"
            name="item"
            value={formData.item}
            onChange={handleChange}
            className={`p-2 rounded-md w-full ${
              darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"
            }`}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Description of Problem</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`p-2 rounded-md w-full h-32 ${
              darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"
            }`}
            required
          ></textarea>
        </div>
        <div className="mb-4">
          <label className="block mb-2">Report ID (Optional)</label>
          <input
            type="text"
            name="reportId"
            value={formData.reportId}
            onChange={handleChange}
            className={`p-2 rounded-md w-full ${
              darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"
            }`}
          />
        </div>
        <button
          type="submit"
          className="p-3 bg-indigo-500 text-white rounded-md w-full hover:bg-indigo-600"
        >
          Send Message
        </button>
      </form>
      <ToastContainer />
    </div>
  );
};

export default ContactUs;
