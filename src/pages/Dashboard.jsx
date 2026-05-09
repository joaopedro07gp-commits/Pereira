import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp, updateDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { LogOut, Link as LinkIcon, Copy, Trash2, ExternalLink, Calendar, MousePointerClick, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [editingLink, setEditingLink] = useState(null);
  const [editUrl, setEditUrl] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'links'), 
      where('userId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const linksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      linksData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setLinks(linksData);
    }, (error) => {
      console.error("Erro ao carregar links:", error);
    });
    
    return () => unsubscribe();
  }, [user]);

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  const handleShorten = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    try {
      const code = generateCode();
      await addDoc(collection(db, 'links'), {
        originalUrl: url.startsWith('http') ? url : `https://${url}`,
        shortCode: code,
        userId: user.uid,
        clicks: 0,
        createdAt: serverTimestamp()
      });
      setUrl('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editUrl || !editCode || !editingLink) return;
    setEditError('');

    try {
      if (editCode !== editingLink.shortCode) {
        const q = query(collection(db, 'links'), where('shortCode', '==', editCode));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setEditError('Este código curto já está em uso. Escolha outro.');
          return;
        }
      }

      await updateDoc(doc(db, 'links', editingLink.id), {
        originalUrl: editUrl.startsWith('http') ? editUrl : `https://${editUrl}`,
        shortCode: editCode
      });
      setEditingLink(null);
      setEditUrl('');
      setEditCode('');
    } catch (err) {
      console.error(err);
      setEditError('Erro ao atualizar o link.');
    }
  };

  const copyToClipboard = (code, id) => {
    const fullUrl = `${window.location.origin}/r/${code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteLink = async (id) => {
    if (window.confirm('Deseja excluir este link?')) {
      await deleteDoc(doc(db, 'links', id));
    }
  };

  return (
    <div className="container">
      <AnimatePresence>
        {editingLink && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', padding: '1rem' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass card"
              style={{ width: '100%', maxWidth: '500px' }}
            >
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>Personalizar Link</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Altere o destino ou o código do seu link.</p>
              </div>

              <form onSubmit={handleUpdate}>
                <div className="input-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><LinkIcon size={14}/> URL Original</label>
                  <input 
                    type="text" 
                    placeholder="https://exemplo.com"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Edit3 size={14}/> Código Encurtado</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{window.location.host}/r/</span>
                    <input 
                      type="text" 
                      placeholder="meu-link"
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                      style={{ flex: 1 }}
                      required
                    />
                  </div>
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.3rem', display: 'block' }}>Apenas letras, números e hifens.</small>
                </div>

                {editError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '1rem' }}>{editError}</p>}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>Salvar Alterações</button>
                  <button type="button" onClick={() => setEditingLink(null)} className="btn-outline" style={{ flex: 1 }}>Cancelar</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex-between" style={{ marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--primary)' }}>ENCURTA LINK SENAI</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.email}</span>
          <button onClick={() => auth.signOut()} className="btn-outline" style={{ padding: '0.5rem' }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass card"
        >
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Encurtar nova URL</h2>
          <form onSubmit={handleShorten} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <input 
                type="text" 
                placeholder="Cole sua URL longa aqui..." 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={{ width: '100%', fontSize: '1rem' }}
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ minWidth: '140px' }}>
              {loading ? 'Processando...' : <><LinkIcon size={18} /> Encurtar</>}
            </button>
          </form>
        </motion.div>
      </section>

      <section>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          Seus Links <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({links.length})</span>
        </h3>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          <AnimatePresence>
            {links.map((link) => (
              <motion.div 
                key={link.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass"
                style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
              >
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <a 
                      href={`/r/${link.shortCode}`} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ color: 'var(--primary)', textDecoration: 'none' }}
                      className="hover-underline"
                    >
                      {window.location.host}/r/{link.shortCode}
                    </a>
                    <button 
                      onClick={() => copyToClipboard(link.shortCode, link.id)}
                      style={{ background: 'none', color: copiedId === link.id ? 'var(--success)' : 'var(--text-muted)' }}
                      title="Copiar link"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {link.originalUrl}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cliques</div>
                    <div style={{ fontWeight: '700', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'center' }}>
                      <MousePointerClick size={14} color="var(--primary)" /> {link.clicks}
                    </div>
                  </div>
                  
                  <div className="desktop-only" style={{ textAlign: 'center' }}>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Data</div>
                     <div style={{ fontSize: '0.9rem' }}>
                       {link.createdAt?.toDate().toLocaleDateString('pt-BR')}
                     </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => { setEditingLink(link); setEditUrl(link.originalUrl); setEditCode(link.shortCode); setEditError(''); }} className="btn-outline" style={{ padding: '0.5rem' }}>
                      <Edit3 size={18} />
                    </button>
                    <a href={`/r/${link.shortCode}`} target="_blank" rel="noreferrer" className="btn-outline" style={{ padding: '0.5rem' }}>
                      <ExternalLink size={18} />
                    </a>
                    <button onClick={() => deleteLink(link.id)} className="btn-outline" style={{ padding: '0.5rem', color: 'var(--danger)' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {links.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', border: '1px dashed var(--glass-border)', borderRadius: '16px' }}>
              Nenhum link encurtado ainda. Comece colando uma URL acima!
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
