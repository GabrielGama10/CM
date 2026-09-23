import { useState, useEffect } from "react";
import { useReservas, formatCurrency } from "@/hooks/useFinance";
import MonthSelector from "@/components/MonthSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, PiggyBank, Trash2 } from "lucide-react";

export default function ReservasPage() {
  const { ano, setAno, mes, setMes, query, upsert, del, meses } = useReservas();
  const [meta, setMeta] = useState("");
  const [valor, setValor] = useState("");
  const [isTreze, setIsTreze] = useState(false);

  // Pega o registro atual do mês se existir
  const existing = query.data && query.data.length > 0 ? query.data[0] : null;

  // Preenche os inputs automaticamente quando os dados do banco chegarem ou mudarem de mês
  useEffect(() => {
    if (existing) {
      setMeta(existing.meta?.toString() || "");
      setValor(existing.valor?.toString() || "");
      setIsTreze(existing.isTreze === "sim");
    } else {
      setMeta("");
      setValor("");
      setIsTreze(false);
    }
  }, [existing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const metaVal = parseFloat(meta) || 0;
    const valorVal = parseFloat(valor) || 0;

    upsert.mutate({
      id: existing ? existing.id : null, // Se já existe, atualiza pelo ID; senão cria novo
      ano, 
      mes,
      meta: metaVal,
      valor: valorVal,
      isTreze: isTreze ? "sim" : "nao",
    });
  };

  const metaNum = existing ? parseFloat(existing.meta || 0) : 0;
  const valorNum = existing ? parseFloat(existing.valor || 0) : 0;
  const progresso = metaNum > 0 ? Math.min(100, (valorNum / metaNum) * 100) : 0;
  const atingida = valorNum >= metaNum && metaNum > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reservas</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle sua reserva mensal e 13º salário</p>
        </div>
        <MonthSelector mes={mes} setMes={setMes} meses={meses} ano={ano} setAno={setAno} />
      </div>

      {/* Card principal de visualização do progresso */}
      <Card className="border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-violet-600/5">
        <CardContent className="p-6">
          
          {/* Adicionamos flex-wrap e gap-y-4 para permitir que a Meta desça de linha em telas pequenas */}
          <div className="flex flex-wrap items-start justify-between mb-4 gap-x-4 gap-y-4">
            
            {/* Bloco Esquerdo: Livre de amarras, sem o truncate no dinheiro */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                <PiggyBank className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reserva de {meses[mes - 1]}</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(valorNum)}</p>
              </div>
            </div>
            
            {/* Bloco Direito: ml-auto garante que, se descer de linha, ele fique alinhado à direita */}
            <div className="flex items-center gap-3 sm:gap-4 ml-auto">
              {metaNum > 0 && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Meta</p>
                  <p className="text-xl font-bold text-violet-400 whitespace-nowrap">{formatCurrency(metaNum)}</p>
                </div>
              )}
              {existing && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => del.mutate(existing.id)} 
                  className="text-zinc-400 hover:text-red-500 shrink-0 h-8 w-8"
                  title="Excluir Reserva"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          <div className="mb-4">
            <Progress value={progresso} className="h-3 bg-violet-500/20" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {metaNum > 0 ? (
              atingida ? (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Meta atingida!</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Faltam {formatCurrency(metaNum - valorNum)}</span>
                </div>
              )
            ) : (
              <p className="text-sm text-muted-foreground">Defina uma meta e o valor guardado abaixo</p>
            )}
            {existing?.isTreze === "sim" && (
              <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium whitespace-nowrap">
                13° Salário Incluso
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Edição / Criação */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gerenciar Reserva do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Meta da Reserva (R$)</label>
                <Input
                  type="number"
                  placeholder="Ex: 1000.00"
                  value={meta}
                  onChange={e => setMeta(e.target.value)}
                  className="h-9 bg-zinc-800"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Valor Guardado (R$)</label>
                <Input
                  type="number"
                  placeholder="Ex: 500.00"
                  value={valor}
                  onChange={e => setValor(e.target.value)}
                  className="h-9 bg-zinc-800"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="treze"
                  checked={isTreze} 
                  onCheckedChange={setIsTreze} 
                />
                <label htmlFor="treze" className="text-sm text-zinc-300 cursor-pointer">Considerar 13° salário</label>
              </div>
              <Button type="submit" disabled={upsert.isPending} className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white">
                {upsert.isPending ? "Salvando..." : existing ? "Atualizar Reserva" : "Salvar Reserva"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}