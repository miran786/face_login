import { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { motion } from 'motion/react';
import { ArrowLeft, User, Mail, Phone, Edit2, Save, X, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface ProfileProps {
  onBack: () => void;
  onDataDeleted: () => void;
}

interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function Profile({ onBack, onDataDeleted }: ProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '', phone: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/profile`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
          setEditData({ name: data.user.name, email: data.user.email || '', phone: data.user.phone || '' });
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setEditData({ ...editData, phone: digits });
    if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!editData.name.trim()) errors.name = 'Name is required';
    if (editData.email && !EMAIL_REGEX.test(editData.email)) {
      errors.email = 'Enter a valid email address';
    }
    const digits = editData.phone.replace(/\D/g, '');
    if (editData.phone && digits.length !== 10) {
      errors.phone = 'Phone must be exactly 10 digits';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editData.name.trim(),
          email: editData.email || null,
          phone: editData.phone || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || 'Failed to update profile');
        return;
      }

      setProfile(data.user);
      setEditData({ name: data.user.name, email: data.user.email || '', phone: data.user.phone || '' });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditData({ name: profile.name, email: profile.email || '', phone: profile.phone || '' });
    }
    setFieldErrors({});
    setSaveError('');
    setIsEditing(false);
  };

  const handleDeleteAllData = async () => {
    if (deleteInput !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/clear-data`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || 'Failed to delete data');
        return;
      }

      onDataDeleted();
    } catch (err) {
      setDeleteError('Network error. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <p className="text-white/50">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
        </div>

        {/* Avatar */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-2xl">
            <span className="text-white text-4xl font-bold">
              {(profile?.name || 'U')[0].toUpperCase()}
            </span>
          </div>
          <p className="text-white text-xl font-semibold">{profile?.name}</p>
          <p className="text-purple-300 text-sm">@{profile?.username}</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl mb-6"
        >
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-white font-semibold text-lg">Personal Info</h2>
            {!isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-purple-300 hover:text-white hover:bg-white/10 gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="text-purple-300 text-xs mb-1 block">Full Name</label>
              {isEditing ? (
                <>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 w-4 h-4" />
                    <Input
                      type="text"
                      value={editData.name}
                      onChange={(e) => { setEditData({ ...editData, name: e.target.value }); setFieldErrors({ ...fieldErrors, name: '' }); }}
                      className="bg-white/10 border-white/20 text-white pl-10 py-5 rounded-xl"
                    />
                  </div>
                  {fieldErrors.name && <p className="text-red-400 text-xs mt-1">{fieldErrors.name}</p>}
                </>
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <User className="text-purple-400 w-4 h-4 shrink-0" />
                  <p className="text-white">{profile?.name || '—'}</p>
                </div>
              )}
            </div>

            {/* Username (read-only) */}
            <div>
              <label className="text-purple-300 text-xs mb-1 block">Username</label>
              <div className="flex items-center gap-3 py-2">
                <User className="text-purple-400 w-4 h-4 shrink-0" />
                <p className="text-white/70">@{profile?.username}</p>
                <span className="text-xs text-purple-400 ml-auto">(cannot change)</span>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-purple-300 text-xs mb-1 block">Email Address</label>
              {isEditing ? (
                <>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 w-4 h-4" />
                    <Input
                      type="text"
                      value={editData.email}
                      onChange={(e) => { setEditData({ ...editData, email: e.target.value }); setFieldErrors({ ...fieldErrors, email: '' }); }}
                      placeholder="john@example.com"
                      className="bg-white/10 border-white/20 text-white pl-10 py-5 rounded-xl"
                    />
                  </div>
                  {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
                </>
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <Mail className="text-purple-400 w-4 h-4 shrink-0" />
                  <p className="text-white">{profile?.email || '—'}</p>
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="text-purple-300 text-xs mb-1 block">Phone Number</label>
              {isEditing ? (
                <>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 w-4 h-4" />
                    <Input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      className="bg-white/10 border-white/20 text-white pl-10 py-5 rounded-xl"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 text-xs">
                      {editData.phone.replace(/\D/g, '').length}/10
                    </span>
                  </div>
                  {fieldErrors.phone && <p className="text-red-400 text-xs mt-1">{fieldErrors.phone}</p>}
                </>
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <Phone className="text-purple-400 w-4 h-4 shrink-0" />
                  <p className="text-white">{profile?.phone || '—'}</p>
                </div>
              )}
            </div>
          </div>

          {saveError && <p className="text-red-400 text-sm mt-3 text-center">{saveError}</p>}
          {saveSuccess && (
            <p className="text-green-400 text-sm mt-3 text-center">Profile updated successfully!</p>
          )}
        </motion.div>

        {/* Danger Zone — Delete All Data */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-red-950/40 backdrop-blur-xl rounded-3xl p-6 border border-red-500/30 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h2 className="text-red-300 font-semibold text-lg">Danger Zone</h2>
          </div>

          <p className="text-red-200/70 text-sm mb-5">
            Delete ALL data — all registered users, face scans, and transaction history.
            This action is <strong className="text-red-300">irreversible</strong>.
          </p>

          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400 py-5 rounded-2xl gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete All Data
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                <p className="text-red-300 text-sm font-medium mb-3">
                  Type <span className="font-bold text-white bg-red-600/40 px-1.5 py-0.5 rounded">DELETE</span> to confirm
                </p>
                <Input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => { setDeleteInput(e.target.value); setDeleteError(''); }}
                  placeholder="DELETE"
                  className="bg-red-950/50 border-red-500/40 text-white placeholder:text-red-400/50 py-5 rounded-xl"
                  autoFocus
                />
                {deleteError && <p className="text-red-400 text-xs mt-2">{deleteError}</p>}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setDeleteError(''); }}
                  className="flex-1 text-gray-400 hover:text-white hover:bg-white/10 py-5 rounded-2xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAllData}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
