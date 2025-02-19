import { useState, useEffect } from "react";
import { Play, Volume2, Maximize2, MoreVertical } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { axiosPrivate } from "../api/axios";
import { useAuth } from "../components/auth";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
const TextToVideo = () => {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const { getUserEmail } = useAuth();
  const [uploadLoading, setUploadLoading] = useState(false);
  const [audioHistory, setAudioHistory] = useState([]);
  const getAudioHistory = async () => {
    try {
      const response = await axiosPrivate.post("/video/get-audio", {
        user_email: getUserEmail(),
      });
      setAudioHistory(response.data);
    } catch (error) {
      console.error("Error getting audio history:", error);
    }
  };
  useEffect(() => {
    getAudioHistory();
  }, []);
  const handleFileUpload = async (event) => {
    setUploadLoading(true);
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("user_email", getUserEmail());

      try {
        const response = await axiosPrivate.post(
          "/video/upload-audio",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        if (response.status === 200) {
          getAudioHistory();
          toast({
            description: "Audio uploaded successfully!",
          });
        }
      } catch (error) {
        console.error("Error uploading document:", error);
        toast({
          variant: "destructive",
          title: "Error uploading audio.",
          description: error.response.data.detail
            ? error.response.data.detail
            : "An error occurred.",
        });
      } finally {
        setUploadLoading(false);
      }
    }
  };
  console.log(audioHistory);
  return (
    <>
      <div className="flex-1 flex space-x-4">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="flex-1 p-8 flex flex-col">
            {/* Text Input Area */}
            <div className="flex-1">
              <textarea
                placeholder="Start typing here or paste any text you want to generate Lip Sync Video"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-[calc(100vh-240px)] p-6 border rounded-2xl resize-none focus:outline-none focus:border-gray-400 text-base text-gray-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between mt-6 space-x-4">
              <div className="flex space-x-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose from audio history" />
                  </SelectTrigger>
                  <SelectContent>
                    {audioHistory.map((audio) => (
                      <SelectItem value={audio.audio_id} key={audio.audio_id}>
                        {audio.audio_url}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* <button className="rounded-full px-4 py-2 border border-gray-200 hover:bg-gray-50 flex items-center space-x-2">
                  <span className="text-sm">Choose from audio history</span>
                </button> */}
                <input
                  type="file"
                  accept=".mp3,.wav,.m4a"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="rounded-full px-4 py-2 border border-gray-200 hover:bg-gray-50 flex items-center cursor-pointer"
                >
                  <span className="text-sm whitespace-nowrap">
                    {uploadLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                    ) : (
                      "Upload an audio"
                    )}
                  </span>
                </label>
                {/* <button className="rounded-full px-4 py-2 border border-gray-200 hover:bg-gray-50 flex items-center space-x-2">
                  <span className="text-sm">Upload an audio</span>
                </button> */}
              </div>
              <button className="rounded-full px-6 py-2 bg-black text-white hover:bg-gray-800 flex items-center space-x-2">
                <span className="text-sm">Lip Sync</span>
              </button>
            </div>
          </div>
        </div>

        {/* Video Preview Area - Right Side */}
        <div className="w-96 space-y-4">
          {/* First Video */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="relative aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden">
              <img
                src="/api/placeholder/400/500"
                alt="Video preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2">
                    <Play className="w-4 h-4" />
                    <span className="text-xs">0:00 / 0:26</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-4 h-4" />
                    <Maximize2 className="w-4 h-4" />
                    <MoreVertical className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Second Video */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="relative aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden">
              <img
                src="/api/placeholder/400/500"
                alt="Video preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2">
                    <Play className="w-4 h-4" />
                    <span className="text-xs">0:00 / 0:20</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-4 h-4" />
                    <Maximize2 className="w-4 h-4" />
                    <MoreVertical className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TextToVideo;
