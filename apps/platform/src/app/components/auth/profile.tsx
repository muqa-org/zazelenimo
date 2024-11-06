import { ProfileField, UserProfile } from '@/lib/next-auth/types';
import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../Button';
import { useTranslations } from 'next-intl';

export type ProfileEditModalProps = {
  user: UserProfile;
  missingFields: ProfileField[];
  onSave: (updatedFields: Partial<UserProfile>) => void;
  onClose: () => void;
  open: boolean;
};

const fieldLabels: Record<ProfileField, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email Address',
  // kycStatus: 'KYC Status'
};

export function ProfileEditModal({
  user,
  missingFields,
  onSave,
  onClose,
  open
}: ProfileEditModalProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const t = useTranslations('profile');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleChange = (field: ProfileField, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Modal open={open} onOpenChange={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="mb-2 text-[28px] text-primaryBlack">{t('title')}</h2>

        <form onSubmit={handleSubmit}>
          <div>
            {Object.keys(fieldLabels).map((field) => {
              const isEditable = missingFields.includes(field as ProfileField);
              const currentValue = user[field as keyof UserProfile] || '';

              return (
                <div key={field} className="mb-6">
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
                    className={`wmb-2 mt-1 block w-full rounded-md text-base border border-borderGray p-2 shadow-sm`}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-between space-x-3">
            <Button type="submit" className='rounded-xl bg-green px-10 py-3 text-base font-normal text-white hover:opacity-85'>
              {t('save')}
            </Button>
            <Button type="button" variant="link" onClick={onClose}>
              {t('cancel')}
            </Button>
          </div>
        </form>
    </div>
    </Modal>
  );
}
