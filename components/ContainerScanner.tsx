// src/components/ContainerScanner.tsx
import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';

interface ContainerScannerProps {
  onScanComplete: (number: string) => void;
  onError?: (error: string) => void; // Optional để xử lý lỗi từ parent
}

const ContainerScanner: React.FC<ContainerScannerProps> = ({ onScanComplete, onError }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  // Video constraints ưu tiên camera sau, độ phân giải vừa
  const videoConstraints = {
    facingMode: 'environment', // Camera sau trên mobile
    width: { ideal: 640 },
    height: { ideal: 480 },
  };

  // Chụp ảnh
  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        scanImage(imageSrc);
      }
    }
  }, []);

  // Preprocess ảnh: Resize + grayscale dùng canvas
  const preprocessImage = (src: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(src); // Fallback nếu lỗi

        ctx.drawImage(img, 0, 0, 640, 480);

        // Chuyển grayscale + tăng contrast đơn giản
        const imageData = ctx.getImageData(0, 0, 640, 480);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = data[i + 1] = data[i + 2] = avg > 128 ? 255 : 0; // Binary threshold cho contrast cao
        }
        ctx.putImageData(imageData, 0, 0);

        resolve(canvas.toDataURL('image/jpeg', 0.8)); // Chất lượng 80% để nhẹ
      };
    });
  };

  // Hàm OCR
  const scanImage = async (src: string) => {
    setScanning(true);
    setError(null);
    try {
      const processedSrc = await preprocessImage(src);
      const { data: { text } } = await Tesseract.recognize(
        processedSrc,
        'eng',
        {
          logger: (m) => console.log(m),
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', // Chỉ alphanumeric
        }
      );

      const containerRegex = /[A-Z]{4}\d{7}/g;
      const matches = text.match(containerRegex);
      const containerNumber = matches?.[0] || null;

      if (containerNumber && validateContainerNumber(containerNumber)) {
        onScanComplete(containerNumber);
        setCapturedImage(null); // Clear sau thành công
      } else {
        const errMsg = containerNumber ? 'Số container không hợp lệ (check digit sai).' : 'Không tìm thấy số container. Thử lại với ảnh rõ hơn.';
        setError(errMsg);
        if (onError) onError(errMsg);
      }
    } catch (err: any) {
      const errMsg = 'Lỗi quét: ' + err.message;
      setError(errMsg);
      if (onError) onError(errMsg);
    } finally {
      setScanning(false);
    }
  };

  // Validate ISO 6346 check digit
  const validateContainerNumber = (num: string): boolean => {
    if (num.length !== 11) return false;
    const prefix = num.slice(0, 4).toUpperCase();
    const digits = num.slice(4).split('').map(Number);
    let sum = 0;
    const letterValues: { [key: string]: number } = {
      A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19, J: 20,
      K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29, S: 30, T: 31,
      U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38,
    };

    for (let i = 0; i < 4; i++) {
      sum += (letterValues[prefix[i]] || 0) * Math.pow(2, i);
    }
    for (let i = 0; i < 6; i++) {
      sum += digits[i] * Math.pow(2, i + 4);
    }
    const checkDigit = digits[6];
    const calculated = sum % 11 === 10 ? 0 : sum % 11;
    return checkDigit === calculated;
  };

  // Upload từ file (fallback)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        setCapturedImage(src);
        scanImage(src);
      };
      reader.readAsDataURL(file);
    }
  };

  // Thử lại (reset)
  const retry = () => {
    setCapturedImage(null);
    setError(null);
  };

  return (
    <div style={{ textAlign: 'center', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '10px' }}>
      <p style={{ fontWeight: 'bold' }}>Quét số container</p>
      <p style={{ fontSize: '12px', color: '#666' }}>Zoom gần số, ánh sáng tốt, giữ yên 2 giây trước khi chụp.</p>

      {!capturedImage ? (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            style={{ width: '100%', maxWidth: '400px', borderRadius: '8px' }}
          />
          <button
            onClick={capture}
            disabled={scanning}
            style={{ margin: '10px 0', padding: '8px 16px', background: '#007bff', color: 'white', border: 'none' }}
          >
            {scanning ? 'Đang quét...' : 'Chụp & Quét'}
          </button>
          <p>Hoặc</p>
          <input type="file" accept="image/*" onChange={handleImageUpload} disabled={scanning} />
        </>
      ) : (
        <img src={capturedImage} alt="Captured" style={{ width: '100%', maxWidth: '400px', borderRadius: '8px' }} />
      )}

      {error && (
        <>
          <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>
          <button onClick={retry} style={{ padding: '8px 16px', background: '#ffc107', color: 'black', border: 'none' }}>
            Thử lại
          </button>
        </>
      )}
    </div>
  );
};

export default ContainerScanner;
