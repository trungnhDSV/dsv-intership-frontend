'use client';
import { GoogleSignIn } from '@/components/google-sign-in';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import React, { useActionState, useEffect, useRef } from 'react';
import { signInAction } from '../../../../lib/actions/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { handleTranslationError } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

const SignInForm = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const t = useTranslations('auth');
  const [isLoading, setIsLoading] = React.useState(false);
  const [state, formAction] = useActionState(signInAction, {
    values: {
      email: '',
      password: '',
    },
    errors: {},
    message: '',
  });
  useEffect(() => {
    if (state) {
      setIsLoading(false);
    }
    async function checkSession() {
      if (state?.success) {
        router.push('/documents');
        await getSession();
      }
    }
    checkSession();
  }, [state, router]);
  return (
    <div className='bg-white rounded-xl p-12 flex flex-col gap-10'>
      <div className='flex justify-center'>
        <h1 className='text-5xl font-bold tracking-tight'>{t('signIn')}</h1>
        <Image src={'/logo.png'} width={100} height={100} alt='logo' className='w-8 h-8' />
      </div>
      <div className='flex flex-col gap-10'>
        <GoogleSignIn />
        <div className='flex gap-[24px] flex-col'>
          <div className='flex items-center gap-1'>
            <hr className='flex-1' />
            <p className='text-sm'>or</p>
            <hr className='flex-1' />
          </div>
          {error === 'email-exists' && (
            <div className=' bg-[#FEE9E7] mt-1 px-3 py-4 rounded-md text-xs border-l-[#900B09] border-l-2 w-[360px]'>
              {t('accountExists')}
            </div>
          )}
          <form
            ref={formRef}
            action={formAction}
            className='flex flex-col gap-4'
            onSubmit={() => {
              setIsLoading(true);
              const url = new URL(window.location.href);
              url.searchParams.delete('error');
              window.history.replaceState({}, '', url);
            }}
          >
            <div>
              <p className='mb-1'>
                {t.rich('emailLabel', {
                  tag: (chunks) => <span className='text-[#EC221F]'>{chunks}</span>,
                })}
              </p>
              <Input
                name='email'
                id='email'
                defaultValue={state?.values?.email}
                placeholder={t('emailPlaceholder')}
                type='email'
                autoComplete='email'
                className={state?.errors?.email ? 'border-red-800' : ''}
              />
              {state?.errors?.email && state.errors?.email[0] !== 'Invalid email or password' && (
                <p className='text-sm text-[#900B09] mt-1'>
                  {handleTranslationError(t, state.errors.email[0])}
                </p>
              )}
            </div>
            <div>
              <p className='mb-1'>
                {t.rich('passwordLabel', {
                  tag: (chunks) => <span className='text-[#EC221F]'>{chunks}</span>,
                })}
              </p>
              <Input
                name='password'
                id='password'
                defaultValue={state?.values?.password}
                placeholder={t('passwordPlaceholder')}
                type='password'
                autoComplete='current-password'
                className={state?.errors?.password ? 'border-red-800' : ''}
              />
              {state?.errors?.password && (
                <p className='text-sm text-[#900B09] mt-1'>
                  {handleTranslationError(t, state.errors.password[0])}
                </p>
              )}
            </div>
            <Button
              variant={'primary'}
              type='submit'
              className='w-[360px] mt-2'
              disabled={isLoading}
            >
              {isLoading ? <Spinner size='medium'></Spinner> : t('signInButton')}
            </Button>
          </form>
        </div>
        <div className='text-center'>
          <p>
            {t('dontHaveAccount')}
            <Link href='/sign-up'>
              <span className='text-primary font-bold hover:underline'>{t('signUpButton')}</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInForm;
