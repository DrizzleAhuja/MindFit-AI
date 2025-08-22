import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import moment from "moment-timezone";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { FaSpinner, FaClipboardList, FaSearch } from "react-icons/fa";
export default function Section1({ darkMode }) {
  const [reports, setReports] = useState([]);
  const [otpInputs, setOtpInputs] = useState({});
  const [verificationMessages, setVerificationMessages] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("latest");
  const [reportType, setReportType] = useState("lost");
  const user = useSelector(selectUser);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/reports")
      .then((response) => {
        const filteredReports = response.data.filter(
          (report) =>
            report.reportType === reportType &&
            report.verificationStatus === "Under Verification" &&
            report.claimedBy
        );

        const sortedReports = filteredReports.sort((a, b) => {
          const dateA = a.claimedAt ? new Date(a.claimedAt) : new Date(0);
          const dateB = b.claimedAt ? new Date(b.claimedAt) : new Date(0);
          return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
        });

        setReports(sortedReports);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching reports:", error);
        setLoading(false);
      });
  }, [sortOrder, reportType]);

  const handleSortChange = (order) => {
    setSortOrder(order);
  };

  const handleReportTypeChange = (type) => {
    setReportType(type);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleReset = (reportId) => {
    setLoading(true);
    axios
      .put(
        `http://localhost:8000/api/reports/${reportId}/reset`,
        {
          claimedBy: "", // Set claimedBy to an empty string
          claimedAt: null, // Set claimedAt to null to clear the date
        },
        {
          headers: {
            Email: user.email,
          },
          withCredentials: true,
        }
      )
      .then(() => {
        toast.success("Report reset successfully!");
        setReports((prevReports) =>
          prevReports.map((report) =>
            report._id === reportId
              ? { ...report, claimedBy: "", claimedAt: null }
              : report
          )
        );
        setTimeout(() => {
          setLoading(false);
          window.location.reload();
        }, 2000);
      })

      .catch((error) => {
        console.error("Error resetting report:", error);
        toast.error("Failed to reset the report.");
      });
  };

  const handleOtpChange = (reportId, value) => {
    setOtpInputs((prevOtpInputs) => ({
      ...prevOtpInputs,
      [reportId]: value,
    }));
  };

  const handleVerify = async (reportId) => {
    try {
      const otpInput = otpInputs[reportId];
      if (!otpInput) {
        setVerificationMessages((prevMessages) => ({
          ...prevMessages,
          [reportId]: "Please enter OTP.",
        }));
        return;
      }

      setLoading(true);

      await axios.put(`http://localhost:8000/api/reports/${reportId}/verify`, {
        otp: otpInput,
      });
      const istTimestamp = moment()
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DDTHH:mm:ss.SSSZ");
      await axios.post(
        "http://localhost:8000/api/logs/admin-logs",
        {
          adminId: user._id,
          action: `Verified Report ${reportId}`,
          timestamp: istTimestamp,
        },
        {
          headers: {
            Email: user.email,
          },
          withCredentials: true,
        }
      );

      setVerificationMessages((prevMessages) => ({
        ...prevMessages,
        [reportId]: "Verification successful!",
      }));

      toast.success("Verification successful!", {
        position: "top-center",
        autoClose: 2000,
      });

      setTimeout(() => {
        setLoading(false);
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Verification failed:", error);
      setVerificationMessages((prevMessages) => ({
        ...prevMessages,
        [reportId]: "Verification failed. Please try again.",
      }));
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((report) =>
    report.reportID.toLowerCase().includes(searchQuery.toLowerCase())
  );
const handleSendOtp = async (reportId) => {
  try {
    setLoading(true);

    const response = await axios.put(
      `http://localhost:8000/api/reports/${reportId}/send-otp`,
      null,
      {
        headers: {
          Email: user.email, // Ensure user.email is correct
        },
        withCredentials: true,
      }
    );

    if (response.status === 200) {
      toast.success("OTP sent successfully!", {
        position: "top-center",
        autoClose: 2000,
      });

      // Hide the Send OTP button by removing the button for the specific report
      setReports((prevReports) =>
        prevReports.map((report) =>
          report._id === reportId ? { ...report, otpSent: true } : report
        )
      );
    } else {
      toast.error("Failed to send OTP.");
    }

    setLoading(false);
  } catch (error) {
    console.error("Error sending OTP:", error);
    toast.error("Failed to send OTP.");
    setLoading(false);
  }
};


  return (
    <div
      className={`min-h-screen py-10 px-4 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      {loading && (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
        </div>
      )}

      {!loading && (
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Verification Section</h1>
          <form onSubmit={(e) => e.preventDefault()} className="mt-4 mb-6">
            <div className="flex items-center justify-center space-x-2">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by Report ID"
                className="p-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 w-80 bg-gray-700 text-white border-gray-600"
              />
              <button
                type="submit"
                className="p-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
              >
                <FaSearch />
              </button>
            </div>
          </form>

          <div className="flex justify-center items-center mb-4 space-x-8">
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleReportTypeChange("lost")}
                className={`px-4 py-2 rounded-md ${
                  reportType === "lost"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-white"
                }`}
              >
                Lost
              </button>
              <button
                onClick={() => handleReportTypeChange("found")}
                className={`px-4 py-2 rounded-md ${
                  reportType === "found"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-white"
                }`}
              >
                Found
              </button>
            </div>

            <div className="flex items-center">
              <select
                value={sortOrder}
                onChange={(e) => handleSortChange(e.target.value)}
                className="p-3 rounded-lg bg-gray-700 text-white border-gray-600"
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className="w-full flex flex-wrap justify-center space-y-6 px-4">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <div
                key={report._id}
                className={`flex flex-col lg:flex-row items-start p-6 rounded-lg shadow-lg w-full max-w-5xl ${
                  darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
                }`}
                style={{ minHeight: "280px" }}
              >
                <div className="w-full lg:w-2/5 h-64 lg:h-80 mb-4 lg:mb-0 lg:mr-8">
                  {report.images && report.images.length > 0 ? (
                    <img
                      src={report.images[0]}
                      alt="Reported item"
                      className="w-full h-full object-cover rounded-lg shadow-md"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300 rounded-lg">
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex-grow w-full lg:w-3/5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-semibold mb-4">
                      {report.itemName}
                    </h3>
                    <p className="text-gray-500">
                      <span className="font-semibold">Report ID:</span>{" "}
                      {report.reportID}
                    </p>
                    <p className="text-gray-500">
                      <span className="font-semibold">Claimed by:</span>{" "}
                      {report.claimedBy}
                    </p>
                    <p className="text-gray-500">
                      <span className="font-semibold">Date:</span>{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }).format(new Date(report.date))}
                    </p>
                    <p className="text-gray-500">
                      <span className="font-semibold">Description:</span>{" "}
                      {report.description}
                    </p>
                    {report.reportType === "found" && (
                      <p className="text-gray-700">
                        <strong>Proof Description:</strong>{" "}
                        {report.proofDescription || "N/A"}
                      </p>
                    )}
                    <p className="text-gray-500">
                      <span className="font-semibold">Category:</span>{" "}
                      {report.category}
                    </p>
                    <p className="text-gray-500">
                      <span className="font-semibold">Location:</span>{" "}
                      {report.location}
                    </p>
                    <p className="text-gray-500">
                      <span className="font-semibold">Report Type:</span>{" "}
                      {report.reportType}
                    </p>
                    <p className="text-gray-500">
                      <span className="font-semibold">Status:</span>{" "}
                      {report.verificationStatus}
                    </p>
                    <div className="mt-4">
                      {!report.otpSent && report.reportType === "found" && (
                        <button
                          className="bg-blue-600 text-white p-2 rounded-md"
                          onClick={() => handleSendOtp(report._id)}
                        >
                          Send OTP
                        </button>
                      )}

                      <label
                        htmlFor={`otp-${report._id}`}
                        className={`block ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Enter OTP for verification:
                      </label>
                      <input
                        type="text"
                        id={`otp-${report._id}`}
                        className={`border p-2 rounded-md mt-1 w-67 mr-4 ${
                          darkMode
                            ? "border-gray-600 bg-gray-800 text-white"
                            : "border-gray-300 bg-white text-gray-900"
                        }`}
                        value={otpInputs[report._id] || ""}
                        onChange={(e) =>
                          handleOtpChange(report._id, e.target.value)
                        }
                      />
                      <button
                        className="bg-blue-600 text-white p-2 rounded-md mt-2"
                        onClick={() => handleVerify(report._id)}
                      >
                        Verify
                      </button>
                      {verificationMessages[report._id] && (
                        <p className="text-sm mt-2 text-red-600">
                          {verificationMessages[report._id]}
                        </p>
                      )}
                    </div>
                    <button
                      className="bg-red-600 text-white p-2 rounded-md mt-4"
                      onClick={() => handleReset(report._id)}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-600">No reports found.</div>
          )}
        </div>
      )}
      <ToastContainer />
    </div>
  );
}
