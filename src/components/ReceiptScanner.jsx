import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

function parseReceiptText(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const items = [];
  let total = null;

  // Common price pattern: description followed by a price amount
  const priceRegex = /^(.+?)\s+[\$₱]?\s*(\d+[.,]\d{2})\s*$/;
  // Total line pattern
  const totalRegex = /(?:total|amount\s*due|balance\s*due|grand\s*total|subtotal)\s*:?\s*[\$₱]?\s*(\d+[.,]\d{2})/i;

  for (const line of lines) {
    // Check for total first
    const totalMatch = line.match(totalRegex);
    if (totalMatch) {
      total = parseFloat(totalMatch[1].replace(',', '.'));
      continue;
    }

    // Check for item + price
    const itemMatch = line.match(priceRegex);
    if (itemMatch) {
      const name = itemMatch[1].replace(/[._]{2,}/g, ' ').trim();
      const price = parseFloat(itemMatch[2].replace(',', '.'));
      if (name.length > 0 && price > 0 && price < 100000) {
        items.push({ name, price });
      }
    }
  }

  // If no total was found but we have items, sum them
  if (total === null && items.length > 0) {
    total = items.reduce((sum, item) => sum + item.price, 0);
  }

  return { items, total };
}

function ReceiptScanner({ onAdd }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [rawText, setRawText] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    setError('');
    setResult(null);
    setRawText('');
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleScan = async () => {
    if (!image) return;
    setScanning(true);
    setProgress(0);
    setError('');
    setResult(null);

    try {
      const { data } = await Tesseract.recognize(image, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      setRawText(data.text);
      const parsed = parseReceiptText(data.text);

      if (parsed.items.length === 0 && parsed.total === null) {
        setError('Could not detect any prices. Try a clearer image or adjust the lighting.');
      } else {
        setResult(parsed);
      }
    } catch (err) {
      setError('OCR failed. Please try a different image.');
      console.error('OCR error:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleAddItem = (item) => {
    onAdd({
      id: crypto.randomUUID(),
      description: item.name,
      amount: item.price,
      type: 'expense',
      category: 'Shopping',
      date: new Date().toISOString(),
    });
  };

  const handleAddTotal = () => {
    if (!result?.total) return;
    onAdd({
      id: crypto.randomUUID(),
      description: 'Receipt Total',
      amount: result.total,
      type: 'expense',
      category: 'Shopping',
      date: new Date().toISOString(),
    });
  };

  const handleClear = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setRawText('');
    setError('');
    setProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <section className="form-section receipt-section">
      <h2 className="section-title">Scan Receipt</h2>

      <div className="receipt-upload">
        <label className="receipt-file-label">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="receipt-file-input"
          />
          <span className="receipt-file-btn">
            📷 {image ? 'Change Image' : 'Upload Receipt'}
          </span>
        </label>

        {preview && (
          <div className="receipt-preview-wrapper">
            <img src={preview} alt="Receipt preview" className="receipt-preview" />
          </div>
        )}

        {image && !scanning && (
          <button type="button" className="submit-btn receipt-scan-btn" onClick={handleScan}>
            🔍 Scan for Prices
          </button>
        )}

        {scanning && (
          <div className="receipt-progress">
            <div className="receipt-progress-bar">
              <div
                className="receipt-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="receipt-progress-text">Scanning… {progress}%</span>
          </div>
        )}

        {error && <p className="receipt-error">{error}</p>}

        {result && (
          <div className="receipt-results">
            {result.items.length > 0 && (
              <>
                <h3 className="receipt-results-title">Detected Items</h3>
                <ul className="receipt-items">
                  {result.items.map((item, i) => (
                    <li key={i} className="receipt-item">
                      <span className="receipt-item-name">{item.name}</span>
                      <span className="receipt-item-price">₱{item.price.toFixed(2)}</span>
                      <button
                        type="button"
                        className="receipt-add-btn"
                        onClick={() => handleAddItem(item)}
                        title="Add as transaction"
                      >
                        +
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {result.total !== null && (
              <div className="receipt-total-row">
                <span className="receipt-total-label">Total</span>
                <span className="receipt-total-amount">₱{result.total.toFixed(2)}</span>
                <button
                  type="button"
                  className="receipt-add-btn total"
                  onClick={handleAddTotal}
                  title="Add total as transaction"
                >
                  + Add Total
                </button>
              </div>
            )}

            <button type="button" className="receipt-clear-btn" onClick={handleClear}>
              Clear
            </button>
          </div>
        )}

        {rawText && (
          <details className="receipt-raw">
            <summary>Raw OCR Text</summary>
            <pre className="receipt-raw-text">{rawText}</pre>
          </details>
        )}
      </div>
    </section>
  );
}

export default ReceiptScanner;
