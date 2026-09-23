import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthSelectorProps {
  mes: number;
  setMes: (mes: number) => void;
  meses: string[];
  ano?: number;
  setAno?: (ano: number) => void;
}

export default function MonthSelector({ mes, setMes, meses, ano = 2026, setAno }: MonthSelectorProps) {
  
  const handlePrevMonth = () => {
    if (mes > 1) {
      setMes(mes - 1);
    } else {
      setMes(12);
      if (setAno) setAno(ano - 1);
    }
  };

  const handleNextMonth = () => {
    if (mes < 12) {
      setMes(mes + 1);
    } else {
      setMes(1);
      if (setAno) setAno(ano + 1);
    }
  };

  const handlePrevYear = () => {
    if (setAno) setAno(ano - 1);
  };

  const handleNextYear = () => {
    if (setAno) setAno(ano + 1);
  };

  return (
    // Removido o flex-wrap, agora usamos gap-2 no celular e gap-4 no PC (sm:gap-4)
    <div className="flex items-center gap-2 sm:gap-4">
      {/* Seletor de Mês */}
      <div className="flex items-center gap-1">
        <button
          onClick={handlePrevMonth}
          className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        <div className="flex items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 bg-zinc-900 rounded-lg border border-zinc-800 min-w-[100px] sm:min-w-[120px]">
          <span className="text-sm font-semibold text-foreground">
            {meses[mes - 1]}
          </span>
        </div>
        
        <button
          onClick={handleNextMonth}
          className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Seletor de Ano */}
      {setAno && (
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevYear}
            className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
            aria-label="Ano anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="flex items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 bg-zinc-900/50 rounded-lg border border-zinc-800/50 min-w-[70px] sm:min-w-[80px]">
            <span className="text-sm font-semibold text-zinc-300">
              {ano}
            </span>
          </div>
          
          <button
            onClick={handleNextYear}
            className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
            aria-label="Próximo ano"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}