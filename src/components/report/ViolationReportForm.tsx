'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Upload } from 'lucide-react';

export function ViolationReportForm() {
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim() || !description.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append('address', address);
      form.append('description', description);
      if (notes) form.append('notes', notes);
      if (photo) form.append('photo', photo);

      const res = await fetch('/api/report', { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-green-600" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Report Submitted</h3>
        <p className="text-gray-500 text-sm mb-6">
          Thank you for your anonymous report. The HOA board will review it and may investigate as appropriate.
          All reports are kept confidential.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setSuccess(false);
            setAddress('');
            setDescription('');
            setNotes('');
            setPhoto(null);
            setPhotoPreview(null);
          }}
        >
          Submit Another Report
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
        <strong>Anonymous Reporting:</strong> Your identity will not be collected or stored.
        Reports are reviewed by the HOA board for potential investigation.
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="report-address" className="block text-sm font-medium text-gray-700 mb-1">
            Property Address <span className="text-red-500">*</span>
          </label>
          <Input
            id="report-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Murrayhill Way, Beaverton, OR"
            required
          />
        </div>

        <div>
          <label htmlFor="report-description" className="block text-sm font-medium text-gray-700 mb-1">
            Describe the Violation <span className="text-red-500">*</span>
          </label>
          <Textarea
            id="report-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you observed and which guideline may be violated (e.g., fence height exceeds 6 feet, non-approved paint color, etc.)"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any other context that may be helpful..."
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Photo <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          {photoPreview ? (
            <div className="relative rounded-lg overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="Report photo" className="w-full max-h-48 object-cover" />
              <button
                type="button"
                onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                className="absolute top-2 right-2 bg-white/90 text-gray-600 rounded-full px-2 py-0.5 text-xs hover:bg-white shadow"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 hover:bg-gray-50 transition-colors">
              <Upload size={18} className="text-gray-400" />
              <span className="text-sm text-gray-500">Click to attach a photo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
        )}

        <Button
          type="submit"
          disabled={isLoading || !address.trim() || !description.trim()}
          className="w-full"
        >
          {isLoading ? 'Submitting...' : 'Submit Anonymous Report'}
        </Button>
      </form>
    </div>
  );
}
