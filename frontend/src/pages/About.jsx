import { useEffect, useState } from 'react';
import {
  getApiErrorMessage,
  getCurrentUser,
  updateCurrentUser,
} from '../services/api';

const MAX_PROFILE_PHOTO_BYTES = 512 * 1024;

const getInitials = (name) =>
  name
    ?.trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

function About({ onUserUpdated }) {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    profilePhoto: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let isCurrent = true;

    const loadProfile = async () => {
      try {
        const user = await getCurrentUser();
        if (isCurrent) {
          setProfile({
            name: user.name || '',
            email: user.email || '',
            age: user.age ?? '',
            gender: user.gender || '',
            profilePhoto: user.profilePhoto || null,
          });
          onUserUpdated(user);
          setError('');
        }
      } catch (requestError) {
        console.error('Unable to load account profile:', requestError);
        if (isCurrent) {
          setError(
            getApiErrorMessage(
              requestError,
              'Unable to load your account profile.',
            ),
          );
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isCurrent = false;
    };
  }, [onUserUpdated]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
    setNotice('');
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      setError('Profile photos must be 512 KB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setError('Unable to read the selected profile photo.');
        return;
      }

      setProfile((current) => ({
        ...current,
        profilePhoto: reader.result,
      }));
      setError('');
      setNotice('');
    };
    reader.onerror = () => {
      console.error('Unable to read the selected profile photo:', reader.error);
      setError('Unable to read the selected profile photo.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const updatedUser = await updateCurrentUser({
        ...profile,
        age: Number(profile.age),
      });
      setProfile({
        name: updatedUser.name,
        email: updatedUser.email,
        age: updatedUser.age,
        gender: updatedUser.gender,
        profilePhoto: updatedUser.profilePhoto || null,
      });
      onUserUpdated(updatedUser);
      setNotice('Profile updated successfully.');
    } catch (requestError) {
      console.error('Unable to update account profile:', requestError);
      setError(
        getApiErrorMessage(
          requestError,
          'Unable to update your account profile.',
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="about-page panel">
      <div className="section-header">
        <h3>About & Profile</h3>
      </div>

      {loading ? (
        <p className="card-note" role="status">
          Loading your profile...
        </p>
      ) : null}

      {error ? (
        <p className="card-note" role="alert">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="card-note" role="status">
          {notice}
        </p>
      ) : null}

      {!loading && !error ? (
        <form className="auth-form about-profile-form" onSubmit={handleSave}>
          <div className="about-profile-photo-wrap">
            {profile.profilePhoto ? (
              <img
                className="about-profile-photo"
                src={profile.profilePhoto}
                alt="Profile"
              />
            ) : (
              <div className="about-profile-photo about-profile-initials">
                {getInitials(profile.name)}
              </div>
            )}
            <label>
              Profile photo (JPEG, PNG, or WebP; up to 512 KB)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
              />
            </label>
            {profile.profilePhoto ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setProfile((current) => ({
                    ...current,
                    profilePhoto: null,
                  }))
                }
              >
                Remove photo
              </button>
            ) : null}
          </div>

          <label>
            Full name
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
              maxLength="120"
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Age
            <input
              type="number"
              name="age"
              value={profile.age}
              onChange={handleChange}
              min="0"
              max="120"
              step="1"
              required
            />
          </label>
          <label>
            Gender
            <input
              type="text"
              name="gender"
              value={profile.gender}
              onChange={handleChange}
              maxLength="50"
              required
            />
          </label>
          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving ? 'Saving profile...' : 'Save profile'}
          </button>
        </form>
      ) : null}

    </div>
  );
}

export default About;
