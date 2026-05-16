'use client';
import { useState } from 'react';
import { useUploadThing } from '../../lib/uploadthingClient';
import styles from './ImageUploader.module.css';

export default function ImageUploader({ images, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const { startUpload } = useUploadThing('propertyImages', {
    headers: () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      return token ? { 'x-ut-token': `Bearer ${token}` } : {};
    },
    onClientUploadComplete: (res) => {
      const urls = res.map((f) => f.url);
      onChange([...images, ...urls]);
      setUploading(false);
      setError('');
    },
    onUploadError: (err) => {
      setError(err.message || 'Upload failed. Please try again.');
      setUploading(false);
    },
  });

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    setError('');
    await startUpload(files);
  };

  const removeImage = (idx) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className={styles.grid}>
        {images.map((img, i) => (
          <div key={i} className={styles.imgWrap}>
            <img src={img} alt={`Property ${i + 1}`} className={styles.img} />
            <button
              type="button"
              className={styles.remove}
              onClick={() => removeImage(i)}
            >×</button>
          </div>
        ))}

        <label className={`${styles.upload} ${uploading ? styles.uploading : ''}`}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          {uploading ? (
            <><div className={styles.miniSpinner} /><span>Uploading…</span></>
          ) : (
            <><span className={styles.plus}>+</span><span>Add Photos</span></>
          )}
        </label>
      </div>

      <p className="form-hint" style={{ marginTop: 8 }}>Upload up to 10 images (max 8MB each). First image will be the cover.</p>
    </div>
  );
}