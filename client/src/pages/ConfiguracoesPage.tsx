import { useState, useEffect, useMemo } from "react";
import { useConfiguracoes, useCartoes, usePessoas } from "@/hooks/useFinance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, Edit2, CreditCard, Target, Wallet, Users } from "lucide-react";

const DEFAULT_CARTOES: Record<string, { nome: string; cor: string; bg: string; border: string; rawCor: string; isWallet?: boolean }> = {
  nubank: { nome: "Nubank", cor: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", rawCor: "purple" },
  inter: { nome: "Banco Inter", cor: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", rawCor: "orange" },
  mercado_pago: { nome: "Mercado Pago", cor: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", rawCor: "blue" },
  picpay: { nome: "PicPay", cor: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", rawCor: "emerald" },
  outros: { nome: "Outros (PIX/Dinheiro)", cor: "text-zinc-300", bg: "bg-zinc-500/10", border: "border-zinc-500/20", rawCor: "zinc", isWallet: true }
};

const PALETA_CORES = [
  { id: "purple", label: "Roxo", dot: "bg-purple-500", cor: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { id: "orange", label: "Laranja", dot: "bg-orange-500", cor: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { id: "blue", label: "Azul", dot: "bg-blue-500", cor: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { id: "emerald", label: "Verde", dot: "bg-emerald-500", cor: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: "pink", label: "Rosa", dot: "bg-pink-500", cor: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  { id: "zinc", label: "Cinza", dot: "bg-zinc-400", cor: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/20" }
];

export default function ConfiguracoesPage() {
  const { metas, salvarMetas } = useConfiguracoes();
  const cartoesQuery = useCartoes();
  const pessoasQuery = usePessoas(); // NOVO: Buscando as pessoas

  // Estados para as Metas
  const [fixo, setFixo] = useState(metas.fixo.toString());
  const [variavel, setVariavel] = useState(metas.variavel.toString());
  const [reserva, setReserva] = useState(metas.reserva.toString());

  useEffect(() => {
    setFixo(metas.fixo.toString());
    setVariavel(metas.variavel.toString());
    setReserva(metas.reserva.toString());
  }, [metas.fixo, metas.variavel, metas.reserva]);

  // Estados para Gerenciamento de Cartões
  const [idCartaoEditando, setIdCartaoEditando] = useState<string | null>(null);
  const [nomeNovoCartao, setNomeNovoCartao] = useState("");
  const [corSelecionada, setCorSelecionada] = useState("purple");
  const [cartoesExcluidos, setCartoesExcluidos] = useState<string[]>([]);

  // NOVO: Estados para Gerenciamento de Pessoas (Empréstimos)
  const [idPessoaEditando, setIdPessoaEditando] = useState<string | null>(null);
  const [nomeNovaPessoa, setNomeNovaPessoa] = useState("");

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
          rawCor: c.cor,
          isCustom: true
        };
      });
    }
    cartoesExcluidos.forEach(id => { delete lista[id]; });
    return lista;
  }, [cartoesQuery.query.data, cartoesExcluidos]);

  const handleSalvarMetas = (e: React.FormEvent) => {
    e.preventDefault();
    salvarMetas.mutate({
      fixo: Number(fixo),
      variavel: Number(variavel),
      reserva: Number(reserva)
    });
  };

  const handleSalvarCartao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeNovoCartao) return;
    cartoesQuery.upsert.mutate({
      id: idCartaoEditando,
      nome: nomeNovoCartao,
      cor: corSelecionada
    });
    setNomeNovoCartao("");
    setCorSelecionada("purple");
    setIdCartaoEditando(null);
  };

  const handleEditarCartao = (id: string, dados: any) => {
    setIdCartaoEditando(id);
    setNomeNovoCartao(dados.nome);
    setCorSelecionada(dados.rawCor || "purple");
  };

  const handleExcluirCartao = (id: string, isDefault: boolean) => {
    if (isDefault) {
      setCartoesExcluidos(prev => [...prev, id]);
    } else {
      cartoesQuery.del.mutate(id);
    }
  };

  // NOVO: Funções para gerenciar as Pessoas
  const handleSalvarPessoa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeNovaPessoa) return;
    pessoasQuery.upsert.mutate({
      id: idPessoaEditando,
      nome: nomeNovaPessoa
    });
    setNomeNovaPessoa("");
    setIdPessoaEditando(null);
  };

  const handleEditarPessoa = (id: string, nome: string) => {
    setIdPessoaEditando(id);
    setNomeNovaPessoa(nome);
  };

  const handleExcluirPessoa = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta pessoa? O histórico de empréstimos dela não será apagado.")) {
      pessoasQuery.del.mutate(id);
    }
  };

  const totalPorcentagem = Number(fixo) + Number(variavel) + Number(reserva);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Configurações do Sistema</h1>
        <p className="text-muted-foreground mt-1">Ajuste suas metas e gerencie suas formas de pagamento.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* SEÇÃO DE METAS */}
        <Card className="border-emerald-500/20">
          <CardHeader className="bg-emerald-500/5">
            <CardTitle className="text-emerald-500 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Metas de Orçamento
            </CardTitle>
            <CardDescription>
              Defina a porcentagem ideal da sua renda que deve ir para cada categoria.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSalvarMetas} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Custo Fixo (%)</Label>
                  <Input 
                    type="number" 
                    value={fixo} 
                    onChange={(e) => setFixo(e.target.value)} 
                    className="bg-zinc-900 border-zinc-800" 
                    max="100" min="0" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Custo Variável (%)</Label>
                  <Input 
                    type="number" 
                    value={variavel} 
                    onChange={(e) => setVariavel(e.target.value)} 
                    className="bg-zinc-900 border-zinc-800" 
                    max="100" min="0" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Reservas (%)</Label>
                  <Input 
                    type="number" 
                    value={reserva} 
                    onChange={(e) => setReserva(e.target.value)} 
                    className="bg-zinc-900 border-zinc-800" 
                    max="100" min="0" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <div className="text-sm">
                  Total: <span className={`font-bold ${totalPorcentagem > 100 ? 'text-red-500' : totalPorcentagem === 100 ? 'text-emerald-500' : 'text-zinc-400'}`}>{totalPorcentagem}%</span>
                  {totalPorcentagem !== 100 && <span className="text-zinc-500 ml-2">(O ideal é que a soma dê exatos 100%)</span>}
                </div>
                <Button type="submit" disabled={salvarMetas.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                  {salvarMetas.isPending ? "Salvando..." : "Salvar Metas"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* SEÇÃO DE CARTÕES */}
        <Card className="border-blue-500/20">
          <CardHeader className="bg-blue-500/5">
            <CardTitle className="text-blue-500 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Gerenciador de Cartões e Contas
            </CardTitle>
            <CardDescription>
              Adicione novos cartões, oculte os padrões ou edite as cores.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <form onSubmit={handleSalvarCartao} className="space-y-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Nome do Cartão (ex: C6 Bank, XP)"
                  value={nomeNovoCartao}
                  onChange={(e) => setNomeNovoCartao(e.target.value)}
                  required
                  className="bg-zinc-900"
                />
                <div className="flex items-center gap-3 bg-zinc-900 px-3 py-2 rounded-md border border-zinc-800">
                  <span className="text-xs text-zinc-400 mr-2">Cor:</span>
                  <div className="flex items-center gap-3">
                    {PALETA_CORES.map((corItem) => (
                      <button
                        key={corItem.id}
                        type="button"
                        onClick={() => setCorSelecionada(corItem.id)}
                        className={`w-6 h-6 rounded-full ${corItem.dot} transition-transform ${
                          corSelecionada === corItem.id ? "scale-125 ring-2 ring-white" : "opacity-70 hover:opacity-100"
                        }`}
                        title={corItem.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                {idCartaoEditando && (
                  <Button type="button" variant="outline" onClick={() => { setIdCartaoEditando(null); setNomeNovoCartao(""); }}>
                    Cancelar
                  </Button>
                )}
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {idCartaoEditando ? "Salvar Alterações" : "Adicionar Cartão"}
                </Button>
              </div>
            </form>

            <div className="pt-2">
              <p className="text-sm font-medium text-zinc-400 mb-3">Opções Ativas no Sistema:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(DEFAULT_CARTOES).filter(([key]) => !cartoesExcluidos.includes(key)).map(([key, c]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/60">
                    <div className="flex items-center gap-2">
                      {c.isWallet ? <Wallet className={`w-4 h-4 ${c.cor}`} /> : <CreditCard className={`w-4 h-4 ${c.cor}`} />}
                      <span className={`font-medium ${c.cor}`}>{c.nome}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleExcluirCartao(key, true)} className="h-7 w-7 text-zinc-500 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                
                {cartoesQuery.query.data?.map((c: any) => {
                  const config = todosCartoes[c.id];
                  if (!config) return null;
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900">
                      <div className="flex items-center gap-2">
                         <CreditCard className={`w-4 h-4 ${config.cor}`} />
                         <span className={`font-medium ${config.cor}`}>{c.nome}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditarCartao(c.id, c)} className="h-7 w-7 text-zinc-400 hover:text-blue-400">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleExcluirCartao(c.id, false)} className="h-7 w-7 text-zinc-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NOVO: SEÇÃO DE PESSOAS (EMPRÉSTIMOS) */}
        <Card className="border-amber-500/20">
          <CardHeader className="bg-amber-500/5">
            <CardTitle className="text-amber-500 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Gerenciamento de Pessoas (Empréstimos)
            </CardTitle>
            <CardDescription>
              Cadastre familiares e amigos para organizar os cartões e dinheiros emprestados.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <form onSubmit={handleSalvarPessoa} className="space-y-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Nome da pessoa (ex: Mãe, Igor)"
                  value={nomeNovaPessoa}
                  onChange={(e) => setNomeNovaPessoa(e.target.value)}
                  required
                  className="bg-zinc-900 md:col-span-2"
                />
              </div>
              <div className="flex gap-2 justify-end">
                {idPessoaEditando && (
                  <Button type="button" variant="outline" onClick={() => { setIdPessoaEditando(null); setNomeNovaPessoa(""); }}>
                    Cancelar
                  </Button>
                )}
                <Button type="submit" disabled={pessoasQuery.upsert.isPending} className="bg-amber-600 hover:bg-amber-700 text-white">
                  {pessoasQuery.upsert.isPending ? "Salvando..." : idPessoaEditando ? "Salvar Alterações" : "Adicionar Pessoa"}
                </Button>
              </div>
            </form>

            <div className="pt-2">
              <p className="text-sm font-medium text-zinc-400 mb-3">Pessoas Cadastradas:</p>
              {pessoasQuery.query.isLoading ? (
                <p className="text-muted-foreground text-sm">Carregando...</p>
              ) : pessoasQuery.query.data && pessoasQuery.query.data.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {pessoasQuery.query.data.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900">
                      <div className="flex items-center gap-2">
                         <span className="font-medium text-amber-500">{p.nome}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditarPessoa(p.id, p.nome)} className="h-7 w-7 text-zinc-400 hover:text-blue-400">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleExcluirPessoa(p.id)} className="h-7 w-7 text-zinc-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 italic">Nenhuma pessoa cadastrada ainda.</p>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}