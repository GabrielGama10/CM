import { useState, useMemo } from "react";
import { useDespesasFixas, formatCurrency } from "@/hooks/useFinance";
import MonthSelector from "@/components/MonthSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Receipt } from "lucide-react";

export default function DespesasPage() {
  const { ano, setAno, mes, setMes, query, upsert, del, meses } = useDespesasFixas();
  
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");

  const totalDespesas = useMemo(() => {
    if (!query.data) return 0;
    return query.data.reduce((acc: number, d: any) => acc + parseFloat(d.valor || 0), 0);
  }, [query.data]);

  const despesasOrdenadas = useMemo(() => {
    if (!query.data) return [];
    return [...query.data].sort((a: any, b: any) => 
      a.categoria.localeCompare(b.categoria)
    );
  }, [query.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = parseFloat(valor);
    if (isNaN(numVal) || numVal <= 0 || !descricao) return;

    upsert.mutate({
      id: idEditando, 
      categoria: descricao, 
      valor: numVal,
      mes,
      ano
    });

    setDescricao("");
    setValor("");
    setIdEditando(null);
  };

  const handleEdit = (despesa: any) => {
    setIdEditando(despesa.id);
    setDescricao(despesa.categoria);
    setValor(despesa.valor.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setDescricao("");
    setValor("");
    setIdEditando(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Despesas Fixas</h1>
        <MonthSelector mes={mes} setMes={setMes} meses={meses} ano={ano} setAno={setAno} />
      </div>

      <Card className="border-rose-500/20">
        <CardHeader className="bg-rose-500/5 pb-4">
          <CardTitle className="text-lg text-rose-500">
            {idEditando ? "Editar Despesa" : "Nova Despesa Fixa"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Nome da Conta (ex: Aluguel, Luz)"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Valor (R$)"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={upsert.isPending} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white">
                  {upsert.isPending ? "Salvando..." : idEditando ? "Salvar Alterações" : "Adicionar Conta"}
                </Button>
                {idEditando && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit} className="px-4">
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-rose-500" />
            <CardTitle>Contas de {meses[mes - 1]}</CardTitle>
          </div>
          <div className="text-right">
            <span className="text-sm text-muted-foreground mr-2">Total:</span>
            <span className="text-xl font-bold text-rose-500">{formatCurrency(totalDespesas)}</span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {query.isLoading ? (
            <p className="text-muted-foreground text-sm">Carregando contas...</p>
          ) : despesasOrdenadas.length > 0 ? (
            <div className="space-y-3">
              {despesasOrdenadas.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between p-3 sm:p-4 border border-zinc-800 rounded-lg bg-zinc-900/20 hover:bg-zinc-900/50 transition-colors gap-3">
                  
                  {/* TEXTO LIVRE: Quebra a linha automaticamente sem precisar clicar */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground whitespace-normal break-words leading-tight">
                      {d.categoria}
                    </p>
                  </div>
                  
                  {/* Bloco de valores e botões trancado à direita (shrink-0) */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-foreground whitespace-nowrap">
                      {formatCurrency(d.valor)}
                    </span>
                    <div className="flex items-center gap-1 border-l border-zinc-700 pl-3">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(d)} className="h-8 w-8 text-zinc-400 hover:text-blue-400 shrink-0">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => del.mutate(d.id)} className="h-8 w-8 text-zinc-400 hover:text-red-500 shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">Nenhuma despesa fixa registrada neste mês.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}