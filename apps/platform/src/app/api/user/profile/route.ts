import { z } from 'zod';
import { validateBody } from '@/lib/util/auth';
import { getUser, updateUser, User } from '@muqa/db';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/next-auth/web3-provider/auth-options';

export const UpdateUserRequestSchema = z.object({
  firstName: z.string().min(1, 'firstNameError'),
  lastName: z.string().min(1, 'lastNameError'),
  email: z.string().email('emailError'),
  mobile: z.string().min(1, 'mobileError'),
}).strip();

export type UpdateUserRequestDTO = z.infer<typeof UpdateUserRequestSchema>;
export type UpdateUserResponse = {
  success: boolean;
}

export interface UserProfileDTO {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  mobile: string | null;
}

class UserProfile implements UserProfileDTO {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  mobile: string | null;

  constructor(user: User) {
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
    this.mobile = user.mobile;
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUser(session.user as User);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user: new UserProfile(user) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const result = validateBody(body, UpdateUserRequestSchema);
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  await updateUser(session.user as User, result.data as UpdateUserRequestDTO);

  return NextResponse.json({ success: true });
}
