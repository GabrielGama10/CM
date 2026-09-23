import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import MonthSelector from "@/components/MonthSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, useDashboard, useConfiguracoes } from "@/hooks/useFinance";
import { TrendingDown, TrendingUp, Wallet, CreditCard, PiggyBank, Target, Calendar } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const MESES_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function DashboardPage() {
  const [visao, setVisao] = useState<"mensal" | "anual">("mensal");
  const { ano, setAno, mes, setMes, monthQuery, annualQuery, meses } = useDashboard();
  const { metas } = useConfiguracoes();
  const { user } = useAuth();
  
  const data = monthQuery.data;
  const annual = annualQuery.data;

  let userName = "Usuário";
  if (user?.email === "gabrielgama995@gmail.com") userName = "Gabriel";
  else if (user?.email === "leandravitoriamendonca@gmail.com") userName = "Leandra";
  else if (user?.displayName) userName = user.displayName;

  if (monthQuery.isLoading || annualQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Toggle de Visão */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {visao === "mensal" ? `${meses[mes - 1]} ${ano}` : `Visão Anual ${ano}`}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Olá, {userName}! Aqui está seu resumo financeiro.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setVisao("mensal")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${visao === "mensal" ? "bg-zinc-800 text-foreground" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Mensal
            </button>
            <button
              onClick={() => setVisao("anual")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${visao === "anual" ? "bg-zinc-800 text-foreground" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Anual
            </button>
          </div>
          
          {/* Seletor de mês/ano só aparece na visão mensal (ano aparece em ambos) */}
          {visao === "mensal" ? (
            <MonthSelector mes={mes} setMes={setMes} meses={meses} ano={ano} setAno={setAno} />
          ) : (
            <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800">
               <Calendar className="w-4 h-4 text-zinc-400"/>
               <span className="font-bold text-foreground">{ano}</span>
            </div>
          )}
        </div>
      </div>

      {visao === "mensal" ? (
        <>
          {/* CARDS VISÃO MENSAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Renda Total" value={data?.receitas ?? 0} icon={<TrendingUp className="w-5 h-5" />} color="emerald" />
            <SummaryCard title="Despesas" value={data?.despesas ?? 0} icon={<CreditCard className="w-5 h-5" />} color="rose" />
            <SummaryCard title="Saldo Livre (Mês)" value={data?.saldo ?? 0} icon={<Wallet className="w-5 h-5" />} color={data?.saldo !== undefined && data.saldo >= 0 ? "blue" : "orange"} />
            <SummaryCard title="Reserva" value={data?.reserva?.valor ?? 0} subtitle={`Meta de reserva: ${formatCurrency(data?.reserva?.meta ?? 0)}`} icon={<PiggyBank className="w-5 h-5" />} color="violet" />
          </div>

          {/* KPIS VISÃO MENSAL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard title="Custo Fixo" value={data?.kpis?.custoFixo ?? 0} meta={metas.fixo} description={`Meta: até ${metas.fixo}% da renda`} status={(data?.kpis?.custoFixo ?? 0) <= metas.fixo ? "success" : "warning"} />
            <KPICard title="Custo Variável" value={data?.kpis?.custoVariavel ?? 0} meta={metas.variavel} description={`Meta: até ${metas.variavel}% da renda`} status={(data?.kpis?.custoVariavel ?? 0) <= metas.variavel ? "success" : "warning"} />
            <KPICard title="Guardado" value={data?.kpis?.guardado ?? 0} meta={metas.reserva} description={`Meta: pelo menos ${metas.reserva}% da renda`} status={(data?.kpis?.guardado ?? 0) >= metas.reserva ? "success" : "warning"} invert />
          </div>
        </>
      ) : (
        <>
          {/* CARDS VISÃO ANUAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Total Ganho no Ano" value={annual?.totalReceitas ?? 0} icon={<TrendingUp className="w-5 h-5" />} color="emerald" />
            <SummaryCard title="Total Gasto no Ano" value={annual?.totalDespesas ?? 0} icon={<TrendingDown className="w-5 h-5" />} color="rose" />
            
            {/* O SUBTITLE FOI ADICIONADO NESTA LINHA ABAIXO: */}
            <SummaryCard title="Total Acumulado (Reserva)" value={annual?.totalGuardado ?? 0} subtitle={`Meta de reserva: ${formatCurrency(annual?.totalMetaReserva ?? 0)}`} icon={<PiggyBank className="w-5 h-5" />} color="violet" />
            
            <SummaryCard title="Média de Gasto Mensal" value={annual?.mediaDespesas ?? 0} subtitle="Baseado nos meses corridos" icon={<Target className="w-5 h-5" />} color="orange" />
          </div>
        </>
      )}

      {/* GRÁFICO ANUAL (Aparece nas duas visões, mas é o foco da visão anual) */}
      {annual?.chart && annual.chart.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-zinc-400" />
              Evolução e Fluxo de Caixa ({ano})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={annual.chart.map((m: any) => ({ ...m, mes: MESES_SHORT[m.mes - 1] }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1).replace('.0', '')}k` : v} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    labelStyle={{ color: "#f8fafc" }}
                  />
                  <Legend />
                  <Bar dataKey="receitas" name="Renda" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saldo" name="Saldo Livre" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({ title, value, subtitle, icon, color }: {
  title: string; value: number; subtitle?: string; icon: React.ReactNode;
  color: "emerald" | "rose" | "blue" | "orange" | "violet";
}) {
  const colors = {
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
    rose: "from-rose-500/20 to-rose-600/5 border-rose-500/20",
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20",
    orange: "from-orange-500/20 to-orange-600/5 border-orange-500/20",
    violet: "from-violet-500/20 to-violet-600/5 border-violet-500/20",
  };
  const iconColors = {
    emerald: "text-emerald-400",
    rose: "text-rose-400",
    blue: "text-blue-400",
    orange: "text-orange-400",
    violet: "text-violet-400",
  };

  return (
    <Card className={`bg-gradient-to-br ${colors[color]} border`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-medium ${iconColors[color]}`}>{title}</span>
          <div className={`${iconColors[color]}`}>{icon}</div>
        </div>
        <p className="text-2xl font-bold text-foreground">{formatCurrency(value)}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function KPICard({ title, value, meta, description, status, invert }: {
  title: string; value: number; meta: number; description: string;
  status: "success" | "warning"; invert?: boolean;
}) {
  // Trava matemática: se a meta não existir ou for zero, calcula baseado em 1 para não quebrar a barra (divisão por zero)
  const safeMeta = meta > 0 ? meta : 1; 
  const progressValue = Math.min(100, Math.max(0, (value / safeMeta) * 100));
  
  const barColor = status === "success" ? "bg-emerald-500" : "bg-amber-500";

  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">{title}</span>
          <span className={`text-sm font-bold ${status === "success" ? "text-emerald-400" : "text-amber-400"}`}>
            {value.toFixed(1)}%
          </span>
        </div>
        
        {/* Barra de Progresso Nativa e Dinâmica */}
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${barColor} transition-all duration-500 ease-out`} 
            style={{ width: `${progressValue}%` }}
          />
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      </CardContent>
    </Card>
  );  
}