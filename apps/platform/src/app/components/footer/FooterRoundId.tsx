'use client';

import { useRoundId } from '@/app/contexts/roundIdContext';

export default function Footer() {
	const { roundId, setRoundId } = useRoundId();

  function onRoundIdInput(e: any) {
		const value = e.target.value.replace(/([^0-9]+)/gi, '');
		setRoundId(value);
	}

	return (
    <div className='relative'>
      <span className='absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-500'>ROUND</span>
      <input
        type="text"
        className='text-sm px-2 py-2 pl-16 w-30 rounded-md border border-borderGray'
        value={roundId}
        onChange={onRoundIdInput}
      />
    </div>
	);
}
