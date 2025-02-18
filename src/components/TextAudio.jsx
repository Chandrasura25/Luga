import { useState, useEffect, useRef } from "react";
import { Play, Download, Trash2 } from "lucide-react";
import axios from "../api/axios";

const TextAudio = () => {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const voicesPerPage = 10;

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

  const indexOfLastVoice = currentPage * voicesPerPage;
  const indexOfFirstVoice = indexOfLastVoice - voicesPerPage;
  const currentVoices = voices.slice(indexOfFirstVoice, indexOfLastVoice);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
            <button className="rounded-full px-6 py-2 bg-black text-white hover:bg-gray-800 flex items-center">
              <span className="text-sm">Generate speech</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audio Files List - Right Side */}
      <div className="w-96 bg-white rounded-2xl p-6 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div>
            {currentVoices.map((voice, index) => (
              <div
                key={index}
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
                  <div className="text-sm truncate">{voice.name}</div>
                </div>

                {/* Actions: Download & Delete */}
                <div className="flex items-center space-x-4 ml-4">
                  <a href={voice.preview_url} download>
                    <Download className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
                  </a>
                  <Trash2 className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
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
