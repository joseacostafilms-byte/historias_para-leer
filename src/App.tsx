import React, { useState, useEffect, useRef } from 'react';
import { Play, Sparkles, BookOpen, Brush, Star, Gamepad2, ChevronRight, Pause, FastForward, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- STORY DATA ---
const storyData = {
  id: 'dragon-chispa',
  title: 'El Dragón Chispa',
  nodes: {
    start: {
      text: 'Había una vez un pequeño dragón llamado Chispa. A diferencia de los demás dragones, Chispa no podía escupir fuego, solo pequeñas burbujas de jabón.',
      imagePrompt: 'A highly detailed children storybook illustration of a cute sad little red dragon blowing soap bubbles instead of fire, charming fantasy background.',
      mood: 'calm',
      choices: [
        { text: 'Ir al Bosque de Cristal', next: 'bosque' },
        { text: 'Preguntar al Búho Sabio', next: 'buho' },
      ],
      image: 'dragon_sad',
    },
    bosque: {
      text: 'En el Bosque de Cristal, Chispa conoció a una tortuga que estaba atrapada bajo una rama de cristal muy pesada.',
      imagePrompt: 'A highly detailed children storybook illustration of a cute little red dragon meeting a turtle trapped under a heavy crystal branch in a glowing magical crystal forest.',
      mood: 'mysterious',
      choices: [
        { text: 'Ayudar usando burbujas para levantar la rama', next: 'ayudar_tortuga' },
        { text: 'Buscar a alguien más fuerte', next: 'buscar_fuerte' },
      ],
      image: 'bosque_tortuga',
    },
    buho: {
      text: 'El Búho Sabio le dijo a Chispa que el verdadero fuego viene del corazón, cuando uno tiene valentía y ayuda a los demás.',
      imagePrompt: 'A highly detailed children storybook illustration of a cute little red dragon listening to a wise majestic old owl perched on a tree branch, magical starry night.',
      mood: 'calm',
      choices: [
        { text: 'Volar a la Montaña Alta para ser valiente', next: 'montana' },
        { text: 'Volver a casa a pensar', next: 'casa' },
      ],
      image: 'buho_sabio',
    },
    ayudar_tortuga: {
      text: '¡Las burbujas levantaron la rama! La tortuga agradecida le dio a Chispa una Gema de Valentía. De repente, Chispa sintió un calor en su pecho...',
      imagePrompt: 'A highly detailed children storybook illustration of a cute little red dragon blowing giant glowing soap bubbles to lift a crystal branch off a happy turtle. Magical.',
      mood: 'happy',
      choices: [],
      image: 'dragon_happy',
      isEnding: true,
      moral: 'La empatía y usar tus talentos únicos te hace especial.',
    },
    buscar_fuerte: {
      text: 'Chispa se alejó para buscar ayuda. Cuando volvió con un oso, la tortuga ya se había liberado sola, pero estaba triste de que Chispa no intentara ayudar.',
      imagePrompt: 'A highly detailed children storybook illustration of a sad little red dragon returning with a friendly bear, to see a turtle leaving on its own. Soft lighting.',
      mood: 'tense',
      choices: [],
      image: 'dragon_sad',
      isEnding: true,
      moral: 'A veces, intentar ayudar es mejor que no hacer nada.',
    },
    montana: {
      text: 'En la cima de la montaña, un fuerte viento amenazó con derribar el nido de un águila. Chispa usó su cuerpo para proteger los huevos.',
      imagePrompt: 'A highly detailed children storybook illustration of a brave little red dragon shielding an eagle nest with glowing eggs from a harsh wind on a mountain peak.',
      mood: 'mysterious',
      choices: [],
      image: 'dragon_brave',
      isEnding: true,
      moral: 'La verdadera valentía es proteger a los que lo necesitan.',
    },
    casa: {
      text: 'Chispa volvió a casa. Estaba a salvo, pero seguía sintiéndose igual que antes. Decidió que mañana intentaría ser más valiente.',
      imagePrompt: 'A highly detailed children storybook illustration of a cute little red dragon sleeping peacefully inside a cozy glowing crystal cave.',
      mood: 'calm',
      choices: [],
      image: 'dragon_sleep',
      isEnding: true,
      moral: 'Los grandes cambios requieren tiempo y pequeños pasos.',
    }
  }
};

type AppState = 'menu' | 'dev_doc' | 'reading' | 'painting';

export default function App() {
  const [appState, setAppState] = useState<AppState>('menu');
  const [gems, setGems] = useState(0);
  const [mood, setMood] = useState<'calm' | 'happy' | 'tense' | 'mysterious'>('calm');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (appState === 'reading') {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        gainNodeRef.current = audioCtxRef.current.createGain();
        gainNodeRef.current.connect(audioCtxRef.current.destination);
        gainNodeRef.current.gain.value = 0; // start silent
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      let freq = 220; // calm (A3)
      let targetGain = 0.05;
      if (mood === 'happy') { freq = 440; targetGain = 0.04; } 
      else if (mood === 'tense') { freq = 150; targetGain = 0.08; } 
      else if (mood === 'mysterious') { freq = 293; targetGain = 0.03; } 

      if (!oscillatorRef.current) {
        oscillatorRef.current = ctx.createOscillator();
        oscillatorRef.current.type = 'sine';
        oscillatorRef.current.frequency.value = freq;
        
        // Add some LFO for "adaptive" feel
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1; // slow modulation
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 10;
        lfo.connect(lfoGain);
        lfoGain.connect(oscillatorRef.current.frequency);
        lfo.start();

        oscillatorRef.current.connect(gainNodeRef.current!);
        oscillatorRef.current.start();
      } else {
        // Smoothly transition frequencies between moods
        oscillatorRef.current.frequency.setTargetAtTime(freq, ctx.currentTime, 1.5);
      }

      // Fade in / adjust volume smoothly
      gainNodeRef.current!.gain.setTargetAtTime(targetGain, ctx.currentTime, 2);

    } else {
      // Fade out
      if (audioCtxRef.current && gainNodeRef.current) {
         gainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 1);
      }
    }
  }, [appState, mood]);

  return (
    <div className="fixed inset-0 bg-[#FDFBF2] font-sans text-[#2D334A] flex flex-col overflow-hidden">
      {/* Header / Navbar */}
      <header className="shrink-0 w-full flex justify-between items-center bg-[#FFD93D] px-4 py-3 sm:px-6 sm:py-4 border-b-4 border-[#2D334A] shadow-md z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white rounded-full border-4 border-[#2D334A] flex items-center justify-center text-xl font-black">
            <BookOpen className="text-[#2D334A] w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black uppercase tracking-tight hidden sm:block">Mundos de Tinta</h1>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-3 sm:px-4 py-2 rounded-2xl border-4 border-[#2D334A] flex items-center gap-2 shadow-[4px_4px_0px_0px_#2D334A]">
            <Sparkles className="text-[#FFD93D]" size={20} fill="currentColor" />
            <span className="font-black text-lg sm:text-xl">{gems} <span className="hidden sm:inline">Gemas</span></span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto relative z-10 w-full flex flex-col bg-[#FDFBF2]">
        <div className="min-h-full w-full max-w-4xl mx-auto flex flex-col p-4 sm:p-6 pb-24">
        <AnimatePresence mode="wait">
          {appState === 'menu' && (
            <MainMenu key="menu" onNavigate={setAppState} />
          )}
          {appState === 'dev_doc' && (
            <DevDocumentation key="dev_doc" onNavigate={setAppState} />
          )}
          {appState === 'reading' && (
            <ReadingView 
              key="reading" 
              onNavigate={setAppState} 
              onEarnGems={(amount) => setGems(g => g + amount)} 
              onMoodChange={setMood}
            />
          )}
          {appState === 'painting' && (
            <PaintingView key="painting" onNavigate={setAppState} />
          )}
        </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function MainMenu({ onNavigate }: { onNavigate: (s: AppState) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center gap-8 w-full max-w-md bg-white p-6 rounded-3xl border-4 border-[#2D334A] shadow-[8px_8px_0px_0px_#2D334A]"
    >
      <div className="text-center space-y-4">
        <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-[#2D334A]">
          Mundos de Tinta
        </h2>
        <p className="text-xl font-bold opacity-80 uppercase tracking-widest text-[#2D334A]">¡Aprende a leer jugando!</p>
      </div>

      <div className="flex flex-col gap-4 w-full">
        <button 
          onClick={() => onNavigate('reading')}
          className="w-full bg-[#55EFC4] text-[#2D334A] font-black uppercase tracking-wider py-4 px-8 rounded-3xl border-4 border-[#2D334A] shadow-[8px_8px_0px_0px_#2D334A] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_#2D334A] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-4 text-xl group"
        >
          <Play className="group-hover:scale-125 transition-transform" fill="currentColor" />
          Leer Historia
        </button>
        
        <button 
          onClick={() => onNavigate('painting')}
          className="w-full bg-[#A29BFE] text-[#2D334A] font-black uppercase tracking-wider py-4 px-8 rounded-3xl border-4 border-[#2D334A] shadow-[8px_8px_0px_0px_#2D334A] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_#2D334A] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-4 text-xl group"
        >
          <Brush className="group-hover:rotate-12 transition-transform" />
          Pincel Mágico
        </button>

        <button 
          onClick={() => onNavigate('dev_doc')}
          className="w-full bg-white text-[#2D334A] font-black uppercase tracking-wider py-4 px-8 rounded-3xl border-4 border-[#2D334A] shadow-[8px_8px_0px_0px_#2D334A] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_#2D334A] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-4 text-lg mt-4"
        >
          <Info className="text-[#6C5CE7]" />
          Docs del Desarrollador
        </button>
      </div>
    </motion.div>
  );
}

function ReadingView({ onNavigate, onEarnGems, onMoodChange }: { onNavigate: (s: AppState) => void, onEarnGems: (n: number) => void, onMoodChange: (mood: 'calm'|'happy'|'tense'|'mysterious') => void }) {
  const [currentNodeId, setCurrentNodeId] = useState('start');
  const [nodeData, setNodeData] = useState<any>((storyData.nodes as any)['start']);
  const [speedState, setSpeedState] = useState<'paused' | 'listening'>('paused');
  const [wordIndex, setWordIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [struggles, setStruggles] = useState<Record<string, number>>({});
  const [errorInfo, setErrorInfo] = useState<string|null>(null);

  const words = nodeData?.text?.split(' ') || [];
  const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognitionRef = useRef<any>(null);

  // Update Mood when Node changes
  useEffect(() => {
    if (nodeData?.mood) {
      onMoodChange(nodeData.mood);
    } else {
      onMoodChange('calm'); // default
    }
  }, [nodeData, onMoodChange]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (SpeechRecognition) {
      if (!recognitionRef.current) {
         recognitionRef.current = new SpeechRecognition();
         recognitionRef.current.continuous = true;
         recognitionRef.current.interimResults = true;
         recognitionRef.current.lang = 'es-ES';
      }

      recognitionRef.current.onerror = (event: any) => {
        let msg = "Prueba hablando más fuerte.";
        if (event.error === 'not-allowed') msg = "No tenemos permiso para usar el micrófono.";
        else if (event.error === 'network') msg = "Error de red con el reconocimiento de voz.";
        
        setErrorInfo(`Error de voz: ${msg} Puedes tocar las palabras para avanzar rápido.`);
        setSpeedState('paused');
      };

      recognitionRef.current.onresult = (event: any) => {
        if (speedState !== 'listening') return;
        
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            interimTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        // Simple matching logic
        const currentWordClean = words[wordIndex]?.toLowerCase().replace(/[.,!?;:]/g, '');
        const spokenWords = interimTranscript.toLowerCase().split(' ');
        
        if (spokenWords.includes(currentWordClean)) {
          // Success! Advance word
          setWordIndex(w => w + 1);
        } else {
          // Struggling
          const newStruggles = { ...struggles };
          newStruggles[currentWordClean] = (newStruggles[currentWordClean] || 0) + 1;
          setStruggles(newStruggles);
          
          if (newStruggles[currentWordClean] > 3) {
            // Narrator helps
            narrateWord(words[wordIndex]);
            newStruggles[currentWordClean] = 0; // reset
            setStruggles(newStruggles);
          }
        }
      };
    } else {
      setTimeout(() => setErrorInfo("Tu navegador no soporta Reconocimiento de Voz. Toca las palabras para avanzar."), 1000);
    }
  }, [speedState, wordIndex, words, struggles]);

  useEffect(() => {
    if (speedState === 'listening' && recognitionRef.current) {
      try {
        setErrorInfo(null);
        recognitionRef.current.start();
      } catch(e) {}
    } else if (speedState === 'paused' && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch(e) {}
    }
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
    }
  }, [speedState]);

  useEffect(() => {
    if (wordIndex >= words.length && words.length > 0) {
      if (speedState === 'listening') {
        onEarnGems(5); // Reward
        setSpeedState('paused'); // Pause for choice
        
        // Save analytics
        const struggledWordsList = Object.keys(struggles).filter(k => struggles[k] > 0);
        fetch('/api/analytics/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'user-1',
            age: 7,
            wpm: 60, // Simulated WPM
            struggledWords: struggledWordsList
          })
        }).catch(err => console.error("Analytics Error", err));
      }
    }
  }, [wordIndex, words.length, speedState]);

  const narrateWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'es-ES';
      utterance.rate = 0.8; // Speak slowly
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleChoice = async (nextId: string, choiceText: string = '') => {
    setWordIndex(0);
    setStruggles({});
    setErrorInfo(null);
    
    // Check local nodes
    const localNode = (storyData.nodes as any)[nextId];
    if (localNode) {
      setCurrentNodeId(nextId);
      setNodeData(localNode);
      setSpeedState('listening');
    } else {
      // Dynamic AI generation
      setIsGenerating(true);
      setNodeData({ text: 'Pensando en la siguiente aventura...', choices: [] });
      try {
        const res = await fetch('/api/story/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentStoryPath: `El usuario eligió: ${choiceText}.`,
            readingLevel: 'principiante'
          })
        });
        
        if (!res.ok) {
           throw new Error(`Error ${res.status}`);
        }
        
        const generatedNode = await res.json();
        
        // Ensure choices have generic next ids
        if (generatedNode.choices) {
          generatedNode.choices = generatedNode.choices.map((c: any, i: number) => ({
            ...c,
            next: `gen_${Date.now()}_${i}`
          }));
        }
        
        setNodeData(generatedNode);
        setCurrentNodeId(`gen_${Date.now()}`);
      } catch (e) {
        setNodeData((prev: any) => ({
           ...prev, 
           text: 'El portal mágico parece cerrado. ¡Intenta de nuevo!',
           choices: [ { text: "Reintentar", next: nextId, intent: "" } ]
        }));
        setErrorInfo("Hubo un problema de conexión con la IA de la historia. Por favor revisa tu internet y haz click en Reintentar.");
        setSpeedState('paused'); // prevent infinite listening on error
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleRestart = () => {
    setCurrentNodeId('start');
    setNodeData((storyData.nodes as any)['start']);
    setWordIndex(0);
    setSpeedState('paused');
    setErrorInfo(null);
  }

  // Auto skip visually for demonstration if they don't want to use voice recording
  const debugAdvanceWord = () => {
      setWordIndex(w => Math.min(w + 1, words.length));
  }

  if (!nodeData) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-transparent w-full h-full flex flex-col relative"
    >
      <div className="flex justify-between items-center mb-6 bg-[#FFD93D] p-3 sm:p-4 border-4 border-[#2D334A] rounded-2xl shadow-[4px_4px_0px_0px_#2D334A] shrink-0">
        <button onClick={() => {
            if(recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e){} }
            onNavigate('menu');
        }} className="text-[#2D334A] font-black uppercase text-xs sm:text-sm flex items-center justify-center h-12 px-4 hover:opacity-80 active:translate-y-1">
          Volver
        </button>
        <div className="flex gap-2 items-center">
            {speedState === 'listening' && !errorInfo && <div className="text-xs sm:text-sm font-bold animate-pulse text-red-500 mr-2">● Escuchando...</div>}
           <button 
            onClick={() => setSpeedState(s => s === 'paused' ? 'listening' : 'paused')}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-[#2D334A] shadow-[4px_4px_0px_0px_#2D334A] flex items-center justify-center transition-transform hover:translate-y-1 active:shadow-none active:translate-y-2 ${speedState === 'listening' ? 'bg-[#FF7675] text-white' : 'bg-[#55EFC4] text-[#2D334A]'}`}
          >
            {speedState === 'listening' ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
        </div>
      </div>

      {errorInfo && (
        <div className="mb-4 bg-[#FF7675] text-white p-4 rounded-2xl border-4 border-[#2D334A] shadow-[4px_4px_0px_0px_#2D334A] flex items-center gap-3 shrink-0">
           <AlertCircle size={24} className="shrink-0" />
           <p className="font-bold text-sm sm:text-base leading-tight">{errorInfo}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full overflow-hidden">
        {isGenerating ? (
            <div className="text-xl sm:text-2xl font-black animate-pulse text-[#6C5CE7] text-center p-4">La magia está escribiendo e ilustrando...</div>
        ) : (
            <div className="w-full max-w-5xl h-full sm:h-auto sm:min-h-[600px] bg-[#FDFBF2] rounded-r-3xl rounded-l-3xl border-4 border-[#2D334A] shadow-[12px_12px_0px_0px_#2D334A] flex flex-col md:flex-row relative mx-auto overflow-y-auto md:overflow-visible">
                {/* Book Spine simulating shadow on desktop */}
                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-transparent via-[#2D334A]/10 to-transparent pointer-events-none z-20"></div>
                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[2px] bg-[#2D334A]/20 pointer-events-none z-20"></div>

                {/* Left Page (Image) */}
                <div className="w-full md:w-1/2 p-4 sm:p-8 border-b-4 md:border-b-0 md:border-r-4 border-[#2D334A] flex flex-col justify-center bg-gradient-to-br from-[#FDFBF2] to-[#F4EFE6] relative overflow-hidden group">
                    {/* Simulated paper texture background */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#8B7355_1px,_transparent_1px)] bg-[size:12px_12px] pointer-events-none"></div>
                    
                    {nodeData.imagePrompt ? (
                        <div className="relative w-full aspect-square md:aspect-[4/5] rounded-2xl border-4 border-[#2D334A] shadow-[4px_4px_0px_0px_#2D334A] overflow-hidden bg-[#FFEAA7] z-10">
                            <img 
                                src={`https://image.pollinations.ai/prompt/${encodeURIComponent(nodeData.imagePrompt)}?width=800&height=1000&nologo=true`} 
                                alt="Ilustración del cuento"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="relative w-full aspect-square md:aspect-[4/5] rounded-2xl border-4 border-[#2D334A] shadow-[4px_4px_0px_0px_#2D334A] flex justify-center items-center bg-[#A29BFE] z-10">
                            <Star size={64} className="text-[#FFD93D] animate-bounce" fill="currentColor" />
                        </div>
                    )}
                </div>

                {/* Right Page (Text & Choices) */}
                <div className="w-full md:w-1/2 p-4 sm:p-8 flex flex-col bg-gradient-to-bl from-[#FDFBF2] to-[#F4EFE6] relative">
                    {/* Simulated paper texture background */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#8B7355_1px,_transparent_1px)] bg-[size:12px_12px] pointer-events-none"></div>

                    <div className="relative z-10 flex-1 flex flex-col justify-center">
                        <div className="text-xl sm:text-2xl font-medium leading-relaxed sm:leading-loose text-[#2D334A] min-h-[150px]" onClick={debugAdvanceWord}>
                            {words.map((word: string, i: number) => {
                            const isHighlighted = i === wordIndex;
                            const isRead = i < wordIndex;
                            
                            return (
                                <motion.span 
                                key={`${currentNodeId}-${i}`}
                                onClick={(e) => { e.stopPropagation(); narrateWord(word); }}
                                initial={{ opacity: 0 }}
                                animate={{ 
                                    opacity: isRead || isHighlighted ? 1 : 0.4, 
                                    color: isHighlighted ? '#2D334A' : '#2D334A',
                                    scale: isHighlighted ? 1.05 : 1,
                                }}
                                transition={{ duration: 0.2 }}
                                className={`inline-block mx-1 cursor-pointer select-none ${isHighlighted ? 'font-bold bg-[#81ECEC] px-2 border-b-4 border-[#00B894] rounded-lg' : ''} ${isRead ? 'text-[#00B894] font-bold' : ''}`}
                                >
                                {word}
                                </motion.span>
                            )
                            })}
                        </div>

                        {/* Choices Area */}
                        <AnimatePresence>
                            {(wordIndex >= words.length || speedState === 'paused') && words.length > 0 && !errorInfo?.includes('Reintentar') && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 flex flex-col gap-3"
                            >
                                {nodeData.choices && nodeData.choices.length > 0 ? (
                                <>
                                    <h3 className="text-center font-black text-[#6C5CE7] mb-2 tracking-widest uppercase text-xs sm:text-sm">¿Qué debería hacer Chispa?</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                    {nodeData.choices.map((choice: any, idx: number) => {
                                        const bgColors = ['bg-[#FF7675]', 'bg-[#00B894]', 'bg-[#74B9FF]', 'bg-[#A29BFE]'];
                                        return (
                                        <button
                                            key={idx}
                                            onClick={() => handleChoice(choice.next, choice.text)}
                                            className={`${bgColors[idx % bgColors.length]} text-white border-4 border-[#2D334A] shadow-[4px_4px_0px_0px_#2D334A] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#2D334A] active:translate-y-2 active:shadow-none font-black uppercase py-3 sm:py-4 px-4 sm:px-6 rounded-2xl transition-all flex items-center justify-between group`}
                                        >
                                            <span className="text-left text-sm sm:text-base">{choice.text}</span>
                                            <ChevronRight className="shrink-0 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                                        </button>
                                        );
                                    })}
                                    </div>
                                </>
                                ) : (
                                <div className="text-center p-6 bg-[#A29BFE] rounded-3xl border-4 border-[#2D334A] shadow-[8px_8px_0px_0px_#2D334A] mt-4">
                                    <Star className="text-[#FFD93D] mx-auto mb-4 animate-[spin_3s_linear_infinite]" size={48} fill="currentColor" />
                                    <h3 className="text-2xl font-black uppercase text-white mb-2">¡Final Alcanzado!</h3>
                                    {nodeData.moral && <p className="text-sm sm:text-base text-[#2D334A] mb-4 font-bold bg-white px-4 py-3 rounded-xl inline-block border-2 border-[#2D334A] shadow-[4px_4px_0px_0px_#2D334A]">Moral: {nodeData.moral}</p>}
                                    <button
                                    onClick={handleRestart}
                                    className="mx-auto block w-full bg-[#00B894] text-white font-black uppercase text-lg sm:text-xl py-3 px-6 border-4 border-[#2D334A] shadow-[4px_4px_0px_0px_#2D334A] hover:translate-y-1 hover:shadow-none active:translate-y-2 rounded-2xl transition-all"
                                    >
                                    Otra Aventura
                                    </button>
                                </div>
                                )}
                            </motion.div>
                            )}
                            {/* Retry Generation Output (if error) */}
                            {errorInfo?.includes('Reintentar') && (
                                <div className="mt-8 flex flex-col gap-4">
                                {nodeData.choices.map((choice: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleChoice(choice.next, choice.text)}
                                        className="bg-[#FFD93D] text-[#2D334A] border-4 border-[#2D334A] shadow-[4px_4px_0px_0px_#2D334A] hover:translate-y-1 hover:shadow-none active:translate-y-2 font-black uppercase py-4 px-4 sm:px-6 rounded-3xl transition-all flex items-center justify-between group"
                                    >
                                        <span className="text-left text-sm sm:text-lg">{choice.text}</span>
                                        <ChevronRight className="shrink-0 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                                    </button>
                                ))}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        )}
      </div>
    </motion.div>
  );
}

// --- PAINTING COMPONENT ---
function PaintingView({ onNavigate }: { onNavigate: (s: AppState) => void }) {
  const [color, setColor] = useState('#FF7675');
  const [fills, setFills] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load previously saved paints
    try {
      const saved = localStorage.getItem('chispa-paint');
      if (saved) setFills(JSON.parse(saved));
    } catch(e){}
  }, []);

  const handleFill = (partId: string) => {
    const newFills = { ...fills, [partId]: color };
    setFills(newFills);
    try {
      localStorage.setItem('chispa-paint', JSON.stringify(newFills));
    } catch(e){}
  };

  const colors = [
    '#FAB1A0', '#FFEAA7', '#81ECEC', '#74B9FF', 
    '#D63031', '#55EFC4', '#6C5CE7', '#FF7675', '#2D334A', '#FFFFFF'
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#6C5CE7] w-full max-w-4xl rounded-3xl border-4 border-[#2D334A] shadow-[8px_8px_0px_0px_#2D334A] p-6 sm:p-8 flex flex-col items-center relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#fff_2px,_transparent_0)] bg-[size:24px_24px] pointer-events-none"></div>

      <div className="w-full flex justify-between items-center mb-6 relative z-10 bg-white p-4 border-4 border-[#2D334A] rounded-2xl shadow-[4px_4px_0px_0px_#2D334A]">
         <button onClick={() => onNavigate('menu')} className="text-[#2D334A] font-black uppercase text-sm hover:opacity-80">Volver</button>
         <h2 className="text-2xl font-black uppercase tracking-tight text-[#2D334A]">🎨 Pincel Mágico</h2>
         <button onClick={() => { setFills({}); localStorage.removeItem('chispa-paint'); }} className="text-xs font-bold uppercase text-[#FF7675] hover:opacity-80">Limpiar</button>
      </div>

      <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 p-4 bg-[#A29BFE] rounded-2xl border-4 border-[#2D334A] shadow-[8px_8px_0px_0px_#2D334A] justify-center relative z-10 max-w-full">
        {colors.map(c => (
          <button 
           key={c}
           onClick={() => setColor(c)}
           className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-4 border-[#2D334A] shadow-[4px_4px_0px_0px_#2D334A] transition-transform ${color === c ? 'scale-110 translate-y-1 shadow-none' : 'hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#2D334A]'}`}
           style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-lg aspect-square bg-white rounded-3xl overflow-hidden border-4 border-[#2D334A] shadow-[8px_8px_0px_0px_#2D334A] flex items-center justify-center z-10 p-8">
        <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-md">
            {/* Background Sky */}
            <path id="bg" d="M0,0 h400 v400 h-400 z" fill={fills['bg'] || '#81ECEC'} onClick={() => handleFill('bg')} className="cursor-pointer transition-colors duration-300" stroke="#2D334A" strokeWidth="8" />
            
            {/* Sun */}
            <circle id="sun" cx="320" cy="80" r="40" fill={fills['sun'] || '#FFEAA7'} onClick={() => handleFill('sun')} className="cursor-pointer transition-colors duration-300" stroke="#2D334A" strokeWidth="6" />

            {/* Mountains */}
            <path id="mountain1" d="M0,400 L150,200 L300,400 z" fill={fills['mountain1'] || '#A29BFE'} onClick={() => handleFill('mountain1')} className="cursor-pointer transition-colors duration-300" stroke="#2D334A" strokeWidth="6" strokeLinejoin="round" />
            <path id="mountain2" d="M150,400 L280,250 L400,400 z" fill={fills['mountain2'] || '#6C5CE7'} onClick={() => handleFill('mountain2')} className="cursor-pointer transition-colors duration-300" stroke="#2D334A" strokeWidth="6" strokeLinejoin="round" />

            {/* Dragon Body */}
            <path id="dragon-body" d="M100,300 C100,200 250,200 250,300 C280,350 250,400 180,400 C150,400 100,350 100,300 z" fill={fills['dragon-body'] || '#55EFC4'} onClick={() => handleFill('dragon-body')} className="cursor-pointer transition-colors duration-300" stroke="#2D334A" strokeWidth="8" strokeLinejoin="round" />
            
            {/* Dragon Belly */}
            <path id="dragon-belly" d="M120,300 C120,250 200,250 200,300 C210,340 180,380 150,380 C130,380 120,340 120,300 z" fill={fills['dragon-belly'] || '#FFEAA7'} onClick={() => handleFill('dragon-belly')} className="cursor-pointer transition-colors duration-300" stroke="#2D334A" strokeWidth="6" strokeLinejoin="round" />

            {/* Dragon Head */}
            <circle id="dragon-head" cx="220" cy="180" r="45" fill={fills['dragon-head'] || '#55EFC4'} onClick={() => handleFill('dragon-head')} className="cursor-pointer transition-colors duration-300" stroke="#2D334A" strokeWidth="6" />
            
            {/* Dragon Snout */}
            <ellipse id="dragon-snout" cx="260" cy="190" rx="30" ry="20" fill={fills['dragon-head'] || '#55EFC4'} onClick={() => handleFill('dragon-head')} className="cursor-pointer transition-colors duration-300" stroke="#2D334A" strokeWidth="6" />

            {/* Dragon Wings */}
            <path id="wing-back" d="M140,240 Q100,100 200,120 Q160,180 160,250" fill={fills['dragon-wing'] || '#FF7675'} onClick={() => handleFill('dragon-wing')} className="cursor-pointer transition-colors duration-300" stroke="#2D334A" strokeWidth="6" strokeLinejoin="round" />
            <path id="wing-front" d="M180,250 Q150,120 250,140 Q210,190 200,260" fill={fills['dragon-wing'] || '#FF7675'} onClick={() => handleFill('dragon-wing')} className="cursor-pointer transition-colors duration-300" stroke="#2D334A" strokeWidth="6" strokeLinejoin="round" />

            {/* Dragon Eyes (Non-clickable details) */}
            <circle cx="230" cy="170" r="6" fill="#2D334A" />
            <circle cx="232" cy="168" r="2" fill="#FFF" />
            
            <circle cx="250" cy="170" r="6" fill="#2D334A" />
            <circle cx="252" cy="168" r="2" fill="#FFF" />

            {/* Magic Bubble */}
            <circle id="bubble" cx="320" cy="170" r="15" fill={fills['bubble'] || '#81ECEC'} onClick={() => handleFill('bubble')} stroke="#2D334A" strokeWidth="4" />
            <circle cx="316" cy="166" r="4" fill="#FFFFFF" opacity="0.6" />
        </svg>
      </div>
    </motion.div>
  );
}


// --- DEV DOCUMENTATION COMPONENT ---
function DevDocumentation({ onNavigate }: { onNavigate: (s: AppState) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-[#FDFBF2] w-full max-w-4xl rounded-3xl border-4 border-[#2D334A] shadow-[8px_8px_0px_0px_#2D334A] p-6 sm:p-12 h-[80vh] overflow-y-auto"
    >
      <div className="flex justify-between items-center mb-8 border-b-4 border-[#2D334A] pb-4 sticky top-0 bg-[#FDFBF2] pt-2 z-10">
        <h2 className="text-3xl font-black uppercase text-[#2D334A]">Dev Output & GDD</h2>
        <button onClick={() => onNavigate('menu')} className="bg-[#FF7675] text-white font-black uppercase border-2 border-[#2D334A] shadow-[4px_4px_0px_0px_#2D334A] px-4 py-2 rounded-xl hover:translate-y-1 hover:shadow-none active:translate-y-2 transition-all">Cerrar Docs</button>
      </div>

      <div className="prose prose-slate prose-lg max-w-none text-[#2D334A] space-y-8 font-medium">
        
        <section className="bg-white p-6 rounded-3xl border-4 border-[#2D334A] shadow-[8px_8px_0px_0px_#2D334A]">
          <h3 className="text-2xl font-black uppercase text-[#6C5CE7] mb-4">Output Esperado (Game Design Document)</h3>
          <p><strong>Nombre del Prototipo:</strong> Mundos de Tinta y Fantasía</p>
          <p><strong>Guion Técnico:</strong><br/>
          El juego usa un sistema UI basado en nodos (Graph). Cada nodo contiene `text`, `choices` (aristas) e `image` o `moral`. 
          La mecánica de "Speed Reading" se implementa renderizando palabras individualmente y controlando su opacidad y highlight mediante un loop temporal (`setInterval` o `timeout`), premiando al jugador con `Gemas` (+5) al completar párrafos sin pulsar "Pause".
          </p>
        </section>

        <section className="bg-[#A29BFE] text-white p-6 rounded-3xl border-4 border-[#2D334A] shadow-[8px_8px_0px_0px_#2D334A]">
          <h3 className="text-2xl font-black uppercase mb-4 text-[#FFD93D]">20 Micro-Finales (Esquema de Árbol)</h3>
          <p className="italic text-sm opacity-90 font-bold">Ejemplos para las distintas tramas posibles generables con este motor:</p>
          <ul className="text-sm grid grid-cols-1 md:grid-cols-2 gap-2 list-disc pl-4 font-bold mt-4">
            <li>El dragón descubre que su aliento cura heridas.</li>
            <li>Encuentra cristales mágicos que potencian sus alas.</li>
            <li>Se hace amigo del trol del puente cantando una canción.</li>
            <li>Conduce a las luciérnagas de vuelta a su hogar subterráneo.</li>
            <li>Rompe la maldición de la tortuga abrazándola.</li>
            <li>Construye una balsa para ayudar al castor perdido.</li>
            <li>Escucha el secreto del bosque que susurraban los árboles.</li>
            <li>Aprende que huir del miedo solo lo hace más grande.</li>
            <li>Dibuja un sol nuevo con el pincel encontrado en la cueva.</li>
            <li>Protege el nido del águila durante la tormenta.</li>
            <li>Encuentra el valor para hablar en público ante el consejo de bestias.</li>
            <li>Resuelve el enigma del Espejo de Agua.</li>
            <li>Entiende que llorar también es de valientes.</li>
            <li>Libera a la estrella fugaz enredada en la montaña.</li>
            <li>Crea una nueva constelación usando burbujas brillantes.</li>
            <li>Acepta que no puede controlar el clima, pero sí cómo abrigarse.</li>
            <li>Se disculpa con el duende por pisar su jardín por accidente.</li>
            <li>Plantó una semilla de roble que creció en una noche.</li>
            <li>Le dio su única manta al oso invernal.</li>
            <li>Despierta entendiendo que el cuento es solo el inicio del viaje.</li>
          </ul>
        </section>

        <section className="bg-[#FFEAA7] p-6 rounded-3xl border-4 border-[#2D334A] shadow-[8px_8px_0px_0px_#2D334A]">
          <h3 className="text-2xl font-black uppercase text-[#2D334A] mb-4 flex items-center gap-2">
             <Sparkles className="text-[#FF7675]" /> ¿Qué más se necesita?
          </h3>
          <p className="mb-4">Para evolucionar esta aplicación de un prototipo interactivo a una app de grado producción EdTech, necesitaría los siguientes detalles/integraciones:</p>
          <ol className="list-decimal pl-6 space-y-4 font-bold text-sm">
            <li><strong>Métricas de Fluidez (Backend Educativo):</strong> ¿Cuál es el WPM (Words Per Minute) base esperado según la edad del niño? Se necesita un servidor para guardar analíticas de qué palabras exactas le cuestan más.</li>
            <li><strong>Reconocimiento de Voz (Web Speech API o externa):</strong> Para gamificar <em>verdaderamente</em> la lectura, el motor no debería avanzar solo por tiempo (como en el prototipo ahora), sino <strong>escuchando</strong> al niño pronunciar correctamente.</li>
            <li><strong>Generación de Contenido por IA (Gemini):</strong> Podríamos conectar <code>@google/genai</code> para generar dinámicamente nuevas ramas de "Elige tu propia aventura" en tiempo real según el nivel de lectura del niño, logrando historias infinitas y personalizadas.</li>
            <li><strong>Sistema de Arte Dinámico (SVG):</strong> Para el módulo "Pincel Mágico", en vez de un <code>canvas</code> libre como el actual, necesitaríamos ilustraciones vectoriales (.svg) con máscaras, donde al tocar (Flood Fill) ciertos sectores se rellenen de color inteligentemente, guardando esos metadatos para las siguientes escenas in-game.</li>
            <li><strong>Audio y SFX:</strong> Necesitaríamos activos de audio (narrador de soporte para ayudar con palabras difíciles, música de fondo adaptable).</li>
          </ol>
          <div className="mt-6 font-black uppercase text-[#2D334A]">
             Soluciones Tecnológicas Sugeridas:
             <ul className="font-bold text-sm mt-2 list-disc pl-6 opacity-80">
               <li>Motor Frontend: React (Vite) + Tailwind CSS + Framer Motion.</li>
               <li>Motor Juego/Texto: Sistema Node/Graph JSON.</li>
               <li>Generación Dinámica: Google Gemini API.</li>
               <li>Reconocimiento Lector: OpenAI Whisper o Cloud Speech API.</li>
             </ul>
          </div>
        </section>

      </div>
    </motion.div>
  );
}


