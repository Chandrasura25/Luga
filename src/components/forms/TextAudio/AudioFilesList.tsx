import { Play, Pause, Download, Edit3, Check } from "lucide-react";
import { Slider } from "../../ui/slider";
import { useCallback, useState } from "react";
import { useToast } from "../../../hooks/use-toast";
import axios from "../../../api/axios"; // Changed import to avoid TypeScript error

interface AudioFile {
  voice_id: string;
  audio_url: string;
  file_name: string;
  name?: string;
  id: string; // Added id property to match usage in handleNameUpdate
}

interface AudioFilesListProps {
  audioRefs: React.RefObject<HTMLAudioElement[]>;
  setPlayingIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setIsPlaying: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  setAudioProgress: React.Dispatch<
    React.SetStateAction<Record<number, number>>
  >;
  userVoices: AudioFile[];
  fetchLoading: boolean;
  playingIndex: number | null;
  playbackRate: number;
  isPlaying: Record<number, boolean>;
  audioProgress: Record<number, number>;
  setPlaybackRate: React.Dispatch<React.SetStateAction<number>>;
  selectedVoice: AudioFile | null;
  progressIntervals: React.MutableRefObject<
    Record<number, NodeJS.Timeout | undefined>
  >; // Added progressIntervals type
  updateProgress: (index: number) => void; // Added updateProgress type
}

const AudioFilesList: React.FC<AudioFilesListProps> = ({
  audioRefs,
  setPlayingIndex,
  setIsPlaying,
  setAudioProgress,
  userVoices,
  fetchLoading,
  playingIndex,
  playbackRate,
  isPlaying,
  audioProgress,
  setPlaybackRate,
  selectedVoice,
  progressIntervals,
  updateProgress,
}) => {
  const { toast } = useToast();
  const [audioNames, setAudioNames] = useState<Record<number, string>>({});
  const [audioDurations, setAudioDurations] = useState<Record<number, number>>(
    {}
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handlePlayPause = useCallback(
    (index: number) => {
      try {
        if (audioRefs.current) {
          audioRefs.current.forEach((audio, i) => {
            if (audio && i !== index) {
              audio.pause();
              audio.currentTime = 0;
              setIsPlaying((prev) => ({ ...prev, [i]: false }));
              clearInterval(progressIntervals.current[i]);
              setAudioProgress((prev) => ({ ...prev, [i]: 0 }));
            }
          });
        }
        if (audioRefs.current && audioRefs.current[index]) {
          const audio = audioRefs.current[index];

          audio.onerror = (e) => {
            console.error("Audio playback error:", e);
            toast({
              variant: "destructive",
              title: "Playback Error",
              description: "Failed to play audio. Please try again.",
            });
            setIsPlaying((prev) => ({ ...prev, [index]: false }));
            setPlayingIndex(null);
            clearInterval(progressIntervals.current[index]);
          };

          if (playingIndex === index) {
            audio.pause();
            setPlayingIndex(null);
            setIsPlaying((prev) => ({ ...prev, [index]: false }));
            clearInterval(progressIntervals.current[index]);
          } else {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  audio.playbackRate = playbackRate;
                  setPlayingIndex(index);
                  setIsPlaying((prev) => ({ ...prev, [index]: true }));
                  progressIntervals.current[index] = setInterval(() => {
                    updateProgress(index);
                  }, 100);
                })
                .catch((error) => {
                  console.error("Playback failed:", error);
                  toast({
                    variant: "destructive",
                    title: "Playback Error",
                    description: "Failed to play audio. Please try again.",
                  });
                });
            }
          }
        }
      } catch (error) {
        console.error("Error in handlePlayPause:", error);
        toast({
          variant: "destructive",
          title: "Playback Error",
          description: "An error occurred during playback. Please try again.",
        });
      }
    },
    [playingIndex, playbackRate]
  );

  const handleDownload = (url: string, name: string) => {
    axios
      .get(url, { responseType: "blob" })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", name);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link); // Added optional chaining to avoid TypeScript error
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Error downloading file.",
          description: error.response?.data?.detail || "An error occurred.", // Added optional chaining
        });
      });
  };

  const handleNameChange = (index: number, newName: string) => {
    setAudioNames((prev) => ({ ...prev, [index]: newName }));
  };

  const handleNameUpdate = async (index: number, newName: string) => {
    const voice = userVoices[index];
    try {
      await axios.post("/voice/update-audio-name", {
        // Changed axiosPrivate to axios
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
        description: (error as any).response?.data?.detail || "An error occurred.", // Added optional chaining
      });
    }
  };

  const handleAudioLoadedMetadata = (
    index: number,
    audio: HTMLAudioElement
  ) => {
    setAudioDurations((prev) => ({
      ...prev,
      [index]: audio.duration,
    }));
  };

  return (
    <>
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
                    onLoadedMetadata={
                      (e) =>
                        handleAudioLoadedMetadata(
                          index,
                          e.target as HTMLAudioElement
                        ) // Type assertion added
                    }
                  />

                  {isPlaying[index] ? (
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
                        value={
                          audioNames[index] !== undefined
                            ? audioNames[index]
                            : voice.file_name
                        }
                        onChange={(e) =>
                          handleNameChange(index, e.target.value)
                        }
                        onBlur={() => {
                          handleNameUpdate(index, audioNames[index]);
                          setEditingIndex(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleNameUpdate(index, audioNames[index]);
                            setEditingIndex(null);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            setEditingIndex(null); // cancel editing
                          }
                        }}
                        className="text-sm truncate border-b border-gray-300 focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <div
                        className="text-sm truncate border-b border-transparent cursor-pointer"
                        onDoubleClick={() => setEditingIndex(index)}
                      >
                        {audioNames[index] !== undefined
                          ? audioNames[index]
                          : voice.file_name}
                      </div>
                    )}

                    <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-black transition-all duration-100"
                        style={{ width: `${audioProgress[index] || 0}%` }}
                      />
                    </div>

                    <div className="text-xs text-gray-500 mt-1">
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
    </>
  );
};

export default AudioFilesList;
