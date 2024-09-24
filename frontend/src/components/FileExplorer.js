import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaFolder, FaFile, FaImage } from 'react-icons/fa';
import './FileExplorer.css';
import FilePreview from './FilePreview';

const FileExplorer = () => {
  const [sourcePaths, setSourcePaths] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [files, setFiles] = useState({});
  const [currentPaths, setCurrentPaths] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);
  const [page, setPage] = useState({});
  const [hasMore, setHasMore] = useState({});
  const [sortOrder, setSortOrder] = useState('lastModified');
  const [iconSize, setIconSize] = useState('normal');
  const itemsPerPage = 20;
  const [selectedFile, setSelectedFile] = useState(null);
  const [filter, setFilter] = useState({});

  const baseUrl = `${window.location.protocol}//${window.location.host}`;

  useEffect(() => {
    fetchSourcePaths();
  }, []);

  const fetchFiles = useCallback(async (path, pageNum, tabIndex, currentFilter = '') => {
    setLoading(prev => ({ ...prev, [tabIndex]: true }));
    setError(null);
    try {
      const response = await axios.get(`${baseUrl}/api/files`, {
        params: {
          path: encodeURIComponent(path),
          page: pageNum,
          limit: itemsPerPage,
          filter: currentFilter || undefined
        }
      });
      let fetchedFiles = response.data.items;
      if (sortOrder === 'lastModified') {
        fetchedFiles.sort((a, b) => b.lastModified - a.lastModified);
      } else if (sortOrder === 'name') {
        fetchedFiles.sort((a, b) => a.name.localeCompare(b.name));
      }
      setFiles(prevFiles => ({
        ...prevFiles,
        [tabIndex]: pageNum === 1 ? fetchedFiles : [...(prevFiles[tabIndex] || []), ...fetchedFiles]
      }));
      setHasMore(prevHasMore => ({
        ...prevHasMore,
        [tabIndex]: response.data.has_more
      }));
    } catch (err) {
      setError(`Error fetching files for ${path}`);
    }
    setLoading(prev => ({ ...prev, [tabIndex]: false }));
  }, [baseUrl, itemsPerPage, sortOrder]);

  useEffect(() => {
    if (sourcePaths.length > 0) {
      sourcePaths.forEach((path, index) => {
        setCurrentPaths(prev => ({ ...prev, [index]: path }));
        fetchFiles(path, 1, index);
      });
    }
  }, [sourcePaths, fetchFiles]);

  const fetchSourcePaths = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/source-paths`);
      setSourcePaths(response.data.paths);
      setActiveTab(0);
    } catch (err) {
      setError('Error fetching source paths');
    }
  };

  const loadMore = () => {
    if (!loading[activeTab] && hasMore[activeTab]) {
      const nextPage = (page[activeTab] || 1) + 1;
      setPage(prevPage => ({
        ...prevPage,
        [activeTab]: nextPage
      }));
      fetchFiles(currentPaths[activeTab], nextPage, activeTab);
    }
  };

  const handleFileClick = (file) => {
    if (file.type === 'directory') {
      const newPath = `${currentPaths[activeTab]}/${file.name}`;
      setCurrentPaths(prev => ({ ...prev, [activeTab]: newPath }));
      fetchFiles(newPath, 1, activeTab);
      setSelectedFile(null);
    } else {
      const filePath = `${currentPaths[activeTab]}/${file.name}`;
      setSelectedFile({ ...file, path: filePath });
    }
  };

  const handleBackClick = () => {
    const currentPath = currentPaths[activeTab];
    const newPath = currentPath.split('/').slice(0, -1).join('/');
    setCurrentPaths(prev => ({ ...prev, [activeTab]: newPath }));
    fetchFiles(newPath, 1, activeTab);
  };

  const FileIcon = ({ file, iconSize }) => {
    const sizeClass = `icon-${iconSize}`;

    if (file.type === 'directory') {
      return <FaFolder className={sizeClass} />;
    } else if (file.image_base64) {
      return <img src={`data:image/jpeg;base64,${file.image_base64}`} alt={file.name} className={`${sizeClass} file-icon-image`} />;
    } else if (file.name.match(/\.(jpeg|jpg|gif|png)$/i)) {
      return <FaImage className={sizeClass} />;
    } else {
      return <FaFile className={sizeClass} />;
    }
  };

  const getIcon = (file) => {
    return <FileIcon file={file} iconSize={iconSize} />;
  };

  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    setFilter(prev => ({ ...prev, [activeTab]: newFilter }));
    setFiles(prev => ({ ...prev, [activeTab]: [] }));
    setPage(prev => ({ ...prev, [activeTab]: 1 }));
    setHasMore(prev => ({ ...prev, [activeTab]: false }));
    fetchFiles(currentPaths[activeTab], 1, activeTab, newFilter);
  };

  return (
    <div className="file-explorer">
      <div className="explorer-content">
        <div className="file-list-container">
          <div className="tabs">
            {sourcePaths.map((path, index) => (
              <button
                key={index}
                className={`tab ${index === activeTab ? 'active' : ''}`}
                onClick={() => setActiveTab(index)}
              >
                {path}
              </button>
            ))}
          </div>
          {sourcePaths.length > 0 ? (
            <>
              <h3>Current Path: {currentPaths[activeTab] || '/'}</h3>
              {currentPaths[activeTab] !== sourcePaths[activeTab] && (
                <button onClick={handleBackClick}>Back</button>
              )}
              <div>
                <label>Sort by: </label>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                  <option value="lastModified">Last Modified</option>
                  <option value="name">Name</option>
                </select>
              </div>
              <div>
                <label>Icon Size: </label>
                <select value={iconSize} onChange={(e) => setIconSize(e.target.value)}>
                  <option value="extra-large">Extra Large</option>
                  <option value="large">Large</option>
                  <option value="normal">Normal</option>
                  <option value="small">Small</option>
                </select>
              </div>
              <div>
                <label>Filter: </label>
                <input
                  type="text"
                  value={filter[activeTab] || ''}
                  onChange={handleFilterChange}
                  placeholder="Filter files and folders"
                />
              </div>
              {loading[activeTab] ? (
                <div>Loading files...</div>
              ) : (
                <>
                  <ul className="file-list">
                    {(files[activeTab] || []).map((file) => (
                      <li 
                        key={file.name} 
                        onClick={() => handleFileClick(file)}
                        className={selectedFile && selectedFile.name === file.name && selectedFile.path === `${currentPaths[activeTab]}/${file.name}` ? 'selected' : ''}
                      >
                        {getIcon(file)} {file.name}
                      </li>
                    ))}
                  </ul>
                  {hasMore[activeTab] && <button onClick={loadMore}>Load More</button>}
                </>
              )}
            </>
          ) : (
            <div>Loading source paths...</div>
          )}
          {error && <div className="error">{error}</div>}
        </div>
        <div className="preview-container">
          {selectedFile ? (
            <FilePreview file={selectedFile} baseUrl={baseUrl} />
          ) : (
            <div className="no-preview">No file selected</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;