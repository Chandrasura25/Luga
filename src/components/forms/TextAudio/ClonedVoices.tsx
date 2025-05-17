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
}

interface ClonedVoicesProps {
  selectedVoice: Voice | null;
  cloneVoices: Voice[];
  handlePlayPreview: (voice: Voice) => void;
  handleSelectVoice: (voice: Voice) => void;
}

const ClonedVoices: React.FC<ClonedVoicesProps> = ({
  selectedVoice,
  cloneVoices,
  handlePlayPreview,
  handleSelectVoice,
}) => {
  return (
    <div>
      <Select
        onValueChange={(value) => {
          const voice = cloneVoices.find((v) => v.voice_id === value);
          if (voice) {
            handleSelectVoice(voice);
            handlePlayPreview(voice);
          }
        }}
        defaultValue={selectedVoice?.voice_id}
      >
        <SelectTrigger className="rounded-full px-4 py-2 border border-gray-200 hover:bg-gray-50 flex items-center">
          <SelectValue placeholder="Clone Voice" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Cloned Voices</SelectLabel>
            {cloneVoices.length > 0 && (
              <>
                {cloneVoices.map((voice) => (
                  <SelectItem key={voice.voice_id} value={voice.voice_id}>
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
    </div>
  );
};

export default ClonedVoices;
