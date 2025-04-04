import { useState } from 'react';
import axios from "../api/axios";

const VoiceClone = () => {
  const [files, setFiles] = useState([]);
  const [voiceName, setVoiceName] = useState('My Cloned Voice');
  const [description, setDescription] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [clonedVoice, setClonedVoice] = useState(null);
  const [previewText, setPreviewText] = useState('Hello, this is a preview of your cloned voice.');
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const cloneVoice = async () => {
    if (files.length === 0) {
      setError('Please upload at least one audio file');
      return;
    }

    setIsCloning(true);
    setError('');

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('voice_name', voiceName);
    formData.append('description', description);

    try {
      const response = await axios.post('/clone/clone-voice', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setClonedVoice(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to clone voice');
    } finally {
      setIsCloning(false);
    }
  };

  const generatePreview = async () => {
    if (!clonedVoice?.voice_id) {
      setError('No voice ID available');
      return;
    }

    setIsGeneratingPreview(true);
    setError('');

    try {
      const response = await axios.post('/clone/generate-preview', {
        voice_id: clonedVoice.voice_id,
        text: previewText
      });
      setPreviewUrl(`${response.data.preview_url}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate preview');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Voice Cloning with ElevenLabs</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">1. Upload Voice Samples</h2>
        <input 
          type="file" 
          multiple 
          onChange={handleFileChange} 
          accept="audio/*" 
          className="border border-gray-300 rounded p-2 mb-2"
        />
        <div>
          {files.map((file, index) => (
            <div key={index} className="text-gray-700">{file.name}</div>
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. Voice Details</h2>
        <div className="mb-4">
          <label className="block mb-1">Voice Name:</label>
          <input 
            type="text" 
            value={voiceName} 
            onChange={(e) => setVoiceName(e.target.value)} 
            className="border border-gray-300 rounded p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-1">Description:</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            className="border border-gray-300 rounded p-2 w-full"
          />
        </div>
      </div>
      
      <button 
        onClick={cloneVoice} 
        disabled={isCloning || files.length === 0}
        className={`bg-blue-500 text-white font-bold py-2 px-4 rounded ${isCloning ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isCloning ? 'Cloning...' : 'Clone Voice'}
      </button>
      
      {clonedVoice && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">3. Generate Preview</h2>
          <div className="mb-4">
            <label className="block mb-1">Preview Text:</label>
            <textarea 
              value={previewText} 
              onChange={(e) => setPreviewText(e.target.value)} 
              className="border border-gray-300 rounded p-2 w-full"
            />
          </div>
          <button 
            onClick={generatePreview} 
            disabled={isGeneratingPreview}
            className={`bg-green-500 text-white font-bold py-2 px-4 rounded ${isGeneratingPreview ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isGeneratingPreview ? 'Generating...' : 'Generate Preview'}
          </button>
          
          {previewUrl && (
            <div className="mt-4">
              <audio controls src={previewUrl} className="w-full" />
              <a href={previewUrl} download="preview.mp3" className="text-blue-500 underline">Download Preview</a>
            </div>
          )}
        </div>
      )}
      
      {error && <div className="text-red-500">{error}</div>}
      
      {clonedVoice && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">Voice Details</h3>
          <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(clonedVoice, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default VoiceClone;