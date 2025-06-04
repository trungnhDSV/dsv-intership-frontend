'use client';
import { GoogleSignIn } from '@/components/google-sign-in';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { signUpAction } from '@/lib/actions/auth';
import { handleTranslationError } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useActionState, useEffect, useRef, useState } from 'react';

const SignUpForm = () => {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const t = useTranslations('auth');
  const [isLoading, setIsLoading] = useState(false);

  const [state, formAction] = useActionState(signUpAction, {
    values: {
      email: '',
      password: '',
      fullName: '',
      confirmPassword: '',
      terms: false,
    },
    errors: {},
    message: '',
  });

  useEffect(() => {
    if (state?.success) {
      localStorage.setItem('pendingEmail', state?.values?.email ? state?.values?.email : '');
      router.push('/verify-email');
    }
  }, [state?.success, router, state?.values?.email]);

  useEffect(() => {
    if (state) {
      setIsLoading(false);
    }
  }, [state]);

  console.log('state', state);
  return (
    <div className='w-1/3 px-12 h-screen bg-white p-12 flex flex-col justify-center items-center gap-10'>
      <div className='flex justify-center gap-2'>
        <h1 className='text-5xl font-bold tracking-tight'>{t('signUp')}</h1>
        <Image src={'/logo.png'} width={100} height={100} alt='logo' className='w-8 h-8' />
      </div>
      <div className='flex flex-col gap-10'>
        <GoogleSignIn />

        <div className='flex gap-[24px] flex-col'>
          <div className='flex items-center'>
            <hr className='flex-1' />
            <p className='text-sm'>{t('or')}</p>
            <hr className='flex-1' />
          </div>
          <form
            ref={formRef}
            action={formAction}
            className='flex flex-col gap-4'
            onSubmit={() => setIsLoading(true)}
          >
            <div>
              <p className='mb-1'>
                {t.rich('fullNameLabel', {
                  tag: (chunks) => <span className='text-[#EC221F]'>{chunks}</span>,
                })}
              </p>
              <Input
                type='text'
                placeholder={t('fullNamePlaceholder')}
                name='fullName'
                id='fullName'
                defaultValue={state?.values?.fullName}
                className={state?.errors?.fullName ? 'border-red-800' : ''}
              />
              {state?.errors?.fullName && (
                <p className='text-sm text-[#900B09] mt-1'>
                  {handleTranslationError(t, state.errors.fullName[0])}
                </p>
              )}
            </div>
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
              {state?.errors?.email && (
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
                className={state?.errors?.password ? 'border-red-800' : ''}
              />
              {state?.errors?.password && (
                <p className='text-sm text-[#900B09] mt-1'>
                  {handleTranslationError(t, state.errors.password[0])}
                </p>
              )}
            </div>
            <div>
              <p className='mb-1'>
                {t.rich('rePasswordLabel', {
                  tag: (chunks) => <span className='text-[#EC221F]'>{chunks}</span>,
                })}
              </p>
              <Input
                type='password'
                placeholder={t('rePasswordPlaceholder')}
                name='confirmPassword'
                id='confirmPassword'
                defaultValue={state?.values?.confirmPassword}
                className={state?.errors?.confirmPassword ? 'border-red-800' : ''}
              />
              {state?.errors?.confirmPassword && (
                <p className='text-sm text-[#900B09] mt-1'>{state.errors.confirmPassword[0]}</p>
              )}
            </div>
            <div>
              <div className='flex gap-2'>
                <Checkbox id='terms' name='terms' defaultChecked={state?.values?.terms ?? true} />
                <label
                  htmlFor='terms'
                  className='text-sm font-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 '
                >
                  {t.rich('accept', {
                    tag: (chunks) => <b className='font-semibold'>{chunks}</b>,
                  })}
                </label>
              </div>
              {state?.errors?.terms && (
                <p className='text-sm text-[#900B09] mt-1'>
                  {handleTranslationError(t, state.errors.terms[0])}
                </p>
              )}
            </div>
            <Button variant={'primary'} type='submit' className='w-full mt-2' disabled={isLoading}>
              {isLoading ? <Spinner size='medium'></Spinner> : t('signUpButton')}
            </Button>
          </form>
        </div>
        <div className='text-center'>
          <p>
            {t('alreadyHaveAccount')}
            <Link href='/sign-in'>
              <span className='text-primary font-bold hover:underline'>{t('signInButton')}</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
