import { useState, useEffect } from "react";
import { Play, Volume2, Maximize2, MoreVertical } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { axiosPrivate } from "../api/axios";
import { useAuth } from "../components/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
const TextToVideo = () => {
  const { toast } = useToast();
  // const [text, setText] = useState("");
  const { getUserEmail } = useAuth();
  const [uploadLoading, setUploadLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [audioHistory, setAudioHistory] = useState([]);
  const [videoHistory, setVideoHistory] = useState([]);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [lipSyncLoading, setLipSyncLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [jobHistory, setJobHistory] = useState([]);
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

  const getVideoHistory = async () => {
    try {
      const response = await axiosPrivate.post("/video/get-video", {
        user_email: getUserEmail(),
      });
      setVideoHistory(response.data);
    } catch (error) {
      console.error("Error getting video history:", error);
    }
  };
  const getJobHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await axiosPrivate.get(`/video/jobs/${getUserEmail()}`);
      setJobHistory(response.data);
    } catch (error) {
      console.error("Error getting job history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };
  useEffect(() => {
    getAudioHistory();
    getVideoHistory();
    getJobHistory();
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

  const handleVideoUpload = async (event) => {
    setVideoLoading(true);
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("user_email", getUserEmail());

      try {
        const response = await axiosPrivate.post(
          "/video/upload-video",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        if (response.status === 200) {
          getVideoHistory();
          toast({
            description: "Video uploaded successfully!",
          });
        }
      } catch (error) {
        console.error("Error uploading video:", error);
        toast({
          variant: "destructive",
          title: "Error uploading video.",
          description: error.response.data.detail
            ? error.response.data.detail
            : "An error occurred.",
        });
      } finally {
        setVideoLoading(false);
      }
    }
  };
  const handleLipSync = async () => {
    if (!selectedAudio || !selectedVideo) {
      toast({
        variant: "destructive",
        title: "Error syncing audio.",
        description: "Please select an audio and video.",
      });
      return;
    }
    if (lipSyncLoading) {
      toast({
        variant: "destructive",
        title: "Error syncing audio.",
        description: "Please wait for the previous sync to complete.",
      });
      return;
    }
    if (!selectedVideo) {
      toast({
        variant: "destructive",
        title: "Error syncing audio.",
        description: "Please select a video.",
      });
      return;
    }
    setLipSyncLoading(true);
    try {
      const response = await axiosPrivate.post("/video/sync-audio", {
        user_email: getUserEmail(),
        audio_id: selectedAudio,
        video_id: selectedVideo,
      });
      if (response.status === 200) {
        getVideoHistory();
        toast({
          description: "Audio synced successfully!",
        });
      }
    } catch (error) {
      console.error("Error syncing audio:", error);
      toast({
        variant: "destructive",
        title: "Error syncing audio.",
        description: error.response.data.detail
          ? error.response.data.detail
          : "An error occurred.",
      });
    } finally {
      setLipSyncLoading(false);
    }
  };
  const getJobInfo = async (user_id, video_id) => {
    try {
      const response = await axiosPrivate.get(
        `/video/job/${user_id}/${video_id}`
      );
      console.log(response.data);
    } catch (error) {
      console.error("Error getting job info:", error);
    }
  };
  // Separate completed and pending jobs
  const completedJobs = jobHistory.filter((job) => job.status === "COMPLETED");
  const pendingJobs = jobHistory.filter((job) => job.status !== "COMPLETED");
  return (
    <>
      <div className="flex-1 flex space-x-4">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="flex-1 p-8 flex flex-col">
            {/* Text Input Area */}
            <div className="flex-1 ">
              {historyLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {pendingJobs.map((job, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 mb-4 shadow-sm w-fit"
                    >
                      <p>
                        <strong>Status:</strong> {job.status}
                      </p>
                      <p>
                        <strong>Created At:</strong> {job.created_at}
                      </p>
                      <button
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        onClick={() => getJobInfo(job.user_id, job.video_id)}
                      >
                        Get Info
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between mt-6 space-x-4">
              <div className="flex space-x-4">
                <Select
                  onValueChange={(value) => {
                    setSelectedAudio(value);
                  }}
                >
                  <SelectTrigger className="rounded-full w-[200px] px-4 py-2 border border-gray-200 hover:bg-gray-50 flex items-center">
                    <SelectValue placeholder="Choose from audio history" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[300px] overflow-y-auto">
                    {audioHistory.map((audio) => (
                      <SelectItem
                        value={audio.audio_id}
                        key={audio.audio_id}
                        className="whitespace-wrap"
                      >
                        {audio.file_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <input
                  type="file"
                  accept=".mp4,.mov,.avi"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="rounded-full px-4 py-2 border border-gray-200 hover:bg-gray-50 flex items-center cursor-pointer"
                >
                  <span className="text-sm whitespace-nowrap">
                    {videoLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                    ) : (
                      "Upload a video"
                    )}
                  </span>
                </label>
                <Select
                  onValueChange={(value) => {
                    setSelectedVideo(value);
                  }}
                >
                  <SelectTrigger className="rounded-full w-[200px] px-4 py-2 border border-gray-200 hover:bg-gray-50 flex items-center">
                    <SelectValue placeholder="Choose from video history" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[300px] overflow-y-auto">
                    {videoHistory.map((video) => (
                      <SelectItem
                        value={video.video_id}
                        key={video.video_id}
                        className="whitespace-wrap"
                      >
                        {video.file_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button
                className="rounded-full px-6 py-2 bg-black text-white hover:bg-gray-800 flex items-center space-x-2"
                disabled={lipSyncLoading}
                onClick={handleLipSync}
              >
                {lipSyncLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <span className="text-sm">Lip Sync</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Video Preview Area - Right Side */}
        <div className="w-96 space-y-4 relative">
          <h2 className="text-xl font-semibold">Synced Videos</h2>
          {completedJobs.map((job) => (
            <div key={job.video_id}>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="relative w-80 bg-gray-100 rounded-xl overflow-hidden">
                  <video src={job?.job_result?.outputUrl} controls></video>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default TextToVideo;
