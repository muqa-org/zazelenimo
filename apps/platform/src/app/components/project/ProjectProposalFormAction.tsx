'use client';

import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ProfileEditModalProps, ProfileEditModal } from '../auth/profile';
import { getMissingFlowFields } from '@/lib/next-auth/validators';
import { UserProfile } from '@/lib/next-auth/types';
import MuqaConnectButton from '../MuqaConnectButton';
import { UpdateUserRequestDTO, UpdateUserResponse, UserProfileDTO } from '@/app/api/user/profile/route';

const profileApi = '/api/user/profile';

type ProjectProposalFormActionProps = {
	formRef: React.RefObject<HTMLFormElement>,
	disabled: boolean,
	pending: boolean,
}

/**
 * A multi-step form action component that handles project proposal submissions.
 * This component manages the following workflow:
 * 1. Checks user authentication status
 * 2. Verifies if the user profile is complete for proposal submission
 * 3. Prompts for missing profile information if needed
 * 4. Handles the final form submission
 *
 * The component renders either:
 * - A connect button for unauthenticated users (MuqaConnectButton)
 * - A submit button for authenticated users
 * - A profile completion modal when required fields are missing
 *
 * When profile updates are needed, the component will:
 * - Display a modal to collect missing information
 * - Update the user profile via API
 * - Automatically continue with form submission after profile completion
 *
 * @param {Object} props
 * @param {React.RefObject<HTMLFormElement>} props.formRef - Reference to the parent form element
 * @param {boolean} props.disabled - Whether the form submission is disabled
 * @param {boolean} props.pending - Whether a submission is currently in progress
 * @returns {JSX.Element} A button component with associated profile modal
 */
const ProjectProposalFormAction = ({ formRef, pending, disabled = false }: ProjectProposalFormActionProps) => {
	const t = useTranslations('proposalForm');
	const { data: session } = useSession();
	const [button, setButton] = useState<JSX.Element | null>(null);

	const [modalProps, setModalProps] = useState<ProfileEditModalProps | null>(null);

	function onClick() {
		return async (e: React.MouseEvent<HTMLButtonElement>) => {
			e.preventDefault();
			const userProfile = await getUserProfile();
			verifyProfile(userProfile, setModalProps, submitForm);
		}
	}

	async function afterSignIn() {
		const userProfile = await getUserProfile();
		return verifyProfile(userProfile, setModalProps, submitForm);
	}

	async function verifyProfile(
		userProfile: UserProfile,
		setModalProps: (props: ProfileEditModalProps | null) => void,
		cb: (data: UpdateUserRequestDTO | null) => unknown
	) {

		const missingFields = getMissingFlowFields(userProfile, 'proposer');

		if (missingFields.length <= 0) {
			setModalProps(null);
			cb(null);
		}

		setModalProps({
			open: true,
			user: userProfile,
			missingFields,
			onSave: (data: UserProfile) => updateUser(data as UpdateUserRequestDTO).then(cb),
			onClose: () => setModalProps(null),
		});
	}

	async function submitForm(data: UpdateUserRequestDTO | null) {
		const form = formRef.current;
		if (!form) return;

		if (data) {
			Object.entries(data).forEach(([key, value]) => {
				const input = form.elements.namedItem(key);
				if (input) {
					(input as HTMLInputElement).value = value;
				}
			});
		}

		form.requestSubmit();
	}

	const className = useMemo(() => `rounded-xl px-10 py-3 text-base font-normal text-white ${
    disabled
      ? 'bg-gray-400 cursor-not-allowed'
      : 'bg-green hover:opacity-85'
  }`, [disabled]);

	const connectButtonRef = useRef<HTMLButtonElement>(null);

	const regularButton = (
		<button
			type='submit'
			disabled={pending || disabled}
			onClick={onClick()}
			className={className}
		>
			{pending ? t('buttonSubmitting') : t('buttonName')}
		</button>
	);

	const connectButton = (
		<MuqaConnectButton
			ref={connectButtonRef}
			className={className}
			disabled={pending || disabled}
			afterSignIn={afterSignIn}
		>
			{disabled ? t('buttonSubmitting') : t('buttonName')}
		</MuqaConnectButton>
	);

	useEffect(() => {
		return session?.user
			? setButton(regularButton)
			: setButton(connectButton);
	}, [session?.user, className]);

	return <>
		{button}
		{modalProps?.open && <ProfileEditModal {...modalProps} />}
	</>
};

export default ProjectProposalFormAction;

async function getUserProfile() {
	const res = await fetch(profileApi);
	const { user } = await res.json() as { user: UserProfileDTO };
	return user as UserProfile;
}

async function updateUser(data: UpdateUserRequestDTO): Promise<UpdateUserRequestDTO | null> {
	try {
		const res = await fetch(profileApi, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});

		await res.json() as UpdateUserResponse;
		return data;
	} catch (error) {
		console.error('Error updating user profile:', error);
		return null;
	}
}
