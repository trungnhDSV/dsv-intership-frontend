'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

const LanguageSwitcher = () => {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'vi', label: 'VN' },
  ];

  const onSelectLanguage = (langCode: string) => {
    const segments = pathname.split('/');
    segments[1] = langCode;
    router.replace(segments.join('/'));
  };

  return (
    <div className='inline-flex rounded-md shadow-sm' role='group'>
      {languages.map((lang, index) => (
        <button
          key={lang.code}
          onClick={() => onSelectLanguage(lang.code)}
          className={`px-4 py-2 text-sm font-semibold border ${
            lang.code === locale
              ? 'bg-[#F5C731] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          } ${index === 0 ? 'rounded-l-lg border-r-0' : ''} ${
            index === languages.length - 1 ? 'rounded-r-lg border-l-0' : ''
          } border-gray-200 dark:border-gray-600`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
