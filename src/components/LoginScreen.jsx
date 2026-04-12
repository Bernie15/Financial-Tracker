import { useState, useRef, useEffect, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';

const VALID_USERNAME = 'Bernard';
const STORAGE_KEY = 'face_descriptor';

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [step, setStep] = useState('username'); // username | loading | camera | enrolling | verifying
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  // Load face-api models
  const loadModels = useCallback(async () => {
    try {
      setStep('loading');
      setMessage('Loading facial recognition models...');

      // Resolve the correct model path
      const testFile = 'tiny_face_detector_model-weights_manifest.json';
      const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
      const candidates = [
        `${base}models`,
        '/models',
        './models',
      ];

      let modelPath = candidates[0];
      for (const candidate of candidates) {
        try {
          const res = await fetch(`${candidate}/${testFile}`);
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('json')) {
            modelPath = candidate;
            break;
          }
        } catch {
          // try next candidate
        }
      }
      console.log('Loading models from:', modelPath);

      await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
      await faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);
      await faceapi.nets.faceRecognitionNet.loadFromUri(modelPath);
      setModelsLoaded(true);
      return true;
    } catch (err) {
      setError(`Failed to load facial recognition models: ${err.message}`);
      console.error('Model loading error:', err);
      return false;
    }
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera access and try again.');
      console.error(err);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Detect face and get descriptor
  const detectFace = async () => {
    if (!videoRef.current) return null;
    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
    return detection;
  };

  // Draw detection overlay
  const drawDetection = (detection) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const dims = faceapi.matchDimensions(canvas, video, true);
    const resized = faceapi.resizeResults(detection, dims);
    faceapi.draw.drawDetections(canvas, [resized]);
    faceapi.draw.drawFaceLandmarks(canvas, [resized]);
  };

  // Handle username submission
  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (username.trim().toLowerCase() !== VALID_USERNAME.toLowerCase()) {
      setError('Invalid username.');
      return;
    }

    const loaded = modelsLoaded || (await loadModels());
    if (!loaded) return;

    const hasEnrolledFace = localStorage.getItem(STORAGE_KEY);
    if (hasEnrolledFace) {
      setStep('verifying');
      setMessage('Position your face in the camera to verify identity...');
    } else {
      setStep('enrolling');
      setMessage('No face registered. Look at the camera to enroll your face.');
    }
    await startCamera();
  };

  // Capture & enroll face
  const handleEnroll = async () => {
    setError('');
    setMessage('Scanning face...');
    const detection = await detectFace();
    if (!detection) {
      setError('No face detected. Make sure your face is visible and well-lit.');
      setMessage('Look at the camera to enroll your face.');
      return;
    }
    drawDetection(detection);
    // Store descriptor as JSON array
    const descriptorArray = Array.from(detection.descriptor);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(descriptorArray));
    setMessage('Face enrolled successfully! Logging in...');
    stopCamera();
    setTimeout(() => onLogin(), 800);
  };

  // Verify face
  const handleVerify = async () => {
    setError('');
    setMessage('Verifying face...');
    const detection = await detectFace();
    if (!detection) {
      setError('No face detected. Make sure your face is visible and well-lit.');
      setMessage('Position your face in the camera to verify identity...');
      return;
    }
    drawDetection(detection);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const storedDescriptor = new Float32Array(stored);
    const distance = faceapi.euclideanDistance(detection.descriptor, storedDescriptor);

    if (distance < 0.55) {
      setMessage('Face verified! Logging in...');
      stopCamera();
      setTimeout(() => onLogin(), 800);
    } else {
      setError('Face does not match. Please try again.');
      setMessage('Position your face in the camera to verify identity...');
    }
  };

  // Re-enroll face (reset)
  const handleReEnroll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStep('enrolling');
    setMessage('Look at the camera to enroll your face.');
    setError('');
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-icon">🔒</div>
        <h2 className="login-title">Financial Tracker</h2>
        <p className="login-subtitle">Secure Access Required</p>

        {step === 'username' && (
          <form className="login-form" onSubmit={handleUsernameSubmit}>
            <label className="login-label">Username</label>
            <input
              className="login-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoFocus
            />
            <button className="login-btn" type="submit">
              Continue
            </button>
          </form>
        )}

        {step === 'loading' && (
          <div className="login-status">
            <div className="login-spinner" />
            <p>{message}</p>
          </div>
        )}

        {(step === 'enrolling' || step === 'verifying') && (
          <div className="login-camera">
            <p className="login-camera-msg">{message}</p>
            <div className="login-video-wrap">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                width={400}
                height={300}
              />
              <canvas ref={canvasRef} className="login-canvas" />
            </div>
            <div className="login-camera-actions">
              {step === 'enrolling' && (
                <button className="login-btn" onClick={handleEnroll}>
                  📸 Capture & Enroll Face
                </button>
              )}
              {step === 'verifying' && (
                <>
                  <button className="login-btn" onClick={handleVerify}>
                    ✅ Verify Face
                  </button>
                  <button
                    className="login-btn login-btn-secondary"
                    onClick={handleReEnroll}
                  >
                    🔄 Re-enroll Face
                  </button>
                </>
              )}
              <button
                className="login-btn login-btn-secondary"
                onClick={() => {
                  stopCamera();
                  setStep('username');
                  setError('');
                  setMessage('');
                }}
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}

export default LoginScreen;
