import { ChevronUp, ChevronDown } from 'lucide-react';

export default function SortButtons({ index, total, onMove }) {
  return (
    <div className="flex flex-col">
      <button
        onClick={() => onMove(index, index - 1)}
        disabled={index === 0}
        className="p-0.5 rounded hover:bg-white/5 text-slate-500 hover:text-white disabled:opacity-20 disabled:cursor-default"
      >
        <ChevronUp size={14} />
      </button>
      <button
        onClick={() => onMove(index, index + 1)}
        disabled={index === total - 1}
        className="p-0.5 rounded hover:bg-white/5 text-slate-500 hover:text-white disabled:opacity-20 disabled:cursor-default"
      >
        <ChevronDown size={14} />
      </button>
    </div>
  );
}
