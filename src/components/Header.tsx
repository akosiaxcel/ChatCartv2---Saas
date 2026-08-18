import { Utensils } from 'lucide-react';

interface HeaderProps {
  restaurantName: string;
  tableNumber: string;
  setTableNumber: (val: string) => void;
}

export default function Header({ restaurantName, tableNumber, setTableNumber }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-bottom border-zinc-100 px-4 py-4">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 p-2 rounded-xl">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-sans font-bold text-xl tracking-tight text-zinc-900">
            {restaurantName}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="table" className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Table
          </label>
          <input
            id="table"
            type="text"
            placeholder="#"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="w-12 h-9 text-center bg-zinc-100 border-none rounded-lg font-mono font-bold text-zinc-900 focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
      </div>
    </header>
  );
}
