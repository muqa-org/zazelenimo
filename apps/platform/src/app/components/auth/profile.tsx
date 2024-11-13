import { UpdateUserRequestSchema } from '@/app/api/user/profile/schema';
import { ProfileField, UserProfile } from '@/lib/next-auth/types';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge'
import { z } from 'zod';

import { Modal } from '../common/Modal';
import { Button } from '../Button';
import FormErrorMessage from '../common/FormErrorMessage';

export type ProfileEditModalProps = {
  user: UserProfile;
  missingFields: ProfileField[];
  onSave: (data: UserProfile) => Promise<unknown>;
  onClose: () => void;
  open: boolean;
};

const fieldLabels: Record<ProfileField, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email Address',
  mobile: 'Mobile Number',
  // kycStatus: 'KYC Status'
};

const errorMessages: Record<ProfileField, string> = {
  firstName: 'firstNameError',
  lastName: 'lastNameError',
  email: 'emailError',
  mobile: 'mobileError',
};

export function ProfileEditModal({
  open,
  user,
  missingFields,
  onClose,
  onSave,
}: ProfileEditModalProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>(user);
  const [errors, setErrors] = useState<Partial<Record<ProfileField, string>>>({});
  const [isPending, setIsPending] = useState(false);
  const t = useTranslations('profile');
  const tf = useTranslations('proposalForm');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const validatedData = UpdateUserRequestSchema.parse(formData);
      await onSave(validatedData as UserProfile);
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<ProfileField, string>> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as ProfileField;
          newErrors[field] = tf(errorMessages[field]);
        });
        setErrors(newErrors);
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleChange = (field: ProfileField, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <Modal open={open} onOpenChange={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="mb-2 text-[28px] text-primaryBlack">{tf('contact')}</h2>
        <div className='mb-6 text-base text-black'>
          {tf('contactDescription')}
        </div>

        <div>
          {Object.keys(fieldLabels).map((field) => {
            const isEditable = missingFields.includes(field as ProfileField);
            const currentValue = user[field as keyof UserProfile] || '';
            const error = errors[field as ProfileField];

            const editableClass = !isEditable ? 'cursor-not-allowed bg-gray-100' : '';
            const errorClass = error ? 'border-borderRed bg-softRedBG' : 'border-borderGray bg-white';

            return (
              <div key={field} className="mb-7">
                <label
                  htmlFor={field}
                  className="mb-2 block text-sm font-bold text-softBlack"
                >
                  {t(field)}
                </label>

                <input
                  id={field}
                  type={field === 'email' ? 'email' : 'text'}
                  value={isEditable ? (formData[field as keyof UserProfile] || '') : currentValue}
                  onChange={(e: any) => handleChange(field as ProfileField, e.target.value)}
                  disabled={!isEditable}
                  required={isEditable}
                  className={twMerge('block w-full rounded-md text-base border p-2 shadow-sm', errorClass, editableClass)}
                />
                {error && (
                  <div className='absolute'>
                    <FormErrorMessage message={error} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex justify-between space-x-3">
          <Button type="submit"
            className='rounded-xl bg-green w-1/4 text-base font-normal text-white hover:opacity-85 h-10 flex items-center justify-center'
            disabled={isPending}
            onClick={handleSubmit}>
            {isPending
              ? <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-primary rounded-full"></div>
              : t('save')
            }
          </Button>
          <Button type="button" variant="link" onClick={onClose}>
            {t('cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
