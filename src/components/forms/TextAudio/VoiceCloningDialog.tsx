import { useState, ChangeEvent } from "react";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import axiosPrivate from "../../../api/axios";
import { useAuth } from "../../auth";
import { useToast } from "../../../hooks/use-toast";

const VoiceCloningDialog = ({
  setShowCloneDialog,
  fetchCloneVoices,
}: {
  setShowCloneDialog: (show: boolean) => void;
  fetchCloneVoices: () => void;
}) => {
  const { toast } = useToast();
  const { getUserEmail } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");
  const [voiceName, setVoiceName] = useState<string>("");
  const [voiceDescription, setVoiceDescription] = useState<string>("");
  const [cloneLoading, setCloneLoading] = useState<boolean>(false);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
    setCloneLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("user_email", getUserEmail() || "");
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
          (error as any).response?.data?.detail ||
          "An error occurred while cloning your voice.",
      });
    } finally {
      setCloneLoading(false);
    }
  };
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 w-1/3">
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
                Please upload a well-recorded audio file that is between 1 and 5
                minutes long.
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
                disabled={cloneLoading}
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
                className="flex-1 bg-black flex justify-center items-center text-white rounded-md py-2 hover:bg-gray-800"
                onClick={handleCloneVoice}
                disabled={!selectedFile || !!fileError || cloneLoading}
              >
                {cloneLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  "Clone Voice"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VoiceCloningDialog;
