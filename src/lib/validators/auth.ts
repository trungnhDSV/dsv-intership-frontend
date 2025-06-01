import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().min(1, 'Mandatory field').email({ message: 'Invalid email address' }),
  password: z.string().min(1, 'Mandatory field'),
});

export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    fullName: z.string().min(1, 'Mandatory field'),
    email: z.string().min(1, 'Mandatory field').email('Invalid email address'),
    password: z
      .string()
      .min(1, 'Mandatory field')
      .min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z
      .string()
      .min(1, 'Mandatory field')
      .min(8, 'Password must be at least 8 characters long'),
    terms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must be the same',
    path: ['password'], // lỗi hiển thị ở password
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must be the same',
    path: ['confirmPassword'], // lỗi hiển thị ở confirmPassword
  });

export type SignUpValues = z.infer<typeof signUpSchema>;
