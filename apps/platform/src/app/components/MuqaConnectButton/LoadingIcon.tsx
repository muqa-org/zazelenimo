import { useAccount } from 'wagmi';

export function LoadingIcon() {
  const { isConnecting } = useAccount();
  return (
    <>
    {isConnecting && <div className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-primary rounded-full"></div>}
    </>
  );
}
