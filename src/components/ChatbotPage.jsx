import { useState, useEffect } from "react";
import {
  Settings,
  User,
  Activity,
  MessageSquare,
  FileText,
  Music,
  Video,
  CreditCard,
  Sliders,
} from "lucide-react";
import TextAudio from "./TextAudio";
import AudioVideo from "./AudioVideo";
import axios from "../api/axios";
import { useAuth } from "./auth";
import { toast } from "react-toastify";
import logo from "../assets/logo.jpeg";
const ChatbotInterface = () => {
  const [message, setMessage] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("Advanced");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isLevelOpen, setIsLevelOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [activeView, setActiveView] = useState("chat");
  const [isLoading, setIsLoading] = useState(false);
  const { getUserEmail } = useAuth();
  const levels = ["Advanced", "Balanced", "Basic"];
  const languages = ["Arabic", "Spanish", "French", "Chinese", "English"];
  const [chatHistory, setChatHistory] = useState([
    {
      type: "user",
      text: "Draft an email to my recruiter to accept the Social Media Manager job offer and negotiate a later start date",
    },
    {
      type: "bot",
      text: `Dear [Recruiter's Name], I am writing to express my sincere gratitude for the opportunity to join [Company Name] as the Social Media Manager. I am thrilled to accept this position and look forward to contributing my skills and expertise to the team. While I am eager to begin, I would like to request a later start date of [Desired Start Date]. This would allow me to [Reason for requesting a later start date, e.g., "complete my current project," "transition smoothly from my current role," or "handle personal commitments"]. I understand that this might require some adjustment, and I am open to discussing alternative options or accommodations that would work for both of us. Thank you for your understanding and flexibility.`,
    },
  ]);
  const getHistory = async () => {
    try {
      const userEmail = getUserEmail();
      const response = await axios.post("/text/history", { user_email: userEmail });
      setChatHistory(response.data);
    } catch (error) {
      console.error("Error getting history:", error);
    }
  };
  useEffect(() => {
    getHistory();
  }, []);
  const handleLevelSelect = (level) => {
    setSelectedLevel(level);
    setIsLevelOpen(false);
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    setIsLanguageOpen(false);
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
    { icon: Activity, label: "Activity" },
    { icon: CreditCard, label: "Pricing" },
    { icon: Settings, label: "Settings" },
  ];

  const recentChats = [
    "Game Night Planning",
    "Uncover Lab Learn",
    "Using Origin in Vietnam",
    "Clientless Public Work",
    "Developer Team Size",
    "Instagram Post Embed",
    "Video Editing Community",
    "Hi Response Summary",
  ];

  const sendMessage = async () => {
    try {
      setIsLoading(true);
      const userEmail = getUserEmail();
      const prompt = {
        prompt: message,
        user_email: userEmail,
      };
      setChatHistory((prev) => [...prev, { type: "user", text: message }]);
      setMessage("");
      const response = await axios.post("/text/generate", prompt);
      setChatHistory((prev) => [...prev, { type: "bot", text: response.data.response }]);
    } catch (error) {
      toast.error(error.response.data.detail);
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
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
              <div className="p-4 border-b flex items-center space-x-4">
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

                {/* Language Dropdown */}
                <div className="relative">
                  <div
                    className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50"
                    onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                  >
                    <span>{selectedLanguage}</span>
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

                  {isLanguageOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg py-1 min-w-[120px] z-10">
                      {languages.map((language) => (
                        <div
                          key={language}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleLanguageSelect(language)}
                        >
                          {language}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4">
                {chatHistory.map((chat, index) => (
                  <>
                  <div key={index}>
                    {chat.type === "user" && (
                       <div className="flex items-start space-x-3 mb-6">
                       <div className="w-8 h-8 rounded-full bg-gray-200" />
                       <div className="flex-1">
                         <div className="bg-gray-100 rounded-2xl p-4 inline-block max-w-3xl">
                           <p className="text-gray-900 text-left">
                             {chat.text}
                           </p>
                         </div>
                       </div>
                     </div>
                    )}
                    {chat.type === "bot" && (
                      <div className="flex items-start space-x-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gray-200" />
                      <div className="flex-1">
                        <div className="inline-block max-w-3xl">
                          <p className="text-gray-900 text-left whitespace-pre-line">
                          {chat.text}
                        </p>
                        </div>
                      </div>
                    </div>
                    )}
                  </div>
                  </>
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
                      if (e.key === "Enter") {
                        sendMessage();
                      }
                    }}
                    className="w-full p-4 pr-12 rounded-lg border focus:outline-none focus:border-gray-400"
                  />
                  {isLoading ? (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <button
                      onClick={sendMessage}
                      disabled={isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg"
                    >
                      {isLoading ? (
                        <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900"></span>
                      ) : (
                        "Send"
                      )}
                    </button>
                  )}
                </div>
                <p className="text-gray-500 font-semibold text-xs">
                  Message Luga AI (Enter to send)
                </p>
              </div>
            </div>

            {/* Right Sidebar - Recent Chats */}
            <div className="w-64 bg-white rounded-2xl p-4 shadow-sm">
              {recentChats.map((chat, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer text-left w-full"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>{chat}</span>
                </div>
              ))}
            </div>
          </>
        ) : activeView === "audio" ? (
          <TextAudio />
        ) : (
          <AudioVideo />
        )}
      </div>
    </div>
  );
};

export default ChatbotInterface;
