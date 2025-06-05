'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const LanguageSwitcher = () => {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'vi', label: 'Tiếng Việt' },
  ];

  const onSelectLanguage = (langCode: string) => {
    const segments = pathname.split('/');
    segments[1] = langCode; // replace locale segment
    router.replace(segments.join('/'));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>{languages.find((l) => l.code === locale)?.label ?? 'Language'}</div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' side='left' className='z-100000'>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => onSelectLanguage(lang.code)}
            disabled={lang.code === locale}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
