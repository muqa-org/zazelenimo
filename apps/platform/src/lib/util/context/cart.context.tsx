'use client';

import { CartAllocation, FundedApplication } from '@allo/kit';
import {
	createContext,
	FC,
	PropsWithChildren,
	useContext,
	useMemo,
	useState,
} from 'react';

export type CartContextType = {
	items: CartAllocation[];
	addItem: (item: FundedApplication, amount?: number) => void;
	removeItem: (id: string) => void;
	setAmount: (id: string, amount: number) => void;
	clearCart: () => void;
	totalAmount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: FC<PropsWithChildren> = ({ children, ...props }) => {
	const [items, setItems] = useState<CartAllocation[]>([]);

	/**
	 * Adds a project (accepted application) to the cart.
	 * @param project A FundedApplication object representing an accepted application to a round.
	 */
	const addItem = (project: FundedApplication, amount = 0) => {
		const existingItem = items.find(item => item.project.id === project.id);
		if (existingItem) return;

		const item: CartAllocation = {
			project,
			amount,
		};
		setItems([...items, item]);
	};

	/**
	 * Removes a project from the cart.
	 * @param id The unique identifier of the project to be removed.
	 */
	const removeItem = (id: string) => {
		const existingItem = items.find(it => it.project.id === id);
		if (!existingItem) return;

		setItems(items.filter(it => it.project.id !== id));
	};

	/**
	 * Sets the donation amount for a specific project in the cart.
	 * @param id The unique identifier of the project.
	 * @param amount The new donation amount to be set.
	 */
	const setAmount = (id: string, amount: number) => {
		const existingItem = items.find(it => it.project.id === id);
		if (!existingItem) return;

		existingItem.amount = amount;
		setItems(items.map(it => (it.project.id === id ? existingItem : it)));
	};

	/**
	 * Clears all items from the cart.
	 */
	const clearCart = () => {
		setItems([]);
	};

	/**
	 * Calculates the total donation amount across all items in the cart.
	 */
	const totalAmount = useMemo(() => {
		return items.reduce((acc, item) => acc + item.amount, 0);
	}, [items]);

	const defaultCartContext: CartContextType = {
		items,
		addItem,
		removeItem,
		setAmount,
		totalAmount,
		clearCart,
	};

	return (
		<CartContext.Provider value={defaultCartContext} {...props}>
			{children}
		</CartContext.Provider>
	);
};

export const useCart = () => {
	const context = useContext(CartContext);
	if (!context) {
		throw new Error('useCart must be used within a CartProvider');
	}
	return context;
};
