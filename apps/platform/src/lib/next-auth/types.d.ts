export type UserProfile = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  // kycStatus?: string;
};
export type Flow = 'proposer' | 'donator';

export const profileFields = {
  proposer: ['firstName', 'lastName', 'email', 'mobile'] as const,
  donator: ['firstName', 'lastName', 'email'] as const
};

export type ProfileField = typeof profileFields.base[number] |
                    typeof profileFields.proposer[number] |
                    typeof profileFields.donator[number];