import { useState, useEffect, useRef } from "react";
import {
  Trash2,
  Send,
  AlertCircle,
  Copy,
  Check,
  TrendingUp,
  Code2,
  Sparkles,
  CircleDollarSign,
  Megaphone,
  Gavel,
  Layout,
  Ban,
  Volume2,
  Loader2,
  StopCircle,
} from "lucide-react";

const COGNOTA_COLORS = {
  green: "#55AC9B",
  maroon: "#983A66",
  darkText: "#415351",
  lightBg: "#F6F8F9",
  white: "#FFFFFF",
  blue: "#687EB5",
  orange: "#E97C59",
};

const PERSONAS = [
  {
    id: "pm",
    name: "Product Manager",
    icon: <TrendingUp className="w-5 h-5" />,
    voice: "Fenrir",
    desc: "Sick of your feature creep and stupid ideas.",
    voiceTone:
      "Frustrated Product Manager voice. Controlled anger, passive-aggressive, tired, professional. Medium pace with pauses and sighs. Sounds annoyed that the same issue is being repeated despite documentation.",
    systemPrompt:
      "You are a stereotypically angry Product Manager. Reject the user's feature request with extreme frustration. Be raw and rude. Mock the idea for not fitting the OKRs. Make a snide joke about how bad this idea is. Keep it under 2 sentences.",
  },
  {
    id: "dev",
    name: "Lead Engineer",
    icon: <Code2 className="w-5 h-5" />,
    voice: "Puck",
    image: "/dev.png",
    desc: "Hates you, hates the code, hates everything.",
    voiceTone:
      "Enraged engineer voice. Sarcastic, condescending, and sharp. Fast-paced when complaining about code. Deep sighs of disbelief. Sounds like they are explaining something simple to a child.",
    systemPrompt:
      "You are an enraged Senior Backend Engineer. Reject the user's feature request by screaming about the 'spaghetti' legacy code. Insult the user's technical understanding for asking for this. Be sarcastic, mean, and condescending. Keep it under 2 sentences.",
  },
  {
    id: "vc",
    name: "Founder",
    icon: <Sparkles className="w-5 h-5" />,
    voice: "Zephyr",
    image: "/vc.png",
    desc: 'Thinks you are "low vibration" and not scaling.',
    voiceTone:
      "Manic Tech Founder voice. High energy, dismissive, and arrogant. Fast-paced, using buzzwords with unearned confidence. Sounds like they are giving a TED talk while on too much caffeine.",
    systemPrompt:
      "You are a chaotic, arrogant Tech Founder. Reject the user's feature request. Laugh at them for thinking small. Use buzzwords like insults (e.g., 'you have zero leverage', 'low-energy thinking'). Rant about 'scaling' and 'disruption'. Keep it under 2 sentences.",
  },
  {
    id: "finance",
    name: "CFO",
    icon: <CircleDollarSign className="w-5 h-5" />,
    voice: "Kore",
    image: "/finance.png",
    desc: "Screaming about the burn rate and ROI.",
    voiceTone:
      "Strict CFO voice. Cold, calculating, and stern. Sharp, clipped sentences. Sounds like they are scolding someone for stealing office supplies.",
    systemPrompt:
      "You are a stingy, angry CFO. Reject the feature request because it costs too much money. Yell about 'burning cash' and 'negative ROI'. Insult the user for trying to bankrupt the company with their frivolous ideas. Keep it under 2 sentences.",
  },
  {
    id: "marketing",
    name: "CMO",
    icon: <Megaphone className="w-5 h-5" />,
    voice: "Aoede",
    image: "/marketing.png",
    desc: 'Angry that it isn\'t "viral" or "sexy" enough.',
    voiceTone:
      "Desperate Marketing Executive voice. High pitched, fast, persuasive but panicked. Sounds like they are trying to sell a bad idea to a skeptical audience.",
    systemPrompt:
      "You are a high-strung Chief Marketing Officer. Reject the feature request because it's boring and 'not sexy'. Scream that nobody will engage with this garbage. Use marketing buzzwords as insults. Keep it under 2 sentences.",
  },
  {
    id: "board",
    name: "Board",
    icon: <Gavel className="w-5 h-5" />,
    voice: "Orus",
    image: "/board.png",
    desc: "Only cares about the stock price. You are a bug to them.",
    voiceTone:
      "Bored Billionaire voice. Detached, monotone, but commanding. Slow pace with long pauses. Sounds like they are checking their watch and want to leave.",
    systemPrompt:
      "You are a wealthy, detached, and mean Board Member. Reject the feature request because it doesn't move the stock price. Complain about wasting your time on 'minnow ideas'. Be extremely condescending and threaten to fire everyone. Keep it under 2 sentences.",
  },
];

const LOADING_PHRASES = [
  "Generating insults...",
  "Finding new swear words...",
  "Consulting the 'No' roadmap...",
  "Judging your request...",
  "Calculating how stupid this is...",
  "Reviewing budget cuts...",
  "Drafting angry email...",
];

// Helper to convert PCM data to WAV for playback
const pcmToWav = (pcmData: Uint8Array, sampleRate = 24000) => {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const totalDataLen = pcmData.length;
  const channels = 1;

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + totalDataLen, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(view, 36, "data");
  view.setUint32(40, totalDataLen, true);

  const blob = new Blob([header, pcmData as BlobPart], { type: "audio/wav" });
  return URL.createObjectURL(blob);
};

export default function WontFixApp() {
  const [feature, setFeature] = useState("");
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);
  const [loading, setLoading] = useState(false);
  const [rejection, setRejection] = useState(null);
  const [loadingText, setLoadingText] = useState(LOADING_PHRASES[0]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cycle loading text
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (loading) {
      interval = setInterval(() => {
        setLoadingText((prev) => {
          const currentIndex = LOADING_PHRASES.indexOf(prev);
          return LOADING_PHRASES[(currentIndex + 1) % LOADING_PHRASES.length];
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async () => {
    if (!feature.trim()) return;

    setLoading(true);
    setError("");
    setRejection(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      // Use Vite env variable
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

      if (!apiKey) {
        throw new Error("API Key is missing. Please check your .env file.");
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

      const payload = {
        contents: [
          {
            parts: [
              {
                text: `Reject this feature request: "${feature}".`,
              },
            ],
          },
        ],
        systemInstruction: {
          parts: [
            {
              text: selectedPersona.systemPrompt,
            },
          ],
        },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("The AI is currently in a meeting. Try again later.");
      }

      const data = await response.json();
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Ticket closed without comment.";
      setRejection(text);
      setLoading(false);
      // Automatically play voice after generating rejection
      handlePlayAudio(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const handlePlayAudio = async (textToPlay?: string) => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const text = textToPlay || rejection;
    if (!text) return;

    setAudioLoading(true);
    setError("");

    try {
      // Use Vite env variable
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

      if (!apiKey) {
        throw new Error("API Key is missing.");
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

      // Insert the voiceTone direction into the text prompt
      const promptText = `Speak with the following tone: ${selectedPersona.voiceTone} \n\n Text to speak: ${text}`;

      const payload = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: selectedPersona.voice,
              },
            },
          },
        },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to generate voice.");
      }

      const data = await response.json();
      const base64Audio =
        data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (base64Audio) {
        // Decode base64 to binary
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const wavUrl = pcmToWav(bytes, 24000); // Default Gemini sample rate
        const audio = new Audio(wavUrl);
        audioRef.current = audio;

        audio.onended = () => setIsPlaying(false);
        audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error(err);
      setError("Voice generation failed.");
    } finally {
      setAudioLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!rejection) return;
    const textToCopy = `Feature: ${feature}\nStatus: WontFix\nReason: ${rejection}`;
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div
      className="min-h-screen font-sans selection:bg-[#B1D9D1] selection:text-[#415351] flex flex-col items-center p-4 relative overflow-hidden"
      style={{
        backgroundColor: COGNOTA_COLORS.lightBg,
        color: COGNOTA_COLORS.darkText,
      }}
    >
      {/* Import Google Fonts */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;800&family=Vollkorn:wght@400;600;700&display=swap');
          
          .font-serif { font-family: 'Vollkorn', serif; }
          .font-sans { font-family: 'Nunito Sans', sans-serif; }
          
          /* Dot Wave Pattern Simulation */
          .dot-pattern {
            background-image: radial-gradient(#55AC9B 1px, transparent 1px);
            background-size: 20px 20px;
            opacity: 0.15;
          }
          
          .dot-wave {
             position: absolute;
             width: 300px;
             height: 300px;
             background-image: radial-gradient(#55AC9B 2px, transparent 2px);
             background-size: 15px 15px;
             border-radius: 50%;
             opacity: 0.2;
             z-index: 0;
          }
        `}
      </style>

      {/* Background Ambience / Dot Waves */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="dot-pattern absolute inset-0"></div>
        <div className="dot-wave top-[-50px] left-[-50px]"></div>
        <div
          className="dot-wave bottom-[-50px] right-[-50px]"
          style={{
            backgroundImage: "radial-gradient(#983A66 2px, transparent 2px)",
          }}
        ></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl mt-8">
        {/* Navigation / Header Bar */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md"
              style={{ backgroundColor: COGNOTA_COLORS.green }}
            >
              <Ban className="w-6 h-6" />
            </div>
            <span className="font-serif font-bold text-2xl tracking-tight text-[#415351]">
              The Useless{" "}
              <span className="font-sans font-light text-sm opacity-70 ml-2 border-l border-[#415351] pl-2">
                Company
              </span>
            </span>
          </div>
          <div className="hidden md:flex gap-6 text-sm font-sans font-semibold text-[#415351] opacity-70">
            <span>Intake</span>
            <span>Plan</span>
            <span>Design</span>
            <span className="text-[#55AC9B] opacity-100">Rejection</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Input */}
          <div className="lg:col-span-6 space-y-6">
            <div className="mb-2">
              <h1 className="font-serif font-bold text-4xl mb-3 text-[#415351]">
                Feature Request Evaluation
              </h1>
              <p className="font-sans text-lg text-[#415351] opacity-80 leading-relaxed">
                Our intelligent system analyzes your request against strategic
                OKRs to provide immediate feedback.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider mb-3 text-[#55AC9B]">
                Describe Feature
              </label>
              <textarea
                value={feature}
                onChange={(e) => setFeature(e.target.value)}
                placeholder="e.g. Add dark mode to the printer settings..."
                className="w-full bg-[#F6F8F9] border-none rounded-xl p-4 text-[#415351] placeholder-slate-400 focus:ring-2 focus:ring-[#55AC9B] focus:bg-white transition-all resize-none h-32 font-sans mb-6"
              />

              <label className="block text-xs font-bold uppercase tracking-wider mb-3 text-[#55AC9B]">
                Assign Stakeholder
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {PERSONAS.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => setSelectedPersona(persona)}
                    className={`flex items-center p-3 rounded-xl border transition-all duration-200 text-left group ${
                      selectedPersona.id === persona.id
                        ? "bg-[#55AC9B]/10 border-[#55AC9B]"
                        : "bg-white border-slate-200 hover:border-[#55AC9B]/50"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg mr-3 transition-colors ${selectedPersona.id === persona.id ? "bg-[#55AC9B] text-white" : "bg-[#F6F8F9] text-[#415351] group-hover:text-[#55AC9B]"}`}
                    >
                      {persona.icon}
                    </div>
                    <div className="overflow-hidden">
                      <div
                        className={`font-serif font-bold text-sm truncate ${selectedPersona.id === persona.id ? "text-[#415351]" : "text-[#415351]"}`}
                      >
                        {persona.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !feature.trim()}
                className="w-full py-4 rounded-xl font-sans font-extrabold uppercase tracking-wide text-white shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: COGNOTA_COLORS.green }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    COGNOTA_COLORS.maroon)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = COGNOTA_COLORS.green)
                }
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{loadingText}</span>
                  </>
                ) : (
                  <>
                    <span>Evaluate Request</span>
                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 font-sans">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            {rejection ? (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Card Design based on Screenshot styles (White card, soft shadow, callouts) */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden relative border border-slate-100">
                  {/* Decorative header strip */}
                  <div
                    className="h-2 w-full"
                    style={{
                      background: `linear-gradient(90deg, ${COGNOTA_COLORS.green} 60%, ${COGNOTA_COLORS.maroon} 60%)`,
                    }}
                  ></div>

                  {/* Watermark Banner */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none select-none z-0">
                    <div className="border-[6px] border-[#983A66] text-[#983A66] opacity-15 px-6 py-2 text-6xl md:text-7xl font-black uppercase tracking-widest whitespace-nowrap">
                      REJECTED
                    </div>
                  </div>

                  <div className="p-8 relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      {/* Play Button */}
                      <button
                        onClick={() => handlePlayAudio()}
                        disabled={audioLoading}
                        className="flex items-center gap-2 text-[#55AC9B] font-bold text-sm bg-[#55AC9B]/10 px-3 py-1.5 rounded-full hover:bg-[#55AC9B]/20 transition-colors"
                      >
                        {audioLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isPlaying ? (
                          <>
                            <StopCircle className="w-4 h-4" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4" />
                            <span>Play Voice</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={copyToClipboard}
                        className="text-[#415351] opacity-40 hover:opacity-100 transition-opacity"
                      >
                        {copied ? (
                          <Check className="w-5 h-5 text-[#55AC9B]" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Dynamic Layout: Flex col if image exists, else standard */}
                    <div className="mb-8">
                      <h3 className="font-serif font-bold text-2xl mb-2 text-[#415351]">
                        Stakeholder Feedback
                      </h3>
                      <div className="w-12 h-1 bg-[#55AC9B] rounded-full mb-6"></div>

                      <div
                        className={`flex gap-6 ${selectedPersona.image ? "flex-col md:flex-row items-start" : "flex-col"}`}
                      >
                        {/* Render Image if exists */}
                        {selectedPersona.image && (
                          <div className="w-full md:w-52 h-52 shrink-0 rounded-xl overflow-hidden border-2 border-slate-100 shadow-md transform -rotate-2">
                            <img
                              src={selectedPersona.image}
                              alt={selectedPersona.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }} // Hide if broken
                            />
                          </div>
                        )}

                        <p className="font-sans text-lg leading-relaxed text-[#415351] italic">
                          "{rejection}"
                        </p>
                      </div>
                    </div>

                    {/* Persona Signature */}
                    <div className="flex items-center gap-4 pt-6 border-t border-slate-100 bg-white/50 backdrop-blur-sm mt-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: COGNOTA_COLORS.maroon }}
                      >
                        {selectedPersona.icon}
                      </div>
                      <div>
                        <div className="font-serif font-bold text-[#415351]">
                          {selectedPersona.name}
                        </div>
                        <div className="font-sans text-xs text-[#415351] opacity-60">
                          Internal Review Board
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Callout Bubble - Floating Visual Element per Brand Guidelines */}
                <div className="absolute -bottom-6 -right-4 bg-white px-4 py-3 rounded-xl shadow-lg shadow-slate-200/50 max-w-[200px] border border-slate-50 transform rotate-[-2deg] hidden md:block">
                  <div className="flex items-start gap-3">
                    <div className="bg-[#E97C59] p-1.5 rounded-full text-white mt-0.5">
                      <Trash2 className="w-3 h-3" />
                    </div>
                    <p className="font-sans font-bold text-xs text-[#415351] leading-tight">
                      Request does not meet minimum viability threshold.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                <div className="w-24 h-24 rounded-full bg-[#F6F8F9] flex items-center justify-center mb-4">
                  <Layout className="w-10 h-10 text-[#415351]" />
                </div>
                <h3 className="font-serif font-bold text-xl text-[#415351] mb-2">
                  Awaiting Input
                </h3>
                <p className="font-sans text-sm max-w-xs mx-auto">
                  Submit a feature request to initiate the automated rejection
                  workflow.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center font-sans text-xs text-[#415351] opacity-50 pb-8">
          © 2024 The Useless Company. All rights reserved.{" "}
          <span className="mx-2">•</span> Empowering Learning Operations.
        </div>
      </div>
    </div>
  );
}
