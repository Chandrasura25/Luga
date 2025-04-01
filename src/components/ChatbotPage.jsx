import { useState, useEffect } from "react";
import {
  User,
  Activity,
  MessageSquare,
  FileText,
  Music,
  Video,
  CreditCard,
  Sliders,
  Plus,
  Copy,
  CheckCircle, // Import the check circle icon for the copied state
} from "lucide-react";
import TextAudio from "./TextAudio";
import AudioVideo from "./AudioVideo";
import ActivityPage from "./Activity";
import Profile from "./Profile";
import axios from "../api/axios";
import { useAuth } from "./auth";
import { toast } from "react-toastify";
import logo from "../assets/logo.jpeg";

const ChatbotInterface = () => {
  const [message, setMessage] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("OpenAI");
  const [isLevelOpen, setIsLevelOpen] = useState(false);
  const [activeView, setActiveView] = useState("chat");
  const [isLoading, setIsLoading] = useState(false);
  const { getUserEmail } = useAuth();
  const levels = ["OpenAI", "Deepseek", "Grok"];
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [copyIcon, setCopyIcon] = useState(Copy); // State to manage the copy icon

  const groupConversationsByDate = (conversations) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    const groups = {
      today: [],
      yesterday: [],
      previous7Days: [],
      previous30Days: [],
      older: [],
    };

    conversations.forEach((conv) => {
      const convDate = new Date(conv.created_at);
      convDate.setHours(0, 0, 0, 0);

      if (convDate.getTime() === today.getTime()) {
        groups.today.push(conv);
      } else if (convDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(conv);
      } else if (convDate >= last7Days && convDate < yesterday) {
        groups.previous7Days.push(conv);
      } else if (convDate >= last30Days && convDate < last7Days) {
        groups.previous30Days.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  };
  // Fetch user's conversations
  const getConversations = async () => {
    try {
      const userEmail = getUserEmail();
      const response = await axios.get(
        `/text/conversations?user_email=${userEmail}`
      );
      setConversations(response.data);
    } catch (error) {
      console.error("Error getting conversations:", error);
      toast.error("Failed to load conversations");
    }
  };

  // Fetch conversation messages
  const getConversation = async (conversationId) => {
    try {
      const userEmail = getUserEmail();
      const response = await axios.get(
        `/text/conversation/${conversationId}?user_email=${userEmail}`
      );
      setMessages(response.data.messages);
      setActiveConversation(response.data);
    } catch (error) {
      console.error("Error getting conversation:", error);
      toast.error("Failed to load conversation");
    }
  };

  useEffect(() => {
    getConversations();
  }, []);

  const handleLevelSelect = (level) => {
    setSelectedLevel(level);
    setIsLevelOpen(false);
  };
  const sidebarItems = [
    {
      icon: FileText,
      label: "Text Generation",
      active: activeView === "chat",
      onClick: () => setActiveView("chat"),
    },
    {
      icon: Music,
      label: "Text To Audio",
      active: activeView === "audio",
      onClick: () => setActiveView("audio"),
    },
    {
      icon: Video,
      label: "Audio To Video",
      active: activeView === "video",
      onClick: () => setActiveView("video"),
    },
    {
      icon: Activity,
      label: "Activity",
      onClick: () => setActiveView("activity"),
      active: activeView === "activity",
    },
    { icon: CreditCard, label: "Pricing" },
    {
      icon: User,
      label: "Profile",
      onClick: () => setActiveView("profile"),
      active: activeView === "profile",
    },
  ];
  const startNewConversation = () => {
    setActiveConversation(null);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      setIsLoading(true);
      const userEmail = getUserEmail();
      const prompt = {
        prompt: message,
        user_email: userEmail,
        conversation_id: activeConversation?.conversation_id,
        level: selectedLevel,
      };

      // Add user message to UI immediately
      setMessages((prev) => [
        ...prev,
        {
          prompt: message,
          response: "",
          timestamp: new Date().toISOString(),
        },
      ]);
      setMessage("");

      const response = await axios.post("/text/generate", prompt);

      // Update messages with the complete conversation
      setMessages(response.data.messages);
      setActiveConversation({
        ...response.data,
        conversation_id: response.data.conversation_id,
        title: response.data.title,
      });

      // Refresh conversations list to show new conversation
      getConversations();

      if (response.data.warning) {
        toast.warning(response.data.warning);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send message");
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
    setCopyIcon(CheckCircle); // Change icon to check circle

    // Change back to copy icon after 10 seconds
    setTimeout(() => {
      setCopyIcon(Copy);
    }, 10000);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 border-r flex flex-col bg-white">
        {/* Logo */}
        <div className="p-4 border-b">
          <img
            src={logo}
            alt="logo"
            style={{ height: "50px", width: "auto" }}
          />
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4">
          {sidebarItems.map((item, index) => (
            <div
              key={index}
              onClick={() => item.onClick?.()}
              className={`flex items-center space-x-3 p-3 rounded-lg mb-1 cursor-pointer ${
                item.active ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            <User className="w-5 h-5" />
            <span>Profile</span>
          </div>
          <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            <Sliders className="w-5 h-5" />
            <span>Preferences</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex p-4 space-x-4">
        {activeView === "chat" ? (
          <>
            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm">
              {/* Top Bar with Dropdowns */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Level Dropdown */}
                  <div className="relative">
                    <div
                      className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50"
                      onClick={() => setIsLevelOpen(!isLevelOpen)}
                    >
                      <span>{selectedLevel}</span>
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>

                    {isLevelOpen && (
                      <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg py-1 min-w-[120px] z-10">
                        {levels.map((level) => (
                          <div
                            key={level}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleLevelSelect(level)}
                          >
                            {level}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {activeConversation && (
                  <div className="text-lg font-semibold">
                    {activeConversation.title}
                  </div>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4">
                {messages.map((msg, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gray-200" />
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-2xl p-4 inline-block max-w-3xl">
                          <p className="text-gray-900">{msg.prompt}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-200" />
                      <div className="flex-1">
                        <div className="inline-block max-w-3xl relative">
                          <p className="text-gray-900 whitespace-pre-line">
                            {msg.response}
                          </p>
                          <button
                            onClick={() => copyToClipboard(msg.response)}
                            className="absolute right-2 top-0 transform -translate-y-1/2 p-1 rounded hover:bg-gray-200 transition"
                          >
                            {copyIcon === CheckCircle ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t">
                <div className="relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Message Luga AI"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="w-full p-4 pr-12 rounded-lg border focus:outline-none focus:border-gray-400"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading}
                    className="absolute right-2 top-0 bg-blue-500 text-white px-4 py-2 rounded-lg"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      "Send"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Conversations */}
            <div className="w-64 bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Conversations</h2>
                <button
                  onClick={startNewConversation}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
                {Object.entries(groupConversationsByDate(conversations)).map(
                  ([group, convs]) =>
                    convs.length > 0 && (
                      <div key={group} className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-3">
                          {group === "today"
                            ? "Today"
                            : group === "yesterday"
                            ? "Yesterday"
                            : group === "previous7Days"
                            ? "Previous 7 Days"
                            : group === "previous30Days"
                            ? "Previous 30 Days"
                            : "Older"}
                        </h3>
                        {convs.map((conv) => (
                          <div
                            key={conv.conversation_id}
                            onClick={() =>
                              getConversation(conv.conversation_id)
                            }
                            className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer ${
                              activeConversation?.conversation_id ===
                              conv.conversation_id
                                ? "bg-gray-100"
                                : ""
                            }`}
                          >
                            <MessageSquare className="w-5 h-5" />
                            <span className="truncate">{conv.title}</span>
                          </div>
                        ))}
                      </div>
                    )
                )}
              </div>
            </div>
          </>
        ) : activeView === "audio" ? (
          <TextAudio />
        ) : activeView === "video" ? (
          <AudioVideo />
        ) : activeView === "activity" ? (
          <ActivityPage />
        ) : activeView === "profile" ? (
          <Profile />
        ) : (
          <div>No Activity</div>
        )}
      </div>
    </div>
  );
};

export default ChatbotInterface;
