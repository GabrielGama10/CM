import { initializeApp } from "firebase/app";
// Trocamos o getFirestore pelo initializeFirestore com ferramentas de cache
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCaVfNZxnsSd_HbW2YyuDQcEOYZKc_GwJ4",
  authDomain: "gestao-cm.firebaseapp.com",
  projectId: "gestao-cm",
  storageBucket: "gestao-cm.firebasestorage.app",
  messagingSenderId: "797143098274",
  appId: "1:797143098274:web:9519c1343fef433b7e88fb"
};

const app = initializeApp(firebaseConfig);

// A MÁGICA ACONTECE AQUI: Inicializa o banco de dados com o cache local ativado
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);