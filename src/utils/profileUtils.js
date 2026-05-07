/**
 * profileUtils.js
 *
 * Canonical helpers for resolving display data from a profile object.
 * The `profiles` table has 4 name columns (first_name, last_name, full_name, name)
 * for historical reasons. Always use these helpers instead of inline resolution.
 */

/**
 * Returns the best available display name for a profile.
 * Resolution order: first_name + last_name → full_name → name → email prefix → 'Unknown'
 *
 * @param {Object|null} profile - A row from the profiles table
 * @returns {string}
 */
export const getDisplayName = (profile) => {
  if (!profile) return 'Unknown';

  if (profile.first_name) {
    return `${profile.first_name} ${profile.last_name || ''}`.trim();
  }
  if (profile.full_name) return profile.full_name;
  if (profile.name) return profile.name;
  if (profile.email) return profile.email.split('@')[0];
  return 'Unknown';
};

/**
 * Returns the user's initials (up to 2 characters) for avatar display.
 *
 * @param {Object|null} profile - A row from the profiles table
 * @returns {string}
 */
export const getInitials = (profile) => {
  if (!profile) return '??';

  if (profile.first_name) {
    const first = profile.first_name[0] || '';
    const last = profile.last_name?.[0] || '';
    return (first + last).toUpperCase();
  }

  const displayName = profile.full_name || profile.name || profile.email || '';
  return displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';
};
