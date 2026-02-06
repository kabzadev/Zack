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
    const searchName = (params?.name || '').trim();
    if (!searchName) return JSON.stringify({ found: false, message: 'No name provided' });

    const cs = customerStoreRef.current;
    
    // Try full name first
    let results = cs.searchCustomers({ search: searchName });
    
    // If no results, try each word individually (e.g. "Keith" alone should find "Keith Kabza")
    if (results.length === 0) {
      const words = searchName.split(/\s+/).filter(w => w.length > 1);
      for (const word of words) {
        results = cs.searchCustomers({ search: word });
        if (results.length > 0) break;
      }
    }
    
    // If still no results, try fuzzy — check if any customer's first or last name starts with the search
    if (results.length === 0) {
      const allCustomers = cs.searchCustomers({ search: '' });
      const searchLower = searchName.toLowerCase();
      results = allCustomers.filter(c => 
        c.firstName.toLowerCase().startsWith(searchLower) ||
        c.lastName.toLowerCase().startsWith(searchLower) ||
        `${c.firstName} ${c.lastName}`.toLowerCase().startsWith(searchLower)
      );
    }

    if (results.length === 0) {
      return JSON.stringify({ found: false, message: `No customer found matching "${searchName}". Ask for their full name and details to create a new customer.` });
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

    // If multiple matches, list them but use the first
    const otherMatches = results.length > 1 
      ? ` (Also found: ${results.slice(1, 4).map(r => `${r.firstName} ${r.lastName}`).join(', ')})`
      : '';

    return JSON.stringify({
      found: true,
      name: fullName,
      address: fullAddress,
      phone: customer.phone,
      email: customer.email || '',
      type: customer.type,
      tags: customer.tags,
      estimateCount: customer.estimateCount,
      multipleMatches: results.length > 1,
      matchCount: results.length,
      message: `Found ${fullName} at ${fullAddress}. Phone: ${customer.phone}. Their info has been added to the estimate.${otherMatches} Now ask about the project details.`,
    });
  }, []);

  // Load previous conversation when resuming — and auto-start
  useEffect(() => {
    if (!isOpen) return;
    
    if (draftId) {
      const draft = store.getDraftById(draftId);
      if (draft && draft.conversationHistory.length > 0) {
        setTranscript(draft.conversationHistory);
      }
      currentDraftIdRef.current = draftId;
      store.setActiveDraft(draftId);
    }
    
    // Auto-start voice agent when panel opens (new or resume)
    if (conversation.status !== 'connected') {
      const timer = setTimeout(() => {
        startConversation();
      }, 500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, draftId]);

  // Extract structured data from conversation text — handles natural speech
  const extractFields = useCallback(async (dId: string, entries: VoiceConversationEntry[]) => {
    // Process user messages and agent messages separately for context
    const userText = entries.filter(e => e.role === 'user').map(e => e.message).join(' ');
    // Agent text available for future context matching
    // const agentText = entries.filter(e => e.role === 'agent').map(e => e.message).join(' ');
    const allText = entries.map(t => t.message).join(' ');
    const allLower = allText.toLowerCase();
    const userLower = userText.toLowerCase();
    const updates: Partial<VoiceDraft> = {};

    // Get current draft to avoid overwriting fields already set (e.g. by client tools)
    const currentDraftData = storeRef.current.getDraftById(dId);

    // === Customer name ===
    // Only extract if not already set (e.g. by lookup_customer client tool)
    if (!currentDraftData?.customerName) {
      // First: detect "existing customer" / "already in the system" → trigger auto-lookup
      const existingCustomerMatch = allText.match(
        /(?:existing|current|my)\s+customer\s+(?:is\s+)?(?:named?\s+)?([a-z][a-z'-]+(?:\s+[a-z][a-z'-]+){0,2})/i
      ) || allText.match(
        /(?:already\s+(?:in|on)\s+(?:the\s+)?(?:system|database|file|record))\s*[.,]?\s*(?:(?:it'?s|name(?:\s+is)?|they'?re?)\s+)?([a-z][a-z'-]+(?:\s+[a-z][a-z'-]+){0,2})/i
      ) || allText.match(
        /(?:you\s+(?:already\s+)?have|look\s*up|pull\s*up|search\s*for)\s+([a-z][a-z'-]+(?:\s+[a-z][a-z'-]+){0,2})/i
      );

      if (existingCustomerMatch) {
        const lookupName = existingCustomerMatch[1].trim();
        const skipLookup = new Set(['my', 'the', 'a', 'an', 'existing', 'current', 'their', 'customer']);
        if (!skipLookup.has(lookupName.toLowerCase())) {
          // Trigger the lookup_customer tool programmatically
          try {
            await lookupCustomerRef.current({ name: lookupName });
          } catch {
            // If lookup fails, still set the name
            const titleCased = lookupName.replace(/\b[a-z]/g, c => c.toUpperCase());
            updates.customerName = titleCased;
          }
        }
      }

      // Only proceed with regex extraction if lookup didn't set it
      const refreshedDraft = storeRef.current.getDraftById(dId);
      if (!refreshedDraft?.customerName && !updates.customerName) {
        const namePatterns = [
          /(?:for|customer(?:\s+is)?|name(?:\s+is)?|this is for|estimate for|it'?s for)\s+(?:the\s+)?(?:(?:my\s+)?existing\s+customer\s+)?([a-z][a-z'-]+(?:\s+[a-z][a-z'-]+){0,2})/i,
          /(?:got it|okay|perfect),?\s+([a-z][a-z'-]+(?:\s+[a-z][a-z'-]+){0,2})/i,
          /(?:i'?m|my name is|this is|i am)\s+([a-z][a-z'-]+(?:\s+[a-z][a-z'-]+){0,2})/i,
          /(?:call me|they call me)\s+([a-z][a-z'-]+(?:\s+[a-z][a-z'-]+){0,2})/i,
        ];
        const skipNames = new Set([
          'interior', 'exterior', 'duration', 'superpaint', 'super', 'emerald',
          'sherwin', 'williams', 'pinpoint', 'hey', 'sure', 'okay', 'perfect',
          'the', 'a', 'an', 'about', 'around', 'just', 'paint', 'painting',
          'estimate', 'project', 'house', 'home', 'looking', 'going', 'doing',
          'getting', 'ready', 'here', 'there', 'good', 'great', 'fine',
          'my', 'existing', 'current', 'customer', 'already',
        ]);
        for (const pat of namePatterns) {
          const m = allText.match(pat);
          if (m) {
            const rawName = m[1].trim();
            const firstWord = rawName.split(/\s+/)[0].toLowerCase();
            if (!skipNames.has(firstWord)) {
              const titleCased = rawName.replace(/\b[a-z]/g, c => c.toUpperCase());
              updates.customerName = titleCased;
              break;
            }
          }
        }
        // Fallback: look for two consecutive capitalized-ish words in user text
        if (!updates.customerName) {
          const userEntries = entries.filter(e => e.role === 'user').map(e => e.message);
          for (const msg of userEntries) {
            const twoWordMatch = msg.match(/\b([A-Za-z][a-z'-]{1,})\s+([A-Za-z][a-z'-]{1,})\b/);
            if (twoWordMatch) {
              const first = twoWordMatch[1].toLowerCase();
              const second = twoWordMatch[2].toLowerCase();
              if (!skipNames.has(first) && !skipNames.has(second) && first.length >= 2 && second.length >= 2) {
                const wordCount = msg.trim().split(/\s+/).length;
                if (wordCount <= 4) {
                  const titleCased = `${twoWordMatch[1].charAt(0).toUpperCase()}${twoWordMatch[1].slice(1)} ${twoWordMatch[2].charAt(0).toUpperCase()}${twoWordMatch[2].slice(1)}`;
                  updates.customerName = titleCased;
                  break;
                }
              }
            }
          }
        }
      }
    }

    // === Address ===
    // Only extract if not already set
    if (!currentDraftData?.propertyAddress) {
      // Flexible: "123 Main Street", "the address is 456 Oak Ave Apt 2", spoken numbers,
      // and also addresses without standard suffixes like "123 Main"
      const addrPatterns = [
        /(\d+\s+[\w\s]+(?:street|st|avenue|ave|drive|dr|road|rd|lane|ln|boulevard|blvd|court|ct|way|place|pl|circle|cir|terrace|ter|trail|trl|pike|highway|hwy|parkway|pkwy)[\w\s,#.]*)/i,
        /address\s+(?:is\s+)?(\d+[\w\s,#.]+)/i,
        /(?:at|on|lives?\s+(?:at|on))\s+(\d+[\w\s,#.]+)/i,
        /(?:property|house|home|job)\s+(?:is\s+)?(?:at\s+)?(\d+[\w\s,#.]+)/i,
        // Bare address: number followed by at least one word (e.g. "123 maple")
        /\b(\d{1,6}\s+[a-z][\w\s]{2,}?)(?:\.|,|\s*$)/i,
      ];
      for (const pat of addrPatterns) {
        const m = allText.match(pat);
        if (m) {
          const addr = m[1].trim().replace(/\s+/g, ' ');
          // Sanity: must start with a number and have at least one word after
          if (/^\d+\s+\w/.test(addr) && addr.length >= 5) {
            updates.propertyAddress = addr;
            break;
          }
        }
      }
    }

    // === Project type ===
    // Only extract if not already set
    if (!currentDraftData?.projectType) {
      // Check user text first to avoid agent questions being matched
      const typeText = userLower || allLower;
      if (typeText.includes('interior') && typeText.includes('exterior')) updates.projectType = 'both';
      else if (/\b(?:outside|exterior)\b/.test(typeText)) updates.projectType = 'exterior';
      else if (/\b(?:inside|interior)\b/.test(typeText)) updates.projectType = 'interior';
    }

    // === Areas/rooms ===
    // Merge with existing areas rather than overwriting
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
    const existingAreas = currentDraftData?.areas || [];
    const areas: string[] = [...existingAreas];
    for (const room of roomNames) {
      if (allLower.includes(room) && !areas.includes(room)) areas.push(room);
    }
    if (areas.length > existingAreas.length) updates.areas = areas;

    // Room count: "5 rooms", "three bedrooms"
    const wordNums: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
    const roomCountMatch = allLower.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:rooms?|bedrooms?|areas?|bathrooms?)/i);
    if (roomCountMatch && areas.length === 0) {
      const n = wordNums[roomCountMatch[1]] || parseInt(roomCountMatch[1], 10);
      if (n) updates.areas = [`${n} rooms`];
    }

    // === Painters ===
    // Only extract if not already set
    if (!currentDraftData?.numberOfPainters) {
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
    }

    // === Days ===
    // Only extract if not already set
    if (!currentDraftData?.estimatedDays) {
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
    }

    // === Hours per day ===
    if (!currentDraftData?.hoursPerDay) {
      const hrsMatch = allLower.match(/(\d+)\s*hours?\s*(?:per|a|each)\s*day/i);
      if (hrsMatch) updates.hoursPerDay = parseInt(hrsMatch[1], 10);
    }

    // === Rate ===
    // Only extract if not already set
    if (!currentDraftData?.hourlyRate) {
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
      'primer': 45, 'pro block': 45, 'paint': 55,
    };
    // Normalize product name variants to canonical names
    const productAliases: Record<string, string> = {
      'super paint': 'superpaint',
      'pro classic': 'proclassic',
      'pro block': 'problock',
    };
    const productList = 'duration home|duration|superpaint|super paint|emerald|proclassic|pro classic|problock|pro block|primer|paint';
    
    // More flexible: "10 gallons of Duration", "Duration 10 gallons", "we need 5 gallons",
    // "I want 5 gallons of super paint", "emerald for the trim, 3 gallons"
    const gallonPatterns = [
      // "X gallons of [product] [for area]"
      new RegExp(`(\\d+)\\s*gallons?\\s*(?:of\\s+)?(?:(?:the\\s+)?(?:sherwin[- ]?williams\\s+)?)?(${productList})?(?:\\s+(?:for|on|in)\\s+(?:the\\s+)?([\\w\\s]+?))?(?:[.,;]|$)`, 'gi'),
      // "[product] X gallons"
      new RegExp(`(${productList})\\s+(?:for\\s+(?:the\\s+)?([\\w\\s]+?)\\s+)?(\\d+)\\s*gallons?`, 'gi'),
      // "[product] for [area], X gallons"
      new RegExp(`(${productList})\\s+(?:for|on)\\s+(?:the\\s+)?([\\w\\s]+?)\\s*,?\\s*(\\d+)\\s*gallons?`, 'gi'),
      // "I want/need/using X gallons [of product]"
      new RegExp(`(?:i\\s+)?(?:want|need|using|use|got|getting)\\s+(\\d+)\\s*gallons?(?:\\s+(?:of\\s+)?(?:(?:the\\s+)?(?:sherwin[- ]?williams\\s+)?)?(${productList}))?`, 'gi'),
    ];
    
    const paintItems = [...(currentDraftData?.paintItems || [])];
    
    for (const pat of gallonPatterns) {
      pat.lastIndex = 0;
      let m;
      while ((m = pat.exec(allLower)) !== null) {
        let gallons: number, product: string, area: string;
        // Determine which capture groups hold what based on pattern
        if (/^\d/.test(m[1])) {
          gallons = parseInt(m[1], 10);
          product = (m[2] || 'paint').trim();
          area = (m[3] || 'general').trim();
        } else {
          product = m[1].trim();
          area = (m[2] || 'general').trim();
          gallons = parseInt(m[3], 10);
        }
        // Normalize product name
        product = productAliases[product] || product;
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
    if (paintItems.length > (currentDraftData?.paintItems?.length || 0)) updates.paintItems = paintItems;

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
    // Fuzzy aliases for spoken color names (e.g. "naval blue" → "naval", "the navy color" → "naval")
    const colorAliases: Record<string, string> = {
      'naval blue': 'naval', 'navy': 'naval', 'navy blue': 'naval', 'the navy color': 'naval',
      'sea salt green': 'sea salt', 'agreeable': 'agreeable gray', 'repose': 'repose gray',
      'iron ore black': 'iron ore', 'tricorn': 'tricorn black', 'snowbound white': 'snowbound',
      'accessible': 'accessible beige', 'urbane': 'urbane bronze', 'evergreen': 'evergreen fog',
      'greek villa white': 'greek villa', 'caviar black': 'caviar', 'mega greige gray': 'mega greige',
      'mindful': 'mindful gray', 'colonnade': 'colonnade gray', 'worldly': 'worldly gray',
      'dorian': 'dorian gray', 'gauntlet': 'gauntlet gray', 'intellectual': 'intellectual gray',
      'anew': 'anew gray', 'balanced': 'balanced beige',
    };
    
    const colorAssignments = [...(currentDraftData?.colorAssignments || [])];
    // Check aliases first
    for (const [alias, canonical] of Object.entries(colorAliases)) {
      if (allLower.includes(alias)) {
        const swCode = swColors[canonical];
        if (swCode) {
          const exists = colorAssignments.some(c => c.color.toLowerCase() === canonical);
          if (!exists) {
            let area = 'general';
            const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const areaContext = allLower.match(new RegExp(`(body|trim|door|exterior|interior|walls?|ceiling|accent|siding|shutters?)\\s+(?:in\\s+|is\\s+|with\\s+)?${escapedAlias}|${escapedAlias}\\s+(?:for\\s+|on\\s+)?(?:the\\s+)?(body|trim|door|exterior|interior|walls?|ceiling|accent|siding|shutters?)`));
            if (areaContext) area = (areaContext[1] || areaContext[2]).trim();
            colorAssignments.push({ area, color: canonical, swCode });
          }
        }
      }
    }
    // Check exact SW color names
    for (const [name, code] of Object.entries(swColors)) {
      if (allLower.includes(name)) {
        const exists = colorAssignments.some(c => c.color.toLowerCase() === name);
        if (!exists) {
          // Try to find the area context near this color mention
          let area = 'general';
          const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const areaContext = allLower.match(new RegExp(`(body|trim|door|exterior|interior|walls?|ceiling|accent|siding|shutters?)\\s+(?:in\\s+|is\\s+|with\\s+)?${escapedName}|${escapedName}\\s+(?:for\\s+|on\\s+)?(?:the\\s+)?(body|trim|door|exterior|interior|walls?|ceiling|accent|siding|shutters?)`));
          if (areaContext) area = (areaContext[1] || areaContext[2]).trim();
          colorAssignments.push({ area, color: name, swCode: code });
        }
      }
    }
    // SW codes like "SW 6244", "SW-6244", "SW#6244", "sw 6244"
    const swCodeMatches = allText.matchAll(/SW\s*[-#]?\s*(\d{4})/gi);
    for (const m of swCodeMatches) {
      const code = `SW ${m[1]}`;
      const exists = colorAssignments.some(c => c.swCode === code);
      if (!exists) {
        // Try to reverse-lookup the color name from the code
        let colorName = code;
        for (const [name, swCode] of Object.entries(swColors)) {
          if (swCode === code) { colorName = name; break; }
        }
        colorAssignments.push({ area: 'general', color: colorName, swCode: code });
      }
    }
    if (colorAssignments.length > (currentDraftData?.colorAssignments?.length || 0)) updates.colorAssignments = colorAssignments;

    // === Scope of work ===
    // Merge with existing scope
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
    const existingScope = currentDraftData?.scopeOfWork || [];
    const scope: string[] = [...existingScope];
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
    if (dedupedScope.length > existingScope.length) updates.scopeOfWork = dedupedScope;

    // === Add-ons ===
    // Look for hourly add-on work, merge with existing
    const existingAddOns = currentDraftData?.addOns || [];
    const addOns: { description: string; hours: number; rate: number }[] = [...existingAddOns];
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
          addOns.push({ description: desc, hours, rate: updates.hourlyRate || currentDraftData?.hourlyRate || 65 });
        }
      }
    }
    if (addOns.length > existingAddOns.length) updates.addOns = addOns;

    if (Object.keys(updates).length > 0) {
      storeRef.current.updateDraftFields(dId, updates);
    }
  }, []);

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
              prompt: `You are the Pinpoint Painting estimator resuming a conversation. Here is the current state of this estimate:\n\n${context}\n\nIMPORTANT: Do NOT re-ask for information already collected. Pick up where you left off. Be brief.`,
            },
            firstMessage: `Welcome back! Let me check where we left off...`,
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
