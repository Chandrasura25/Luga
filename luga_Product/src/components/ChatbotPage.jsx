import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { Plus, MessageSquare } from "lucide-react";

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

  // Fetch user's conversations
  const getConversations = async () => {
    try {
      const userEmail = getUserEmail();
      const response = await axios.get(`/text/conversations?user_email=${userEmail}`);
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
      const response = await axios.get(`/text/conversation/${conversationId}?user_email=${userEmail}`);
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
        level: selectedLevel,
        conversation_id: activeConversation?.conversation_id
      };

      // Add user message to UI immediately
      setMessages(prev => [...prev, {
        prompt: message,
        response: "",
        timestamp: new Date().toISOString()
      }]);
      setMessage("");

      const response = await axios.post("/text/generate", prompt);
      
      // Update messages with the complete conversation
      setMessages(response.data.messages);
      setActiveConversation({
        ...response.data,
        conversation_id: response.data.conversation_id,
        title: response.data.title
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      // ... existing sidebar code ...

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
                  // ... existing level dropdown code ...
                </div>
                {activeConversation && (
                  <div className="text-lg font-semibold">{activeConversation.title}</div>
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
                        <div className="inline-block max-w-3xl">
                          <p className="text-gray-900 whitespace-pre-line">{msg.response}</p>
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg"
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
              {conversations.map((conv) => (
                <div
                  key={conv.conversation_id}
                  onClick={() => getConversation(conv.conversation_id)}
                  className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer ${
                    activeConversation?.conversation_id === conv.conversation_id ? 'bg-gray-100' : ''
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="truncate">{conv.title}</span>
                </div>
              ))}
            </div>
          </>
        ) : // ... rest of the views ...
      </div>
    </div>
  );
};

export default ChatbotInterface; 