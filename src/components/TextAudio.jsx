import { useState, useEffect, useRef } from "react";
import { Play, Download, CheckCircle } from "lucide-react";
import axios, { axiosPrivate } from "../api/axios";
import { toast } from "react-toastify";
import { useAuth } from "./auth";
const TextAudio = () => {
  const { getUserEmail } = useAuth();
  const [text, setText] = useState("");
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const voicesPerPage = 10;
  const [isLoading, setIsLoading] = useState(false);

  const fetchVoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/voice/voices");
      setVoices(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching voices:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoices();
  }, []);

  const audioRefs = useRef([]);

  const handlePlay = (index) => {
    // Pause all audios before playing the selected one
    audioRefs.current.forEach((audio, i) => {
      if (audio && i !== index) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    // Play the selected audio
    if (audioRefs.current[index]) {
      audioRefs.current[index].play();
    }
  };

  const handleDownload = (url, name) => {
    axios.get(url, { responseType: 'blob' })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', name);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      })
      .catch((error) => console.error("Error downloading file:", error));
  };
  const email = getUserEmail();
  const handleGenerateSpeech = async () => {
    if (!text.trim() && !selectedVoice) {
      toast.error("Please enter text and select a voice.");
      return;
    }
    if (!text.trim()) {
      toast.error("Please enter text.");
      return;
    }
    if (!selectedVoice) {
      toast.error("Please select a voice.");
      return;
    }
    const request = {
      text,
      voice_id: selectedVoice.voice_id,
      user_email: email,
    };
    try {
      setIsLoading(true);
      const response = await axiosPrivate.post("/voice/text-to-speech", request);
      console.log(response);
      const audioUrl = response.data.audio_url;
      const audio = new Audio(audioUrl);
      audioRefs.current.push(audio);
      audio.play();
      setIsLoading(false);
    } catch (error) {
      console.error("Error generating speech:", error);
      setIsLoading(false);
    }
  };

  const indexOfLastVoice = currentPage * voicesPerPage;
  const indexOfFirstVoice = indexOfLastVoice - voicesPerPage;
  const currentVoices = voices.slice(indexOfFirstVoice, indexOfLastVoice);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSelectVoice = (voice) => {
    setSelectedVoice(voice);
  };

  return (
    <div className="flex-1 flex space-x-4">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="flex-1 p-8 flex flex-col">
          {/* Text Input Area */}
          <div className="flex-1">
            <textarea
              placeholder="Start typing here or paste any text you want to turn into lifelike speech"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-[calc(100vh-240px)] p-6 border rounded-2xl resize-none focus:outline-none focus:border-gray-400 text-base text-gray-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between mt-6 space-x-4">
            <div className="flex space-x-4">
              <button className="rounded-full px-4 py-2 border border-gray-200 hover:bg-gray-50 flex items-center">
                <span className="text-sm">Choose from chat history</span>
              </button>
              <button className="rounded-full px-4 py-2 border border-gray-200 hover:bg-gray-50 flex items-center">
                <span className="text-sm">Upload your text</span>
              </button>
            </div>
            <button
              className="rounded-full px-6 py-2 bg-black text-white hover:bg-gray-800 flex items-center"
              disabled={isLoading}
              onClick={handleGenerateSpeech}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <span className="text-sm">Generate speech</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Audio Files List - Right Side */}
      <div className="w-96 bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex uppercase">
          <h3 className="text-sm font-bold pb-2">Select From Library</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div>
            {currentVoices.map((voice, index) => (
              <div
                key={voice.voice_id}
                className="group flex items-center py-4 first:pt-0 last:pb-0"
              >
                {/* Hidden Audio Element */}
                <audio
                  ref={(el) => (audioRefs.current[index] = el)}
                  src={voice.preview_url}
                />

                {/* Play Icon (Click to Play Audio) */}
                <Play
                  className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  onClick={() => handlePlay(index)}
                />

                {/* Voice Name */}
                <div className="ml-4 flex-1 min-w-0">
                  <div className="text-sm truncate uppercase">{voice.name}</div>
                  <div className="text-xs text-gray-500">
                    {voice.labels.accent} / {voice.labels.description}
                  </div>
                </div>

                {/* Actions: Download & Select */}
                <div className="flex items-center space-x-4 ml-4">
                  <Download
                    className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    onClick={() => handleDownload(voice.preview_url, `${voice.name}.mp3`)}
                  />
                  <CheckCircle
                    className={`w-5 h-5 cursor-pointer ${selectedVoice === voice ? "text-green-600" : "text-gray-400 hover:text-gray-600"}`}
                    onClick={() => handleSelectVoice(voice)}
                  />
                </div>
              </div>
            ))}
            <div className="flex justify-center mt-4">
              {Array.from(
                { length: Math.ceil(voices.length / voicesPerPage) },
                (_, i) => (
                  <button
                    key={i}
                    onClick={() => paginate(i + 1)}
                    className={`px-3 py-1 mx-1 rounded-full ${
                      currentPage === i + 1
                        ? "bg-black text-white"
                        : "bg-gray-200 text-black"
                    }`}
                  >
                    {i + 1}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextAudio;
