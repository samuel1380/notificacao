import React, { useState, useEffect, useRef } from 'react';
import { Bell, Upload, Globe, Store, Clock, Settings, Play, Square, CheckCircle2, ShieldAlert } from 'lucide-react';

const TEMPLATES = [
  { name: 'Nubank', appName: 'Nubank', title: 'Transferência recebida', body: 'Você recebeu uma transferência de R$ 150,00 de João Silva.', iconUrl: 'https://nubank.com.br/favicon.ico' },
  { name: 'Mercado Pago', appName: 'Mercado Pago', title: 'Pix recebido!', body: 'Novo Pix de R$ 45,90 adicionado à sua conta.', iconUrl: 'https://www.mercadopago.com.br/favicon.ico' },
  { name: 'WhatsApp', appName: 'WhatsApp', title: 'Maria', body: 'Oi, tudo bem? Já te enviei o comprovante.', iconUrl: 'https://whatsapp.com/favicon.ico' },
];

export default function App() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  
  // Estado principal sendo carregado do localStorage ou valores padrão
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('notifyConfig');
    return saved ? JSON.parse(saved) : {
      appName: 'Meu App',
      title: 'Nova Notificação',
      body: 'Esta é uma notificação de teste.',
      iconUrl: 'https://google.com/favicon.ico',
      fromText: '',
      showFrom: false,
      delaySeconds: 0,
    };
  });

  const [autoNotify, setAutoNotify] = useState(() => {
    const saved = localStorage.getItem('autoNotifyConfig');
    return saved ? JSON.parse(saved) : {
      active: false,
      intervalMinutes: 1
    };
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Catch PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // Salva config no LocalStorage sempre que alterar
  useEffect(() => {
    localStorage.setItem('notifyConfig', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('autoNotifyConfig', JSON.stringify(autoNotify));
  }, [autoNotify]);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Este navegador não suporta notificações de sistema.');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const handleIconExtract = (type: 'site' | 'store') => {
    const url = prompt(`Digite o link do ${type === 'site' ? 'site' : 'App na loja'}:`);
    if (!url) return;
    
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      // Busca o favicon padrão do domínio fornecido
      setConfig({ ...config, iconUrl: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128` });
    } catch {
      alert('URL inválida!');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setConfig({ ...config, iconUrl: e.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const sendNotification = () => {
    if (permission !== 'granted') {
      alert('Você precisa permitir as notificações primeiro!');
      return;
    }

    const options: NotificationOptions = {
      body: config.body,
      icon: config.iconUrl,
      badge: config.iconUrl,
      silent: false
    };

    const finalTitle = config.showFrom && config.fromText 
      ? `${config.appName} • de: ${config.fromText} - ${config.title}`
      : `${config.appName} • ${config.title}`;

    if (config.delaySeconds > 0) {
      setTimeout(() => {
        new Notification(finalTitle, options);
      }, config.delaySeconds * 1000);
    } else {
      new Notification(finalTitle, options);
    }
  };

  const toggleAutoNotify = () => {
    if (!autoNotify.active) {
      setAutoNotify({ ...autoNotify, active: true });
      sendNotification(); // Envia a primeira logo de cara
      timerRef.current = setInterval(sendNotification, autoNotify.intervalMinutes * 60000);
    } else {
      setAutoNotify({ ...autoNotify, active: false });
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    // Restaura o timer automático caso o usuário recarregue a página e estivesse ativo
    if (autoNotify.active && !timerRef.current) {
      timerRef.current = setInterval(sendNotification, autoNotify.intervalMinutes * 60000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoNotify.active, autoNotify.intervalMinutes, config]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-20 md:p-8 font-sans text-gray-800">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header & Status */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Bell size={24} /></div>
            <div>
              <h1 className="text-2xl font-bold">NotifyPro</h1>
              <p className="text-sm text-gray-500">PWA Notification Studio</p>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap justify-center">
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                📲 Instalar App
              </button>
            )}
            <button 
              onClick={requestPermission}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                permission === 'granted' ? 'bg-green-100 text-green-700' :
                permission === 'denied' ? 'bg-red-100 text-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {permission === 'granted' ? <><CheckCircle2 size={18} /> Permitido</> :
               permission === 'denied' ? <><ShieldAlert size={18} /> Bloqueado</> : 
               'Permitir Notificações'}
            </button>
          </div>
        </div>

        {/* Templates */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {TEMPLATES.map((tpl, i) => (
            <button key={i} onClick={() => setConfig({ ...config, ...tpl })}
              className="whitespace-nowrap px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium hover:border-blue-500 transition-colors">
              {tpl.name}
            </button>
          ))}
        </div>

        {/* Configurações da Notificação */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-lg font-bold flex items-center gap-2"><Settings size={20} /> Conteúdo da Notificação</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome do App</label>
              <input type="text" value={config.appName} onChange={e => setConfig({...config, appName: e.target.value})} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Título principal</label>
              <input type="text" value={config.title} onChange={e => setConfig({...config, title: e.target.value})} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrição (Corpo)</label>
            <textarea value={config.body} onChange={e => setConfig({...config, body: e.target.value})} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" rows={3}></textarea>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-medium text-sm flex items-center gap-2">
                <input type="checkbox" checked={config.showFrom} onChange={e => setConfig({...config, showFrom: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                Mostrar campo "de:" (Remetente)
              </label>
            </div>
            {config.showFrom && (
              <input type="text" placeholder="Ex: João da Silva" value={config.fromText} onChange={e => setConfig({...config, fromText: e.target.value})} className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ícone do App</label>
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                <Upload size={16} /> Upload Foto
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              <button onClick={() => handleIconExtract('site')} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                <Globe size={16} /> Extrair de Site
              </button>
              <button onClick={() => handleIconExtract('store')} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                <Store size={16} /> Extrair da Loja (Link)
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview estilo Android */}
        <div className="bg-[#1f1f1f] p-4 rounded-2xl shadow-lg relative overflow-hidden text-white">
          <div className="text-xs text-gray-400 mb-4 font-medium flex justify-between">
            <span>PREVIEW DA NOTIFICAÇÃO (ANDROID)</span>
            <span>Agora</span>
          </div>
          <div className="flex gap-3">
            <img src={config.iconUrl} alt="icon" className="w-10 h-10 rounded-lg object-cover bg-white p-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-1 text-xs text-gray-300 mb-0.5">
                <span className="font-medium">{config.appName}</span>
                {config.showFrom && config.fromText && <span>• de: {config.fromText}</span>}
              </div>
              <p className="font-bold text-sm mb-0.5 leading-tight">{config.title}</p>
              <p className="text-sm text-gray-300 leading-tight line-clamp-2">{config.body}</p>
            </div>
          </div>
        </div>

        {/* Ações e Agendamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Clock size={18}/> Envio Único</h3>
            <div>
              <label className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Atraso: {config.delaySeconds}s</span>
              </label>
              <input type="range" min="0" max="60" value={config.delaySeconds} onChange={e => setConfig({...config, delaySeconds: parseInt(e.target.value)})} className="w-full accent-blue-600" />
            </div>
            <button onClick={sendNotification} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 flex justify-center items-center gap-2">
              <Bell size={18} /> Enviar Agora
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Play size={18}/> Envio Automático</h3>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Intervalo (Minutos)</label>
              <input type="number" min="1" value={autoNotify.intervalMinutes} onChange={e => setAutoNotify({...autoNotify, intervalMinutes: parseInt(e.target.value)})} disabled={autoNotify.active} className="w-full border rounded-lg p-2 outline-none disabled:bg-gray-100" />
            </div>
            <button onClick={toggleAutoNotify} className={`w-full py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 flex justify-center items-center gap-2 ${autoNotify.active ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-800 hover:bg-gray-900 text-white'}`}>
              {autoNotify.active ? <><Square size={18} /> Parar Envios</> : <><Play size={18} /> Iniciar Envios</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}