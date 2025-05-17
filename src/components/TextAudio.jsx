import { useState, useEffect, useRef, useCallback } from "react";
import { Mic } from "lucide-react";
import axios, { axiosPrivate } from "../api/axios";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "./auth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

import SelectFromLibrary from "../components/forms/TextAudio/SelectFromLibrary";
import ClonedVoices from "../components/forms/TextAudio/ClonedVoices";
import VoiceCloningDialog from "../components/forms/TextAudio/VoiceCloningDialog";
import AudioFilesList from "../components/forms/TextAudio/AudioFilesList";

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
  const [playbackRate, setPlaybackRate] = useState(1);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [playingPreview, setPlayingPreview] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [cloneVoices, setCloneVoices] = useState([]);
  const previewAudioRef = useRef(null);
  const audioRefs = useRef([]);
  const [audioProgress, setAudioProgress] = useState({});
  const [isPlaying, setIsPlaying] = useState({});
  const progressIntervals = useRef({});
  const [networkError, setNetworkError] = useState(false);

  const fetchVoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/voice/voices");
      const voices = response.data.filter(
        (voice) => voice.category === "premade"
      );
      setVoices(voices);
      return voices;
    } catch (error) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Error fetching voices.",
        description: "Failed to fetch voices. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCloneVoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosPrivate.post("/voice/cloned-voices", {
        email: getUserEmail(),
      });
      setCloneVoices(response.data);
      return response.data;
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserVoices = useCallback(async () => {
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
  }, [getUserEmail]);

  useEffect(() => {
    fetchVoices();
    fetchUserVoices();
    fetchCloneVoices();
  }, [fetchVoices, fetchUserVoices, fetchCloneVoices]);

  const updateProgress = (index) => {
    if (audioRefs.current[index]) {
      const audio = audioRefs.current[index];
      const progress = (audio.currentTime / audio.duration) * 100;
      setAudioProgress((prev) => ({ ...prev, [index]: progress }));

      if (audio.ended) {
        setIsPlaying((prev) => ({ ...prev, [index]: false }));
        setPlayingIndex(null);
        clearInterval(progressIntervals.current[index]);
      }
    }
  };

  const handleGenerateSpeech = async () => {
    if (!text.trim() && !selectedVoice) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter text and select a voice.",
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
    try {
      setIsLoading(true);
      const request = {
        text: text.trim(),
        voice_id: selectedVoice.voice_id,
        user_email: getUserEmail(),
      };

      const response = await axiosPrivate.post(
        "/voice/text-to-speech",
        request
      );

      const audioUrl = response.data.audio_url;
      const audio = new Audio();
      const newIndex = audioRefs.current.length;

      // Set up error handling for audio loading
      audio.onerror = () => {
        toast({
          variant: "destructive",
          title: "Audio Error",
          description: "Failed to load audio. Please try again.",
        });
        setIsLoading(false);
      };

      // Set up audio loading
      audio.oncanplaythrough = () => {
        audio.playbackRate = playbackRate;
        audioRefs.current.push(audio);

        audio.addEventListener("play", () => {
          setIsPlaying((prev) => ({ ...prev, [newIndex]: true }));
          progressIntervals.current[newIndex] = setInterval(() => {
            updateProgress(newIndex);
          }, 100);
        });

        audio.addEventListener("ended", () => {
          setIsPlaying((prev) => ({ ...prev, [newIndex]: false }));
          setPlayingIndex(null);
          clearInterval(progressIntervals.current[newIndex]);
        });

        // Start playback
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Playback failed:", error);
            toast({
              variant: "destructive",
              title: "Playback Error",
              description: "Failed to play audio. Please try again.",
            });
          });
        }

        setPlayingIndex(newIndex);
        setUserVoices((prev) => [
          ...prev,
          {
            voice_id: selectedVoice.voice_id,
            audio_url: audioUrl,
            file_name: response.data.file_name,
          },
        ]);
      };

      audio.src = audioUrl;
    } catch (error) {
      console.error("Error in handleGenerateSpeech:", error);
      toast({
        variant: "destructive",
        title: "Generation Error",
        description:
          error.response.data.detail ||
          "Failed to generate speech. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVoice = (voice) => {
    setSelectedVoice(voice);
  };

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

  useEffect(() => {
    return () => {
      Object.values(progressIntervals.current).forEach((interval) => {
        clearInterval(interval);
      });
    };
  }, []);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setNetworkError(false);
    };

    const handleOffline = () => {
      setNetworkError(true);
      toast({
        variant: "destructive",
        title: "Network Error",
        description:
          "You are currently offline. Please check your internet connection.",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Add network error banner
  const NetworkErrorBanner = () =>
    networkError && (
      <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-2 text-center z-50">
        You are currently offline. Some features may be unavailable.
      </div>
    );
  return (
    <>
      <NetworkErrorBanner />
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
                <SelectFromLibrary
                  voices={voices}
                  loading={loading}
                  handlePlayPreview={handlePlayPreview}
                  handleSelectVoice={handleSelectVoice}
                  selectedVoice={selectedVoice}
                />
                <ClonedVoices
                  handlePlayPreview={handlePlayPreview}
                  handleSelectVoice={handleSelectVoice}
                  selectedVoice={selectedVoice}
                  cloneVoices={cloneVoices}
                />
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
        <AudioFilesList
          audioRefs={audioRefs}
          setPlayingIndex={setPlayingIndex}
          setIsPlaying={{ setIsPlaying }}
          setAudioProgress={setAudioProgress}
          userVoices={userVoices}
          fetchLoading={fetchLoading}
          isPlaying={isPlaying}
          audioProgress={audioProgress}
          setPlaybackRate={setPlaybackRate}
          playingIndex={playingIndex}
          selectedVoice={selectedVoice}
          playbackRate={playbackRate}
          progressIntervals={progressIntervals}
          updateProgress={updateProgress}
        />
      </div>

      {/* Voice Cloning Dialog */}
      {showCloneDialog && (
        <VoiceCloningDialog
          fetchCloneVoices={fetchCloneVoices}
          setShowCloneDialog={setShowCloneDialog}
        />
      )}
    </>
  );
};

export default TextAudio;
