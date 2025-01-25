export function AddressTooltip({ show, label, onMouseEnter, onMouseLeave }: {
  show: boolean,
  label?: `0x${string}`,
  onMouseEnter?: () => void,
  onMouseLeave?: () => void
}) {
  const copyToClipboard = () => {
    if (label) {
      navigator.clipboard.writeText(label);
    }
  };

  return (
    <>
    {show && !!label && (
      <div className="absolute top-8 right-0 mt-2 w-max p-2 bg-gray-700 font-mono text-white text-sm rounded flex items-center"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}>
        <span>{label}</span>
        <button
          onClick={copyToClipboard}
          className="ml-2 p-1 bg-gray-600 hover:bg-gray-500 rounded active:bg-gray-400 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400"
          title="Copy to clipboard"
        >
          <span className="transform inline-block transition-transform duration-150 ease-in-out active:scale-90">
            📋
          </span>
        </button>
      </div>
    )}
    </>
  );
}
