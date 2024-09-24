import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import FileExplorer from './components/FileExplorer';
import FilePreview from './components/FilePreview';
import './App.css';

function App() {
  const [selectedPath, setSelectedPath] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <FileExplorer
          selectedPath={selectedPath}
          setSelectedPath={setSelectedPath}
          setSelectedFile={setSelectedFile}
        />
        <FilePreview selectedFile={selectedFile} />
      </div>
    </div>
  );
}

export default App;
