import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, updateDoc, doc, increment } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const Redirect = () => {
  const { code } = useParams();
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const performRedirect = async () => {
      try {
        const q = query(collection(db, 'links'), where('shortCode', '==', code));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const linkDoc = querySnapshot.docs[0];
          const data = linkDoc.data();
          
          // Incrementar clique (não bloqueante para o usuário)
          updateDoc(doc(db, 'links', linkDoc.id), {
            clicks: increment(1)
          }).catch(err => console.error("Erro ao computar clique:", err));

          // Redirecionar imediatamente
          window.location.replace(data.originalUrl);
        } else {
          console.warn("Código não encontrado no Firestore:", code);
          setError(true);
        }
      } catch (err) {
        console.error(err);
        setError(true);
      }
    };

    performRedirect();
  }, [code, navigate]);

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
        <div className="glass card">
          <h2 style={{ color: 'var(--danger)' }}>Link não encontrado</h2>
          <p style={{ color: 'var(--text-muted)' }}>O link que você tentou acessar não existe ou foi removido.</p>
          <button onClick={() => navigate('/login')} className="btn-primary" style={{ marginTop: '1.5rem' }}>
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      <h2 style={{ fontWeight: '500' }}>Redirecionando...</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aguarde enquanto preparamos seu destino.</p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Redirect;
