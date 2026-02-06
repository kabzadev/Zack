import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Voice Estimate Draft Store
 * 
 * Persists partial estimate data collected through voice conversations.
 * Allows the user to start a conversation, leave, and come back to continue.
 * Each draft tracks what's been collected and the full conversation history.
 */

export interface VoiceConversationEntry {
  role: 'user' | 'agent';
  message: string;
  timestamp: number;
}

export interface VoiceDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
  
  // Collected estimate fields (null = not yet collected)
  customerName: string | null;
  propertyAddress: string | null;
  projectType: 'interior' | 'exterior' | 'both' | null;
  numberOfRooms: number | null;
  colors: string[];  // SW color names/codes mentioned
  squareFootage: number | null;
  numberOfPainters: number | null;
  estimatedDays: number | null;
  hourlyRate: number | null;
  gallonsOfPaint: { area: string; gallons: number; product: string }[];
  addOns: string[];
  specialNotes: string | null;
  
  // Labor calc (derived)
  laborCost: number | null;
  
  // Conversation state
  conversationHistory: VoiceConversationEntry[];
  isComplete: boolean;
  
  // Link to a real estimate once created
  estimateId: string | null;
}

interface VoiceDraftState {
  drafts: VoiceDraft[];
  activeDraftId: string | null;
  
  // CRUD
  createDraft: () => VoiceDraft;
  getActiveDraft: () => VoiceDraft | null;
  getDraftById: (id: string) => VoiceDraft | null;
  setActiveDraft: (id: string | null) => void;
  
  // Update fields from conversation
  updateDraftFields: (id: string, fields: Partial<Omit<VoiceDraft, 'id' | 'createdAt' | 'conversationHistory'>>) => void;
  
  // Conversation history
  addConversationEntry: (id: string, entry: VoiceConversationEntry) => void;
  
  // Mark complete / link to estimate
  markComplete: (id: string) => void;
  linkToEstimate: (draftId: string, estimateId: string) => void;
  
  // Cleanup
  deleteDraft: (id: string) => void;
  getIncompleteDrafts: () => VoiceDraft[];
  
  // Build context summary for the agent
  buildAgentContext: (id: string) => string;
}

const generateId = () => `vd-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

export const useVoiceDraftStore = create<VoiceDraftState>()(
  persist(
    (set, get) => ({
      drafts: [],
      activeDraftId: null,
      
      createDraft: () => {
        const draft: VoiceDraft = {
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          customerName: null,
          propertyAddress: null,
          projectType: null,
          numberOfRooms: null,
          colors: [],
          squareFootage: null,
          numberOfPainters: null,
          estimatedDays: null,
          hourlyRate: null,
          gallonsOfPaint: [],
          addOns: [],
          specialNotes: null,
          laborCost: null,
          conversationHistory: [],
          isComplete: false,
          estimateId: null,
        };
        
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
      
      getDraftById: (id) => {
        return get().drafts.find(d => d.id === id) || null;
      },
      
      setActiveDraft: (id) => {
        set({ activeDraftId: id });
      },
      
      updateDraftFields: (id, fields) => {
        set((state) => ({
          drafts: state.drafts.map(d => {
            if (d.id !== id) return d;
            const updated = { ...d, ...fields, updatedAt: new Date().toISOString() };
            // Recalculate labor cost if we have all the pieces
            if (updated.numberOfPainters && updated.estimatedDays && updated.hourlyRate) {
              updated.laborCost = updated.numberOfPainters * updated.estimatedDays * 8 * updated.hourlyRate;
            }
            return updated;
          }),
        }));
      },
      
      addConversationEntry: (id, entry) => {
        set((state) => ({
          drafts: state.drafts.map(d => {
            if (d.id !== id) return d;
            return {
              ...d,
              conversationHistory: [...d.conversationHistory, entry],
              updatedAt: new Date().toISOString(),
            };
          }),
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
      
      getIncompleteDrafts: () => {
        return get().drafts.filter(d => !d.isComplete && !d.estimateId);
      },
      
      buildAgentContext: (id) => {
        const draft = get().getDraftById(id);
        if (!draft) return '';
        
        const collected: string[] = [];
        const missing: string[] = [];
        
        // Check each field
        if (draft.customerName) collected.push(`Customer: ${draft.customerName}`);
        else missing.push('customer name');
        
        if (draft.propertyAddress) collected.push(`Address: ${draft.propertyAddress}`);
        else missing.push('property address');
        
        if (draft.projectType) collected.push(`Project: ${draft.projectType}`);
        else missing.push('project type (interior/exterior/both)');
        
        if (draft.numberOfRooms != null) collected.push(`Rooms: ${draft.numberOfRooms}`);
        else missing.push('number of rooms');
        
        if (draft.colors.length > 0) collected.push(`Colors: ${draft.colors.join(', ')}`);
        else missing.push('paint colors');
        
        if (draft.squareFootage != null) collected.push(`Square footage: ${draft.squareFootage}`);
        else missing.push('square footage');
        
        if (draft.numberOfPainters != null) collected.push(`Painters: ${draft.numberOfPainters}`);
        else missing.push('number of painters');
        
        if (draft.estimatedDays != null) collected.push(`Days: ${draft.estimatedDays}`);
        else missing.push('estimated days');
        
        if (draft.hourlyRate != null) collected.push(`Rate: $${draft.hourlyRate}/hr`);
        else missing.push('hourly rate');
        
        if (draft.gallonsOfPaint.length > 0) {
          const gallonStr = draft.gallonsOfPaint.map(g => `${g.gallons}gal ${g.product} (${g.area})`).join(', ');
          collected.push(`Paint: ${gallonStr}`);
        } else {
          missing.push('gallons of paint');
        }
        
        if (draft.laborCost != null) collected.push(`Labor cost: $${draft.laborCost.toLocaleString()}`);
        
        let context = '';
        if (collected.length > 0) {
          context += `ALREADY COLLECTED:\n${collected.join('\n')}\n\n`;
        }
        if (missing.length > 0) {
          context += `STILL NEEDED:\n${missing.join(', ')}\n\n`;
        }
        context += `Ask about the missing items. Do not re-ask what has already been collected. Pick up where we left off.`;
        
        return context;
      },
    }),
    {
      name: 'pinpoint-voice-drafts',
      partialize: (state) => ({
        drafts: state.drafts,
        activeDraftId: state.activeDraftId,
      }),
    }
  )
);
