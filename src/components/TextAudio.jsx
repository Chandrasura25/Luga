import { useState } from 'react';
import { Play, Download, Trash2 } from 'lucide-react';

const TextAudio = () => {
  const [text, setText] = useState('');
  
  const audioFiles = [
    {
      name: 'Hamid_French_Introducing Luga ..._2024-09-04.mp3',
      duration: '0:20',
      current: '0:02'
    },
    {
      name: 'Zhuorui_Arabic_Luga AI is ..._2024-09-04.mp3',
      duration: '0:20',
      current: '0:02'
    },
    {
      name: 'Gulidalai_Spanish_We frontier in ..._2024-09-04.mp3',
      duration: '0:20',
      current: '0:02'
    },
    {
      name: 'Ruisi_Chinese_Luga AI is ..._2024-09-04.mp3',
      duration: '0:20',
      current: '0:02'
    },
    {
      name: 'Nam_Arabic_Luga AI is ..._2024-09-04.mp3',
      duration: '0:20',
      current: '0:02'
    }
  ];

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
        {audioFiles.map((file, index) => (
          <div key={index} className="group flex items-center py-4 first:pt-0 last:pb-0">
            <Play className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
            <div className="ml-4 flex-1 min-w-0">
              <div className="text-sm truncate">{file.name}</div>
              <div className="text-xs text-gray-400">{file.current} / {file.duration}</div>
            </div>
            <div className="flex items-center space-x-4 ml-4">
              <Download className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
              <Trash2 className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TextAudio;