import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { selectUser } from "../../redux/userSlice";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaSpinner } from "react-icons/fa";

const NotificationsPage = ({ darkMode }) => {
  const user = useSelector(selectUser);
  const [notifications, setNotifications] = useState([]);
  const [sortOrder, setSortOrder] = useState("latest"); // Default is 'latest'
  const [loading, setLoading] = useState(true); // Loading state


  

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("https://mindfitaibackend.vercel.app/api/reports", {
          headers: {
            Authorization: `Bearer ${user.token}`,
            email: user.email,
          },
        });

        let userNotifications;
        if (user.role === "admin") {
          userNotifications = response.data.filter(
            (notification) => notification.claimedBy
          );
        } else {
          userNotifications = response.data.filter(
            (report) =>
              (report.reportType === "lost" &&
                report.user.email === user.email &&
                report.claimedBy) ||
              (report.reportType === "found" && report.claimedBy === user.email)
          );
        }

        // Sort notifications based on the selected sortOrder
        if (sortOrder === "latest") {
          userNotifications.sort(
            (a, b) => new Date(b.claimedAt) - new Date(a.claimedAt)
          );
        } else if (sortOrder === "oldest") {
          userNotifications.sort(
            (a, b) => new Date(a.claimedAt) - new Date(b.claimedAt)
          );
        }

        setNotifications(userNotifications);

        // Mark notifications as read
        const markAsReadPromises = userNotifications.map((notification) => {
          if (!notification.read) {
            return axios.put(
              `https://mindfitaibackend.vercel.app/api/reports/notification/${notification._id}/read`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${user.token}`,
                  email: user.email,
                },
              }
            );
          }
          return null;
        });

        await Promise.all(markAsReadPromises);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false); // Set loading to false after data is fetched
      }
    };

    fetchNotifications();
  }, [user, sortOrder]); // Depend on sortOrder to refetch and resort notifications

  const handleSortChange = (order) => {
    setSortOrder(order);
  };

  return (
    <div
      className={`flex flex-col min-h-screen ${
        darkMode ? "dark bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      <div className="container mx-auto py-6 px-4">
        <h2 className="text-xl lg:text-2xl font-semibold mb-4">
          Notifications
        </h2>
        <ToastContainer />

        {notifications.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => handleSortChange("latest")}
              className={`mr-2 px-4 py-2 rounded ${
                sortOrder === "latest"
                  ? darkMode
                    ? "bg-blue-700 text-white"
                    : "bg-blue-500 text-white"
                  : darkMode
                  ? "bg-gray-800 text-white"
                  : "bg-gray-300 text-black"
              }`}
            >
              Latest
            </button>
            <button
              onClick={() => handleSortChange("oldest")}
              className={`px-4 py-2 rounded ${
                sortOrder === "oldest"
                  ? darkMode
                    ? "bg-blue-700 text-white"
                    : "bg-blue-500 text-white"
                  : darkMode
                  ? "bg-gray-800 text-white"
                  : "bg-gray-300 text-black"
              }`}
            >
              Oldest
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-card ${
                  darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
                } shadow-md rounded-lg p-4 flex items-start`}
              >
                <div className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-lg overflow-hidden">
                  {notification.images && notification.images.length > 0 ? (
                    <img
                      src={notification.images[0]}
                      alt="Report"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300 rounded-lg">
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex-grow ml-4">
                  <h3 className="text-md font-semibold mb-1">
                    Item: {notification.itemName}
                  </h3>
                  <p className="text-sm text-gray-500 mb-1">
                    <span className="font-semibold">Report ID:</span>{" "}
                    {notification.reportID}
                  </p>
                  <p className="text-sm mb-2">
                    Description: {notification.description}
                  </p>
                  {notification.reportType === "lost" ? (
                    <div>
                      <p className="text-sm">
                        Claimed by: <strong>{notification.claimedBy}</strong>
                      </p>
                      {notification.responseMessage && (
                        <div
                          className={`mt-2 p-2 border rounded-lg text-sm ${
                            darkMode
                              ? "bg-green-900 border-green-700 text-green-300"
                              : "bg-green-100 border-green-500 text-green-600"
                          }`}
                        >
                          <h4 className="font-semibold">Response</h4>
                          <p>{notification.responseMessage}</p>
                        </div>
                      )}
                      {notification.otp && (
                        <p className="text-sm mt-1">
                          OTP: <strong>{notification.otp}</strong>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      {notification.responseMessage && (
                        <div
                          className={`mt-2 p-2 border rounded-lg text-sm ${
                            darkMode
                              ? "bg-green-900 border-green-700 text-green-300"
                              : "bg-green-100 border-green-500 text-green-600"
                          }`}
                        >
                          <h4 className="font-semibold">Response</h4>
                          <p>{notification.responseMessage}</p>
                        </div>
                      )}
                      {notification.user && (
                        <div className="mt-1">
                          <h4 className="font-semibold text-sm">Posted By:</h4>
                          <p className="text-sm">
                            Contact: {notification.user.email}
                          </p>
                        </div>
                      )}
                      {notification.locationDetails && (
                        <div className="mt-1">
                          <h4 className="font-semibold text-sm">Location:</h4>
                          <p className="text-sm">
                            {notification.locationDetails}
                          </p>
                        </div>
                      )}
                      {notification.additionalInfo && (
                        <div className="mt-1">
                          <h4 className="font-semibold text-sm">
                            Additional Info:
                          </h4>
                          <p className="text-sm">
                            {notification.additionalInfo}
                          </p>
                        </div>
                      )}
                      {notification.otp && (
                        <p className="text-sm mt-1">
                          OTP: <strong>{notification.otp}</strong>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-lg text-gray-500">No notifications</div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
