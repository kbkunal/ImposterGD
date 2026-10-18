import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Avatar, AVATAR_OPTIONS, BACKGROUND_COLORS } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Upload, Check, RotateCcw, ZoomIn, ZoomOut, User } from 'lucide-react';

export interface AvatarSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarId: string;
  currentBackground: string;
  currentDisplayName: string;
  currentAvatarUrl?: string;
  onSave: (data: { avatarId: string; avatarBackground: string; displayName: string; avatarUrl?: string }) => Promise<void>;
}

export const AvatarSelectorModal: React.FC<AvatarSelectorModalProps> = ({
  isOpen,
  onClose,
  currentAvatarId,
  currentBackground,
  currentDisplayName,
  currentAvatarUrl,
  onSave,
}) => {
  const [selectedAvatarId, setSelectedAvatarId] = useState(currentAvatarId);
  const [selectedBg, setSelectedBg] = useState(currentBackground);
  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crop / Reposition state
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedAvatarId(currentAvatarId);
      setSelectedBg(currentBackground);
      setDisplayName(currentDisplayName);
      setAvatarUrl(currentAvatarUrl);
      setUploadedImageSrc(null);
      setError(null);
    }
  }, [isOpen, currentAvatarId, currentBackground, currentDisplayName, currentAvatarUrl]);

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError('File size must be less than 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setUploadedImageSrc(event.target.result);
        setScale(1);
        setOffset({ x: 0, y: 0 });
      }
    };
    reader.readAsDataURL(file);
  };

  // Render crop canvas
  useEffect(() => {
    if (!uploadedImageSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = uploadedImageSrc;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      ctx.fillStyle = selectedBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Circular clip mask
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 4, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const baseWidth = canvas.width;
      const baseHeight = (img.height / img.width) * baseWidth;
      const drawWidth = baseWidth * scale;
      const drawHeight = baseHeight * scale;
      const drawX = (canvas.width - drawWidth) / 2 + offset.x;
      const drawY = (canvas.height - drawHeight) / 2 + offset.y;

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();

      // Border circle
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 3, 0, Math.PI * 2);
      ctx.stroke();
    };
  }, [uploadedImageSrc, scale, offset, selectedBg]);

  const handleApplyCropped = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
    setAvatarUrl(dataUrl);
    setUploadedImageSrc(null);
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }
    try {
      setIsSaving(true);
      setError(null);
      await onSave({
        avatarId: selectedAvatarId,
        avatarBackground: selectedBg,
        displayName: displayName.trim(),
        avatarUrl: avatarUrl,
      });
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customize Your Character"
      description="Personalize your avatar and table presence for game night"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Live Preview Card */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-[#0A0E1A] rounded-2xl border border-slate-800">
          <div className="relative group">
            <Avatar
              avatarId={selectedAvatarId}
              avatarBackground={selectedBg}
              avatarUrl={avatarUrl}
              size="xl"
            />
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl(undefined)}
                className="absolute -top-1 -right-1 bg-rose-600 hover:bg-rose-500 text-white p-1 rounded-full text-xs shadow-md"
                title="Remove photo & use cartoon avatar"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex-1 w-full space-y-3 text-center sm:text-left">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Character Preview</span>
              <h4 className="text-xl font-bold text-white">{displayName || 'Anonymous Player'}</h4>
              <p className="text-xs text-slate-400">
                {avatarUrl ? 'Custom Photo' : AVATAR_OPTIONS.find(a => a.id === selectedAvatarId)?.name}
              </p>
            </div>

            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your game name"
              leftIcon={<User className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Reposition / Crop view if an image was picked */}
        {uploadedImageSrc ? (
          <div className="p-4 bg-[#0A0E1A] border border-purple-500/40 rounded-2xl space-y-4 text-center">
            <h5 className="text-sm font-bold text-purple-300">Reposition & Zoom Your Photo</h5>
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width={200}
                height={200}
                className="rounded-full shadow-2xl cursor-grab active:cursor-grabbing touch-none"
                onMouseDown={(e) => {
                  setIsDragging(true);
                  dragStartRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
                }}
                onMouseMove={(e) => {
                  if (!isDragging) return;
                  setOffset({
                    x: e.clientX - dragStartRef.current.x,
                    y: e.clientY - dragStartRef.current.y,
                  });
                }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onTouchStart={(e) => {
                  if (e.touches[0]) {
                    setIsDragging(true);
                    dragStartRef.current = { x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y };
                  }
                }}
                onTouchMove={(e) => {
                  if (!isDragging || !e.touches[0]) return;
                  setOffset({
                    x: e.touches[0].clientX - dragStartRef.current.x,
                    y: e.touches[0].clientY - dragStartRef.current.y,
                  });
                }}
                onTouchEnd={() => setIsDragging(false)}
              />
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center justify-center gap-3 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => setScale(Math.max(0.6, scale - 0.15))}
                className="p-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-lg"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="0.6"
                max="2.5"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="flex-1 accent-purple-500 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setScale(Math.min(2.5, scale + 0.15))}
                className="p-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-lg"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button size="sm" variant="secondary" onClick={() => setUploadedImageSrc(null)}>
                Cancel
              </Button>
              <Button size="sm" variant="success" icon={<Check className="w-4 h-4" />} onClick={handleApplyCropped}>
                Apply Photo
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Background Color Palette */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Avatar Background Color
              </label>
              <div className="flex flex-wrap gap-2.5 items-center">
                {BACKGROUND_COLORS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setSelectedBg(bg)}
                    className={`w-9 h-9 rounded-full transition-all duration-150 flex items-center justify-center ${
                      selectedBg === bg ? 'ring-4 ring-white ring-offset-2 ring-offset-[#11162B] scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: bg }}
                  >
                    {selectedBg === bg && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Cartoon Avatar Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Choose Cartoon Character
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-56 overflow-y-auto p-1 pr-2">
                {AVATAR_OPTIONS.map((opt) => {
                  const isSelected = selectedAvatarId === opt.id && !avatarUrl;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatarId(opt.id);
                        setAvatarUrl(undefined);
                      }}
                      className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/20 ring-2 ring-purple-500/50 scale-105'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60'
                      }`}
                    >
                      <Avatar avatarId={opt.id} avatarBackground={selectedBg} size="sm" showBorder={false} />
                      <span className="text-[11px] font-semibold text-slate-300 mt-1 truncate w-full text-center">
                        {opt.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {error && <p className="text-xs text-rose-400 font-medium text-center">{error}</p>}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};
