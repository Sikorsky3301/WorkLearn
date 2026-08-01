import { useRef, useState } from 'react'
import { Camera, Loader2, FileText, Upload, Phone, MapPin, Briefcase, FolderGit2, Globe } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useUpdateProfile, useUploadPhoto, useDeletePhoto, useUploadResume, useDeleteResume } from '../../../hooks'
import { resolveMediaUrl } from '../../../lib/client'
import IconField from '../../../shared/ui/IconField'
import Modal from './Modal'

export default function EditProfileModal({ onClose }) {
  const { user, refreshUser } = useAuth()
  const [form, setForm] = useState({
    headline: user?.headline || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    location: user?.location || '',
    linkedin_url: user?.linkedin_url || '',
    github_url: user?.github_url || '',
    website_url: user?.website_url || '',
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const photoInputRef = useRef(null)
  const resumeInputRef = useRef(null)

  const updateProfile = useUpdateProfile()
  const uploadPhoto = useUploadPhoto()
  const deletePhoto = useDeletePhoto()
  const uploadResume = useUploadResume()
  const deleteResume = useDeleteResume()

  const busy = updateProfile.isPending || uploadPhoto.isPending || deletePhoto.isPending || uploadResume.isPending || deleteResume.isPending

  function set(key, value) { setForm((f) => ({ ...f, [key]: value })) }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    try { await uploadPhoto.mutateAsync(file); await refreshUser() }
    catch (err) { setError(err.message) }
  }

  async function handleRemovePhoto() {
    setError('')
    try { await deletePhoto.mutateAsync(); await refreshUser() }
    catch (err) { setError(err.message) }
  }

  async function handleResumeChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    try { await uploadResume.mutateAsync(file); await refreshUser() }
    catch (err) { setError(err.message) }
  }

  async function handleRemoveResume() {
    setError('')
    try { await deleteResume.mutateAsync(); await refreshUser() }
    catch (err) { setError(err.message) }
  }

  async function handleSave() {
    setError('')
    try {
      await updateProfile.mutateAsync(form)
      await refreshUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (err) { setError(err.message) }
  }

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <Modal title="Edit Profile" onClose={onClose} maxWidth="max-w-xl">
      <div className="space-y-6">
        {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        {/* Photo */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            {user?.photo_url ? (
              <img src={resolveMediaUrl(user.photo_url)} alt="" className="w-20 h-20 rounded-2xl object-cover border border-border" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-white text-xl font-bold">
                {initials}
              </div>
            )}
            <button
              onClick={() => photoInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary-dark transition-colors cursor-pointer"
              aria-label="Change photo"
              type="button"
            >
              {uploadPhoto.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input ref={photoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhotoChange} />
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">Profile photo</p>
            <p className="text-xs text-on-surface-variant mb-1.5">PNG, JPG or WEBP — up to 5MB.</p>
            {user?.photo_url && (
              <button type="button" onClick={handleRemovePhoto} className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer">
                Remove photo
              </button>
            )}
          </div>
        </div>

        {/* Basic */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Headline</label>
            <input className="input text-sm" placeholder="e.g. Aspiring Data Analyst" value={form.headline} onChange={(e) => set('headline', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Bio</label>
            <textarea rows={3} className="input text-sm resize-none" placeholder="A short summary about you" value={form.bio} onChange={(e) => set('bio', e.target.value)} />
          </div>
        </div>

        {/* Contact */}
        <div>
          <p className="section-label mb-2">Contact</p>
          <div className="grid grid-cols-2 gap-3">
            <IconField icon={Phone} placeholder="Phone number" value={form.phone} onChange={(v) => set('phone', v)} />
            <IconField icon={MapPin} placeholder="Location" value={form.location} onChange={(v) => set('location', v)} />
            <IconField icon={Briefcase} placeholder="LinkedIn URL" value={form.linkedin_url} onChange={(v) => set('linkedin_url', v)} />
            <IconField icon={FolderGit2} placeholder="GitHub URL" value={form.github_url} onChange={(v) => set('github_url', v)} />
            <IconField icon={Globe} placeholder="Website URL" value={form.website_url} onChange={(v) => set('website_url', v)} className="col-span-2" />
          </div>
        </div>

        {/* Resume */}
        <div>
          <p className="section-label mb-2">Resume</p>
          {user?.resume_url ? (
            <div className="flex items-center justify-between gap-3 border border-border rounded-lg p-3 bg-surface-low">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-on-surface truncate">{user.resume_filename || 'Resume.pdf'}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button type="button" onClick={() => resumeInputRef.current?.click()} className="text-xs text-primary font-semibold hover:underline cursor-pointer">
                  Replace
                </button>
                <button type="button" onClick={handleRemoveResume} className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer">
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => resumeInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-4 text-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors cursor-pointer"
            >
              <Upload className="h-4 w-4" /> Upload your resume (PDF, DOC — up to 10MB)
            </button>
          )}
          <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeChange} />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <button type="button" onClick={onClose} className="btn-secondary text-sm px-4 py-2">Cancel</button>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className={`btn-primary text-sm px-5 py-2 transition-all disabled:opacity-60 ${saved ? 'bg-green-600 hover:bg-green-600' : ''}`}
          >
            {saved ? '✓ Saved' : busy ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
