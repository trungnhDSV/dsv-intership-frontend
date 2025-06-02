'use client';
import { GoogleSignIn } from '@/components/google-sign-in';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { signUpAction } from '@/lib/actions/auth';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useActionState, useEffect, useRef } from 'react';

const SignUpForm = () => {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

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

  console.log('state', state);
  return (
    <div className='w-1/3 px-12 h-screen bg-white p-12 flex flex-col justify-center items-center gap-10'>
      <div className='flex justify-center gap-2'>
        <h1 className='text-5xl font-bold tracking-tight'>Sign Up</h1>
        <Image src={'/logo.png'} width={100} height={100} alt='logo' className='w-8 h-8' />
      </div>
      <div className='flex flex-col gap-10'>
        <GoogleSignIn />

        <div className='flex gap-[24px] flex-col'>
          <div className='flex items-center'>
            <hr className='flex-1' />
            <p className='text-sm'>or</p>
            <hr className='flex-1' />
          </div>
          <form ref={formRef} action={formAction} className='flex flex-col gap-4'>
            <div>
              <p className='mb-1'>
                Full Name <span className='text-[#EC221F]'>*</span>
              </p>
              <Input
                type='text'
                placeholder='Input full name'
                name='fullName'
                id='fullName'
                defaultValue={state?.values?.fullName}
                className={state?.errors?.fullName ? 'border-red-800' : ''}
              />
              {state?.errors?.fullName && (
                <p className='text-sm text-[#900B09] mt-1'>{state.errors.fullName[0]}</p>
              )}
            </div>
            <div>
              <p className='mb-1'>
                Email <span className='text-[#EC221F]'>*</span>
              </p>
              <Input
                name='email'
                id='email'
                defaultValue={state?.values?.email}
                placeholder='Input email address'
                type='email'
                autoComplete='email'
                className={state?.errors?.email ? 'border-red-800' : ''}
              />
              {state?.errors?.email && (
                <p className='text-sm text-[#900B09] mt-1'>{state.errors.email[0]}</p>
              )}
            </div>
            <div>
              <p className='mb-1'>
                Password <span className='text-[#EC221F]'>*</span>
              </p>
              <Input
                name='password'
                id='password'
                defaultValue={state?.values?.password}
                placeholder='Input password'
                type='password'
                className={state?.errors?.password ? 'border-red-800' : ''}
              />
              {state?.errors?.password && (
                <p className='text-sm text-[#900B09] mt-1'>{state.errors.password[0]}</p>
              )}
            </div>
            <div>
              <p className='mb-1'>
                Re-confirm password <span className='text-[#EC221F]'>*</span>
              </p>
              <Input
                type='password'
                placeholder='Re-confirm password'
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
                  I accept all <b className='font-semibold'>Terms of Service</b> and{' '}
                  <b className='font-semibold'>Privacy Policy</b>
                </label>
              </div>
              {state?.errors?.terms && (
                <p className='text-sm text-[#900B09] mt-1'>{state.errors.terms[0]}</p>
              )}
            </div>

            <Button variant={'primary'} type='submit' className='w-full mt-2'>
              Sign up
            </Button>
          </form>
        </div>
        <div className='text-center'>
          <p>
            Already have an account?{' '}
            <Link href='/sign-in'>
              <span className='text-primary font-bold hover:underline'>Sign In</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
