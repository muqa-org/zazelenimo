'use client';

export function AddToCheckout() {
  // const { data: checkout } = useCheckout();
  // const { data, mutate, isPending } = useAddToCheckout();
  // console.log(data, checkout, isPending);
  // const isAdded = checkout[id];
  const isAdded = false;
  return (
    <div className="flex gap-2">
      <button
        // disabled={isPending}
        className="rounded border border-gray-100 px-3 py-2"
        // onClick={() => mutate({ id })}
      >
        {isAdded ? 'In cart' : 'Add to checkout'}
      </button>
    </div>
  );
}
