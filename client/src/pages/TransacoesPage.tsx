import { useState, useMemo } from "react";
import { useTransacoes, useCartoes, formatCurrency } from "@/hooks/useFinance";
import MonthSelector from "@/components/MonthSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, CreditCard, Wallet, Calculator } from "lucide-react";

// Configuração visual dos cartões com a nova categoria "Outros"
const DEFAULT_CARTOES: Record<string, { nome: string; cor: string; bg: string; border: string; rawCor: string; isWallet?: boolean }> = {
  nubank: { nome: "Nubank", cor: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", rawCor: "purple" },
  inter: { nome: "Banco Inter", cor: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", rawCor: "orange" },
  mercado_pago: { nome: "Mercado Pago", cor: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", rawCor: "blue" },
  picpay: { nome: "PicPay", cor: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", rawCor: "emerald" },
  outros: { nome: "Outros (PIX/Dinheiro)", cor: "text-zinc-300", bg: "bg-zinc-500/10", border: "border-zinc-500/20", rawCor: "zinc", isWallet: true }
};

const PALETA_CORES = [
  { id: "purple", cor: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { id: "orange", cor: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { id: "blue", cor: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { id: "emerald", cor: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: "pink", cor: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  { id: "zinc", cor: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/20" }
];

export default function TransacoesPage() {
  const { ano, setAno, mes, setMes, query, add, del, meses } = useTransacoes();
  const cartoesQuery = useCartoes();

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [cartao, setCartao] = useState("nubank");
  
  const hoje = new Date().toISOString().split('T')[0];
  const [dataCompra, setDataCompra] = useState(hoje);
  
  const [isParcelado, setIsParcelado] = useState(false);
  const [qtdParcelas, setQtdParcelas] = useState("2");

  const todosCartoes = useMemo(() => {
    const lista: Record<string, any> = { ...DEFAULT_CARTOES };
    if (cartoesQuery.query.data) {
      cartoesQuery.query.data.forEach((c: any) => {
        const configCor = PALETA_CORES.find(item => item.id === c.cor) || PALETA_CORES[0];
        lista[c.id] = {
          nome: c.nome,
          cor: configCor.cor,
          bg: configCor.bg,
          border: configCor.border,
        };
      });
    }
    return lista;
  }, [cartoesQuery.query.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = parseFloat(valor);
    if (isNaN(numVal) || numVal <= 0 || !descricao) return;

    add.mutate({
      descricao,
      valor: numVal,
      cartao,
      dataCompra,
      mes,
      ano,
      parcelado: isParcelado,
      qtdParcelas: isParcelado ? parseInt(qtdParcelas) : 1
    });

    setDescricao("");
    setValor("");
    setIsParcelado(false);
    setQtdParcelas("2");
  };

  const faturas = useMemo(() => {
    if (!query.data) return {};
    return query.data.reduce((acc: any, t: any) => {
      const cardKey = t.cartao || "nubank"; 
      if (!acc[cardKey]) {
        acc[cardKey] = { total: 0, compras: [] };
      }
      acc[cardKey].compras.push(t);
      acc[cardKey].total += parseFloat(t.valor);
      return acc;
    }, {});
  }, [query.data]);

  const faturasOrdenadasPorCartao = useMemo(() => {
    const entradas = Object.entries(faturas);
    return entradas.sort(([keyA], [keyB]) => {
      const nomeA = todosCartoes[keyA]?.nome || keyA;
      const nomeB = todosCartoes[keyB]?.nome || keyB;
      return nomeA.localeCompare(nomeB);
    });
  }, [faturas, todosCartoes]);

  const totalGeralDoMes = useMemo(() => {
    if (!query.data) return 0;
    return query.data.reduce((acc: number, t: any) => acc + parseFloat(t.valor || 0), 0);
  }, [query.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Lançamentos</h1>
        <MonthSelector mes={mes} setMes={setMes} meses={meses} ano={ano} setAno={setAno} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Compra / Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input 
                type="date" 
                value={dataCompra} 
                onChange={(e) => setDataCompra(e.target.value)} 
                className="w-full appearance-none min-h-[40px] bg-transparent flex items-center justify-start"
                required 
              />
              <Input placeholder="Descrição (ex: Ifood, Empréstimo)" value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
              <Input type="number" step="0.01" placeholder="Valor Total (R$)" value={valor} onChange={(e) => setValor(e.target.value)} required />
              
              <Select value={cartao} onValueChange={setCartao}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(todosCartoes).map(([key, c]) => (
                    <SelectItem key={key} value={key}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 mt-2 border border-zinc-800 rounded-md bg-zinc-900/30">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
                <div className="flex items-center space-x-2">
                  <Switch id="parcelado" checked={isParcelado} onCheckedChange={setIsParcelado} />
                  <Label htmlFor="parcelado" className="text-zinc-300 cursor-pointer">Compra parcelada?</Label>
                </div>
                {isParcelado && (
                  <div className="flex items-center gap-3 sm:border-l border-zinc-700 sm:pl-6">
                    <Label htmlFor="parcelas" className="whitespace-nowrap text-zinc-300">Qtd. Parcelas:</Label>
                    <Input id="parcelas" type="number" min="2" max="72" value={qtdParcelas} onChange={(e) => setQtdParcelas(e.target.value)} className="w-20" />
                  </div>
                )}
              </div>
              <Button type="submit" disabled={add.isPending} className="w-full sm:w-auto min-w-[120px]">
                {add.isPending ? "Salvando..." : "Registrar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {!query.isLoading && totalGeralDoMes > 0 && (
        <div className="flex items-center justify-between p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg shadow-sm mt-6">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-zinc-400" />
            <span className="text-sm sm:text-base font-medium text-zinc-300">Total de Gastos no Mês</span>
          </div>
          <span className="text-xl font-bold text-foreground">{formatCurrency(totalGeralDoMes)}</span>
        </div>
      )}

      <div className="space-y-6">
        {query.isLoading ? (
          <p className="text-muted-foreground text-sm">Carregando lançamentos...</p>
        ) : faturasOrdenadasPorCartao.length > 0 ? (
          faturasOrdenadasPorCartao.map(([cardKey, data]: [string, any]) => {
            const config = todosCartoes[cardKey];
            if (!config) return null;
            
            const comprasOrdenadas = data.compras.sort((a: any, b: any) => {
              const diffDias = new Date(b.dataCompra).getTime() - new Date(a.dataCompra).getTime();
              if (diffDias === 0) {
                return (b.createdAt || 0) - (a.createdAt || 0);
              }
              return diffDias;
            });
            
            const Icon = config.isWallet ? Wallet : CreditCard;

            return (
              <Card key={cardKey} className={`${config.border} border-t-4`}>
                <CardHeader className={`${config.bg} flex flex-row items-center justify-between pb-4`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${config.cor}`} />
                    <CardTitle className="text-lg">{config.nome}</CardTitle>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">Total</span>
                    <span className={`text-xl font-bold ${config.cor}`}>{formatCurrency(data.total)}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {comprasOrdenadas.map((t: any) => {
                      const dataFormatada = t.dataCompra ? new Date(t.dataCompra + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '') : '--/--';
                      return (
                        <div key={t.id} className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg hover:bg-zinc-900/50 transition-colors gap-3">
                          
                          {/* Bloco empilhado estilo Nubank: Data em cima (pequena) e Descrição embaixo */}
                          <div className="flex flex-col flex-1 min-w-0 justify-center">
                            <span className="text-xs font-medium text-zinc-500 mb-0.5 capitalize">
                              {dataFormatada}
                            </span>
                            <span className="font-medium text-foreground block whitespace-normal break-words leading-tight">
                              {t.descricao}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-bold text-rose-500 whitespace-nowrap">{formatCurrency(t.valor)}</span>
                            <Button variant="ghost" size="icon" onClick={() => del.mutate(t.id)} className="h-8 w-8 shrink-0">
                              <Trash2 className="w-4 h-4 text-zinc-500 hover:text-red-500" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum lançamento registrado para este mês.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}