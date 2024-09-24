import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FilePreview = ({ file }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const baseUrl = `${window.location.protocol}//${window.location.host}`;

  useEffect(() => {
    if (!file || !file.path) {
      setLoading(false);
      return;
    }

    const fetchPreview = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${baseUrl}/api/preview?path=${encodeURIComponent(file.path)}`);
        setPreview(response.data.content);
      } catch (err) {
        setError('Error fetching file preview');
      }
      setLoading(false);
    };

    fetchPreview();
  }, [file, baseUrl]);

  const handleDownload = async () => {
    if (!file || !file.path) return;

    try {
      const response = await axios.get(`${baseUrl}/api/download?path=${encodeURIComponent(file.path)}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Error downloading file');
    }
  };

  if (!file) return null;
  if (loading) return <div>Loading preview...</div>;
  if (error) return <div>{error}</div>;

  const isImage = file.name.match(/\.(jpeg|jpg|gif|png)$/i);

  return (
    <div className="file-preview">
      <h3>{file.name}</h3>
      {isImage ? (
        <img src={preview} alt={file.name} style={{ maxWidth: '320px', maxHeight: '320px' }} />
      ) : (
        <pre>{preview}</pre>
      )}
      <button onClick={handleDownload}>Download</button>
    </div>
  );
};

export default FilePreview;