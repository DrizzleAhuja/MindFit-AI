import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { FaSearch, FaSpinner, FaClipboardList } from "react-icons/fa";

export default function Section1() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
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
        console.log("Logs fetched successfully:", response.data);

        const filteredLogs = response.data.filter(
          (log) => log.userId === user._id
        );
        setLogs(filteredLogs);
      } catch (error) {
        console.error("Error fetching user logs:", error);
        toast.error("An error occurred while fetching your logs.");
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
    <div className="min-h-screen py-10 px-4 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2 text-white">User Activity Logs</h1>
          <p className="text-xl text-gray-300">Track your recent actions</p>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="p-6 rounded-lg shadow-lg bg-gray-800 border border-gray-700"
              >
                <div className="flex items-center mb-4">
                  <FaClipboardList className="text-2xl mr-2 text-blue-400" />
                  <h3 className="text-2xl font-semibold text-white">{log.action}</h3>
                </div>
                <p className="text-lg text-gray-400 mb-2">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
                <p className="text-lg text-gray-400">{log.userEmail}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <FaClipboardList className="text-6xl mx-auto mb-4 text-gray-600" />
            <p className="text-xl text-gray-400">No logs found.</p>
          </div>
        )}
      </div>
      <ToastContainer theme="dark" />
    </div>
  );
}
