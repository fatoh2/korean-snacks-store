const ICON_PATHS = {
  ramen: <><path d="M7 10h18l-1.3 7.2A7 7 0 0 1 16.8 23h-1.6a7 7 0 0 1-6.9-5.8L7 10Z" /><path d="M5 10h22M10 26h12M11 5c0 2 2 2 2 4M16 4c0 2 2 2 2 4M21 5c0 2 2 2 2 4" /></>,
  chips: <><path d="m9 5 14 1 2 20H7L9 5Z" /><path d="M10 10c4 1 8 1 14 0M10 21c4-1 8-1 14 0" /><path d="M13 15c2-3 5-2 6 0-1 3-4 4-6 0Z" /></>,
  candy: <><path d="M11 11c3-3 7-3 10 0s3 7 0 10-7 3-10 0-3-7 0-10Z" /><path d="m10 12-5-2 2 6-2 6 6-2M22 12l5-2-2 6 2 6-6-2" /></>,
  drinks: <><path d="M10 9h13l-1 17H11L10 9Z" /><path d="M9 9h15M17 9l2-5h5M13 14h7M14 18h5" /></>,
  biscuits: <><circle cx="16" cy="16" r="10" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="20" cy="13" r="1" fill="currentColor" stroke="none" /><circle cx="13" cy="20" r="1" fill="currentColor" stroke="none" /><circle cx="20" cy="20" r="1" fill="currentColor" stroke="none" /></>,
  all: <><path d="M6 12 16 6l10 6v12H6V12Z" /><path d="M11 24v-7h10v7M12 11h8" /></>,
};

export default function CategoryIcon({ type = 'all', size = 48, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false">
      {ICON_PATHS[type] || ICON_PATHS.all}
    </svg>
  );
}
