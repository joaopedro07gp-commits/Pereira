import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('O método de login por e-mail/senha não está ativado no Console do Firebase.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está sendo usado.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError(`Erro: ${err.code || 'Falha na autenticação'}`);
      }
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err) {
      setError('Erro ao entrar com Google.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass card animate-fade" 
        style={{ width: '100%', maxWidth: '400px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>Encurta Link Senai</h1>
          <p style={{ color: 'var(--text-muted)' }}>{isRegister ? 'Crie sua conta gratuita' : 'Bem-vindo de volta'}</p>
        </div>

        <form onSubmit={handleAuth}>
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <Mail size={16} /> E-mail
            </label>
            <input 
              type="email" 
              placeholder="seu@email.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <Lock size={16} /> Senha
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

          <button type="submit" className="btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
            {isRegister ? <><UserPlus size={18} /> Criar Conta</> : <><LogIn size={18} /> Entrar</>}
          </button>
        </form>

        <div style={{ position: 'relative', margin: '1.5rem 0', textAlign: 'center' }}>
          <hr style={{ border: '0', borderTop: '1px solid var(--glass-border)' }} />
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#141419', padding: '0 10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>OU</span>
        </div>

        <button onClick={handleGoogle} className="btn-outline" style={{ width: '100%', marginBottom: '1.5rem' }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" alt="Google" />
          Entrar com Google
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {isRegister ? 'Já tem uma conta?' : 'Não tem uma conta?'}
          <button 
            onClick={() => setIsRegister(!isRegister)} 
            style={{ background: 'none', color: 'var(--primary)', padding: '0 5px', fontSize: '0.9rem' }}
          >
            {isRegister ? 'Entre aqui' : 'Cadastre-se'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
