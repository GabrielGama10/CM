import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Dicionários baseados na lógica da sua EmprestimosPage.tsx
const DEFAULT_CARTOES_HEX: Record<string, { nome: string; cor: string }> = {
  nubank: { nome: "Nubank", cor: "#a855f7" }, // purple-500
  inter: { nome: "Banco Inter", cor: "#f97316" }, // orange-500
  mercado_pago: { nome: "Mercado Pago", cor: "#3b82f6" }, // blue-500
  picpay: { nome: "PicPay", cor: "#10b981" }, // emerald-500
  outros: { nome: "Outros (PIX/Dinheiro)", cor: "#a1a1aa" } // zinc-400
};

const PALETA_HEX: Record<string, string> = {
  purple: "#a855f7",
  orange: "#f97316",
  blue: "#3b82f6",
  emerald: "#10b981",
  pink: "#ec4899",
  zinc: "#a1a1aa"
};

// --- Utilitários de Simulação ---

function useFirestoreQuery(
  collectionName: string,
  conditions: { field: string; op: any; value: any }[],
  dependencies: any[]
) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      let q = query(collection(db, collectionName), where("userId", "==", user.uid));
      conditions.forEach((c: any) => {
        q = query(q, where(c.field, c.op, c.value));
      });

      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id }));
      setData(results);
    } catch (error) {
      console.error(`Erro ao buscar ${collectionName}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [collectionName, ...dependencies]);

  useEffect(() => {
    refetch();
    const unsubscribe = auth.onAuthStateChanged((user: any) => {
      if (user) refetch();
    });
    return () => unsubscribe();
  }, [refetch]);

  return { data, isLoading, refetch };
}

function useMutation(
  mutationFn: (variables: any) => Promise<any>,
  options?: { onSuccess?: () => void; onError?: (error: any) => void }
) {
  const [isPending, setIsPending] = useState(false);
  const mutate = async (variables: any) => {
    setIsPending(true);
    try {
      const result = await mutationFn(variables);
      options?.onSuccess?.();
      return result;
    } catch (error) {
      options?.onError?.(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };
  return { mutate, isPending };
}

// --- Hooks Principais ---

export function useCurrentMonth() {
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  const mesInicial = mesAtual === 12 ? 1 : mesAtual + 1;
  const anoInicial = mesAtual === 12 ? anoAtual + 1 : anoAtual;

  const [ano, setAno] = useState(anoInicial);
  const [mes, setMes] = useState(mesInicial);

  return { ano, setAno, mes, setMes, meses: MESES };
}

export function useDashboard() {
  const { ano, setAno, mes, setMes } = useCurrentMonth();
  
  const [monthData, setMonthData] = useState<any>(null);
  const [annualData, setAnnualData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      return; 
    }
    
    try {
      const qUserId = where("userId", "==", user.uid);
      const qAno = where("ano", "==", ano);

      const [snapRendas, snapDespesas, snapTrans, snapReservas, snapCartoes, snapEmprestimos] = await Promise.all([
        getDocs(query(collection(db, "rendas"), qUserId, qAno)),
        getDocs(query(collection(db, "despesasFixas"), qUserId, qAno)),
        getDocs(query(collection(db, "transacoes"), qUserId, qAno)),
        getDocs(query(collection(db, "reservas"), qUserId, qAno)),
        getDocs(query(collection(db, "cartoes"), qUserId)),
        getDocs(query(collection(db, "emprestimos"), qUserId, qAno))
      ]);

      let mRendas = 0;
      let mDespesasFixas = 0;
      let mTransReceitas = 0;
      let mTransDespesas = 0;
      let mValorGuardado = 0;
      let mMetaReserva = 0;

      const annualMap = Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1, 
        receitas: 0, 
        despesas: 0, 
        saldo: 0, 
        guardado: 0,
        meta: 0
      }));
      
      let totalAnualRendas = 0;
      let totalAnualDespesas = 0;
      let totalAnualGuardado = 0;
      let totalAnualMetaReserva = 0;

      // Montando a lista completa de cartões (Legado + Cadastrados) igual na EmprestimosPage
      const listaCartoes: Record<string, { nome: string; cor: string }> = { ...DEFAULT_CARTOES_HEX };
      snapCartoes.forEach((doc: any) => {
        const c = doc.data();
        listaCartoes[doc.id] = {
          nome: c.nome,
          cor: PALETA_HEX[c.cor] || PALETA_HEX.zinc
        };
      });

      const faturasAgrupadas: Record<string, { pessoal: number; emprestado: number; total: number }> = {};

      snapRendas.forEach((doc: any) => {
        const data = doc.data();
        const v = Number(data.valor || 0);
        const m = Number(data.mes);
        
        if (m === mes) mRendas += v;
        if (m >= 1 && m <= 12) { 
          annualMap[m-1].receitas += v; 
          totalAnualRendas += v; 
        }
      });

      snapDespesas.forEach((doc: any) => {
        const data = doc.data();
        const v = Number(data.valor || 0);
        const m = Number(data.mes);
        
        if (m === mes) mDespesasFixas += v;
        if (m >= 1 && m <= 12) { 
          annualMap[m-1].despesas += v; 
          totalAnualDespesas += v; 
        }
      });

      snapTrans.forEach((doc: any) => {
        const data = doc.data();
        const v = Number(data.valor || 0);
        const m = Number(data.mes);
        
        if (data.tipo === "receita") {
          if (m === mes) mTransReceitas += v;
          if (m >= 1 && m <= 12) { 
            annualMap[m-1].receitas += v; 
            totalAnualRendas += v; 
          }
        } else {
          if (m === mes) {
            mTransDespesas += v;
            
            if (data.cartao && data.cartao.trim() !== "") {
              const cKey = data.cartao;
              if (!faturasAgrupadas[cKey]) faturasAgrupadas[cKey] = { pessoal: 0, emprestado: 0, total: 0 };
              faturasAgrupadas[cKey].pessoal += v;
              faturasAgrupadas[cKey].total += v;
            }
          }
          if (m >= 1 && m <= 12) { 
            annualMap[m-1].despesas += v; 
            totalAnualDespesas += v; 
          }
        }
      });

      snapReservas.forEach((doc: any) => {
        const data = doc.data();
        const v = Number(data.valor || 0);
        const meta = Number(data.meta || 0);
        const m = Number(data.mes);
        
        if (m === mes) { 
          mValorGuardado += v; 
          mMetaReserva += meta; 
        }
        if (m >= 1 && m <= 12) { 
          annualMap[m-1].guardado += v; 
          annualMap[m-1].meta += meta;
          totalAnualGuardado += v; 
          totalAnualMetaReserva += meta; 
        }
      });

      snapEmprestimos.forEach((doc: any) => {
        const data = doc.data();
        const v = Number(data.valor || 0);
        const m = Number(data.mes);

        if (m === mes && data.cartao && data.cartao.trim() !== "") {
          const cKey = data.cartao;
          if (!faturasAgrupadas[cKey]) faturasAgrupadas[cKey] = { pessoal: 0, emprestado: 0, total: 0 };
          faturasAgrupadas[cKey].emprestado += v;
          faturasAgrupadas[cKey].total += v;
        }
      });

      const faturasDetalhadas = Object.keys(faturasAgrupadas).map((key: string) => {
        // Puxamos diretamente da sua lógica combinada!
        const configCartao = listaCartoes[key] || { 
          nome: key.toUpperCase(), 
          cor: "#888888" 
        };

        // 1. Arredondamos as partes individuais cravando 2 casas decimais
        const pessoalArredondado = Math.round(faturasAgrupadas[key].pessoal * 100) / 100;
        const emprestadoArredondado = Math.round(faturasAgrupadas[key].emprestado * 100) / 100;
        
        // 2. Somamos os valores já arredondados para garantir que a soma bate com a tela
        const totalCalculado = pessoalArredondado + emprestadoArredondado;

        return {
          id: key,
          nome: configCartao.nome,
          cor: configCartao.cor,
          pessoal: pessoalArredondado,
          emprestado: emprestadoArredondado,
          total: totalCalculado
        };
      }).sort((a: any, b: any) => b.total - a.total); 

      const receitas = mRendas + mTransReceitas;
      const despesas = mDespesasFixas + mTransDespesas;
      const deducaoDaReserva = Math.max(mMetaReserva, mValorGuardado);
      const saldo = receitas - despesas - deducaoDaReserva; 

      setMonthData({ 
        receitas, 
        despesas, 
        saldo,
        reserva: { valor: mValorGuardado, meta: mMetaReserva },
        kpis: {
          custoFixo: receitas > 0 ? (mDespesasFixas / receitas) * 100 : 0,
          custoVariavel: receitas > 0 ? (mTransDespesas / receitas) * 100 : 0,
          guardado: receitas > 0 ? (mValorGuardado / receitas) * 100 : 0,
        },
        faturas: faturasDetalhadas
      });
      
      annualMap.forEach((item: any) => { 
        const deducaoReservaAnual = Math.max(item.meta, item.guardado);
        item.saldo = item.receitas - item.despesas - deducaoReservaAnual; 
      });
      
      const mesesComDespesa = annualMap.filter((m: any) => m.despesas > 0).length;
      const divisorMedia = mesesComDespesa > 0 ? mesesComDespesa : 1;

      setAnnualData({
        chart: annualMap,
        totalReceitas: totalAnualRendas,
        totalDespesas: totalAnualDespesas,
        totalGuardado: totalAnualGuardado,
        totalMetaReserva: totalAnualMetaReserva, 
        mediaDespesas: totalAnualDespesas / divisorMedia
      });

    } catch (error) {
      console.error("Erro no Dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, [ano, mes]);

  useEffect(() => {
    fetchDashboard();
    const unsubscribe = auth.onAuthStateChanged((user: any) => {
      if (user) fetchDashboard();
    });
    return () => unsubscribe();
  }, [fetchDashboard]);

  const monthQuery = { data: monthData, isLoading, refetch: fetchDashboard };
  const annualQuery = { data: annualData, isLoading, refetch: fetchDashboard };

  return { ano, setAno, mes, setMes, monthQuery, annualQuery, meses: MESES };
}

export function useRendas() {
  const { ano, setAno, mes, setMes } = useCurrentMonth();

  const queryReq = useFirestoreQuery("rendas", [
    { field: "ano", op: "==", value: ano },
    { field: "mes", op: "==", value: mes }
  ], [ano, mes]);

  const upsert = useMutation(async (data: any) => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Não autenticado");
    
    const { id, ...saveData } = data;

    if (id) {
      await setDoc(doc(db, "rendas", id), { ...saveData, userId }, { merge: true });
    } else {
      await addDoc(collection(db, "rendas"), { ...saveData, userId });
    }
  }, {
    onSuccess: () => {
      queryReq.refetch();
      toast.success("Renda salva com sucesso");
    },
    onError: () => toast.error("Erro ao salvar renda"),
  });

  const del = useMutation(async (id: string) => {
    if (!id) throw new Error("ID inválido ao excluir renda");
    await deleteDoc(doc(db, "rendas", id));
  }, {
    onSuccess: () => {
      queryReq.refetch();
      toast.success("Renda removida");
    },
    onError: () => toast.error("Erro ao remover renda"),
  });

  return { ano, setAno, mes, setMes, query: queryReq, upsert, del, meses: MESES };
}

export function useDespesasFixas() {
  const { ano, setAno, mes, setMes } = useCurrentMonth();

  const queryReq = useFirestoreQuery("despesasFixas", [
    { field: "ano", op: "==", value: ano },
    { field: "mes", op: "==", value: mes }
  ], [ano, mes]);

  const upsert = useMutation(async (data: any) => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Não autenticado");

    const { id, ...saveData } = data;

    if (id) {
      await setDoc(doc(db, "despesasFixas", id), { ...saveData, userId }, { merge: true });
    } else {
      const batch = writeBatch(db);
      const mesInicial = saveData.mes;
      const anoAtual = saveData.ano;

      for (let m = mesInicial; m <= 12; m++) {
        const ref = doc(collection(db, "despesasFixas"));
        batch.set(ref, {
          ...saveData,
          mes: m,
          ano: anoAtual,
          userId
        });
      }
      await batch.commit();
    }
  }, {
    onSuccess: () => {
      queryReq.refetch();
      toast.success("Despesa fixa cadastrada com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar despesa fixa"),
  });

  const del = useMutation(async (id: string) => {
    if (!id) throw new Error("ID inválido ao excluir despesa fixa");
    await deleteDoc(doc(db, "despesasFixas", id));
  }, {
    onSuccess: () => {
      queryReq.refetch();
      toast.success("Despesa fixa removida");
    },
    onError: () => toast.error("Erro ao remover despesa fixa"),
  });

  return { ano, setAno, mes, setMes, query: queryReq, upsert, del, meses: MESES };
}

export function useTransacoes() {
  const { ano, setAno, mes, setMes } = useCurrentMonth();

  const queryReq = useFirestoreQuery("transacoes", [
    { field: "ano", op: "==", value: ano },
    { field: "mes", op: "==", value: mes }
  ], [ano, mes]);

  const add = useMutation(async (data: any) => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Não autenticado");

    const momentoExato = Date.now(); 

    if (data.parcelado && data.qtdParcelas > 1) {
      const batch = writeBatch(db);
      const valorParcela = data.valor / data.qtdParcelas;

      for (let i = 0; i < data.qtdParcelas; i++) {
        let mesAtual = data.mes + i;
        let anoAtual = data.ano;

        while (mesAtual > 12) {
          mesAtual -= 12;
          anoAtual += 1;
        }

        const ref = doc(collection(db, "transacoes"));
        batch.set(ref, {
          descricao: `${data.descricao} (${i + 1}/${data.qtdParcelas})`,
          valor: valorParcela,
          tipo: "despesa",
          cartao: data.cartao,
          dataCompra: data.dataCompra,
          mes: mesAtual,
          ano: anoAtual,
          userId,
          createdAt: momentoExato + i 
        });
      }
      await batch.commit();
    } else {
      await addDoc(collection(db, "transacoes"), {
        descricao: data.descricao,
        valor: data.valor,
        tipo: "despesa", 
        cartao: data.cartao,
        dataCompra: data.dataCompra,
        mes: data.mes,
        ano: data.ano,
        userId,
        createdAt: momentoExato 
      });
    }
  }, {
    onSuccess: () => {
      queryReq.refetch();
      toast.success("Compra registrada!");
    },
    onError: () => toast.error("Erro ao registrar compra"),
  });

  const del = useMutation(async (id: string) => {
    if (!id) throw new Error("ID inválido");
    await deleteDoc(doc(db, "transacoes", id));
  }, {
    onSuccess: () => {
      queryReq.refetch();
      toast.success("Compra removida");
    },
    onError: () => toast.error("Erro ao remover compra"),
  });

  return { ano, setAno, mes, setMes, query: queryReq, add, del, meses: MESES };
}

export function useReservas() {
  const { ano, setAno, mes, setMes } = useCurrentMonth();

  const queryReq = useFirestoreQuery("reservas", [
    { field: "ano", op: "==", value: ano },
    { field: "mes", op: "==", value: mes }
  ], [ano, mes]);

  const upsert = useMutation(async (data: any) => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Não autenticado");

    const { id, ...saveData } = data;

    if (id) {
      await setDoc(doc(db, "reservas", id), { ...saveData, userId }, { merge: true });
    } else {
      await addDoc(collection(db, "reservas"), { ...saveData, userId });
    }
  }, {
    onSuccess: () => {
      queryReq.refetch();
      toast.success("Reserva salva com sucesso");
    },
    onError: () => toast.error("Erro ao salvar reserva"),
  });

  const del = useMutation(async (id: string) => {
    if (!id) throw new Error("ID inválido ao excluir reserva");
    await deleteDoc(doc(db, "reservas", id));
  }, {
    onSuccess: () => {
      queryReq.refetch();
      toast.success("Reserva removida");
    },
    onError: () => toast.error("Erro ao remover reserva"),
  });

  return { ano, setAno, mes, setMes, query: queryReq, upsert, del, meses: MESES };
}

export function useCartoes() {
  const queryReq = useFirestoreQuery("cartoes", [], []);

  const upsert = useMutation(async (data: any) => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Não autenticado");

    const { id, ...saveData } = data;

    if (id) {
      await setDoc(doc(db, "cartoes", id), { ...saveData, userId }, { merge: true });
    } else {
      await addDoc(collection(db, "cartoes"), { ...saveData, userId });
    }
  }, {
    onSuccess: () => {
      queryReq.refetch();
      toast.success("Cartão salvo com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar cartão"),
  });

  const del = useMutation(async (id: string) => {
    if (!id) throw new Error("ID inválido ao excluir cartão");
    await deleteDoc(doc(db, "cartoes", id));
  }, {
    onSuccess: () => {
      queryReq.refetch();
      toast.success("Cartão removido");
    },
    onError: () => toast.error("Erro ao remover cartão"),
  });

  return { query: queryReq, upsert, del };
}

export function useConfiguracoes() {
  const queryReq = useFirestoreQuery("configuracoes", [], []);

  const salvarMetas = useMutation(async (metas: { fixo: number; variavel: number; reserva: number }) => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Não autenticado");

    await setDoc(doc(db, "configuracoes", userId), { ...metas, userId }, { merge: true });
  }, {
    onSuccess: () => {
      queryReq.refetch();
      toast.success("Metas atualizadas com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar metas"),
  });

  const metasAtuais = queryReq.data?.[0] || { fixo: 50, variavel: 30, reserva: 20 };

  return { query: queryReq, salvarMetas, metas: metasAtuais };
} 

// --- NOVIDADES: HOOKS DE EMPRÉSTIMOS ---

export function usePessoas() {
  const queryReq = useFirestoreQuery("pessoas", [], []);

  const upsert = useMutation(async (data: any) => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Não autenticado");

    const { id, ...saveData } = data;

    if (id) {
      await setDoc(doc(db, "pessoas", id), { ...saveData, userId }, { merge: true });
    } else {
      await addDoc(collection(db, "pessoas"), { ...saveData, userId });
    }
  }, {
    onSuccess: () => {
      queryReq.refetch();
      toast.success("Pessoa salva com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar pessoa"),
  });

  const del = useMutation(async (id: string) => {
    if (!id) throw new Error("ID inválido");
    await deleteDoc(doc(db, "pessoas", id));
  }, {
    onSuccess: () => {
      queryReq.refetch();
      toast.success("Pessoa removida do sistema");
    },
    onError: () => toast.error("Erro ao remover pessoa"),
  });

  return { query: queryReq, upsert, del };
}

export function useEmprestimos() {
  const { ano, setAno, mes, setMes } = useCurrentMonth();

  const queryReq = useFirestoreQuery("emprestimos", [
    { field: "ano", op: "==", value: ano },
    { field: "mes", op: "==", value: mes }
  ], [ano, mes]);

  const add = useMutation(async (data: any) => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Não autenticado");
    const momentoExato = Date.now();

    if (data.parcelado && data.qtdParcelas > 1) {
      const batch = writeBatch(db);
      const valorParcela = data.valor / data.qtdParcelas;

      for (let i = 0; i < data.qtdParcelas; i++) {
        let mesAtual = data.mes + i;
        let anoAtual = data.ano;

        while (mesAtual > 12) {
          mesAtual -= 12;
          anoAtual += 1;
        }

        const ref = doc(collection(db, "emprestimos"));
        batch.set(ref, {
          pessoaId: data.pessoaId,
          descricao: `${data.descricao} (${i + 1}/${data.qtdParcelas})`,
          valor: valorParcela,
          cartao: data.cartao,
          dataCompra: data.dataCompra,
          mes: mesAtual,
          ano: anoAtual,
          userId,
          createdAt: momentoExato + i 
        });
      }
      await batch.commit();
    } else {
      await addDoc(collection(db, "emprestimos"), {
        pessoaId: data.pessoaId,
        descricao: data.descricao,
        valor: data.valor,
        cartao: data.cartao,
        dataCompra: data.dataCompra,
        mes: data.mes,
        ano: data.ano,
        userId,
        createdAt: momentoExato
      });
    }
  }, {
    onSuccess: () => {
      queryReq.refetch();
      toast.success("Empréstimo registrado!");
    },
    onError: () => toast.error("Erro ao registrar empréstimo"),
  });

  const del = useMutation(async (id: string) => {
    if (!id) throw new Error("ID inválido");
    await deleteDoc(doc(db, "emprestimos", id));
  }, {
    onSuccess: () => {
      queryReq.refetch();
      toast.success("Empréstimo removido");
    },
    onError: () => toast.error("Erro ao remover empréstimo"),
  });

  return { ano, setAno, mes, setMes, query: queryReq, add, del, meses: MESES };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}