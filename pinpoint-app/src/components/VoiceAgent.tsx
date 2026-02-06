import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, X, Volume2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useVoiceDraftStore, type VoiceConversationEntry, type VoiceDraft } from '../stores/voiceDraftStore';
import { useCustomerStore } from '../stores/customerStore';
import { useBusinessConfigStore } from '../stores/businessConfigStore';

export interface VoiceEstimateData {
  draft: VoiceDraft;
  rawTranscript: string;
}

interface VoiceAgentProps {
  isOpen: boolean;
  onClose: () => void;
  onEstimateReady: (data: VoiceEstimateData) => void;
  agentId: string;
  draftId?: string;
}

export const VoiceAgent: React.FC<VoiceAgentProps> = ({
  isOpen,
  onClose,
  onEstimateReady,
  agentId,
  draftId,
}) => {
  const [transcript, setTranscript] = useState<VoiceConversationEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const hasExtractedRef = useRef(false);
  const transcriptRef = useRef<VoiceConversationEntry[]>([]);
  const currentDraftIdRef = useRef<string | null>(null);

  const store = useVoiceDraftStore();
  const customerStore = useCustomerStore();
  const customerStoreRef = useRef(customerStore);
  customerStoreRef.current = customerStore;
  const storeRef = useRef(store);
  storeRef.current = store;
  const bizConfig = useBusinessConfigStore();
  const bizConfigRef = useRef(bizConfig);
  bizConfigRef.current = bizConfig;

  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  // Client tool: lookup customer by name and auto-fill draft fields
  const lookupCustomer = useCallback(async (params: { name?: string }) => {
    const searchName = params?.name || '';
    if (!searchName) return JSON.stringify({ found: false, message: 'No name provided' });

    const cs = customerStoreRef.current;
    const results = cs.searchCustomers({ search: searchName });

    if (results.length === 0) {
      return JSON.stringify({ found: false, message: `No customer found matching "${searchName}". Ask for their details.` });
    }

    const customer = results[0];
    const fullName = `${customer.firstName} ${customer.lastName}`;
    const fullAddress = [customer.address, customer.city, customer.state, customer.zipCode].filter(Boolean).join(', ');

    // Auto-fill the draft with customer info
    const draftId = currentDraftIdRef.current;
    if (draftId) {
      storeRef.current.updateDraftFields(draftId, {
        customerName: fullName,
        propertyAddress: fullAddress,
        customerPhone: customer.phone,
        customerEmail: customer.email || '',
      });
    }

    return JSON.stringify({
      found: true,
      name: fullName,
      address: fullAddress,
      phone: customer.phone,
      email: customer.email || '',
      type: customer.type,
      tags: customer.tags,
      estimateCount: customer.estimateCount,
      message: `Found ${fullName} at ${fullAddress}. Phone: ${customer.phone}. Their info has been added to the estimate. ${customer.estimateCount > 0 ? `They have ${customer.estimateCount} previous estimate(s).` : 'This is their first estimate.'} Now ask about the project details.`,
    });
  }, []);

  // Load previous conversation when resuming
  useEffect(() => {
    if (isOpen && draftId) {
      const draft = store.getDraftById(draftId);
      if (draft && draft.conversationHistory.length > 0) {
        setTranscript(draft.conversationHistory);
      }
      currentDraftIdRef.current = draftId;
      store.setActiveDraft(draftId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, draftId]);

  // Extract structured data from conversation text — handles natural speech
  const extractFields = useCallback((dId: string, entries: VoiceConversationEntry[]) => {
    // Process user messages and agent messages separately for context
    const userText = entries.filter(e => e.role === 'user').map(e => e.message).join(' ');
    // Agent text available for future context matching
    // const agentText = entries.filter(e => e.role === 'agent').map(e => e.message).join(' ');
    const allText = entries.map(t => t.message).join(' ');
    const allLower = allText.toLowerCase();
    const userLower = userText.toLowerCase();
    const updates: Partial<VoiceDraft> = {};

    // === Customer name ===
    // Flexible: "John Smith", "for John", "it's for the Johnsons", "customer is Mike Davis"
    // Also catch agent confirming: "Got it, John Smith"
    const namePatterns = [
      /(?:for|customer(?:\s+is)?|name(?:\s+is)?|this is for|estimate for|it'?s for)\s+(?:the\s+)?([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){0,2})/,
      /(?:got it|okay|perfect),?\s+([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){0,2})/,
      /^([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){1,2})$/m, // standalone name on its own line
    ];
    for (const pat of namePatterns) {
      const m = allText.match(pat);
      if (m) {
        const name = m[1].trim();
        // Filter out false positives (common non-name words)
        const skip = ['Interior', 'Exterior', 'Duration', 'SuperPaint', 'Emerald', 'Sherwin', 'Williams', 'Pinpoint', 'Hey', 'Sure', 'Okay', 'Perfect'];
        if (!skip.includes(name.split(' ')[0])) {
          updates.customerName = name;
          break;
        }
      }
    }

    // === Address ===
    // Flexible: "123 Main Street", "the address is 456 Oak Ave Apt 2", spoken numbers
    const addrPatterns = [
      /(\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Drive|Dr|Road|Rd|Lane|Ln|Boulevard|Blvd|Court|Ct|Way|Place|Pl|Circle|Cir|Terrace|Ter|Trail|Trl|Pike|Highway|Hwy|Parkway|Pkwy)[\w\s,#.]*)/i,
      /address\s+(?:is\s+)?(\d+[\w\s,#.]+)/i,
      /(?:at|on|lives?\s+(?:at|on))\s+(\d+[\w\s,#.]+(?:Street|St|Avenue|Ave|Drive|Dr|Road|Rd|Lane|Ln|Blvd|Court|Ct|Way|Place|Pl)[\w\s,#.]*)/i,
    ];
    for (const pat of addrPatterns) {
      const m = allText.match(pat);
      if (m) {
        updates.propertyAddress = m[1].trim().replace(/\s+/g, ' ');
        break;
      }
    }

    // === Project type ===
    // Check user text first to avoid agent questions being matched
    const typeText = userLower || allLower;
    if (typeText.includes('interior') && typeText.includes('exterior')) updates.projectType = 'both';
    else if (/\b(?:outside|exterior)\b/.test(typeText)) updates.projectType = 'exterior';
    else if (/\b(?:inside|interior)\b/.test(typeText)) updates.projectType = 'interior';

    // === Areas/rooms ===
    const roomNames = [
      'living room', 'kitchen', 'hallway', 'hall', 'master bedroom', 'master bath',
      'bedroom', 'bathroom', 'bath', 'dining room', 'family room', 'great room',
      'basement', 'garage', 'foyer', 'entryway', 'entry', 'laundry', 'laundry room',
      'office', 'den', 'bonus room', 'sunroom', 'sun room', 'porch', 'deck',
      'exterior body', 'exterior', 'trim', 'front door', 'back door', 'doors',
      'shutters', 'siding', 'fascia', 'soffit', 'eaves',
      'ceiling', 'ceilings', 'accent wall', 'stairway', 'stairwell', 'closet',
      'nursery', 'playroom', 'mudroom', 'mud room', 'pantry',
      'whole house', 'entire house', 'all rooms', 'throughout',
    ];
    const areas: string[] = [];
    for (const room of roomNames) {
      if (allLower.includes(room) && !areas.includes(room)) areas.push(room);
    }
    if (areas.length > 0) updates.areas = areas;

    // Room count: "5 rooms", "three bedrooms"
    const wordNums: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
    const roomCountMatch = allLower.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:rooms?|bedrooms?|areas?|bathrooms?)/);
    if (roomCountMatch && areas.length === 0) {
      const n = wordNums[roomCountMatch[1]] || parseInt(roomCountMatch[1], 10);
      if (n) updates.areas = [`${n} rooms`];
    }

    // === Painters ===
    // "2 guys", "three painters", "me and one other guy", "just me", "a crew of 4"
    const painterPatterns = [
      /(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:guys?|painters?|men|people|workers?|crew\s*(?:members?)?)/i,
      /crew\s*(?:of|size)?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i,
      /(?:just me|myself|solo|alone|one man)/i,
      /(?:me and|myself and)\s*(\d+|one|two|three|four)/i,
    ];
    for (const pat of painterPatterns) {
      const m = allLower.match(pat);
      if (m) {
        if (/just me|myself|solo|alone|one man/.test(m[0])) {
          updates.numberOfPainters = 1;
        } else if (/me and|myself and/.test(m[0])) {
          const extra = wordNums[m[1]] || parseInt(m[1], 10);
          updates.numberOfPainters = 1 + (extra || 1);
        } else {
          updates.numberOfPainters = wordNums[m[1]] || parseInt(m[1], 10);
        }
        break;
      }
    }

    // === Days ===
    // "3 days", "about a week", "two and a half days", "a day and a half"
    const dayPatterns = [
      /(\d+(?:\.\d+)?)\s*days?/i,
      /(one|two|three|four|five|six|seven|eight|nine|ten)\s*days?/i,
      /(?:a|one)\s*(?:day\s*and\s*a\s*half|and\s*a\s*half\s*days?)/i,
      /(?:about\s*)?(?:a|one)\s*week/i,
      /half\s*(?:a\s*)?day/i,
    ];
    for (const pat of dayPatterns) {
      const m = allLower.match(pat);
      if (m) {
        if (/day and a half|half days/.test(m[0])) {
          updates.estimatedDays = 1.5;
        } else if (/week/.test(m[0])) {
          updates.estimatedDays = 5;
        } else if (/half a day|half day/.test(m[0])) {
          updates.estimatedDays = 0.5;
        } else {
          updates.estimatedDays = wordNums[m[1]] || parseFloat(m[1]);
        }
        break;
      }
    }

    // === Hours per day ===
    const hrsMatch = allLower.match(/(\d+)\s*hours?\s*(?:per|a|each)\s*day/);
    if (hrsMatch) updates.hoursPerDay = parseInt(hrsMatch[1], 10);

    // === Rate ===
    // "$65 an hour", "65 per hour", "hourly rate is 70", "charging 55 an hour"
    const ratePatterns = [
      /\$?\s*(\d+)\s*(?:an?\s*hour|per\s*hour|\/\s*h(?:ou)?r|hourly|\/\s*hour)/i,
      /(?:hourly\s*)?rate\s*(?:is|of|at)?\s*\$?\s*(\d+)/i,
      /(?:charg(?:e|ing))\s*\$?\s*(\d+)\s*(?:an?\s*hour|per\s*hour|hourly)?/i,
    ];
    for (const pat of ratePatterns) {
      const m = allLower.match(pat);
      if (m) {
        const rate = parseInt(m[1], 10);
        if (rate >= 20 && rate <= 200) { // sanity check
          updates.hourlyRate = rate;
          break;
        }
      }
    }

    // === Square footage ===
    const sqftMatch = allLower.match(/(\d[\d,]*)\s*(?:square\s*(?:feet|foot|ft)|sq\.?\s*(?:ft|feet)|sqft)/);
    if (sqftMatch) {
      const sqft = parseInt(sqftMatch[1].replace(/,/g, ''), 10);
      if (!updates.areas) updates.areas = [];
      const sqftNote = `~${sqft.toLocaleString()} sq ft`;
      if (!updates.areas.includes(sqftNote)) updates.areas.push(sqftNote);
    }

    // === Paint products & gallons ===
    const productPrices: Record<string, number> = {
      'duration': 75, 'duration home': 65, 'superpaint': 55, 'super paint': 55,
      'emerald': 85, 'proclassic': 70, 'pro classic': 70, 'problock': 45,
      'primer': 45, 'pro block': 45,
    };
    
    // More flexible: "10 gallons of Duration", "Duration 10 gallons", "we need 5 gallons"
    const gallonPatterns = [
      /(\d+)\s*gallons?\s*(?:of\s+)?(?:(?:the\s+)?(?:sherwin[- ]?williams\s+)?)?(duration home|duration|superpaint|super paint|emerald|proclassic|pro classic|problock|pro block|primer|paint)?(?:\s+(?:for|on|in)\s+(?:the\s+)?([\w\s]+?))?(?:[.,]|$)/gi,
      /(duration home|duration|superpaint|super paint|emerald|proclassic|pro classic|problock|pro block|primer)\s+(\d+)\s*gallons?/gi,
    ];
    
    const paintItems = [...(store.getDraftById(dId)?.paintItems || [])];
    
    for (const pat of gallonPatterns) {
      pat.lastIndex = 0;
      let m;
      while ((m = pat.exec(allLower)) !== null) {
        let gallons: number, product: string, area: string;
        if (/^\d/.test(m[1])) {
          gallons = parseInt(m[1], 10);
          product = (m[2] || 'paint').trim();
          area = (m[3] || 'general').trim();
        } else {
          product = m[1].trim();
          gallons = parseInt(m[2], 10);
          area = 'general';
        }
        if (gallons > 0 && gallons <= 100) {
          const exists = paintItems.some(p => p.gallons === gallons && p.product === product && p.area === area);
          if (!exists) {
            paintItems.push({
              area, product, gallons,
              finish: product.includes('classic') ? 'semi-gloss' : 'flat',
              color: '', coats: 2,
              pricePerGallon: productPrices[product] || 55,
            });
          }
        }
      }
    }
    if (paintItems.length > 0) updates.paintItems = paintItems;

    // === Colors ===
    // Expanded popular SW colors
    const swColors: Record<string, string> = {
      'naval': 'SW 6244', 'alabaster': 'SW 7008', 'sea salt': 'SW 6204',
      'agreeable gray': 'SW 7029', 'repose gray': 'SW 7015', 'pure white': 'SW 7005',
      'extra white': 'SW 7006', 'iron ore': 'SW 7069', 'tricorn black': 'SW 6258',
      'city loft': 'SW 7631', 'dover white': 'SW 6385', 'snowbound': 'SW 7004',
      'mindful gray': 'SW 7016', 'passive': 'SW 7064', 'accessible beige': 'SW 7036',
      'colonnade gray': 'SW 7641', 'worldly gray': 'SW 7043',
      'urbane bronze': 'SW 7048', 'evergreen fog': 'SW 9130', 'redend point': 'SW 9081',
      'greek villa': 'SW 7551', 'natural tan': 'SW 7567', 'incredible white': 'SW 7028',
      'eider white': 'SW 7014', 'modern gray': 'SW 7632', 'balanced beige': 'SW 7037',
      'pewter tankard': 'SW 0023', 'gauntlet gray': 'SW 7019', 'dorian gray': 'SW 7017',
      'black magic': 'SW 6991', 'caviar': 'SW 6990', 'oyster white': 'SW 7637',
      'mega greige': 'SW 7031', 'intellectual gray': 'SW 7045', 'anew gray': 'SW 7030',
      'shoji white': 'SW 7042', 'origami white': 'SW 7636', 'swiss coffee': 'SW 9502',
      'white dove': 'SW 7006', 'evening shadow': 'SW 7662',
    };
    
    const colorAssignments = [...(store.getDraftById(dId)?.colorAssignments || [])];
    for (const [name, code] of Object.entries(swColors)) {
      if (allLower.includes(name)) {
        const exists = colorAssignments.some(c => c.color.toLowerCase() === name);
        if (!exists) {
          // Try to find the area context near this color mention
          let area = 'general';
          const areaContext = allLower.match(new RegExp(`(body|trim|door|exterior|interior|walls?|ceiling|accent|siding|shutters?)\\s+(?:in\\s+|is\\s+|with\\s+)?${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(?:for\\s+|on\\s+)?(?:the\\s+)?(body|trim|door|exterior|interior|walls?|ceiling|accent|siding|shutters?)`));
          if (areaContext) area = (areaContext[1] || areaContext[2]).trim();
          colorAssignments.push({ area, color: name, swCode: code });
        }
      }
    }
    // SW codes like "SW 6244", "62 44", "sixty-two forty-four"
    const swCodeMatches = allText.matchAll(/SW\s*[-#]?\s*(\d{4})/gi);
    for (const m of swCodeMatches) {
      const code = `SW ${m[1]}`;
      const exists = colorAssignments.some(c => c.swCode === code);
      if (!exists) {
        colorAssignments.push({ area: 'general', color: code, swCode: code });
      }
    }
    if (colorAssignments.length > 0) updates.colorAssignments = colorAssignments;

    // === Scope of work ===
    const prepItems = [
      'patch', 'patching', 'sand', 'sanding', 'caulk', 'caulking',
      'prime', 'priming', 'primer', 'pressure wash', 'power wash',
      'scrape', 'scraping', 'protect flooring', 'protect furniture',
      'drop cloth', 'tape off', 'taping', 'mask', 'masking',
      'wallpaper removal', 'remove wallpaper', 'strip wallpaper',
      'drywall repair', 'drywall patch', 'skim coat',
      'fill holes', 'nail holes', 'fill cracks', 'wood rot',
      'wood repair', 'carpentry', 'replace trim', 'replace boards',
      'clean', 'cleaning', 'prep', 'preparation',
    ];
    const scope: string[] = [];
    for (const item of prepItems) {
      if (allLower.includes(item) && !scope.includes(item)) scope.push(item);
    }
    // Deduplicate related items
    const dedupedScope = scope.filter((item, _i, arr) => {
      if (item === 'sand' && arr.includes('sanding')) return false;
      if (item === 'patch' && arr.includes('patching')) return false;
      if (item === 'caulk' && arr.includes('caulking')) return false;
      if (item === 'prime' && arr.includes('priming')) return false;
      if (item === 'scrape' && arr.includes('scraping')) return false;
      if (item === 'mask' && arr.includes('masking')) return false;
      if (item === 'tape off' && arr.includes('taping')) return false;
      if (item === 'clean' && arr.includes('cleaning')) return false;
      if (item === 'prep' && arr.includes('preparation')) return false;
      return true;
    });
    if (dedupedScope.length > 0) updates.scopeOfWork = dedupedScope;

    // === Add-ons ===
    // Look for hourly add-on work
    const addOns: { description: string; hours: number; rate: number }[] = [];
    const addOnPatterns = [
      /(?:pressure|power)\s*wash(?:ing)?\s*(?:(\d+)\s*hours?)?/i,
      /carpentry\s*(?:(\d+)\s*hours?)?/i,
      /wallpaper\s*removal\s*(?:(\d+)\s*hours?)?/i,
    ];
    for (const pat of addOnPatterns) {
      const m = allLower.match(pat);
      if (m) {
        const desc = m[0].replace(/\d+\s*hours?/, '').trim();
        const hours = m[1] ? parseInt(m[1], 10) : 0;
        if (!addOns.some(a => a.description === desc)) {
          addOns.push({ description: desc, hours, rate: updates.hourlyRate || 65 });
        }
      }
    }
    if (addOns.length > 0) updates.addOns = addOns;

    if (Object.keys(updates).length > 0) {
      store.updateDraftFields(dId, updates);
    }
  }, [store]);

  // Get business config for the agent
  const getBusinessConfig = useCallback(async () => {
    const cfg = bizConfigRef.current;
    const defaultRate = cfg.getDefaultRate();
    const draftId = currentDraftIdRef.current;

    // Auto-fill defaults into draft
    if (draftId && defaultRate) {
      storeRef.current.updateDraftFields(draftId, {
        hourlyRate: defaultRate.rate,
        hoursPerDay: cfg.defaultHoursPerDay,
        materialMarkupPercent: cfg.defaultMarkupPercent,
        taxRate: cfg.defaultTaxRate,
      });
    }

    return JSON.stringify({
      defaultRate: defaultRate ? { label: defaultRate.label, rate: defaultRate.rate } : null,
      allRates: cfg.hourlyRates.map(r => ({ label: r.label, rate: r.rate, isDefault: r.isDefault })),
      oneOffCosts: cfg.oneOffCosts.map(c => ({ label: c.label, cost: c.cost })),
      markupPercent: cfg.defaultMarkupPercent,
      taxRate: cfg.defaultTaxRate,
      hoursPerDay: cfg.defaultHoursPerDay,
      message: defaultRate
        ? `Default rate is $${defaultRate.rate}/hr (${defaultRate.label}). ${cfg.hourlyRates.length > 1 ? `Other rates: ${cfg.hourlyRates.filter(r => !r.isDefault).map(r => `${r.label} $${r.rate}/hr`).join(', ')}.` : ''} Do NOT ask about the hourly rate — it's already set. Move on to the next question.`
        : 'No rates configured. Ask the user for their hourly rate.',
    });
  }, []);

  // Stable refs for tools
  const lookupCustomerRef = useRef(lookupCustomer);
  lookupCustomerRef.current = lookupCustomer;
  const getBusinessConfigRef = useRef(getBusinessConfig);
  getBusinessConfigRef.current = getBusinessConfig;

  const clientTools = useRef({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lookup_customer: async (params: any) => {
      return lookupCustomerRef.current(params);
    },
    get_business_config: async () => {
      return getBusinessConfigRef.current();
    },
  }).current;

  const conversation = useConversation({
    clientTools,
    onConnect: () => {
      console.log('[Voice] Connected');
      setErrorMsg(null);
    },
    onDisconnect: () => {
      console.log('[Voice] Disconnected');
      const id = currentDraftIdRef.current;
      if (id) {
        extractFields(id, transcriptRef.current);
        // Auto-trigger finish if we have enough data
        const pct = storeRef.current.getCompletionPercent(id);
        if (pct >= 80 && !hasExtractedRef.current) {
          hasExtractedRef.current = true;
          const draft = storeRef.current.getDraftById(id);
          if (draft) {
            const fullTranscript = transcriptRef.current
              .map(t => `${t.role === 'user' ? 'You' : 'Agent'}: ${t.message}`)
              .join('\n');
            onEstimateReady({ draft, rawTranscript: fullTranscript });
          }
        }
      }
    },
    onMessage: (props: { message: string; source: string }) => {
      const role = props.source === 'user' ? 'user' as const : 'agent' as const;
      const entry: VoiceConversationEntry = { role, message: props.message, timestamp: Date.now() };
      setTranscript(prev => [...prev, entry]);
      const id = currentDraftIdRef.current;
      if (id) {
        storeRef.current.addConversationEntry(id, entry);
        // Extract after each message for live updates
        extractFields(id, [...transcriptRef.current, entry]);
      }

      // Detect when the agent signals the estimate is complete
      if (role === 'agent') {
        const lower = props.message.toLowerCase();
        const doneSignals = ['that covers everything', 'estimate is complete', 'all set', 'we have everything', 'that wraps it up', 'thats everything'];
        if (doneSignals.some(s => lower.includes(s))) {
          // Auto-end the call after a brief delay to let the agent finish speaking
          setTimeout(async () => {
            try { await conversation.endSession(); } catch {}
          }, 3000);
        }
      }
    },
    onError: (message: string) => {
      console.error('[Voice] Error:', message);
      setErrorMsg(String(message));
    },
  });

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setErrorMsg('Microphone access denied. Please allow microphone in your browser settings.');
      return;
    }

    hasExtractedRef.current = false;
    setErrorMsg(null);

    let activeId = currentDraftIdRef.current;
    if (!activeId) {
      const activeDraft = store.getActiveDraft();
      if (activeDraft && !activeDraft.isComplete) {
        activeId = activeDraft.id;
      } else {
        activeId = store.createDraft().id;
      }
      currentDraftIdRef.current = activeId;
    }

    const context = store.buildAgentContext(activeId);
    const isResume = (store.getDraftById(activeId)?.conversationHistory.length || 0) > 0;

    try {
      const sessionConfig: Record<string, unknown> = {
        agentId,
        connectionType: 'websocket',
      };

      if (isResume && context) {
        sessionConfig.overrides = {
          agent: {
            prompt: {
              prompt: `You are resuming an estimate conversation. Here is the current state:\n\n${context}`,
            },
            first_message: `Welcome back! Let me check where we left off on this estimate...`,
          },
        };
      }

      await conversation.startSession(sessionConfig as Parameters<typeof conversation.startSession>[0]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setErrorMsg(`Failed to connect: ${msg}`);
    }
  }, [agentId, conversation, store]);

  const stopConversation = useCallback(async () => {
    try { await conversation.endSession(); } catch (e) { console.error('[Voice] End error:', e); }
  }, [conversation]);

  const handleClose = useCallback(async () => {
    if (conversation.status === 'connected') await stopConversation();
    onClose();
  }, [conversation.status, stopConversation, onClose]);

  const handleFinish = useCallback(async () => {
    if (conversation.status === 'connected') await stopConversation();
    if (!hasExtractedRef.current) {
      hasExtractedRef.current = true;
      const id = currentDraftIdRef.current;
      if (id) {
        extractFields(id, transcriptRef.current);
        const draft = store.getDraftById(id);
        if (draft) {
          const fullTranscript = transcriptRef.current
            .map(t => `${t.role === 'user' ? 'You' : 'Agent'}: ${t.message}`)
            .join('\n');
          onEstimateReady({ draft, rawTranscript: fullTranscript });
        }
      }
    }
  }, [conversation.status, stopConversation, extractFields, store, onEstimateReady]);

  if (!isOpen) return null;

  const isConnected = conversation.status === 'connected';
  const isConnecting = conversation.status === 'connecting';
  const isSpeaking = conversation.isSpeaking;
  const currentDraft = currentDraftIdRef.current ? store.getDraftById(currentDraftIdRef.current) : null;
  const completionPct = currentDraftIdRef.current ? store.getCompletionPercent(currentDraftIdRef.current) : 0;
  const missingFields = currentDraftIdRef.current ? store.getMissingFields(currentDraftIdRef.current) : [];

  return (
    <div className="fixed inset-0 z-[200] flex flex-col">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" onClick={handleClose} />
      <div className="relative z-10 flex flex-col h-full animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 safe-top">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Volume2 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pinpoint Estimator</h2>
              <p className="text-xs text-slate-400">
                {isConnected
                  ? isSpeaking ? 'Speaking...' : 'Listening...'
                  : isConnecting ? 'Connecting...' : 'Ready'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="w-10 h-10 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex items-center justify-center">
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-5 mb-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{errorMsg}</p>
          </div>
        )}

        {/* Progress Bar */}
        {currentDraft && transcript.length > 0 && (
          <div className="mx-5 mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-500 font-medium">Estimate completion</span>
              <span className="text-[10px] text-slate-400 font-semibold">{completionPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            {missingFields.length > 0 && missingFields.length <= 3 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <AlertCircle size={10} className="text-amber-400 flex-shrink-0" />
                <span className="text-[10px] text-amber-400/80 truncate">
                  Still need: {missingFields.slice(0, 3).join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {transcript.length === 0 && !isConnected && !isConnecting ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-6 border border-blue-500/20">
                <Mic size={36} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {currentDraft?.conversationHistory.length ? 'Continue Estimate' : 'Voice Estimate'}
              </h3>
              <p className="text-slate-400 text-sm max-w-[280px] leading-relaxed">
                Tap the microphone to start. The assistant will walk you through every field needed for a complete estimate.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transcript.map((entry, i) => (
                <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                    entry.role === 'user'
                      ? 'bg-blue-500/20 border border-blue-500/30 text-blue-50'
                      : 'bg-slate-800/80 border border-slate-700/50 text-slate-200'
                  }`}>
                    <p className="text-xs font-semibold mb-1 opacity-60">{entry.role === 'user' ? 'You' : 'Estimator'}</p>
                    <p className="text-sm leading-relaxed">{entry.message}</p>
                  </div>
                </div>
              ))}
              {isConnected && isSpeaking && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/50">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-5 py-6 safe-bottom">
          <div className="flex flex-col items-center gap-4">
            {/* Collected data summary chips */}
            {currentDraft && (
              <div className="flex flex-wrap justify-center gap-1.5 max-w-full">
                {currentDraft.customerName && (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 size={8} /> {currentDraft.customerName}
                  </span>
                )}
                {currentDraft.projectType && (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                    <CheckCircle2 size={8} /> {currentDraft.projectType}
                  </span>
                )}
                {currentDraft.laborCost != null && (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                    <CheckCircle2 size={8} /> ${currentDraft.laborCost.toLocaleString()} labor
                  </span>
                )}
                {currentDraft.paintItems.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                    <CheckCircle2 size={8} /> {currentDraft.paintItems.reduce((s, p) => s + p.gallons, 0)} gal paint
                  </span>
                )}
                {currentDraft.colorAssignments.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <CheckCircle2 size={8} /> {currentDraft.colorAssignments.length} colors
                  </span>
                )}
              </div>
            )}

            <div className="relative">
              {isConnected && !isSpeaking && (
                <>
                  <div className="absolute inset-0 -m-4 rounded-full bg-blue-500/10 animate-ping" />
                  <div className="absolute inset-0 -m-8 rounded-full bg-blue-500/5 animate-ping" style={{ animationDelay: '300ms' }} />
                </>
              )}
              <button
                onClick={isConnected ? stopConversation : startConversation}
                disabled={isConnecting}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${
                  isConnected
                    ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-[0_8px_32px_rgba(239,68,68,0.4)]'
                    : isConnecting
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 cursor-wait'
                      : 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_8px_32px_rgba(59,130,246,0.4)] hover:scale-105'
                }`}
              >
                {isConnected ? <MicOff size={32} className="text-white" />
                  : isConnecting ? <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Mic size={32} className="text-white" />}
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {isConnected ? 'Tap to end conversation' : isConnecting ? 'Connecting...' : 'Tap to start'}
            </p>

            {transcript.length > 0 && !isConnected && !isConnecting && (
              <button onClick={handleFinish} className="mt-2 px-8 py-3 bg-white text-slate-950 font-semibold rounded-xl shadow-lg shadow-white/10 transition-all hover:bg-slate-100 active:scale-[0.96]">
                {completionPct >= 80 ? 'Finalize Estimate' : 'Review What We Have'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
