import { useState, useEffect, useRef } from "react";
import { Play, Pause, Download, Edit3, Check, Mic } from "lucide-react";
import axios, { axiosPrivate } from "../api/axios";
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
import { Slider } from "../components/ui/slider";
import { useToast } from "../hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
const TextAudio = () => {
  const { toast } = useToast();
  const { getUserEmail } = useAuth();
  const [text, setText] = useState("");
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [userVoices, setUserVoices] = useState([]);
  const [audioNames, setAudioNames] = useState({});
  const [audioDurations, setAudioDurations] = useState({});
  const [playbackRate, setPlaybackRate] = useState(1);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [playingPreview, setPlayingPreview] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [voiceName, setVoiceName] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [cloneVoices, setCloneVoices] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const previewAudioRef = useRef(null);
  const audioRefs = useRef([]);

  const fetchVoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/voice/voices");
      // filter voices to include only those with the category 'premade'
      const voices = response.data.filter(
        (voice) => voice.category === "premade"
      );
      setVoices(voices);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching voices:", error);
      setLoading(false);
    }
  };

  const fetchCloneVoices = async () => {
    try {
      const response = await axiosPrivate.post("/voice/cloned-voices", {
        email: getUserEmail(),
      });
      setCloneVoices(response.data);
    } catch (error) {
      console.error("Error fetching clone voices:", error);
    }
  };
  const fetchUserVoices = async () => {
    try {
      setFetchLoading(true);
      const response = await axiosPrivate.post("/voice/user-voices", {
        email: getUserEmail(),
      });
      setUserVoices(response.data);
    } catch (error) {
      console.error("Error fetching user voices:", error);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchVoices();
    fetchUserVoices();
    fetchCloneVoices();
  }, []);

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
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Error downloading file.",
          description: error.response.data.detail,
        });
      });
  };

  const handleGenerateSpeech = async () => {
    if (!text.trim() && !selectedVoice) {
      toast({
        variant: "destructive",
        title: "Please enter text and select a voice.",
        description: "Please enter text and select a voice to generate speech.",
      });
      return;
    }
    if (!text.trim()) {
      toast({
        variant: "destructive",
        title: "Please enter text.",
        description: "Please enter text to generate speech.",
      });
      return;
    }
    if (!selectedVoice) {
      toast({
        variant: "destructive",
        title: "Please select a voice.",
        description: "Please select a voice from the dropdown menu.",
      });
      return;
    }
    const request = {
      text,
      voice_id: selectedVoice.voice_id,
      user_email: getUserEmail(),
    };
    try {
      setIsLoading(true);
      const response = await axiosPrivate.post(
        "/voice/text-to-speech",
        request
      );
      const audioUrl = response.data.audio_url;
      const audio = new Audio(audioUrl);
      audio.playbackRate = playbackRate;
      audioRefs.current.push(audio);
      audio.play();
      setUserVoices((prev) => [
        ...prev,
        {
          voice_id: selectedVoice.voice_id,
          audio_url: audioUrl,
          file_name: response.data.file_name,
        },
      ]);
      setIsLoading(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error generating speech.",
        description: error.response.data.detail,
      });
      console.error("Error generating speech:", error);
      setIsLoading(false);
    }
  };

  const handleSelectVoice = (voice) => {
    setSelectedVoice(voice);
  };

  const handleNameChange = (index, newName) => {
    setAudioNames((prev) => ({ ...prev, [index]: newName }));
  };

  const handleNameUpdate = async (index, newName) => {
    const voice = userVoices[index];
    try {
      await axiosPrivate.post("/voice/update-audio-name", {
        audio_id: voice.id,
        new_name: newName,
      });
      toast({
        description: "Name updated successfully!",
      });
    } catch (error) {
      console.error("Error updating name:", error);
      toast({
        variant: "destructive",
        title: "Error updating name.",
        description: error.response.data.detail,
      });
    }
  };

  const handleAudioLoadedMetadata = (index, audio) => {
    setAudioDurations((prev) => ({
      ...prev,
      [index]: audio.duration,
    }));
  };

  const handleNameKeyPress = (index, event) => {
    if (event.key === "Enter") {
      handleNameUpdate(index, audioNames[index]);
      setEditingIndex(null);
    }
  };

  useEffect(() => {
    if (playingIndex !== null && audioRefs.current[playingIndex]) {
      audioRefs.current[playingIndex].playbackRate = playbackRate;
    }
  }, [playbackRate, playingIndex]);

  const handleFileUpload = async (event) => {
    setUploadLoading(true);
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_email", getUserEmail());

      try {
        const response = await axiosPrivate.post(
          "/voice/upload-document",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setText(response.data.text);
        toast({
          description: "Document uploaded successfully!",
        });
      } catch (error) {
        console.error("Error uploading document:", error);
        toast({
          variant: "destructive",
          title: "Error uploading document.",
          description: error.response.data.detail,
        });
      } finally {
        setUploadLoading(false);
      }
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if it's an audio file
      if (!file.type.startsWith("audio/")) {
        setFileError("Please upload an audio file");
        setSelectedFile(null);
        return;
      }

      // Get duration of audio file
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);

      audio.addEventListener("loadedmetadata", () => {
        const duration = audio.duration;
        // Check if duration is between 1 and 5 minutes
        if (duration < 60 || duration > 300) {
          setFileError("Audio file must be between 1 and 5 minutes long");
          setSelectedFile(null);
          return;
        }
        setFileError("");
        setSelectedFile(file);
      });

      audio.addEventListener("error", () => {
        setFileError("Error loading audio file");
        setSelectedFile(null);
      });
    }
  };

  const handleCloneVoice = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please upload an audio file.",
      });
      return;
    }

    if (!voiceName.trim()) {
      toast({
        variant: "destructive",
        title: "Voice name required",
        description: "Please enter a name for your voice.",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("user_email", getUserEmail());
      formData.append("name", voiceName.trim());
      formData.append(
        "description",
        voiceDescription.trim() || `Cloned voice: ${voiceName.trim()}`
      );

      const response = await axiosPrivate.post("/voice/clone-voice", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === "success") {
        toast({
          description: "Voice cloned successfully!",
        });

        // Reset state
        setSelectedFile(null);
        setVoiceName("");
        setVoiceDescription("");
        setShowCloneDialog(false);
        setFileError("");

        // Refresh voices
        fetchCloneVoices();
      } else {
        throw new Error(response.data.message || "Failed to clone voice");
      }
    } catch (error) {
      console.error("Error cloning voice:", error);
      toast({
        variant: "destructive",
        title: "Error cloning voice",
        description:
          error.response?.data?.detail ||
          "An error occurred while cloning your voice.",
      });
    }
  };

  const handlePlayPreview = (voice) => {
    if (playingPreview === voice.voice_id) {
      previewAudioRef.current?.pause();
      setPlayingPreview(null);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      previewAudioRef.current = new Audio(voice.preview_url);
      previewAudioRef.current.playbackRate = playbackRate;
      previewAudioRef.current.play();
      setPlayingPreview(voice.voice_id);

      previewAudioRef.current.onended = () => {
        setPlayingPreview(null);
      };
    }
  };

  return (
    <>
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
                    handleSelectVoice(voice);
                    handlePlayPreview(voice);
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
                        <>
                          {voices.map((voice) => (
                            <SelectItem
                              key={voice.voice_id}
                              value={voice.voice_id}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div>
                                  <p className="uppercase">{voice.name}</p>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select
                  onValueChange={(value) => {
                    const voice = cloneVoices.find((v) => v.voice_id === value);
                    handleSelectVoice(voice);
                    handlePlayPreview(voice);
                  }}
                  defaultValue={selectedVoice?.voice_id}
                >
                  <SelectTrigger className="rounded-full px-4 py-2 border border-gray-200 hover:bg-gray-50 flex items-center">
                    <SelectValue placeholder="User Library" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Cloned Voices</SelectLabel>
                      {cloneVoices.length > 0 && (
                        <>
                          {cloneVoices.map((voice) => (
                            <SelectItem
                              key={voice?.voice_id}
                              value={voice?.voice_id}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div>
                                  <p className="uppercase">{voice?.name}</p>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <input
                  type="file"
                  accept=".txt,.docx,.pdf"
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
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      "Upload your text"
                    )}
                  </span>
                </label>
              </div>
              <div className="flex space-x-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <button
                        className="rounded-full p-2 bg-black text-white hover:opacity-90 flex items-center justify-center"
                        onClick={() => setShowCloneDialog(true)}
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clone your voice</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
        </div>

        {/* Audio Files List - Right Side */}
        <div className="w-96 bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex uppercase">
            <h3 className="text-sm font-bold pb-2">Generated Audios</h3>
          </div>

          {fetchLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <div>
                {userVoices.map((voice, index) => (
                  <div
                    key={voice.voice_id}
                    className="group flex items-center py-4 first:pt-0 last:pb-0"
                  >
                    <audio
                      ref={(el) => (audioRefs.current[index] = el)}
                      src={voice.audio_url}
                      onLoadedMetadata={(e) =>
                        handleAudioLoadedMetadata(index, e.target)
                      }
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
                      {editingIndex === index ? (
                        <input
                          type="text"
                          value={audioNames[index] || voice.file_name}
                          onChange={(e) =>
                            handleNameChange(index, e.target.value)
                          }
                          onBlur={() => {
                            handleNameUpdate(index, audioNames[index]);
                            setEditingIndex(null);
                          }}
                          onKeyPress={(e) => handleNameKeyPress(index, e)}
                          className="text-sm truncate border-b border-gray-300 focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="text-sm truncate border-b border-transparent cursor-pointer"
                          onDoubleClick={() => setEditingIndex(index)}
                        >
                          {audioNames[index] || voice.file_name}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {audioDurations[index]
                          ? `${Math.floor(
                              audioDurations[index] / 60
                            )}:${Math.floor(audioDurations[index] % 60)
                              .toString()
                              .padStart(2, "0")}`
                          : "Loading..."}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 ml-4">
                      <Download
                        className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer"
                        onClick={() =>
                          handleDownload(
                            voice.audio_url,
                            `${audioNames[index] || voice.name}.mp3`
                          )
                        }
                      />
                      {editingIndex === index ? (
                        <Check
                          className="w-5 h-5 text-green-600 cursor-pointer"
                          onClick={() => {
                            handleNameUpdate(index, audioNames[index]);
                            setEditingIndex(null);
                          }}
                        />
                      ) : (
                        <Edit3
                          className={`w-5 h-5 cursor-pointer ${
                            selectedVoice === voice
                              ? "text-green-600"
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                          onClick={() => setEditingIndex(index)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Playback Speed
                </label>
                <Slider
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={[playbackRate]}
                  onValueChange={(value) => setPlaybackRate(value[0])}
                />
                <div className="text-sm text-gray-500">{playbackRate}x</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Voice Cloning Dialog */}
      {showCloneDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Clone Your Voice</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Voice Name
                </label>
                <Input
                  type="text"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                  placeholder="Enter a name for your voice"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description (Optional)
                </label>
                <Textarea
                  value={voiceDescription}
                  onChange={(e) => setVoiceDescription(e.target.value)}
                  className="mt-1 resize-none block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                  placeholder="Enter a description for your voice"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Upload Audio File
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Please upload a well-recorded audio file that is between 1 and
                  5 minutes long.
                </p>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-black file:text-white
                  hover:file:bg-gray-800"
                />
                {fileError && (
                  <p className="mt-1 text-sm text-red-600">{fileError}</p>
                )}
                {selectedFile && !fileError && (
                  <p className="mt-1 text-sm text-green-600">
                    Selected file: {selectedFile.name}
                  </p>
                )}
              </div>
              <div className="flex space-x-4">
                <button
                  className="flex-1 bg-gray-200 text-gray-800 rounded-md py-2 hover:bg-gray-300"
                  onClick={() => {
                    setShowCloneDialog(false);
                    setSelectedFile(null);
                    setVoiceName("");
                    setVoiceDescription("");
                    setFileError("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-black text-white rounded-md py-2 hover:bg-gray-800"
                  onClick={handleCloneVoice}
                  disabled={!selectedFile || !!fileError}
                >
                  Clone Voice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TextAudio;
