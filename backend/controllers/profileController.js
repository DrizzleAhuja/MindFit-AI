import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { deleteReport, updateReport } from "../../redux/reportSlice";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Lost({ darkMode }) {
    const [search, setSearch] = useState("");
    const [selectCategory, setSelectCategory] = useState("All");
    const [lostItems, setLostItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [editData, setEditData] = useState({});
    const user = useSelector(selectUser);
    const dispatch = useDispatch();

    useEffect(() => {
        async function fetchLostItems() {
            try {
                const response = await axios.get("http://localhost:8000/api/reports");
                const lostItems = response.data.filter(
                    (item) => item.reportType === "lost"
                );
                setLostItems(lostItems);
                setFilteredItems(lostItems);
            } catch (error) {
                console.error("Error fetching lost items:", error);
            }
        }
        fetchLostItems();
    }, [user]);

    useEffect(() => {
        const searchTerm = search.toLowerCase();
        const filtered = lostItems.filter((item) =>
            item.itemName.toLowerCase().includes(searchTerm)
        );
        setFilteredItems(filtered);
    }, [search, lostItems]);

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:8000/api/reports/${id}`, {
                headers: { Email: user.email },
            });
            dispatch(deleteReport(id));
            setLostItems((prevItems) => prevItems.filter((item) => item._id !== id));
            setFilteredItems((prevItems) =>
                prevItems.filter((item) => item._id !== id)
            );
        } catch (error) {
            console.error("Error deleting report:", error);
        }
    };

    const handleEdit = (item) => {
        setIsEditing(true);
        setCurrentItem(item);
        setEditData({
            itemName: item.itemName,
            location: item.location,
            category: item.category,
            date: item.date,
            description: item.description,
            images: [],
        });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const readerPromises = files.map((file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file); // Ensure this reads the file as a base64 string
            });
        });

        Promise.all(readerPromises)
            .then((images) => {
                setEditData((prevData) => ({
                    ...prevData,
                    images,
                }));
            })
            .catch((error) => {
                console.error("Error reading images:", error);
            });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const updatedData = {
                ...editData,
                user: currentItem.user, // Ensure the user object is retained
            };

            const response = await axios.put(
                `http://localhost:8000/api/reports/${currentItem._id}`,
                updatedData,
                {
                    headers: {
                        Email: user.email,
                    },
                }
            );

            dispatch(updateReport(response.data));
            setIsEditing(false);
            setCurrentItem(null);
            setLostItems((prevItems) =>
                prevItems.map((item) =>
                    item._id === response.data._id
                        ? { ...response.data, user: item.user }
                        : item
                )
            );
            setFilteredItems((prevItems) =>
                prevItems.map((item) =>
                    item._id === response.data._id
                        ? { ...response.data, user: item.user }
                        : item
                )
            );
        } catch (error) {
            console.error("Error updating report:", error);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setCurrentItem(null);
        setEditData({});
    };

    const handleClaim = async (item) => {
        if (item.user.email === user.email) {
            toast.error("You can't claim your own item");
            return;
        }
        try {
            const response = await axios.put(
                `http://localhost:8000/api/reports/${item._id}/claim`,
                {},
                {
                    headers: { Email: user.email },
                }
            );
            setLostItems(
                lostItems.map((i) => (i._id === item._id ? response.data : i))
            );
            setFilteredItems(
                filteredItems.map((i) => (i._id === item._id ? response.data : i))
            );
        } catch (error) {
            console.error("Error claiming item:", error);
        }
    };

    return (
        <div className={`flex flex-col items-center py-10 px-4 w-full ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2">Lost Inventory</h1>
                <h6 className="text-lg text-gray-600">List of items that are lost</h6>
                <form onSubmit={(e) => e.preventDefault()} className="mt-4">
                    <div className="flex items-center justify-center space-x-2">
                        <input
                            type="text"
                            placeholder="Search Item"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            id="search"
                            className={`p-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 w-80 ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"}`}
                        />
                        <button
                            type="submit"
                            className="p-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
                        >
                            <FaSearch />
                        </button>
                    </div>
                </form>
            </div>
            <div className="flex space-x-4 mb-8">
                {[
                    { name: "Specs", imgSrc: "./src/Assets/image 20.png" },
                    { name: "Key", imgSrc: "./src/Assets/image 21.png" },
                    { name: "Bag", imgSrc: "./src/Assets/image 29.png" },
                    { name: "Mobile", imgSrc: "./src/Assets/image 31.png" },
                    { name: "Purse", imgSrc: "./src/Assets/image 37.png" },
                ].map((category, index) => (
                    <button key={index} className="flex flex-col items-center">
                        <img
                            src={category.imgSrc}
                            alt={category.name}
                            className="w-16 h-16 mb-2"
                        />
                        <h1 className="text-lg">{category.name}</h1>
                    </button>
                ))}
            </div>
            <div className="w-full flex justify-center mb-8">
                <form onSubmit={(e) => e.preventDefault()}>
                    <select
                        className={`p-2 rounded-md ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"}`}
                        id="sortId"
                        value={selectCategory}
                        onChange={(e) => setSelectCategory(e.target.value)}
                    >
                        <option value="All">ALL</option>
                        <option value="latest">Latest</option>
                        <option value="oldest">Oldest</option>
                        <option value="claimed">Claimed</option>
                        <option value="unclaimed">Unclaimed</option>
                    </select>
                </form>
            </div>
            <div className="w-full flex flex-wrap justify-center space-y-6 px-4">
                {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                        <div
                            key={item._id}
                            className={`flex items-start p-4 rounded-lg shadow-lg w-full max-w-4xl ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}
                        >
                            <div className="flex-none w-40 h-40 mr-8">
                                {item.images && item.images.length > 0 ? (
                                    <img
                                        src={item.images[0]}
                                        alt="Lost item"
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-300 rounded-lg">
                                        <span>No Image</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow">
                                <h2 className="text-2xl font-bold mb-2">{item.itemName}</h2>
                                <p className="text-lg mb-2">Location: {item.location}</p>
                                <p className="text-lg mb-2">Date: {new Date(item.date).toLocaleDateString()}</p>
                                <p className="text-lg mb-2">Category: {item.category}</p>
                                <p className="text-lg mb-2">Description: {item.description}</p>
                                <p className="text-lg mb-2">Status: {item.isClaimed ? "Claimed" : "Unclaimed"}</p>
                                {user && item.user.email === user.email && (
                                    <div className="flex space-x-2 mt-4">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item._id)}
                                            className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                                {user && !item.isClaimed && (
                                    <button
                                        onClick={() => handleClaim(item)}
                                        className="p-2 bg-green-500 text-white rounded-md mt-4 hover:bg-green-600"
                                    >
                                        Claim
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-lg">No items found</p>
                )}
            </div>
            {isEditing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className={`bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
                        <h2 className="text-2xl font-bold mb-4">Edit Report</h2>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="itemName" className="block text-lg mb-2">
                                    Item Name
                                </label>
                                <input
                                    type="text"
                                    id="itemName"
                                    name="itemName"
                                    value={editData.itemName}
                                    onChange={handleEditChange}
                                    className={`w-full p-2 rounded-md ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                                />
                            </div>
                            <div>
                                <label htmlFor="location" className="block text-lg mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={editData.location}
                                    onChange={handleEditChange}
                                    className={`w-full p-2 rounded-md ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                                />
                            </div>
                            <div>
                                <label htmlFor="category" className="block text-lg mb-2">
                                    Category
                                </label>
                                <input
                                    type="text"
                                    id="category"
                                    name="category"
                                    value={editData.category}
                                    onChange={handleEditChange}
                                    className={`w-full p-2 rounded-md ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                                />
                            </div>
                            <div>
                                <label htmlFor="date" className="block text-lg mb-2">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    id="date"
                                    name="date"
                                    value={editData.date}
                                    onChange={handleEditChange}
                                    className={`w-full p-2 rounded-md ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                                />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-lg mb-2">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={editData.description}
                                    onChange={handleEditChange}
                                    className={`w-full p-2 rounded-md ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                                />
                            </div>
                            <div>
                                <label htmlFor="images" className="block text-lg mb-2">
                                    Images
                                </label>
                                <input
                                    type="file"
                                    id="images"
                                    name="images"
                                    multiple
                                    onChange={handleImageChange}
                                    className={`w-full p-2 rounded-md ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                                />
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    type="submit"
                                    className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="p-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ToastContainer />
        </div>
    );
}
