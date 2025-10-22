import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Brain, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

const HealthAnalyzer = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    setAnalyzing(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', 'test-user');

    try {
      const response = await fetch('/api/health-reports/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        setAnalysisResult(result.report);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      // Mock result for demo
      setAnalysisResult({
        id: 'demo-123',
        name: file.name,
        date: new Date().toISOString().split('T')[0],
        status: 'analyzed',
        insights: 'Blood glucose levels are within normal range. Cholesterol slightly elevated - consider dietary modifications.',
        critical: false,
        extractedValues: {
          'Blood Glucose': { value: '95 mg/dL', status: 'normal', range: '70-100 mg/dL' },
          'Total Cholesterol': { value: '220 mg/dL', status: 'high', range: '<200 mg/dL' },
          'HDL Cholesterol': { value: '45 mg/dL', status: 'normal', range: '>40 mg/dL' },
          'Blood Pressure': { value: '125/80 mmHg', status: 'normal', range: '<120/80 mmHg' }
        },
        recommendations: [
          'Maintain current glucose management',
          'Reduce saturated fat intake to lower cholesterol',
          'Increase physical activity to 150 minutes per week',
          'Schedule follow-up in 3 months'
        ]
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Brain className="mr-2 text-blue-600" size={24} />
          AI Health Report Analyzer
        </h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">
            Upload lab reports, blood tests, or medical documents for AI analysis
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supports PDF, JPG, PNG files up to 10MB
          </p>
          
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            className="hidden"
            id="health-report-upload"
            disabled={analyzing}
          />
          
          <label
            htmlFor="health-report-upload"
            className={`inline-flex items-center px-6 py-3 rounded-lg cursor-pointer transition-colors ${
              analyzing 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {analyzing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Upload size={20} className="mr-2" />
                Choose File
              </>
            )}
          </label>
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                <FileText className="mr-2 text-blue-600" size={20} />
                Analysis Results: {analysisResult.name}
              </h4>
              <div className="flex items-center">
                {analysisResult.critical ? (
                  <AlertTriangle className="text-red-600" size={20} />
                ) : (
                  <CheckCircle className="text-green-600" size={20} />
                )}
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${
              analysisResult.critical ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
            }`}>
              <p className={`text-sm ${
                analysisResult.critical ? 'text-red-800' : 'text-green-800'
              }`}>
                {analysisResult.insights}
              </p>
            </div>
          </div>

          {/* Extracted Values */}
          {analysisResult.extractedValues && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <TrendingUp className="mr-2 text-blue-600" size={20} />
                Extracted Values
              </h4>
              
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(analysisResult.extractedValues).map(([key, data]) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-800">{key}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        data.status === 'normal' 
                          ? 'bg-green-100 text-green-800'
                          : data.status === 'high'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {data.status}
                      </span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{data.value}</div>
                    <div className="text-sm text-gray-600">Normal: {data.range}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysisResult.recommendations && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                AI Recommendations
              </h4>
              
              <div className="space-y-3">
                {analysisResult.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="text-blue-600 mt-0.5" size={16} />
                    <span className="text-blue-800 text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <FileText size={18} />
              <span>View Full Report</span>
            </button>
            <button className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <TrendingUp size={18} />
              <span>Track Trends</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default HealthAnalyzer;
