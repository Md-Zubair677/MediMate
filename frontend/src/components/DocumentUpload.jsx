import React, { useState } from 'react';
import completeApiService from '../services/completeApiService';

const DocumentUpload = ({ userId = 'demo' }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      // Simulate file content for demo
      const documentData = {
        user_id: userId,
        document_name: selectedFile.name,
        document_content: `Medical report content from ${selectedFile.name}. This is a simulated upload for demo purposes.`,
        file_size: selectedFile.size,
        file_type: selectedFile.type
      };

      const response = await completeApiService.uploadReport(documentData);
      setUploadResult(response);
    } catch (error) {
      setUploadResult({
        success: false,
        error: 'Upload failed: ' + error.message
      });
    }
    setLoading(false);
  };

  return (
    <div className="document-upload">
      <h2>📄 Document Upload & Analysis</h2>
      
      <div 
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <p>Drag and drop your medical documents here</p>
          <p>or</p>
          <input
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png,.txt"
            className="file-input"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="file-label">
            Choose File
          </label>
        </div>
      </div>

      {selectedFile && (
        <div className="selected-file">
          <h3>Selected File:</h3>
          <div className="file-info">
            <span className="file-name">📄 {selectedFile.name}</span>
            <span className="file-size">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
          <button 
            onClick={uploadDocument} 
            disabled={loading}
            className="upload-button"
          >
            {loading ? 'Analyzing...' : 'Upload & Analyze'}
          </button>
        </div>
      )}

      {uploadResult && (
        <div className="upload-result">
          {uploadResult.success ? (
            <div className="analysis-results">
              <h3>✅ Analysis Complete</h3>
              <div className="analysis-section">
                <h4>Document Information:</h4>
                <p><strong>Type:</strong> {uploadResult.analysis.document_type}</p>
                <p><strong>Risk Level:</strong> 
                  <span className={`risk-${uploadResult.analysis.risk_assessment.toLowerCase()}`}>
                    {uploadResult.analysis.risk_assessment}
                  </span>
                </p>
              </div>
              
              <div className="analysis-section">
                <h4>Key Findings:</h4>
                <ul>
                  {uploadResult.analysis.findings.map((finding, index) => (
                    <li key={index}>{finding}</li>
                  ))}
                </ul>
              </div>
              
              <div className="analysis-section">
                <h4>AI Recommendations:</h4>
                <ul>
                  {uploadResult.analysis.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
              
              <div className="ai-badge">
                🤖 {uploadResult.analysis.ai_analysis}
              </div>
              
              <div className="appointment-section">
                <button 
                  onClick={() => window.open('/appointments', '_blank')}
                  className="book-appointment-btn"
                >
                  📅 Book Appointment Based on Results
                </button>
              </div>
            </div>
          ) : (
            <div className="error-result">
              <h3>❌ Upload Failed</h3>
              <p>{uploadResult.error}</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .document-upload {
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        .upload-area {
          border: 2px dashed #ccc;
          border-radius: 10px;
          padding: 40px;
          text-align: center;
          background: #f9f9f9;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .upload-area.drag-active {
          border-color: #007bff;
          background: #e3f2fd;
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .upload-icon {
          font-size: 48px;
          margin-bottom: 10px;
        }

        .file-input {
          display: none;
        }

        .file-label {
          background: #007bff;
          color: white;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          transition: background 0.3s;
        }

        .file-label:hover {
          background: #0056b3;
        }

        .selected-file {
          margin: 20px 0;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
          background: white;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 10px 0;
        }

        .file-name {
          font-weight: bold;
        }

        .file-size {
          color: #666;
          font-size: 14px;
        }

        .upload-button {
          background: #28a745;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        }

        .upload-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .upload-result {
          margin-top: 20px;
          padding: 20px;
          border-radius: 5px;
        }

        .analysis-results {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
        }

        .error-result {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .analysis-section {
          margin: 15px 0;
        }

        .analysis-section h4 {
          margin-bottom: 10px;
          color: #495057;
        }

        .analysis-section ul {
          margin: 0;
          padding-left: 20px;
        }

        .analysis-section li {
          margin: 5px 0;
        }

        .risk-moderate {
          color: #856404;
          background: #fff3cd;
          padding: 2px 6px;
          border-radius: 3px;
        }

        .risk-high {
          color: #721c24;
          background: #f8d7da;
          padding: 2px 6px;
          border-radius: 3px;
        }

        .risk-low {
          color: #155724;
          background: #d4edda;
          padding: 2px 6px;
          border-radius: 3px;
        }

        .ai-badge {
          background: #e3f2fd;
          color: #1976d2;
          padding: 10px;
          border-radius: 5px;
          margin-top: 15px;
          font-size: 14px;
        }

        .appointment-section {
          margin-top: 20px;
          text-align: center;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .book-appointment-btn {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(40, 167, 69, 0.2);
        }

        .book-appointment-btn:hover {
          background: linear-gradient(135deg, #218838 0%, #1ea085 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
        }
      `}</style>
    </div>
  );
};

export default DocumentUpload;
