import { useState, useMemo } from "react";
import { useEmprestimos, usePessoas, useCartoes, formatCurrency } from "@/hooks/useFinance";
import MonthSelector from "@/components/MonthSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, Users } from "lucide-react";

// Dicionário completo de cores igualzinho à tela de Cartões!
const DEFAULT_CARTOES: Record<string, { nome: string; cor: string; bg: string; border: string }> = {
  nubank: { nome: "Nubank", cor: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/50" },
  inter: { nome: "Banco Inter", cor: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/50" },
  mercado_pago: { nome: "Mercado Pago", cor: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/50" },
  picpay: { nome: "PicPay", cor: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/50" },
  outros: { nome: "Outros (PIX/Dinheiro)", cor: "text-zinc-300", bg: "bg-zinc-500/10", border: "border-zinc-500/50" }
};

const PALETA_CORES = [
  { id: "purple", cor: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/50" },
  { id: "orange", cor: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/50" },
  { id: "blue", cor: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/50" },
  { id: "emerald", cor: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/50" },
  { id: "pink", cor: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/50" },
  { id: "zinc", cor: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/50" }
];

export default function EmprestimosPage() {
  const { ano, setAno, mes, setMes, query, add, del, meses } = useEmprestimos();
  const pessoasQuery = usePessoas();
  const cartoesQuery = useCartoes();

  const [pessoaId, setPessoaId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [cartao, setCartao] = useState("outros");
  
  const hoje = new Date().toISOString().split('T')[0];
  const [dataCompra, setDataCompra] = useState(hoje);
  
  const [isParcelado, setIsParcelado] = useState(false);
  const [qtdParcelas, setQtdParcelas] = useState("2");

  // Agora puxamos o nome E as cores de cada cartão cadastrado
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
    if (!pessoaId || !descricao || !valor) return;
    
    add.mutate({ 
      pessoaId, 
      descricao, 
      valor: parseFloat(valor), 
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

  const dadosAgrupados = useMemo(() => {
    if (!query.data || !pessoasQuery.query.data) return {};
    return query.data.reduce((acc: any, emp: any) => {
      const pessoa = pessoasQuery.query.data.find((p: any) => p.id === emp.pessoaId)?.nome || "Desconhecido";
      if (!acc[pessoa]) acc[pessoa] = { total: 0, cartoes: {} };
      if (!acc[pessoa].cartoes[emp.cartao]) acc[pessoa].cartoes[emp.cartao] = { total: 0, itens: [] };
      
      acc[pessoa].cartoes[emp.cartao].itens.push(emp);
      acc[pessoa].cartoes[emp.cartao].total += emp.valor;
      acc[pessoa].total += emp.valor;
      return acc;
    }, {});
  }, [query.data, pessoasQuery.query.data]);

  // ORDENAÇÃO DE PESSOAS: Coloca os cards de pessoas em ordem alfabética
  const pessoasOrdenadas = Object.entries(dadosAgrupados).sort(([nomeA], [nomeB]) => 
    nomeA.localeCompare(nomeB)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Empréstimos</h1>
        <MonthSelector mes={mes} setMes={setMes} meses={meses} ano={ano} setAno={setAno} />
      </div>

      <Card>
        <CardHeader><CardTitle>Novo Empréstimo</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Input 
                type="date" 
                value={dataCompra} 
                onChange={(e) => setDataCompra(e.target.value)} 
                className="w-full appearance-none min-h-[40px] bg-transparent flex items-center justify-start"
                required 
              />
              
              <Select value={pessoaId} onValueChange={setPessoaId} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a Pessoa" />
                </SelectTrigger>
                <SelectContent>
                  {pessoasQuery.query.data
                    ?.sort((a: any, b: any) => a.nome.localeCompare(b.nome))
                    .map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={cartao} onValueChange={setCartao} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Forma de Pgto" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(todosCartoes)
                    .sort(([, a], [, b]) => a.nome.localeCompare(b.nome))
                    .map(([key, c]) => (
                      <SelectItem key={key} value={key}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} required className="w-full" />
              <Input type="number" step="0.01" placeholder="Valor (R$)" value={valor} onChange={e => setValor(e.target.value)} required className="w-full" />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 mt-2 border border-zinc-800 rounded-md bg-zinc-900/30">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
                <div className="flex items-center space-x-2">
                  <Switch id="parcelado" checked={isParcelado} onCheckedChange={setIsParcelado} />
                  <Label htmlFor="parcelado" className="text-zinc-300 cursor-pointer">Empréstimo parcelado?</Label>
                </div>
                {isParcelado && (
                  <div className="flex items-center gap-3 sm:border-l border-zinc-700 sm:pl-6">
                    <Label htmlFor="parcelas" className="whitespace-nowrap text-zinc-300">Qtd. Parcelas:</Label>
                    <Input id="parcelas" type="number" min="2" max="72" value={qtdParcelas} onChange={(e) => setQtdParcelas(e.target.value)} className="w-20" />
                  </div>
                )}
              </div>
              <Button type="submit" disabled={add.isPending} className="w-full sm:w-auto min-w-[120px] bg-amber-600 hover:bg-amber-700 text-white">
                {add.isPending ? "Salvando..." : "Registrar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {pessoasOrdenadas.map(([nome, data]: [string, any]) => (
        <Card key={nome} className="border-amber-500/20">
          <CardHeader className="flex flex-row justify-between items-center bg-amber-500/5">
            <CardTitle className="text-amber-500 flex items-center gap-2">
              <Users className="w-5 h-5"/> {nome}
            </CardTitle>
            <span className="text-xl font-bold text-foreground">{formatCurrency(data.total)}</span>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            
            {/* ORDENAÇÃO DE CARTÕES: Coloca os subgrupos em ordem alfabética */}
            {Object.entries(data.cartoes)
              .sort(([keyA], [keyB]) => {
                const nomeA = todosCartoes[keyA]?.nome || keyA;
                const nomeB = todosCartoes[keyB]?.nome || keyB;
                return nomeA.localeCompare(nomeB);
              })
              .map(([cartaoKey, cartaoData]: [string, any]) => {
                
                const configCartao = todosCartoes[cartaoKey] || { 
                  nome: cartaoKey.toUpperCase(), 
                  cor: "text-zinc-400", 
                  border: "border-zinc-800" 
                };
              
                // ORDENAÇÃO DE LANÇAMENTOS: Data mais recente primeiro (Igual a Tela de Lançamentos)
                const itensOrdenados = cartaoData.itens.sort((a: any, b: any) => {
                  const diffDias = new Date(b.dataCompra || 0).getTime() - new Date(a.dataCompra || 0).getTime();
                  if (diffDias === 0) return (b.createdAt || 0) - (a.createdAt || 0);
                  return diffDias;
                });

                return (
                  <div key={cartaoKey} className={`border-l-2 ${configCartao.border} pl-4`}>
                    
                    {/* AQUI ENTRA A MÁGICA DAS CORES */}
                    <div className="flex justify-between text-sm font-semibold mb-2">
                      <span className={configCartao.cor}>{configCartao.nome}</span>
                      <span className={configCartao.cor}>{formatCurrency(cartaoData.total)}</span>
                    </div>

                    {itensOrdenados.map((i: any) => {
                      const dataFormatada = i.dataCompra ? new Date(i.dataCompra + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '') : '--/--';
                      
                      return (
                        <div key={i.id} className="flex items-center justify-between py-3 border-b border-zinc-900/50 gap-3">
                          
                          <div className="flex flex-col flex-1 min-w-0 justify-center pr-4">
                            <span className="text-xs font-medium text-zinc-500 mb-0.5 capitalize">
                              {dataFormatada}
                            </span>
                            <span className="text-foreground block whitespace-normal break-words leading-tight font-medium">
                              {i.descricao}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-bold text-foreground">{formatCurrency(i.valor)}</span>
                            <Button variant="ghost" size="icon" onClick={() => del.mutate(i.id)} className="h-8 w-8 text-zinc-500 hover:text-red-500 shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}