import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { FaSearch, FaSpinner, FaClipboardList } from "react-icons/fa";

export default function Section1({ darkMode }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("latest");
  const user = useSelector(selectUser);

  useEffect(() => {
    async function fetchUserLogs() {
      if (!user) {
        console.error("User not authenticated");
        toast.error("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching logs for user:", user._id);
        const response = await axios.get(
          `https://mindfitaibackend.vercel.app/api/logs/user-logs`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              email: user.email,
            },
            params: {
              userId: user._id,
            },
          }
        );

        if (response.data && Array.isArray(response.data)) {
          console.log("Logs fetched successfully:", response.data);
          setLogs(response.data);
        } else {
          console.warn("Unexpected response structure:", response.data);
          setLogs([]);
        }
      } catch (error) {
        console.error("Error fetching user logs:", error);
        toast.error("An error occurred while fetching your logs.");
        setError("An error occurred while fetching your logs.");
      } finally {
        setLoading(false);
      }
    }

    fetchUserLogs();
  }, [user]);

  const sortedLogs = [...logs]
    .filter((log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "latest") {
        return new Date(b.timestamp) - new Date(a.timestamp);
      } else {
        return new Date(a.timestamp) - new Date(b.timestamp);
      }
    });

  return (
    <div
      className={`min-h-screen py-10 px-4 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">All User Activity Logs</h1>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full p-3 pl-10 rounded-lg ${
                darkMode
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-900 border border-gray-300"
              }`}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={`p-3 rounded-lg ${
              darkMode
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-900 border border-gray-300"
            }`}
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
          </div>
        ) : sortedLogs.length > 0 ? (
          <div className="grid gap-6">
            {sortedLogs.map((log) => (
              <div
                key={log._id}
                className={`p-6 rounded-lg shadow-lg ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="flex items-center mb-4">
                  <FaClipboardList className="text-2xl mr-2 text-blue-500" />
                  <h3 className="text-2xl font-semibold">{log.action}</h3>
                </div>
                <p className="text-lg text-gray-500 mb-2">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
                <p className="text-lg text-gray-500">{log.userEmail}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <FaClipboardList className="text-6xl mx-auto mb-4 text-gray-400" />
            <p className="text-xl text-gray-500">No logs found.</p>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
