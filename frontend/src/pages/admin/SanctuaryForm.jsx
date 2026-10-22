import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import client from '../../api/client';

const DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SanctuaryForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    opening_time: '06:00:00',
    closing_time: '18:00:00',
    operating_days: 'Mon, Tue, Wed, Thu, Fri, Sat, Sun',
    best_time_to_visit: '',
  });

  const [images, setImages] = useState([]);
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch sanctuary details if editing
  useEffect(() => {
    if (!isEditMode) return;

    let isMounted = true;
    async function loadSanctuary() {
      try {
        setLoading(true);
        const res = await client.get(`/admin/sanctuaries/${id}`);
        if (isMounted) {
          const s = res.sanctuary;
          setFormData({
            name: s.name || '',
            location: s.location || '',
            description: s.description || '',
            contact_email: s.contact_email || '',
            contact_phone: s.contact_phone || '',
            website: s.website || '',
            opening_time: s.opening_time || '06:00:00',
            closing_time: s.closing_time || '18:00:00',
            operating_days: s.operating_days || '',
            best_time_to_visit: s.best_time_to_visit || '',
          });

          if (s.operating_days) {
            const parsed = s.operating_days
              .split(',')
              .map((d) => d.trim())
              .filter((d) => DAY_OPTIONS.includes(d));
            if (parsed.length > 0) setSelectedDays(parsed);
          }

          setImages(s.images || []);
        }
      } catch (err) {
        if (isMounted) setError(err.data?.error || err.message || 'Failed to load sanctuary');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSanctuary();
    return () => {
      isMounted = false;
    };
  }, [id, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contact_phone') {
      const clean = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, contact_phone: clean }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleDay = (day) => {
    let next;
    if (selectedDays.includes(day)) {
      next = selectedDays.filter((d) => d !== day);
    } else {
      next = [...selectedDays, day];
    }
    setSelectedDays(next);
    setFormData((prev) => ({
      ...prev,
      operating_days: next.join(', '),
    }));
  };

  // Save Draft (POST or PUT)
  const handleSaveDraft = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.name || !formData.location || !formData.description) {
      setError('Please fill in Sanctuary Name, Location, and Description.');
      return;
    }

    if (formData.contact_phone && formData.contact_phone.length !== 10) {
      setError('Contact phone number must be exactly 10 digits.');
      return;
    }

    try {
      setSaving(true);
      if (isEditMode) {
        await client.put(`/admin/sanctuaries/${id}`, formData);
        setSuccessMsg('Sanctuary draft updated successfully!');
      } else {
        const res = await client.post('/admin/sanctuaries', formData);
        setSuccessMsg('Sanctuary draft created successfully!');
        // Redirect to edit mode so images can be attached to the new ID
        navigate(`/admin/sanctuaries/${res.sanctuary_id}/edit`, { replace: true });
      }
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to save sanctuary draft');
    } finally {
      setSaving(false);
    }
  };

  // Submit for approval (Phase 6)
  const handleSubmitForApproval = async () => {
    if (!isEditMode) {
      alert('Please save the draft first before submitting for approval.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      // First save current form changes
      await client.put(`/admin/sanctuaries/${id}`, formData);

      // Call submit endpoint
      const res = await client.post(`/admin/sanctuaries/${id}/submit`);
      setSuccessMsg(res.message || 'Sanctuary submitted for approval successfully!');
      setTimeout(() => {
        navigate('/admin/sanctuaries');
      }, 1000);
    } catch (err) {
      setError(err.data?.error || err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Upload images
  const handleFileUpload = async (filesToUpload) => {
    if (!filesToUpload || filesToUpload.length === 0) return;

    let targetId = id;

    if (!isEditMode || !targetId) {
      // Must save basic draft first to obtain sanctuary_id
      if (!formData.name || !formData.location || !formData.description) {
        alert('Please fill in basic details and save the draft first before uploading images.');
        return;
      }
      try {
        setSaving(true);
        const res = await client.post('/admin/sanctuaries', formData);
        targetId = res.sanctuary_id;
        navigate(`/admin/sanctuaries/${res.sanctuary_id}/edit`, { replace: true });
      } catch (err) {
        alert(err.data?.error || err.message || 'Please save the draft first.');
        return;
      } finally {
        setSaving(false);
      }
    }

    if (images.length + filesToUpload.length > 10) {
      alert(`Maximum 10 images allowed. You currently have ${images.length} images.`);
      return;
    }

    try {
      setUploading(true);
      const data = new FormData();
      Array.from(filesToUpload).forEach((f) => data.append('images', f));

      const res = await client.upload(`/admin/sanctuaries/${targetId}/images`, data);
      setImages((prev) => [...prev, ...res.images]);
      setSuccessMsg('Images uploaded successfully.');
    } catch (err) {
      alert(err.data?.error || err.message || 'Image upload failed');
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  // Set Cover Star
  const handleSetCover = async (imageId) => {
    try {
      await client.patch(`/admin/sanctuaries/${id}/images/${imageId}`, { is_cover: true });
      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          is_cover: img.image_id === imageId,
        }))
      );
    } catch (err) {
      alert(err.data?.error || err.message || 'Failed to set cover image');
    }
  };

  // Delete Image
  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await client.delete(`/admin/sanctuaries/${id}/images/${imageId}`);
      setImages((prev) => prev.filter((img) => img.image_id !== imageId));
    } catch (err) {
      alert(err.data?.error || err.message || 'Failed to delete image');
    }
  };

  if (loading) {
    return (
      <AdminLayout activeTitle="Loading...">
        <div className="py-24 text-center">
          <div className="inline-block w-8 h-8 border-2 border-[#1F3D2B]/20 border-t-[#1F3D2B] rounded-full animate-spin mb-3" />
          <p className="text-xs text-gray-500">Loading sanctuary details...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeTitle={isEditMode ? 'Edit Sanctuary' : 'Add Sanctuary'}>
      <div className="p-6 md:p-8 max-w-6xl mx-auto pb-28">
        
        {/* ── Breadcrumb & Header (Design 18) ───────────────────────────────── */}
        <div className="mb-6">
          <nav className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
            <Link to="/admin/sanctuaries" className="hover:text-gray-700">
              Sanctuaries
            </Link>
            <span>&gt;</span>
            <span className="text-gray-700 font-medium">
              {isEditMode ? 'Edit sanctuary' : 'Add sanctuary'}
            </span>
          </nav>

          <h2 className="text-3xl font-serif text-[#1F3D2B] font-bold">
            {isEditMode ? 'Edit sanctuary' : 'Add sanctuary'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Fill in the details below to configure and preview your sanctuary.
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSaveDraft} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* ── Section 1: Basic Information (Design 18) ──────────────────── */}
            <div className="bg-white rounded-3xl border border-[#E5DAC6] p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <span className="w-6 h-6 rounded-full bg-[#1F3D2B]/10 text-[#1F3D2B] flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <h3 className="text-base font-serif font-bold text-[#1F3D2B]">
                  Basic information
                </h3>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="name">
                  Sanctuary name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Nagarhole National Park"
                  required
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="location">
                  Location *
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Kodagu & Mysuru, Karnataka"
                  required
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  e.g. District, State, Country
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700" htmlFor="description">
                    Description *
                  </label>
                  <span className="text-[10px] text-gray-400">
                    {formData.description.length} / 1000
                  </span>
                </div>
                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  maxLength="1000"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell us about the sanctuary, its wildlife highlights, topography, and what makes it special..."
                  required
                  className="w-full p-3 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* ── Section 2: Image Upload (Design 18) ───────────────────────── */}
            <div className="bg-white rounded-3xl border border-[#E5DAC6] p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1F3D2B]/10 text-[#1F3D2B] flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <h3 className="text-base font-serif font-bold text-[#1F3D2B]">
                    Image upload
                  </h3>
                </div>
                <span className="text-xs text-gray-400">
                  Uploaded ({images.length}/10)
                </span>
              </div>

              {/* Drag and Drop Box */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileUpload(e.dataTransfer.files);
                }}
                className="border-2 border-dashed border-[#D5C9B5] hover:border-[#D9A441] rounded-2xl p-6 text-center bg-[#F6F1E7]/40 transition cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <div className="w-10 h-10 rounded-full bg-white border border-[#E5DAC6] flex items-center justify-center mx-auto mb-2 text-gray-500 shadow-xs">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-gray-800 block">
                  Drag and drop images here, or <span className="text-[#D9A441] underline">Browse files</span>
                </span>
                <span className="text-[10px] text-gray-400 block mt-1">
                  JPG, PNG, WEBP up to 2MB each (Max 10 photos)
                </span>
              </div>

              {/* Images Preview Grid */}
              {images.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
                    <span>★ Click star to set cover photo</span>
                    <span className="text-gray-400">{images.length} photos</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {images.map((img) => (
                      <div
                        key={img.image_id}
                        className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 group bg-gray-100 shadow-2xs"
                      >
                        <img
                          src={img.image_path}
                          alt="Sanctuary preview"
                          className="w-full h-full object-cover"
                        />

                        {/* Star / Cover badge */}
                        <button
                          type="button"
                          onClick={() => handleSetCover(img.image_id)}
                          className={`absolute top-1.5 left-1.5 p-1 rounded-md transition ${
                            img.is_cover
                              ? 'bg-amber-400 text-[#1F3D2B] shadow-xs'
                              : 'bg-black/50 text-white/80 hover:text-white hover:bg-black/70'
                          }`}
                          title={img.is_cover ? 'Cover photo' : 'Set as cover'}
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img.image_id)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/50 text-white/80 hover:text-red-400 hover:bg-black/80 transition opacity-0 group-hover:opacity-100"
                          title="Delete photo"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>

                        {img.is_cover && (
                          <div className="absolute bottom-1 inset-x-1 text-center bg-[#1F3D2B]/85 text-white text-[9px] font-semibold py-0.5 rounded">
                            Cover
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Section 3: Contact Information (Design 18) ────────────────── */}
            <div className="bg-white rounded-3xl border border-[#E5DAC6] p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <span className="w-6 h-6 rounded-full bg-[#1F3D2B]/10 text-[#1F3D2B] flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <h3 className="text-base font-serif font-bold text-[#1F3D2B]">
                  Contact information
                </h3>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="contact_email">
                  Contact email address *
                </label>
                <input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  placeholder="sanctuary.safari@wildbook.com"
                  required
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="contact_phone">
                  Contact phone number *
                </label>
                <input
                  id="contact_phone"
                  name="contact_phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                  placeholder="e.g. 9876543210 (10 digits)"
                  required
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="form-website">
                  Official website
                </label>
                <input
                  id="form-website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://nagarholetigerreserve.org"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900"
                />
              </div>
            </div>

            {/* ── Section 4: Hours of Operation (Design 18) ─────────────────── */}
            <div className="bg-white rounded-3xl border border-[#E5DAC6] p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <span className="w-6 h-6 rounded-full bg-[#1F3D2B]/10 text-[#1F3D2B] flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <h3 className="text-base font-serif font-bold text-[#1F3D2B]">
                  Hours of operation
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="opening_time">
                    Opening hours *
                  </label>
                  <input
                    id="opening_time"
                    name="opening_time"
                    type="time"
                    value={formData.opening_time}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="closing_time">
                    Closing hours *
                  </label>
                  <input
                    id="closing_time"
                    name="closing_time"
                    type="time"
                    value={formData.closing_time}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Operating days *
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                          isSelected
                            ? 'bg-[#1F3D2B] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="best_time_to_visit">
                  Best time to visit (Optional)
                </label>
                <input
                  id="best_time_to_visit"
                  name="best_time_to_visit"
                  type="text"
                  value={formData.best_time_to_visit}
                  onChange={handleInputChange}
                  placeholder="e.g. October to May"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* ── Sticky Bottom Bar (Design 18) ─────────────────────────────────── */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E5DAC6] py-3.5 px-6 z-20 shadow-lg">
            <div className="max-w-6xl mx-auto flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={saving || submitting}
                className="py-2.5 px-6 rounded-xl bg-white border border-[#D5C9B5] text-[#1F3D2B] font-semibold text-xs hover:bg-gray-50 active:scale-[0.99] transition shadow-xs disabled:opacity-60"
              >
                {saving ? 'Saving draft...' : 'Save draft'}
              </button>

              {/* Submit for approval — enabled in Phase 6 */}
              <button
                type="button"
                onClick={handleSubmitForApproval}
                disabled={saving || submitting || !isEditMode}
                className="py-2.5 px-6 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-semibold text-xs hover:bg-[#c99534] active:scale-[0.99] transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                title={!isEditMode ? 'Save draft first before submitting' : 'Submit sanctuary for approval'}
              >
                {submitting ? 'Submitting...' : 'Submit for approval'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
