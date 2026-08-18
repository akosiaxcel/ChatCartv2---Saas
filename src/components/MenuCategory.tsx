import { Category as MenuCategoryType, CartItem, MenuItem as MenuItemType } from '../types';
import MenuItem from './MenuItem';

interface MenuCategoryProps {
  items: MenuItemType[];
  cart: CartItem[];
  onUpdateCart: (item: MenuItemType, delta: number) => void;
  onSelectItem?: (item: MenuItemType) => void;
  currency: string;
}

export default function MenuCategory({ items, cart, onUpdateCart, onSelectItem, currency }: MenuCategoryProps) {
  return (
    <section className="mb-10">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
        {items.map((item) => {
          const cartItem = cart.find((i) => i.id === item.id);
          return (
            <MenuItem
              key={item.id}
              item={item}
              quantity={cartItem?.quantity || 0}
              onAdd={() => onUpdateCart(item, 1)}
              onRemove={() => onUpdateCart(item, -1)}
              onClick={() => onSelectItem && onSelectItem(item)}
              currency={currency}
            />
          );
        })}
      </div>
    </section>
  );
}
