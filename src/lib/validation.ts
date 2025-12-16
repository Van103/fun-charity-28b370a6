import { z } from 'zod';

// Password requirements for signup
export const signupSchema = z.object({
  email: z.string()
    .min(1, 'Email không được để trống')
    .email('Email không hợp lệ')
    .max(255, 'Email quá dài (tối đa 255 ký tự)'),
  password: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .max(128, 'Mật khẩu quá dài (tối đa 128 ký tự)')
    .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
    .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
    .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số')
    .regex(/[^A-Za-z0-9]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*)'),
  fullName: z.string()
    .trim()
    .min(1, 'Tên không được để trống')
    .max(100, 'Tên quá dài (tối đa 100 ký tự)')
    .regex(/^[\p{L}\s'\-.]+$/u, 'Tên chỉ được chứa chữ cái, khoảng trắng, dấu nháy và gạch nối')
});

// Login only validates presence and basic format
export const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email không được để trống')
    .email('Email không hợp lệ')
    .max(255, 'Email quá dài'),
  password: z.string()
    .min(1, 'Mật khẩu không được để trống')
    .max(128, 'Mật khẩu quá dài')
});

// Helper to get first validation error message from a failed parse result
export const getValidationError = (result: z.SafeParseReturnType<unknown, unknown>): string => {
  if (!result.success) {
    return result.error.errors[0]?.message || 'Dữ liệu không hợp lệ';
  }
  return 'Dữ liệu không hợp lệ';
};
