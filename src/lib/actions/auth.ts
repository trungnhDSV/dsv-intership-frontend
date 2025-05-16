'use server';

import { signIn } from '@/auth';
import {
  signInSchema,
  SignInValues,
  signUpSchema,
  SignUpValues,
} from '@/lib/validators/auth';

export type SignInState = {
  success?: boolean;
  errors?: Record<string, string[]>;
  message?: string;
  values?: SignInValues;
};

export async function signInAction(
  prevState: SignInState | undefined,
  formData: FormData
): Promise<SignInState> {
  const values = {
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  };

  const validated = signInSchema.safeParse(values);

  console.log(values);
  if (!validated.success) {
    console.log('Validation failed', validated.error.flatten().fieldErrors);
    return {
      errors: validated.error.flatten().fieldErrors,
    };
  }
  try {
    await signIn('email-password', {
      email: values.email,
      password: values.password,
      redirect: false,
      callbackUrl: '/documents',
    });
    return { success: true };
  } catch (error) {
    console.error('Sign in failed', error);
    return {
      message: 'Invalid email or password',
      errors: {
        email: ['Invalid email or password'],
        password: ['Invalid email or password'],
      },
    };
  }
}

export async function googleSignInAction() {
  await signIn('google');
}

export type SignUpState = {
  success?: boolean;
  errors?: Record<string, string[]>;
  message?: string;
  values?: SignUpValues;
};
export async function signUpAction(
  prevState: SignUpState | undefined,
  formData: FormData
): Promise<SignUpState> {
  const values = {
    fullName: String(formData.get('fullName') ?? ''),
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
    confirmPassword: String(formData.get('confirmPassword') ?? ''),
    terms: formData.get('terms') === 'on' ? true : false,
  };

  const result = signUpSchema.safeParse(values);

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      values,
    };
  }
  try {
    console.log('Sign up values:', values);
    const signupRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/signup`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: values.fullName,
          email: values.email,
          password: values.password,
        }),
      }
    );

    if (!signupRes.ok) {
      console.error('Sign up failed', signupRes);

      const error = await signupRes.json();
      if (error?.message === 'Email in use') {
        return {
          message: 'Existing email',
          errors: {
            email: ['Existing email'],
          },
          values,
        };
      }
      return {
        message: error.message || 'Sign up failed',
        values,
      };
    }
    const signupData = await signupRes.json();
    console.log('Sign up successful:', signupData);
    console.log('Waiting for email verification');

    return {
      success: true,
      values,
    };
  } catch (err) {
    console.error('Sign up failed', err);
    return {
      message: 'Something went wrong while signing up',
      values,
    };
  }
}
