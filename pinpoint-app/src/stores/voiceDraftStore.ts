import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Voice Estimate Draft Store
 * 
 * Persists partial estimate data collected through voice conversations.
 * Maps directly to the fields in EstimateBuilder so data flows cleanly.
 * Allows pause/resume — user can leave and come back.
 */

export interface VoiceConversationEntry {
  role: 'user' | 'agent';
  message: string;
  timestamp: number;
}

export interface PaintLineItem {
  area: string;       // "exterior body", "trim", "doors", "ceiling", "living room walls"
  product: string;    // "Duration", "SuperPaint", "ProClassic", "Emerald"
  gallons: number;
  finish: string;     // "flat", "matte", "satin", "semi-gloss", "gloss"
  color: string;      // "Naval SW 6244", "Alabaster SW 7008"
  coats: number;      // default 2
  pricePerGallon: number;
}

export interface AddOnItem {
  description: string;  // "carpentry repairs", "wallpaper removal", "pressure washing"
  hours: number;
  rate: number;
}

export interface VoiceDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
  
  // === Customer Info ===
  customerName: string | null;
  propertyAddress: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  
  // === Project Scope ===
  projectType: 'interior' | 'exterior' | 'both' | null;
  areas: string[];           // ["living room", "kitchen", "hallway", "master bedroom"]
  scopeOfWork: string[];     // ["patch nail holes", "sand", "caulk gaps", "protect flooring"]
  
  // === Labor ===
  numberOfPainters: number | null;
  estimatedDays: number | null;
  hoursPerDay: number | null;   // default 8
  hourlyRate: number | null;    // default 65
  laborCost: number | null;     // calculated: painters × days × hours × rate
  
  // === Materials ===
  paintItems: PaintLineItem[];
  materialSubtotal: number | null;
  
  // === Colors ===
  colorAssignments: { area: string; color: string; swCode: string }[];
  
  // === Add-Ons ===
  addOns: AddOnItem[];
  
  // === Pricing ===
  materialMarkupPercent: number;  // default 20
  taxRate: number;                // default 8
  
  // === Totals (calculated) ===
  estimateTotal: number | null;
  
  // === Conversation State ===
  conversationHistory: VoiceConversationEntry[];
  isComplete: boolean;
  
  // === Link to real estimate ===
  estimateId: string | null;
}

// Core fields needed for a usable estimate (fewer = easier to hit 100%)
const REQUIRED_FIELDS = [
  'customerName',
  'projectType',
  'numberOfPainters',
  'estimatedDays',
  'hourlyRate',
] as const;

interface VoiceDraftState {
  drafts: VoiceDraft[];
  activeDraftId: string | null;
  
  createDraft: () => VoiceDraft;
  getActiveDraft: () => VoiceDraft | null;
  getDraftById: (id: string) => VoiceDraft | null;
  setActiveDraft: (id: string | null) => void;
  updateDraftFields: (id: string, fields: Partial<VoiceDraft>) => void;
  addConversationEntry: (id: string, entry: VoiceConversationEntry) => void;
  markComplete: (id: string) => void;
  linkToEstimate: (draftId: string, estimateId: string) => void;
  deleteDraft: (id: string) => void;
  getIncompleteDrafts: () => VoiceDraft[];
  getMissingFields: (id: string) => string[];
  getCollectedFields: (id: string) => string[];
  getCompletionPercent: (id: string) => number;
  buildAgentContext: (id: string) => string;
  recalculate: (id: string) => void;
}

const generateId = () => `vd-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

const createEmptyDraft = (): VoiceDraft => ({
  id: generateId(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  customerName: null,
  propertyAddress: null,
  customerPhone: null,
  customerEmail: null,
  projectType: null,
  areas: [],
  scopeOfWork: [],
  numberOfPainters: null,
  estimatedDays: null,
  hoursPerDay: 8,
  hourlyRate: 65,
  laborCost: null,
  paintItems: [],
  materialSubtotal: null,
  colorAssignments: [],
  addOns: [],
  materialMarkupPercent: 20,
  taxRate: 8,
  estimateTotal: null,
  conversationHistory: [],
  isComplete: false,
  estimateId: null,
});

export const useVoiceDraftStore = create<VoiceDraftState>()(
  persist(
    (set, get) => ({
      drafts: [],
      activeDraftId: null,
      
      createDraft: () => {
        const draft = createEmptyDraft();
        set((state) => ({
          drafts: [draft, ...state.drafts],
          activeDraftId: draft.id,
        }));
        return draft;
      },
      
      getActiveDraft: () => {
        const { drafts, activeDraftId } = get();
        if (!activeDraftId) return null;
        return drafts.find(d => d.id === activeDraftId) || null;
      },
      
      getDraftById: (id) => get().drafts.find(d => d.id === id) || null,
      
      setActiveDraft: (id) => set({ activeDraftId: id }),
      
      updateDraftFields: (id, fields) => {
        set((state) => ({
          drafts: state.drafts.map(d => {
            if (d.id !== id) return d;
            const updated = { ...d, ...fields, updatedAt: new Date().toISOString() };
            
            // Recalculate labor
            const painters = updated.numberOfPainters;
            const days = updated.estimatedDays;
            const hours = updated.hoursPerDay || 8;
            const rate = updated.hourlyRate || 65;
            if (painters && days) {
              updated.laborCost = painters * days * hours * rate;
            }
            
            // Recalculate materials
            if (updated.paintItems.length > 0) {
              updated.materialSubtotal = updated.paintItems.reduce(
                (sum, item) => sum + (item.gallons * item.pricePerGallon), 0
              );
            }
            
            // Recalculate total
            const labor = updated.laborCost || 0;
            const matSub = updated.materialSubtotal || 0;
            const markup = matSub * (updated.materialMarkupPercent / 100);
            const matWithMarkup = matSub + markup;
            const tax = matWithMarkup * (updated.taxRate / 100);
            const addOnTotal = updated.addOns.reduce((sum, a) => sum + a.hours * a.rate, 0);
            updated.estimateTotal = labor + matWithMarkup + tax + addOnTotal;
            
            return updated;
          }),
        }));
      },
      
      addConversationEntry: (id, entry) => {
        set((state) => ({
          drafts: state.drafts.map(d =>
            d.id === id
              ? { ...d, conversationHistory: [...d.conversationHistory, entry], updatedAt: new Date().toISOString() }
              : d
          ),
        }));
      },
      
      markComplete: (id) => {
        set((state) => ({
          drafts: state.drafts.map(d =>
            d.id === id ? { ...d, isComplete: true, updatedAt: new Date().toISOString() } : d
          ),
        }));
      },
      
      linkToEstimate: (draftId, estimateId) => {
        set((state) => ({
          drafts: state.drafts.map(d =>
            d.id === draftId ? { ...d, estimateId, updatedAt: new Date().toISOString() } : d
          ),
        }));
      },
      
      deleteDraft: (id) => {
        set((state) => ({
          drafts: state.drafts.filter(d => d.id !== id),
          activeDraftId: state.activeDraftId === id ? null : state.activeDraftId,
        }));
      },
      
      getIncompleteDrafts: () => get().drafts.filter(d => !d.isComplete && !d.estimateId),
      
      getMissingFields: (id) => {
        const draft = get().getDraftById(id);
        if (!draft) return [];
        const missing: string[] = [];
        
        // Only truly required fields
        if (!draft.customerName) missing.push('Customer name');
        if (!draft.projectType) missing.push('Project type');
        if (draft.numberOfPainters == null) missing.push('Number of painters');
        if (draft.estimatedDays == null) missing.push('Estimated days');
        if (draft.hourlyRate == null) missing.push('Hourly rate');
        
        return missing;
      },
      
      getCollectedFields: (id) => {
        const draft = get().getDraftById(id);
        if (!draft) return [];
        const collected: string[] = [];
        
        if (draft.customerName) collected.push(`Customer: ${draft.customerName}`);
        if (draft.propertyAddress) collected.push(`Address: ${draft.propertyAddress}`);
        if (draft.projectType) collected.push(`Type: ${draft.projectType}`);
        if (draft.areas.length > 0) collected.push(`Areas: ${draft.areas.join(', ')}`);
        if (draft.numberOfPainters != null) collected.push(`Crew: ${draft.numberOfPainters} painters`);
        if (draft.estimatedDays != null) collected.push(`Duration: ${draft.estimatedDays} days`);
        if (draft.hourlyRate != null) collected.push(`Rate: $${draft.hourlyRate}/hr`);
        if (draft.laborCost != null) collected.push(`Labor: $${draft.laborCost.toLocaleString()}`);
        if (draft.paintItems.length > 0) {
          const paintStr = draft.paintItems.map(p => `${p.gallons}gal ${p.product} for ${p.area}`).join('; ');
          collected.push(`Paint: ${paintStr}`);
        }
        if (draft.colorAssignments.length > 0) {
          const colorStr = draft.colorAssignments.map(c => `${c.area}: ${c.color}`).join('; ');
          collected.push(`Colors: ${colorStr}`);
        }
        if (draft.scopeOfWork.length > 0) collected.push(`Prep: ${draft.scopeOfWork.join(', ')}`);
        if (draft.addOns.length > 0) {
          const addStr = draft.addOns.map(a => `${a.description}: ${a.hours}hrs × $${a.rate}`).join('; ');
          collected.push(`Add-ons: ${addStr}`);
        }
        if (draft.estimateTotal != null) collected.push(`Estimate total: $${draft.estimateTotal.toLocaleString()}`);
        
        return collected;
      },
      
      getCompletionPercent: (id) => {
        const draft = get().getDraftById(id);
        if (!draft) return 0;
        let filled = 0;
        const total = REQUIRED_FIELDS.length;
        
        if (draft.customerName) filled++;
        if (draft.projectType) filled++;
        if (draft.numberOfPainters != null) filled++;
        if (draft.estimatedDays != null) filled++;
        if (draft.hourlyRate != null) filled++;
        
        return Math.round((filled / total) * 100);
      },
      
      buildAgentContext: (id) => {
        const collected = get().getCollectedFields(id);
        const missing = get().getMissingFields(id);
        
        let context = '';
        if (collected.length > 0) {
          context += `ALREADY COLLECTED:\n${collected.map(c => `• ${c}`).join('\n')}\n\n`;
        }
        if (missing.length > 0) {
          context += `STILL NEEDED TO COMPLETE THE ESTIMATE:\n${missing.map(m => `• ${m}`).join('\n')}\n\n`;
        }
        context += 'Pick up where we left off. Ask about the missing items ONE at a time. Do NOT re-ask what has been collected. When you have everything, give the full summary with calculated totals.';
        
        return context;
      },
      
      recalculate: (id) => {
        const draft = get().getDraftById(id);
        if (!draft) return;
        get().updateDraftFields(id, {}); // triggers recalc
      },
    }),
    {
      name: 'pinpoint-voice-drafts',
      version: 2, // Bump to force reset
      partialize: (state) => ({
        drafts: state.drafts,
        activeDraftId: state.activeDraftId,
      }),
      migrate: () => ({
        drafts: [],
        activeDraftId: null,
      }),
    }
  )
);
