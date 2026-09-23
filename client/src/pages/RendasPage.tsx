import { useState, useMemo } from "react";
import { useRendas, formatCurrency } from "@/hooks/useFinance";
import MonthSelector from "@/components/MonthSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, Edit2, Wallet } from "lucide-react";

export default function RendasPage() {
  const { ano, setAno, mes, setMes, query, upsert, del, meses } = useRendas();
  
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [isFixa, setIsFixa] = useState(false);

  const totalRendas = useMemo(() => {
    if (!query.data) return 0;
    return query.data.reduce((acc: number, r: any) => acc + parseFloat(r.valor || 0), 0);
  }, [query.data]);

  const rendasOrdenadas = useMemo(() => {
    if (!query.data) return [];
    return [...query.data].sort((a: any, b: any) => Number(b.valor) - Number(a.valor));
  }, [query.data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = parseFloat(valor);
    if (isNaN(numVal) || numVal <= 0 || !descricao) return;

    if (idEditando || !isFixa) {
      upsert.mutate({
        id: idEditando,
        categoria: descricao,
        valor: numVal,
        mes,
        ano
      });
    } else {
      for (let m = mes; m <= 12; m++) {
        upsert.mutate({
          categoria: descricao,
          valor: numVal,
          mes: m,
          ano
        });
      }
    }

    setDescricao("");
    setValor("");
    setIsFixa(false);
    setIdEditando(null);
  };

  const handleEdit = (renda: any) => {
    setIdEditando(renda.id);
    setDescricao(renda.categoria);
    setValor(renda.valor.toString());
    setIsFixa(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setDescricao("");
    setValor("");
    setIsFixa(false);
    setIdEditando(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Rendas</h1>
        <MonthSelector mes={mes} setMes={setMes} meses={meses} ano={ano} setAno={setAno} />
      </div>

      <Card className="border-emerald-500/20">
        <CardHeader className="bg-emerald-500/5 pb-4">
          <CardTitle className="text-lg text-emerald-500">
            {idEditando ? "Editar Renda" : "Nova Fonte de Renda"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Descrição (ex: Salário, Freelance)"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required
                className="md:col-span-2"
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
                <Button 
                  type="submit" 
                  disabled={upsert.isPending} 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {upsert.isPending ? "Salvando..." : idEditando ? "Salvar" : "Adicionar"}
                </Button>
                {idEditando && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancelEdit} 
                    className="px-3"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>

            {!idEditando && (
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="rendaFixa"
                  checked={isFixa}
                  onCheckedChange={setIsFixa}
                />
                <Label htmlFor="rendaFixa" className="text-zinc-300 cursor-pointer">
                  Renda fixa mensal? <span className="text-zinc-500 font-normal text-xs">(Replica automaticamente até o final do ano)</span>
                </Label>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-500" />
            <CardTitle>Rendas de {meses[mes - 1]}</CardTitle>
          </div>
          <div className="text-right">
            <span className="text-sm text-muted-foreground mr-2">Total:</span>
            <span className="text-xl font-bold text-emerald-500">{formatCurrency(totalRendas)}</span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {query.isLoading ? (
            <p className="text-muted-foreground text-sm">Carregando rendas...</p>
          ) : rendasOrdenadas.length > 0 ? (
            <div className="space-y-3">
              {rendasOrdenadas.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 sm:p-4 border border-zinc-800 rounded-lg bg-zinc-900/20 hover:bg-zinc-900/50 transition-colors gap-3">
                  
                  {/* TEXTO LIVRE: Quebra a linha automaticamente sem precisar clicar */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground whitespace-normal break-words leading-tight">
                      {r.categoria}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-emerald-500 whitespace-nowrap">
                      +{formatCurrency(r.valor)}
                    </span>
                    <div className="flex items-center gap-1 border-l border-zinc-700 pl-3">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(r)} className="h-8 w-8 text-zinc-400 hover:text-blue-400 shrink-0">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => del.mutate(r.id)} className="h-8 w-8 text-zinc-400 hover:text-red-500 shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">Nenhuma renda registrada neste mês.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}