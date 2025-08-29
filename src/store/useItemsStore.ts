import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { Item, ItemFormData, Reminder, Location, Profile, Device, ItemStatus } from '../types';
import { supabase } from '../lib/supabase';

interface ItemsState {
  // Data
  items: Item[];
  locations: Location[];
  reminders: Reminder[];
  profile: Profile | null;
  device: Device | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  // Filters and views
  selectedDate: Date;
  viewMode: 'today' | 'calendar' | 'list';
  filterCategory: string | null;
  filterStatus: ItemStatus | null;
  
  // Actions - Items
  addItem: (data: ItemFormData, clerkUserId?: string) => Promise<Item | null>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  completeItem: (id: string) => Promise<void>;
  
  // Actions - Locations
  addLocation: (location: Omit<Location, 'id' | 'clerk_user_id' | 'created_at'>, clerkUserId?: string) => Promise<void>;
  updateLocation: (id: string, updates: Partial<Location>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  
  // Actions - Reminders
  addReminder: (reminder: Omit<Reminder, 'id' | 'created_at'>) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  
  // Actions - Profile
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  
  // Actions - Device
  registerDevice: (device: Omit<Device, 'id' | 'clerk_user_id' | 'created_at' | 'updated_at' | 'last_seen_at'>, clerkUserId?: string) => Promise<void>;
  
  // Actions - Data management
  loadData: (clerkUserId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  clearData: () => void;
  
  // Actions - UI
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: 'today' | 'calendar' | 'list') => void;
  setFilterCategory: (category: string | null) => void;
  setFilterStatus: (status: ItemStatus | null) => void;
  clearError: () => void;
  
  // Computed getters
  getTodayItems: () => Item[];
  getOverdueItems: () => Item[];
  getUpcomingItems: (days?: number) => Item[];
  getItemsByDate: (date: Date) => Item[];
  getItemsByCategory: (category: string) => Item[];
  getActiveReminders: () => Reminder[];
}

export const useItemsStore = create<ItemsState>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        // Initial state
        items: [],
        locations: [],
        reminders: [],
        profile: null,
        device: null,
        loading: false,
        error: null,
        initialized: false,
        selectedDate: new Date(),
        viewMode: 'today',
        filterCategory: null,
        filterStatus: null,

        // Items actions
        addItem: async (data: ItemFormData, clerkUserId?: string) => {
          const state = get();
          // Try to get user ID from parameter, profile, or return error
          const userId = clerkUserId || state.profile?.clerk_user_id;
          
          console.log('🚀 Starting addItem with:', {
            hasUserId: !!userId,
            userId: userId,
            dataTitle: data.title,
            hasProfile: !!state.profile,
            profileUserId: state.profile?.clerk_user_id
          });
          
          if (!userId) {
            const errorMsg = 'User not authenticated - no Clerk user ID available';
            console.error('❌ addItem error:', errorMsg);
            set({ error: errorMsg });
            return null;
          }

          set({ loading: true, error: null });

          try {
            const newItem: Omit<Item, 'id' | 'created_at' | 'updated_at'> = {
              clerk_user_id: userId,
              title: data.title,
              notes: data.notes || '',
              type: data.type,
              start_at: data.start_at,
              end_at: data.end_at,
              all_day: data.all_day || false,
              due_at: data.due_at,
              timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
              location_name: data.location_name,
              lat: data.lat,
              lng: data.lng,
              radius_m: data.radius_m,
              recurrence_rrule: data.recurrence_rrule,
              priority: data.priority,
              tags: data.tags || [],
              category: data.category,
              ai_suggestions: {},
              status: 'pending'
            };

            console.log('📝 Prepared item data:', {
              title: newItem.title,
              type: newItem.type,
              clerk_user_id: newItem.clerk_user_id,
              hasLocation: !!newItem.location_name
            });

            // Set user context for RLS (optional but recommended)
            try {
              const configResult = await supabase.rpc('set_config', {
                parameter: 'app.current_user_id',
                value: userId
              });
              console.log('✅ RLS context set successfully:', configResult);
            } catch (rlsError) {
              console.warn('⚠️ RLS context failed (continuing with explicit filtering):', rlsError);
              // Continue anyway - we'll use explicit user ID filtering
            }

            // Test RLS context before insertion
            try {
              const contextTest = await supabase.rpc('test_rls_context');
              console.log('🔍 RLS context test:', contextTest);
            } catch (testError) {
              console.warn('⚠️ RLS context test failed:', testError);
            }

            console.log('💾 Inserting item into database...');
            const { data: insertedItem, error: insertError } = await supabase
              .from('items')
              .insert([newItem])
              .select('*')
              .single();

            if (insertError) {
              console.error('❌ Database insertion error:', {
                code: insertError.code,
                message: insertError.message,
                details: insertError.details,
                hint: insertError.hint
              });
              throw insertError;
            }

            if (!insertedItem) {
              const error = new Error('No item returned from database after insertion');
              console.error('❌ No item returned:', error);
              throw error;
            }

            console.log('✅ Item created successfully:', {
              id: insertedItem.id,
              title: insertedItem.title,
              type: insertedItem.type
            });

            const item = insertedItem as Item;
            set(state => ({ 
              items: [item, ...state.items],
              loading: false 
            }));

            return item;
          } catch (error) {
            console.error('❌ addItem full error:', error);
            let errorMessage = 'Failed to create item';
            
            if (error instanceof Error) {
              errorMessage = error.message;
              
              // Provide more specific error messages
              if (error.message.includes('permission denied')) {
                errorMessage = 'Database permission denied. Please check your authentication.';
              } else if (error.message.includes('duplicate key')) {
                errorMessage = 'This item already exists.';
              } else if (error.message.includes('connection')) {
                errorMessage = 'Database connection failed. Please check your internet connection.';
              } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
                errorMessage = 'Database table not found. Please contact support.';
              }
            }
            
            console.error('📤 Setting error state:', errorMessage);
            set({ error: errorMessage, loading: false });
            return null;
          }
        },

        updateItem: async (id: string, updates: Partial<Item>) => {
          set({ loading: true, error: null });

          try {
            const { data, error } = await supabase
              .from('items')
              .update({
                ...updates,
                updated_at: new Date().toISOString()
              })
              .eq('id', id)
              .select('*')
              .single();

            if (error) throw error;

            const updatedItem = data as Item;
            set(state => ({
              items: state.items.map(item => 
                item.id === id ? updatedItem : item
              ),
              loading: false
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update item';
            set({ error: errorMessage, loading: false });
          }
        },

        deleteItem: async (id: string) => {
          set({ loading: true, error: null });

          try {
            const { error } = await supabase
              .from('items')
              .delete()
              .eq('id', id);

            if (error) throw error;

            set(state => ({
              items: state.items.filter(item => item.id !== id),
              loading: false
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete item';
            set({ error: errorMessage, loading: false });
          }
        },

        completeItem: async (id: string) => {
          const { updateItem } = get();
          await updateItem(id, {
            status: 'done',
            completed_at: new Date().toISOString()
          });
        },

        // Locations actions
        addLocation: async (locationData, clerkUserId?: string) => {
          const state = get();
          const userId = clerkUserId || state.profile?.clerk_user_id;
          
          if (!userId) {
            set({ error: 'User not authenticated' });
            return;
          }

          set({ loading: true, error: null });

          try {
            const newLocation = {
              ...locationData,
              clerk_user_id: userId
            };

            const { data, error } = await supabase
              .from('locations')
              .insert([newLocation])
              .select('*')
              .single();

            if (error) throw error;

            set(state => ({
              locations: [...state.locations, data as Location],
              loading: false
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to add location';
            set({ error: errorMessage, loading: false });
          }
        },

        updateLocation: async (id: string, updates: Partial<Location>) => {
          set({ loading: true, error: null });

          try {
            const { data, error } = await supabase
              .from('locations')
              .update(updates)
              .eq('id', id)
              .select('*')
              .single();

            if (error) throw error;

            set(state => ({
              locations: state.locations.map(location =>
                location.id === id ? { ...location, ...data } : location
              ),
              loading: false
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update location';
            set({ error: errorMessage, loading: false });
          }
        },

        deleteLocation: async (id: string) => {
          set({ loading: true, error: null });

          try {
            const { error } = await supabase
              .from('locations')
              .delete()
              .eq('id', id);

            if (error) throw error;

            set(state => ({
              locations: state.locations.filter(location => location.id !== id),
              loading: false
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete location';
            set({ error: errorMessage, loading: false });
          }
        },

        // Reminders actions
        addReminder: async (reminderData) => {
          set({ loading: true, error: null });

          try {
            const { data, error } = await supabase
              .from('reminders')
              .insert([reminderData])
              .select('*')
              .single();

            if (error) throw error;

            set(state => ({
              reminders: [...state.reminders, data as Reminder],
              loading: false
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to add reminder';
            set({ error: errorMessage, loading: false });
          }
        },

        updateReminder: async (id: string, updates: Partial<Reminder>) => {
          set({ loading: true, error: null });

          try {
            const { data, error } = await supabase
              .from('reminders')
              .update(updates)
              .eq('id', id)
              .select('*')
              .single();

            if (error) throw error;

            set(state => ({
              reminders: state.reminders.map(reminder =>
                reminder.id === id ? { ...reminder, ...data } : reminder
              ),
              loading: false
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update reminder';
            set({ error: errorMessage, loading: false });
          }
        },

        deleteReminder: async (id: string) => {
          set({ loading: true, error: null });

          try {
            const { error } = await supabase
              .from('reminders')
              .delete()
              .eq('id', id);

            if (error) throw error;

            set(state => ({
              reminders: state.reminders.filter(reminder => reminder.id !== id),
              loading: false
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete reminder';
            set({ error: errorMessage, loading: false });
          }
        },

        // Profile actions
        updateProfile: async (updates: Partial<Profile>) => {
          const state = get();
          if (!state.profile) return;

          set({ loading: true, error: null });

          try {
            const { data, error } = await supabase
              .from('profiles')
              .update({
                ...updates,
                updated_at: new Date().toISOString()
              })
              .eq('id', state.profile.id)
              .select('*')
              .single();

            if (error) throw error;

            set({ profile: data as Profile, loading: false });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
            set({ error: errorMessage, loading: false });
          }
        },

        // Device actions
        registerDevice: async (deviceData, clerkUserId?: string) => {
          const state = get();
          const userId = clerkUserId || state.profile?.clerk_user_id;
          
          if (!userId) return;

          try {
            const device = {
              ...deviceData,
              clerk_user_id: userId
            };

            const { data, error } = await supabase
              .from('devices')
              .upsert([device], {
                onConflict: 'clerk_user_id,platform'
              })
              .select('*')
              .single();

            if (error) throw error;

            set({ device: data as Device });
          } catch (error) {
            console.error('Failed to register device:', error);
          }
        },

        // Data management actions
        loadData: async (clerkUserId: string) => {
          if (get().initialized) return;
          
          set({ loading: true, error: null });

          try {
            // Set user context for RLS (optional - fallback to Clerk auth)
            try {
              await supabase.rpc('set_config', {
                parameter: 'app.current_user_id', 
                value: clerkUserId
              });
              console.log('RLS context set successfully for user:', clerkUserId);
            } catch (error) {
              console.warn('RLS context not available, using Clerk auth instead:', error);
              // Continue anyway - Clerk integration should handle auth
            }

            // Load all data in parallel with explicit error handling
            console.log('Starting data load for user:', clerkUserId);
            
            const [itemsResult, locationsResult, remindersResult, profileResult, deviceResult] = await Promise.all([
              supabase.from('items').select('*').eq('clerk_user_id', clerkUserId).order('created_at', { ascending: false }),
              supabase.from('locations').select('*').eq('clerk_user_id', clerkUserId).order('name'),
              supabase.from('reminders').select('*').order('created_at', { ascending: false }),
              supabase.from('profiles').select('*').eq('clerk_user_id', clerkUserId).single(),
              supabase.from('devices').select('*').eq('clerk_user_id', clerkUserId).eq('platform', 'web').single()
            ]);

            console.log('Data loading results:');
            console.log('Items:', itemsResult.data?.length || 0, 'items loaded');
            console.log('Locations:', locationsResult.data?.length || 0, 'locations loaded');
            console.log('Reminders:', remindersResult.data?.length || 0, 'reminders loaded');
            
            // Log any data loading errors for debugging
            if (itemsResult.error) console.error('Items loading error:', itemsResult.error);
            if (locationsResult.error) console.error('Locations loading error:', locationsResult.error);
            if (remindersResult.error) console.error('Reminders loading error:', remindersResult.error);

            // Handle profile - create if doesn't exist
            let profile: Profile | null = null;
            if (profileResult.error && profileResult.error.code === 'PGRST116') {
              // Profile doesn't exist, create it
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert([{
                  clerk_user_id: clerkUserId,
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                }])
                .select('*')
                .single();

              if (!createError) {
                profile = newProfile as Profile;
              }
            } else if (!profileResult.error) {
              profile = profileResult.data as Profile;
            }

            set({
              items: (itemsResult.data || []) as Item[],
              locations: (locationsResult.data || []) as Location[],
              reminders: (remindersResult.data || []) as Reminder[],
              profile,
              device: deviceResult.error ? null : deviceResult.data as Device,
              loading: false,
              initialized: true
            });

          } catch (error) {
            console.error('Full loadData error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
            console.error('Error message:', errorMessage);
            set({ error: errorMessage, loading: false, initialized: false });
          }
        },

        refreshData: async () => {
          const state = get();
          if (state.profile?.clerk_user_id) {
            set({ initialized: false });
            await get().loadData(state.profile.clerk_user_id);
          }
        },

        clearData: () => {
          set({
            items: [],
            locations: [],
            reminders: [],
            profile: null,
            device: null,
            initialized: false,
            error: null
          });
        },

        // UI actions
        setSelectedDate: (date: Date) => set({ selectedDate: date }),
        setViewMode: (mode: 'today' | 'calendar' | 'list') => set({ viewMode: mode }),
        setFilterCategory: (category: string | null) => set({ filterCategory: category }),
        setFilterStatus: (status: ItemStatus | null) => set({ filterStatus: status }),
        clearError: () => set({ error: null }),

        // Computed getters
        getTodayItems: () => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          return get().items.filter(item => {
            // Due today
            if (item.due_at) {
              const dueDate = new Date(item.due_at);
              dueDate.setHours(0, 0, 0, 0);
              if (dueDate.getTime() === today.getTime()) return true;
            }

            // Scheduled today
            if (item.start_at) {
              const startDate = new Date(item.start_at);
              return startDate >= today && startDate < tomorrow;
            }

            // No date but pending
            return !item.start_at && !item.due_at && item.status === 'pending';
          });
        },

        getOverdueItems: () => {
          const now = new Date();
          return get().items.filter(item => {
            if (item.status === 'done' || item.status === 'cancelled') return false;
            
            if (item.due_at) {
              return new Date(item.due_at) < now;
            }
            
            if (item.start_at && item.type === 'event') {
              return new Date(item.start_at) < now;
            }
            
            return false;
          });
        },

        getUpcomingItems: (days = 7) => {
          const now = new Date();
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + days);

          return get().items.filter(item => {
            if (item.status === 'done' || item.status === 'cancelled') return false;
            
            const targetDate = item.start_at ? new Date(item.start_at) : 
                              item.due_at ? new Date(item.due_at) : null;
            
            return targetDate && targetDate > now && targetDate <= futureDate;
          });
        },

        getItemsByDate: (date: Date) => {
          const targetDate = new Date(date);
          targetDate.setHours(0, 0, 0, 0);
          const nextDay = new Date(targetDate);
          nextDay.setDate(nextDay.getDate() + 1);

          return get().items.filter(item => {
            if (item.start_at) {
              const startDate = new Date(item.start_at);
              return startDate >= targetDate && startDate < nextDay;
            }
            
            if (item.due_at) {
              const dueDate = new Date(item.due_at);
              dueDate.setHours(0, 0, 0, 0);
              return dueDate.getTime() === targetDate.getTime();
            }
            
            return false;
          });
        },

        getItemsByCategory: (category: string) => {
          return get().items.filter(item => item.category === category);
        },

        getActiveReminders: () => {
          const now = new Date();
          return get().reminders.filter(reminder => 
            !reminder.fired_at && 
            reminder.trigger_at && 
            new Date(reminder.trigger_at) > now
          );
        }
      })),
      {
        name: 'taskonix-items',
        partialize: (state) => ({
          selectedDate: state.selectedDate,
          viewMode: state.viewMode,
          filterCategory: state.filterCategory,
          filterStatus: state.filterStatus
        })
      }
    ),
    { name: 'items-store' }
  )
);