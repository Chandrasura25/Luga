import { useState, useEffect, useRef } from "react";
import { Play, Pause, Download, CheckCircle } from "lucide-react";
import axios, { axiosPrivate } from "../api/axios";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuth } from "./auth";

const TextAudio = () => {
  const { getUserEmail } = useAuth();
  const [text, setText] = useState("");
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userVoices, setUserVoices] = useState([]);
  const [audioNames, setAudioNames] = useState({});
  const [audioDurations, setAudioDurations] = useState({});
  const [playbackRate, setPlaybackRate] = useState(1);
  const [playingIndex, setPlayingIndex] = useState(null);

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

  const fetchUserVoices = async () => {
    try {
      const response = await axiosPrivate.post("/voice/user-voices", {
        email: getUserEmail(),
      });
      setUserVoices(response.data);
    } catch (error) {
      console.error("Error fetching user voices:", error);
    }
  };

  useEffect(() => {
    fetchVoices();
    fetchUserVoices();
  }, []);

  const audioRefs = useRef([]);

  const handlePlayPause = (index) => {
    audioRefs.current.forEach((audio, i) => {
      if (audio && i !== index) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    if (audioRefs.current[index]) {
      if (playingIndex === index) {
        audioRefs.current[index].pause();
        setPlayingIndex(null);
      } else {
        audioRefs.current[index].playbackRate = playbackRate;
        audioRefs.current[index].play();
        setPlayingIndex(index);
      }
    }
  };

  const handleDownload = (url, name) => {
    axios
      .get(url, { responseType: "blob" })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", name);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      })
      .catch((error) => console.error("Error downloading file:", error));
  };

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
      user_email: getUserEmail(),
    };
    try {
      setIsLoading(true);
      const response = await axiosPrivate.post("/voice/text-to-speech", request);
      const audioUrl = response.data.audio_url;
      const audio = new Audio(audioUrl);
      audio.playbackRate = playbackRate;
      audioRefs.current.push(audio);
      audio.play();
      setUserVoices((prev) => [
        ...prev,
        { voice_id: selectedVoice.voice_id, audio_url: audioUrl, file_name: response.data.file_name },
      ]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error generating speech:", error);
      setIsLoading(false);
    }
  };

  const handleSelectVoice = (voice) => {
    setSelectedVoice(voice);
  };

  const handleSelectAndPlayVoice = (voice, index) => {
    handleSelectVoice(voice);
    handlePlayPause(index);
  };

  const handleNameChange = (index, newName) => {
    setAudioNames((prev) => ({ ...prev, [index]: newName }));
    handleNameUpdate(index, newName);
  };

  const handleNameUpdate = async (index, newName) => {
    const voice = userVoices[index];
    try {
      await axiosPrivate.post("/voice/update-audio-name", {
        audio_url: voice.audio_url,
        new_name: newName,
      });
      toast.success("Name updated successfully!");
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error("Failed to update name.");
    }
  };

  const handleAudioLoadedMetadata = (index, audio) => {
    setAudioDurations((prev) => ({
      ...prev,
      [index]: audio.duration,
    }));
  };

  useEffect(() => {
    if (playingIndex !== null && audioRefs.current[playingIndex]) {
      audioRefs.current[playingIndex].playbackRate = playbackRate;
    }
  }, [playbackRate, playingIndex]);

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
              <Select
                onValueChange={(value) => {
                  const voice = voices.find((v) => v.voice_id === value);
                  const index = voices.indexOf(voice);
                  handleSelectAndPlayVoice(voice, index);
                }}
                defaultValue={selectedVoice?.voice_id}
              >
                <SelectTrigger className="rounded-full px-4 py-2 border border-gray-200 hover:bg-gray-50 flex items-center">
                  <SelectValue placeholder="Select From Library" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Library</SelectLabel>
                    {loading ? (
                      <SelectItem value="loading">Loading...</SelectItem>
                    ) : (
                      voices.map((voice) => (
                        <SelectItem
                          key={voice.voice_id}
                          value={voice.voice_id}
                          className="uppercase"
                        >
                          {voice.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
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
          <h3 className="text-sm font-bold pb-2">Generated Audios</h3>
        </div>

        <div>
          {userVoices.map((voice, index) => (
            <div
              key={voice.voice_id}
              className="group flex items-center py-4 first:pt-0 last:pb-0"
            >
              <audio
                ref={(el) => (audioRefs.current[index] = el)}
                src={voice.audio_url}
                onLoadedMetadata={(e) => handleAudioLoadedMetadata(index, e.target)}
              />

              {playingIndex === index ? (
                <Pause
                  className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  onClick={() => handlePlayPause(index)}
                />
              ) : (
                <Play
                  className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  onClick={() => handlePlayPause(index)}
                />
              )}

              <div className="ml-4 flex-1 min-w-0">
                <input
                  type="text"
                  value={audioNames[index] || voice.file_name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  className="text-sm truncate border-b border-gray-300 focus:outline-none"
                />
                <div className="text-xs text-gray-500">
                  {audioDurations[index] ? `${Math.floor(audioDurations[index] / 60)}:${Math.floor(audioDurations[index] % 60).toString().padStart(2, '0')}` : "Loading..."}
                </div>
              </div>

              <div className="flex items-center space-x-4 ml-4">
                <Download
                  className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  onClick={() =>
                    handleDownload(voice.audio_url, `${audioNames[index] || voice.name}.mp3`)
                  }
                />
                <CheckCircle
                  className={`w-5 h-5 cursor-pointer ${
                    selectedVoice === voice
                      ? "text-green-600"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                  onClick={() => handleSelectVoice(voice)}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Playback Speed</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={playbackRate}
            onChange={(e) => setPlaybackRate(e.target.value)}
            className="w-full"
          />
          <div className="text-sm text-gray-500">{playbackRate}x</div>
        </div>
      </div>
    </div>
  );
};

export default TextAudio;