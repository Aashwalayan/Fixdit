import React, { useState, useRef } from 'react';
import { 
  Camera, Upload, Sparkles, RefreshCw, AlertCircle, FileText, 
  MapPin, ShieldAlert, CheckCircle2, CheckSquare, Edit2
} from 'lucide-react';
import { IssuePost, SeverityType } from '../types';

interface ReportIssueFormProps {
  token: string;
  username: string;
  onIssueCreated: (newIssue: IssuePost) => void;
  onCancel: () => void;
}

export const ReportIssueForm: React.FC<ReportIssueFormProps> = ({
  token,
  username,
  onIssueCreated,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Roads & Potholes');
  const [severity, setSeverity] = useState<SeverityType>('medium');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locationPermissionError, setLocationPermissionError] = useState<string | null>(null);
  
  // Image & Gemini state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [suggestedDepartment, setSuggestedDepartment] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [isEditingAI, setIsEditingAI] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const captureCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationPermissionError('Browser location is unavailable. Please enable geolocation for accurate map pins.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        setLocationPermissionError(null);
      },
      () => {
        setLocationPermissionError('Location access was denied. The map pin may be less accurate until location is enabled.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  React.useEffect(() => {
    captureCurrentLocation();
  }, []);

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageFile = async (file: File) => {
    setError(null);
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file (PNG, JPEG, WebP).');
      }

      // Max 10MB
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image size exceeds 10MB limit.');
      }

      const base64 = await fileToBase64(file);
      setSelectedImage(base64);

      // Trigger Gemini API Analysis immediately upon upload
      triggerGeminiAnalysis(base64, file.type);
    } catch (err: any) {
      setError(err.message || 'Error processing image file.');
    }
  };

  const triggerGeminiAnalysis = async (base64Data: string, mime: string) => {
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      if (latitude === undefined || longitude === undefined) {
        captureCurrentLocation();
      }

      const analysisLat = latitude;
      const analysisLng = longitude;

      const response = await fetch('/api/issues/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: mime,
          lat: analysisLat,
          lng: analysisLng,
          description: description || "New report submission"
        }),
      });

      if (!response.ok) {
        throw new Error('Gemini API analysis failed. Falling back to default manual tagging.');
      }

      const data = await response.json();
      const analysis = data.analysis;

      setAnalysisResult(analysis);

      // Pre-fill fields with Gemini smart analysis recommendation
      if (analysis.category) setCategory(analysis.category);
      if (analysis.severity) setSeverity(analysis.severity as SeverityType);
      if (analysis.suggestedDepartment) setSuggestedDepartment(analysis.suggestedDepartment);
      if (analysis.aiSummary) setAiSummary(analysis.aiSummary);
      setIsEditingAI(false);
      
      // Auto pre-fill description or title if empty to ease citizen friction
      if (!title) {
        const firstFewWords = analysis.aiSummary.split(' ').slice(0, 5).join(' ');
        setTitle(firstFewWords + '...');
      }
    } catch (err: any) {
      console.error(err);
      setError('Gemini analysis unavailable. Manual report setup active.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Drag handles
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a report title.');
      return;
    }
    if (!location.trim()) {
      setError('Please provide the physical location or intersection.');
      return;
    }
    if (latitude === undefined || longitude === undefined) {
      setError('We could not determine your current coordinates. Please allow location access and try again.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || 'No detailed description provided.',
        category,
        severity,
        latitude,
        longitude,
        image: selectedImage || 'https://images.unsplash.com/photo-1584467541268-b029fb34de4e?w=600&auto=format&fit=crop&q=60',
        location: location.trim(),
        aiSummary: aiSummary,
        suggestedDepartment: suggestedDepartment || 'Department of Public Works',
        creator: username,
        status: 'reported',
      };

      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Could not submit report to city registry.');
      }

      const newIssue = await response.json();
      onIssueCreated(newIssue);
    } catch (err: any) {
      setError(err.message || 'Server error uploading report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-fadeIn" id="report-issue-form-card">
      <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 className="font-extrabold text-slate-950 text-base tracking-tight flex items-center gap-2">
          <Camera className="w-5 h-5 text-orange-500 animate-pulse" />
          Report Civic Infrastructure Issue
        </h3>
        <button
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-slate-600 font-bold transition cursor-pointer"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5" onDragEnter={handleDrag}>
        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold flex items-start gap-2 animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {locationPermissionError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold flex items-start gap-2">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{locationPermissionError}</span>
          </div>
        )}

        {/* Drag and Drop Image Box */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
            1. Evidence Upload (Image Drag-n-Drop)
          </label>
          <div
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden ${
              dragActive 
                ? 'border-orange-500 bg-orange-50/40 scale-[0.99]' 
                : selectedImage 
                  ? 'border-slate-200 hover:border-slate-300 bg-slate-50/40' 
                  : 'border-slate-200 hover:border-orange-400 bg-white hover:bg-slate-50/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleImageFile(e.target.files[0])}
              className="hidden"
              accept="image/*"
            />

            {selectedImage ? (
              <div className="relative w-full max-h-[160px] rounded-xl overflow-hidden flex justify-center items-center">
                <img src={selectedImage} alt="Uploaded evidence" className="object-cover max-h-[160px] rounded-xl shadow-sm" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 hover:opacity-100 flex items-center justify-center transition">
                  <span className="bg-white/95 text-slate-800 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" /> Change Photo
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center mx-auto shadow-sm">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Drag & drop your issue image, or <span className="text-orange-500 hover:underline">browse</span></p>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">Supports JPEG, PNG, WebP up to 10MB. Intercepted for auto AI audit.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gemini Analysis Live Notification Card */}
        {analyzing && (
          <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-orange-500 animate-spin" />
              <div>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  Gemini API Vision Model Analyzing...
                </p>
                <p className="text-[10px] text-slate-500">Extracting category, physical severity, and responsible local agency.</p>
              </div>
            </div>
          </div>
        )}

        {/* Gemini Analysis Live Notification Card / Manual classification */}
        <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2.5 animate-fadeIn" id="ai-analysis-card">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
              <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
              Gemini AI Audited Metadata
            </div>
            <div className="flex items-center gap-2">
              {analysisResult ? (
                <span className="text-[9px] font-mono text-emerald-600 font-extrabold flex items-center gap-0.5 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                  <CheckCircle2 className="w-2.5 h-2.5" /> CONFIRMED
                </span>
              ) : (
                <span className="text-[9px] font-mono text-slate-500 font-extrabold flex items-center gap-0.5 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                  <AlertCircle className="w-2.5 h-2.5 text-slate-400" /> MANUAL MODE
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsEditingAI(!isEditingAI)}
                className="text-[10px] bg-white border border-slate-200 hover:border-slate-300 text-slate-600 font-bold px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <Edit2 className="w-3 h-3 text-slate-500" />
                {isEditingAI ? 'Save' : 'Edit'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Suggested Category</span>
              {isEditingAI ? (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 focus:border-orange-400 px-2 py-1.5 rounded-xl outline-none focus:ring-1 focus:ring-orange-400/20 transition cursor-pointer mt-1"
                >
                  <option value="Roads & Potholes">Roads & Potholes</option>
                  <option value="Garbage & Sanitation">Garbage & Sanitation</option>
                  <option value="Water & Leakages">Water & Leakages</option>
                  <option value="Lighting & Power">Lighting & Power</option>
                  <option value="Parks & Infrastructure">Parks & Infrastructure</option>
                  <option value="Public Transit">Public Transit</option>
                  <option value="Road Damage">Road Damage</option>
                  <option value="Garbage">Garbage</option>
                  <option value="Water Leakage">Water Leakage</option>
                  <option value="Drainage">Drainage</option>
                  <option value="Street Light">Street Light</option>
                  <option value="Public Safety">Public Safety</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <span className="font-semibold text-slate-700 block mt-0.5">{category || 'Roads & Potholes'}</span>
              )}
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Severity Level</span>
              {isEditingAI ? (
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as SeverityType)}
                  className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 focus:border-orange-400 px-2 py-1.5 rounded-xl outline-none focus:ring-1 focus:ring-orange-400/20 transition cursor-pointer mt-1"
                >
                  <option value="low">Low (Cosmetic, non-dangerous)</option>
                  <option value="medium">Medium (Moderate asset damage)</option>
                  <option value="high">High (Disruptive, potential accident hazard)</option>
                  <option value="critical">Critical (Immediate danger to life/limb)</option>
                </select>
              ) : (
                <span className="font-semibold text-slate-700 capitalize flex items-center gap-1 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    severity === 'critical' ? 'bg-red-500' : severity === 'high' ? 'bg-orange-400' : 'bg-yellow-400'
                  }`} />
                  {severity}
                </span>
              )}
            </div>
            <div className="col-span-2 border-t border-slate-150 pt-2">
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Assigned Department</span>
              <span className="font-semibold text-slate-700 block mt-0.5">{suggestedDepartment || 'Department of Public Works'}</span>
            </div>
            <div className="col-span-2 border-t border-slate-150 pt-2">
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Visual AI Audit Summary</span>
              <span className="text-[11px] text-slate-500 italic block mt-0.5 leading-relaxed bg-white p-2 border border-slate-100 rounded-lg">
                "{aiSummary || 'No image uploaded yet. Automatic visual audit will run upon image upload.'}"
              </span>
            </div>
          </div>
        </div>

        {/* Text Fields Grid */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                Report Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Blocked sewer drainage causing localized street flooding"
                className="w-full text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-400 px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-orange-400/20 transition"
                required
              />
            </div>

            {/* Location (required) */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                Intersection / Street Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Corner of 16th St & Mission St, SF"
                  className="w-full text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-400 pl-8 pr-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-orange-400/20 transition"
                  required
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
              Detailed Description / Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context (e.g. dimensions, safety hazards, blockages, times noticed) to help city crews triage correctly."
              rows={3}
              className="w-full text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-400 px-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-orange-400/20 transition resize-none"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/10 flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5" />
                Submit Incident Report
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
