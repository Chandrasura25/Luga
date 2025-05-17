import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

interface Voice {
  voice_id: string;
  name: string;
  labels: {
    gender: string;
    description: string;
    accent: string;
  };
}

interface SelectFromLibraryProps {
  handlePlayPreview: (voice: Voice) => void;
  handleSelectVoice: (voice: Voice) => void;
  voices: Voice[];
  loading: boolean;
  selectedVoice: Voice | null; // Added selectedVoice to the props
}

const SelectFromLibrary: React.FC<SelectFromLibraryProps> = ({ handlePlayPreview, handleSelectVoice, voices, loading, selectedVoice }) => {
  return (
    <div>
      <Select
        onValueChange={(value) => {
          const voice = voices.find((v) => v.voice_id === value);
          if (voice) {
            handlePlayPreview(voice);
            handleSelectVoice(voice);
          }
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
                  <SelectItem key={voice.voice_id} value={voice.voice_id}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <p className="uppercase">{voice.name}</p>
                        <p>
                          {voice.labels.gender}, {voice.labels.description},{" "}
                          {voice.labels.accent} accent
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SelectFromLibrary;
