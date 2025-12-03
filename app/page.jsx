"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Clock, CheckCircle, XCircle, ArrowLeft, Package, User, LogOut, Wifi, WifiOff } from 'lucide-react';

const Home = () => {
  const [screen, setScreen] = useState('login');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [unlockTimer, setUnlockTimer] = useState(0);
  const [selectedTools, setSelectedTools] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [arduinoIP, setArduinoIP] = useState('192.168.1.100');
  const timerRef = useRef(null);

  const users = {
    '12345': { id: '12345', name: 'João Silva', password: '1234' },
    '67890': { id: '67890', name: 'Maria Santos', password: '5678' },
    'admin': { id: 'admin', name: 'Administrador', password: 'admin' }
  };

  const toolsInventory = [
    { id: 1, name: 'Chave Philips', spec: '#2, 6', available: 5, total: 5 },
    { id: 2, name: 'Chave de Fenda', spec: '1/4, 8', available: 4, total: 4 },
    { id: 3, name: 'Alicate Universal', spec: '8 polegadas', available: 3, total: 3 },
    { id: 4, name: 'Martelo', spec: '500g', available: 2, total: 2 },
    { id: 5, name: 'Trena', spec: '5m', available: 6, total: 6 },
    { id: 6, name: 'Nível', spec: '12 polegadas', available: 2, total: 2 },
    { id: 7, name: 'Chave Inglesa', spec: '10 polegadas', available: 3, total: 3 },
    { id: 8, name: 'Furadeira', spec: '500W', available: 1, total: 1 }
  ];

  const [inventory, setInventory] = useState(() => {
    try {
      if (typeof window === 'undefined') return toolsInventory;
      const saved = localStorage.getItem('inventory');
      return saved ? JSON.parse(saved) : toolsInventory;
    } catch (e) {
      return toolsInventory;
    }
  });

  const [transactions, setTransactions] = useState(() => {
    try {
      if (typeof window === 'undefined') return [];
      const saved = localStorage.getItem('transactions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [userLoans, setUserLoans] = useState(() => {
    try {
      if (typeof window === 'undefined') return {};
      const saved = localStorage.getItem('userLoans');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('userLoans', JSON.stringify(userLoans));
  }, [userLoans]);

  useEffect(() => {
    const savedIP = localStorage.getItem('arduinoIP');
    if (savedIP) {
      setArduinoIP(savedIP);
    }
  }, []);

  const checkConnection = async (ip) => {
    try {
      const response = await fetch(`http://${ip}/status`, {
        method: 'GET',
        mode: 'no-cors'
      });
      setIsConnected(true);
      return true;
    } catch (err) {
      setIsConnected(false);
      return false;
    }
  };

  const connectArduino = async () => {
    if (!arduinoIP) {
      showError('Digite o IP do Arduino');
      return;
    }

    localStorage.setItem('arduinoIP', arduinoIP);
    const connected = await checkConnection(arduinoIP);
    if (connected) {
      showSuccess('Arduino conectado via WiFi!');
    } else {
      showSuccess('IP configurado! Certifique-se que o Arduino está na mesma rede WiFi.');
      setIsConnected(true);
    }
  };

  const sendArduinoCommand = async (command, data = {}) => {
  try {
    // Criar os parâmetros para a URL
    const params = new URLSearchParams();
    
    if (data.userId) params.append('user', data.userId);
    if (data.userName) params.append('name', data.userName);
    if (data.tools) params.append('tools', data.tools);
    
    const url = `http://${arduinoIP}/${command}?${params.toString()}`;
    
    console.log('🔍 Enviando para ESP32:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors', // Mudei de 'no-cors' para 'cors'
    });
    
    console.log('✅ Resposta do ESP32:', response.status);
    return { success: true };
  } catch (err) {
    console.error('❌ Erro ao enviar comando:', err);
    console.log('Simulando comando para Arduino:', command, data);
    return { success: true };
  }
};


  useEffect(() => {
    if (unlockTimer > 0) {
      timerRef.current = setTimeout(() => {
        setUnlockTimer(unlockTimer - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [unlockTimer]);

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 5000);
  };

  const handleLogin = async () => {
    setError('');
    setSuccess('');

    if (!userId || !password) {
      showError('Preencha matrícula e senha');
      return;
    }

    const user = users[userId];
    if (!user || user.password !== password) {
      showError('Matrícula ou senha inválida');
      return;
    }

    setCurrentUser(user);
    setScreen('menu');
    setUserId('');
    setPassword('');
  };

  const abrir_trava = async (userId, userName, tools) => { 
  await sendArduinoCommand('unlock', { 
    userId: userId,
    userName: userName,
    tools: tools
  });

  setUnlockTimer(30);
  showSuccess(`Bem-vindo, ${userName}! Carrinho desbloqueado.`);
}

  const handleSelectTool = (toolId, quantity) => {
    setSelectedTools(prev => ({
      ...prev,
      [toolId]: quantity
    }));
  };

  const handleConfirmLoan = () => {
    const selectedItems = Object.entries(selectedTools)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({
        toolId: parseInt(id),
        quantity: qty,
        tool: inventory.find(t => t.id === parseInt(id))
      }));

    if (selectedItems.length === 0) {
      showError('Selecione pelo menos uma ferramenta');
      return;
    }

    for (let item of selectedItems) {
      if (item.quantity > item.tool.available) {
        showError(`Quantidade insuficiente de ${item.tool.name}`);
        return;
      }
    }

    setScreen('confirmation');
  };

  const handleFinalConfirm = async () => {
    const timestamp = new Date().toISOString();
    const loanId = Date.now();

    const selectedItems = Object.entries(selectedTools)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const tool = inventory.find(t => t.id === parseInt(id));
        return {
          toolId: parseInt(id),
          toolName: tool.name,
          toolSpec: tool.spec,
          quantity: qty
        };
      });

    const newInventory = inventory.map(tool => {
      const selected = selectedTools[tool.id];
      if (selected && selected > 0) {
        return { ...tool, available: tool.available - selected };
      }
      return tool;
    });
    setInventory(newInventory);

    const transaction = {
      id: loanId,
      userId: currentUser.id,
      userName: currentUser.name,
      items: selectedItems,
      loanTime: timestamp,
      returnTime: null,
      status: 'active'
    };
    setTransactions(prev => [...prev, transaction]);

    setUserLoans(prev => ({
      ...prev,
      [currentUser.id]: [...(prev[currentUser.id] || []), transaction]
    }));

    const toolsList = selectedItems.map(item => item.toolName).join(', ');
await abrir_trava(currentUser.id, currentUser.name, toolsList);

    setSelectedTools({});
    showSuccess('Empréstimo registrado com sucesso!');
    setTimeout(() => {
      setScreen('menu');
    }, 2000);
  };

  const handleReturnTools = async (loanId) => {
    const timestamp = new Date().toISOString();
    
    const transaction = transactions.find(t => t.id === loanId);
    if (!transaction) return;

    const newInventory = inventory.map(tool => {
      const item = transaction.items.find(i => i.toolId === tool.id);
      if (item) {
        return { ...tool, available: tool.available + item.quantity };
      }
      return tool;
    });
    setInventory(newInventory);

    const newTransactions = transactions.map(t => 
      t.id === loanId 
        ? { ...t, returnTime: timestamp, status: 'returned' }
        : t
    );
    setTransactions(newTransactions);

    const updatedUserLoans = userLoans[currentUser.id].filter(l => l.id !== loanId);
    setUserLoans(prev => ({
      ...prev,
      [currentUser.id]: updatedUserLoans
    }));

    const toolsList = transaction.items.map(item => item.toolName).join(', ');
await abrir_trava(currentUser.id, currentUser.name, toolsList);

    showSuccess('Ferramentas devolvidas com sucesso!');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setScreen('login');
    setSelectedTools({});
    setUnlockTimer(0);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR');
  };

  const Toast = () => (
    <>
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
          <XCircle size={24} />
          <span className="font-semibold">{error}</span>
        </div>
      )}
      {success && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
          <CheckCircle size={24} />
          <span className="font-semibold">{success}</span>
        </div>
      )}
    </>
  );

  if (screen === 'login') {
    return (
      <>
      <Toast />
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
          <Lock size={40} className="text-blue-900" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Sistema de Ferramentas</h1>
          <p className="text-gray-800">Controle via WiFi</p>
        </div>

        <div className={`mb-4 p-4 rounded-lg border-2 ${isConnected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center gap-3 mb-3">
          {isConnected ? <Wifi size={24} className="text-green-600" /> : <WifiOff size={24} className="text-yellow-600" />}
          <div className="flex-1">
            <p className="font-semibold text-black">{isConnected ? 'Arduino Configurado' : 'Configurar Arduino'}</p>
            <p className="text-sm text-black">{isConnected ? `IP: ${arduinoIP}` : 'Digite o IP do Arduino'}</p>
          </div>
          </div>
          
          <div className="space-y-2">
          <input
            type="text"
            value={arduinoIP}
            onChange={(e) => setArduinoIP(e.target.value)}
            placeholder="Ex: 192.168.1.100"
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-black"
          />
          <button
            onClick={connectArduino}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Configurar IP
          </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
          <label className="block text-sm font-semibold text-black mb-2">Matrícula</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none text-lg text-black"
            placeholder="Digite sua matrícula"
          />
          </div>

          <div>
          <label className="block text-sm font-semibold text-black mb-2">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none text-lg text-black"
            placeholder="Digite sua senha"
          />
          </div>

          <button
          onClick={handleLogin}
          className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-lg"
          >
          Entrar
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-black font-semibold mb-2">Usuários de teste:</p>
          <p className="text-xs text-black">12345 / 1234</p>
          <p className="text-xs text-black">67890 / 5678</p>
        </div>
        </div>
      </div>
      </>
    );
  }

  if (screen === 'menu') {
    return (
      <>
        <Toast />
        <div className="min-h-screen bg-gray-50">
          <div className="bg-blue-900 text-white p-6 shadow-lg">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-3">
                <User size={32} />
                <div>
                  <h2 className="text-xl font-bold">{currentUser.name}</h2>
                  <p className="text-sm text-blue-200">ID: {currentUser.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isConnected && <Wifi size={20} className="text-green-400" />}
                <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-blue-800 rounded-lg hover:bg-blue-700 transition">
                  <LogOut size={20} />
                  Sair
                </button>
              </div>
            </div>
          </div>

          {unlockTimer > 0 && (
            <div className="bg-green-500 text-white py-4 px-6 shadow-lg">
              <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
                <Unlock size={24} />
                <span className="text-lg font-semibold">Carrinho desbloqueado: {unlockTimer}s</span>
              </div>
            </div>
          )}

          <div className="max-w-4xl mx-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={() => setScreen('tools')} className="p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition border-2 border-blue-200 hover:border-blue-500">
                <Package size={48} className="text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-blue-900 mb-2">Retirar Ferramentas</h3>
                <p className="text-gray-600">Selecione as ferramentas para empréstimo</p>
              </button>

              <button onClick={() => setScreen('return')} className="p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition border-2 border-blue-200 hover:border-blue-500">
                <CheckCircle size={48} className="text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-blue-900 mb-2">Devolver Ferramentas</h3>
                <p className="text-gray-600">Registre a devolução de ferramentas</p>
                {userLoans[currentUser.id] && userLoans[currentUser.id].filter(l => l.status === 'active').length > 0 && (
                  <span className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                    {userLoans[currentUser.id].filter(l => l.status === 'active').length} empréstimo(s) ativo(s)
                  </span>
                )}
              </button>

              <button onClick={() => setScreen('history')} className="p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition border-2 border-blue-200 hover:border-blue-500">
                <Clock size={48} className="text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-blue-900 mb-2">Histórico</h3>
                <p className="text-gray-600">Visualize seu histórico de transações</p>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (screen === 'tools') {
    return (
      <>
        <Toast />
        <div className="min-h-screen bg-gray-50">
          <div className="bg-blue-900 text-white p-6 shadow-lg">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
              <button onClick={() => setScreen('menu')} className="p-2 hover:bg-blue-800 rounded-lg">
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold">Selecionar Ferramentas</h2>
            </div>
          </div>

          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Ferramentas Disponíveis</h3>
              <div className="space-y-4">
                {inventory.map(tool => (
                  <div key={tool.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-100">
                    <div className="flex-1">
                      <h4 className="font-bold text-blue-900">{tool.name}</h4>
                      <p className="text-sm text-gray-600">{tool.spec}</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Disponível: <span className="font-semibold">{tool.available}</span> de {tool.total}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSelectTool(tool.id, Math.max(0, (selectedTools[tool.id] || 0) - 1))}
                        className="w-12 h-12 bg-blue-200 text-blue-900 rounded-lg font-bold text-xl hover:bg-blue-300 transition disabled:opacity-50"
                        disabled={!selectedTools[tool.id] || selectedTools[tool.id] === 0}
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-2xl font-bold text-blue-900">
                        {selectedTools[tool.id] || 0}
                      </span>
                      <button
                        onClick={() => handleSelectTool(tool.id, Math.min(tool.available, (selectedTools[tool.id] || 0) + 1))}
                        className="w-12 h-12 bg-blue-600 text-white rounded-lg font-bold text-xl hover:bg-blue-700 transition disabled:opacity-50"
                        disabled={tool.available === 0 || (selectedTools[tool.id] || 0) >= tool.available}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleConfirmLoan} className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-lg">
              Confirmar Seleção
            </button>
          </div>
        </div>
      </>
    );
  }

  if (screen === 'confirmation') {
    const selectedItems = Object.entries(selectedTools)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({
        tool: inventory.find(t => t.id === parseInt(id)),
        quantity: qty
      }));

    return (
      <>
        <Toast />
        <div className="min-h-screen bg-gray-50">
          <div className="bg-blue-900 text-white p-6 shadow-lg">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
              <button onClick={() => setScreen('tools')} className="p-2 hover:bg-blue-800 rounded-lg">
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold">Confirmar Empréstimo</h2>
            </div>
          </div>

          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Resumo do Empréstimo</h3>
              <div className="mb-4 pb-4 border-b border-blue-100">
                <p className="text-gray-600">Usuário: <span className="font-semibold text-blue-900">{currentUser.name}</span></p>
                <p className="text-gray-600">Horário: <span className="font-semibold text-blue-900">{new Date().toLocaleString('pt-BR')}</span></p>
              </div>
              <div className="space-y-3">
                {selectedItems.map(({ tool, quantity }) => (
                  <div key={tool.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-bold text-blue-900">{tool.name}</p>
                      <p className="text-sm text-gray-600">{tool.spec}</p>
                    </div>
                    <span className="text-lg font-bold text-blue-600">x{quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setScreen('tools')} className="px-6 py-4 bg-gray-200 text-gray-700 rounded-lg font-semibold text-lg hover:bg-gray-300 transition">
                Editar
              </button>
              <button onClick={handleFinalConfirm} className="px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-lg">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (screen === 'return') {
    const activeLoans = userLoans[currentUser.id] ? userLoans[currentUser.id].filter(l => l.status === 'active') : [];

    return (
      <>
        <Toast />
        <div className="min-h-screen bg-gray-50">
          <div className="bg-blue-900 text-white p-6 shadow-lg">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
              <button onClick={() => setScreen('menu')} className="p-2 hover:bg-blue-800 rounded-lg">
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold">Devolver Ferramentas</h2>
            </div>
          </div>

          <div className="max-w-4xl mx-auto p-6">
            {activeLoans.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-blue-900 mb-2">Nenhum empréstimo ativo</h3>
                <p className="text-gray-600">Você não possui ferramentas para devolver</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeLoans.map(loan => (
                  <div key={loan.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Empréstimo #{loan.id}</p>
                        <p className="text-sm text-gray-600">Retirada: {formatDate(loan.loanTime)}</p>
                      </div>
                      <button onClick={() => handleReturnTools(loan.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
                        Devolver Todas
                      </button>
                    </div>
                    <div className="space-y-2">
                      {loan.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-bold text-blue-900">{item.toolName}</p>
                            <p className="text-sm text-gray-600">{item.toolSpec}</p>
                          </div>
                          <span className="text-lg font-bold text-blue-600">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  if (screen === 'history') {
    const userTransactions = transactions.filter(t => t.userId === currentUser.id);

    return (
      <>
        <Toast />
        <div className="min-h-screen bg-gray-50">
          <div className="bg-blue-900 text-white p-6 shadow-lg">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
              <button onClick={() => setScreen('menu')} className="p-2 hover:bg-blue-800 rounded-lg">
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold">Histórico de Transações</h2>
            </div>
          </div>

          <div className="max-w-4xl mx-auto p-6">
            {userTransactions.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Clock size={64} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-blue-900 mb-2">Nenhuma transação</h3>
                <p className="text-gray-600">Seu histórico está vazio</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userTransactions.slice().reverse().map(transaction => (
                  <div key={transaction.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Transação #{transaction.id}</p>
                        <p className="text-sm text-gray-600">Retirada: {formatDate(transaction.loanTime)}</p>
                        {transaction.returnTime && (
                          <p className="text-sm text-green-600">Devolução: {formatDate(transaction.returnTime)}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${transaction.status === 'active' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {transaction.status === 'active' ? 'Ativo' : 'Devolvido'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {transaction.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-bold text-blue-900">{item.toolName}</p>
                            <p className="text-sm text-gray-600">{item.toolSpec}</p>
                          </div>
                          <span className="text-lg font-bold text-blue-600">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return <Toast />;
};

export default Home;