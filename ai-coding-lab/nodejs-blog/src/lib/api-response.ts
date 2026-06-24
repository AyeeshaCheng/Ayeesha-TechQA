import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';

export function successResponse<T>(data: T, message = 'success', status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ code: status, message, data }, { status });
}

export function errorResponse(code: number, message: string): NextResponse<ApiResponse> {
  return NextResponse.json({ code, message }, { status: code });
}
