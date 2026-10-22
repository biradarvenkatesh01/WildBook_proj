import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import client from '../../api/client';

// Distinct pastel color palette for activity cards matching Image 19
const ACTIVITY_COLORS = [
  { bg: 'bg-[#EAF3EA]', border: 'border-[#BDDDBD]', text: 'text-[#1F3D2B]', dot: 'bg-[#5E7F4F]' }, // Light green
  { bg: 'bg-[#EBF3FB]', border: 'border-[#BDD6F1]', text: 'text-[#1D3A5F]', dot: 'bg-[#4B82BA]' }, // Light blue
  { bg: 'bg-[#FEF8EB]', border: 'border-[#F8E2B5]', text: 'text-[#6D4913]', dot: 'bg-[#D9A441]' }, // Light amber/orange
  { bg: 'bg-[#FDF3F2]', border: 'border-[#F7C9C6]', text: 'text-[#6A2421]', dot: 'bg-[#D36058]' }, // Soft red/coral
  { bg: 'bg-[#F4EEF8]', border: 'border-[#DCC8EB]', text: 'text-[#4A2665]', dot: 'bg-[#8F5CAE]' }, // Soft purple
  { bg: 'bg-[#E8F6F5]', border: 'border-[#B4E3E0]', text: 'text-[#184844]', dot: 'bg-[#359B93]' }, // Teal
];

function getActivityStyle(activityId, index) {
  return ACTIVITY_COLORS[index % ACTIVITY_COLORS.length];
}

function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ActivitiesSlots() {
  const location = useLocation();

  // Selected Sanctuary
  const [sanctuaries, setSanctuaries] = useState([]);
  const [selectedSanctuaryId, setSelectedSanctuaryId] = useState(null);

  // Entities
  const [activities, setActivities] = useState([]);
  const [guides, setGuides] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [slots, setSlots] = useState([]);

  // Calendar State
  const [currentWeekMonday, setCurrentWeekMonday] = useState(() => getMonday(new Date()));
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Right Panel: Add / Edit Slot
  const [isSlotPanelOpen, setIsSlotPanelOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null); // null => add mode
  const [slotForm, setSlotForm] = useState({
    activity_id: '',
    guide_id: '',
    vehicle_id: '',
    slot_date: '',
    slot_time: '06:00',
    capacity: '',
  });
  const [slotFormSaving, setSlotFormSaving] = useState(false);
  const [slotFormError, setSlotFormError] = useState('');

  // Activity Modal (Add / Edit)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [activityForm, setActivityForm] = useState({
    activity_name: '',
    description: '',
    duration_minutes: '120',
    what_to_carry: '',
    price: '',
  });
  const [activitySaving, setActivitySaving] = useState(false);

  // Guides & Vehicles Modal
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  // Check if routed specifically from /admin/guides
  useEffect(() => {
    if (location.pathname.includes('/admin/guides')) {
      setIsGuideModalOpen(true);
    }
  }, [location.pathname]);

  // 1. Initial Load: Sanctuaries
  useEffect(() => {
    async function fetchSanctuaries() {
      try {
        setLoading(true);
        const res = await client.get('/admin/sanctuaries');
        const list = res.sanctuaries || [];
        setSanctuaries(list);
        if (list.length > 0) {
          setSelectedSanctuaryId(list[0].sanctuary_id);
        }
      } catch (err) {
        setErrorMsg(err.data?.error || err.message || 'Failed to load operator sanctuaries');
      } finally {
        setLoading(false);
      }
    }
    fetchSanctuaries();
  }, []);

  // 2. Load Sanctuary Specific Data (Activities, Guides, Vehicles, Slots)
  const loadData = async (sanctuaryId, mondayDate) => {
    if (!sanctuaryId) return;
    try {
      setErrorMsg('');
      const weekStr = formatDate(mondayDate);

      const [actRes, guideRes, vehRes, slotRes] = await Promise.all([
        client.get(`/admin/activities?sanctuary_id=${sanctuaryId}`),
        client.get(`/admin/guides?sanctuary_id=${sanctuaryId}`),
        client.get(`/admin/vehicles?sanctuary_id=${sanctuaryId}`),
        client.get(`/admin/slots?sanctuary_id=${sanctuaryId}&week=${weekStr}`),
      ]);

      setActivities(actRes.activities || []);
      setGuides(guideRes.guides || []);
      setVehicles(vehRes.vehicles || []);
      setSlots(slotRes.slots || []);
    } catch (err) {
      setErrorMsg(err.data?.error || err.message || 'Failed to refresh schedule data');
    }
  };

  useEffect(() => {
    if (selectedSanctuaryId) {
      loadData(selectedSanctuaryId, currentWeekMonday);
    }
  }, [selectedSanctuaryId, currentWeekMonday]);

  // Week days array [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(currentWeekMonday);
      d.setDate(currentWeekMonday.getDate() + i);
      return {
        dateObj: d,
        dateStr: formatDate(d),
        dayName: DAYS_SHORT[i],
        dayNumber: d.getDate(),
        monthShort: d.toLocaleString('en-US', { month: 'short' }),
        isToday: formatDate(d) === formatDate(new Date()),
      };
    });
  }, [currentWeekMonday]);

  // Week Navigation handlers
  const handlePrevWeek = () => {
    const prev = new Date(currentWeekMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekMonday(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekMonday);
    next.setDate(next.getDate() + 7);
    setCurrentWeekMonday(next);
  };

  const handleToday = () => {
    setCurrentWeekMonday(getMonday(new Date()));
  };

  // Activity Color Mapping Helper
  const activityColorMap = useMemo(() => {
    const map = {};
    activities.forEach((act, idx) => {
      map[act.activity_id] = getActivityStyle(act.activity_id, idx);
    });
    return map;
  }, [activities]);

  // ══════════════════════════════════════════════════════════════════════════════
  // SLOT PANEL HANDLERS
  // ══════════════════════════════════════════════════════════════════════════════

  const openAddSlot = (prefilledDate = null) => {
    setEditingSlot(null);
    setSlotFormError('');
    const defaultDate = prefilledDate || formatDate(weekDays[0].dateObj);
    const defaultAct = activities.length > 0 ? activities[0].activity_id : '';
    const defaultGuide = guides.length > 0 ? guides[0].guide_id : '';
    const defaultVeh = vehicles.length > 0 ? vehicles[0] : null;

    setSlotForm({
      activity_id: defaultAct,
      guide_id: defaultGuide,
      vehicle_id: defaultVeh ? defaultVeh.vehicle_id : '',
      slot_date: defaultDate,
      slot_time: '06:00',
      capacity: defaultVeh ? defaultVeh.capacity : '',
    });
    setIsSlotPanelOpen(true);
  };

  const openEditSlot = (slot) => {
    setEditingSlot(slot);
    setSlotFormError('');
    setSlotForm({
      activity_id: slot.activity_id,
      guide_id: slot.guide_id,
      vehicle_id: slot.vehicle_id,
      slot_date: slot.slot_date,
      slot_time: slot.slot_time.substring(0, 5),
      capacity: slot.capacity,
    });
    setIsSlotPanelOpen(true);
  };

  const handleVehicleChange = (vehId) => {
    const veh = vehicles.find((v) => String(v.vehicle_id) === String(vehId));
    setSlotForm((prev) => ({
      ...prev,
      vehicle_id: vehId,
      capacity: veh ? veh.capacity : prev.capacity,
    }));
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    setSlotFormError('');
    setSlotFormSaving(true);

    try {
      if (editingSlot) {
        await client.put(`/admin/slots/${editingSlot.slot_id}`, {
          activity_id: slotForm.activity_id,
          guide_id: slotForm.guide_id,
          vehicle_id: slotForm.vehicle_id,
          slot_date: slotForm.slot_date,
          slot_time: slotForm.slot_time,
          capacity: slotForm.capacity,
        });
        setSuccessMsg('Slot updated successfully');
      } else {
        await client.post('/admin/slots', {
          activity_id: slotForm.activity_id,
          guide_id: slotForm.guide_id,
          vehicle_id: slotForm.vehicle_id,
          slot_date: slotForm.slot_date,
          slot_time: slotForm.slot_time,
          capacity: slotForm.capacity,
        });
        setSuccessMsg('New slot added to calendar');
      }

      setIsSlotPanelOpen(false);
      await loadData(selectedSanctuaryId, currentWeekMonday);
    } catch (err) {
      setSlotFormError(err.data?.error || err.message || 'Failed to save slot');
    } finally {
      setSlotFormSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to remove or deactivate this slot?')) return;
    try {
      const res = await client.delete(`/admin/slots/${slotId}`);
      setSuccessMsg(res.message || 'Slot processed');
      setIsSlotPanelOpen(false);
      await loadData(selectedSanctuaryId, currentWeekMonday);
    } catch (err) {
      alert(err.data?.error || err.message || 'Failed to delete slot');
    }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // ACTIVITY MODAL HANDLERS
  // ══════════════════════════════════════════════════════════════════════════════

  const openAddActivity = () => {
    setEditingActivity(null);
    setActivityForm({
      activity_name: '',
      description: '',
      duration_minutes: '120',
      what_to_carry: '',
      price: '',
    });
    setIsActivityModalOpen(true);
  };

  const openEditActivity = (act) => {
    setEditingActivity(act);
    setActivityForm({
      activity_name: act.activity_name,
      description: act.description || '',
      duration_minutes: String(act.duration_minutes),
      what_to_carry: act.what_to_carry || '',
      price: String(act.price),
    });
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = async (e) => {
    e.preventDefault();
    setActivitySaving(true);
    try {
      if (editingActivity) {
        await client.put(`/admin/activities/${editingActivity.activity_id}`, activityForm);
        setSuccessMsg('Activity updated');
      } else {
        await client.post('/admin/activities', {
          ...activityForm,
          sanctuary_id: selectedSanctuaryId,
        });
        setSuccessMsg('Activity created');
      }
      setIsActivityModalOpen(false);
      await loadData(selectedSanctuaryId, currentWeekMonday);
    } catch (err) {
      alert(err.data?.error || err.message || 'Failed to save activity');
    } finally {
      setActivitySaving(false);
    }
  };

  const handleDeleteActivity = async (actId) => {
    if (!window.confirm('Are you sure you want to delete or deactivate this activity?')) return;
    try {
      const res = await client.delete(`/admin/activities/${actId}`);
      setSuccessMsg(res.message || 'Activity updated');
      await loadData(selectedSanctuaryId, currentWeekMonday);
    } catch (err) {
      alert(err.data?.error || err.message || 'Failed to remove activity');
    }
  };

  return (
    <AdminLayout activeTitle="Manage activities and slots">
      <div className="p-6 md:p-8 max-w-[1700px] mx-auto min-h-screen flex flex-col">
        
        {/* ── Page Header (Image 19) ────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif text-[#1F3D2B] font-bold">
              Manage activities and slots
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Add, edit and manage activities and their weekly schedule.
            </p>
          </div>

          {/* Sanctuary Selector & Quick Modals Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {sanctuaries.length > 0 && (
              <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-[#E5DAC6] shadow-xs">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sanctuary:</span>
                <select
                  value={selectedSanctuaryId || ''}
                  onChange={(e) => setSelectedSanctuaryId(Number(e.target.value))}
                  className="bg-transparent text-sm font-semibold text-[#1F3D2B] focus:outline-none cursor-pointer"
                >
                  {sanctuaries.map((s) => (
                    <option key={s.sanctuary_id} value={s.sanctuary_id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Manage Guides Dialog Button */}
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#E5DAC6] hover:bg-gray-50 text-xs font-semibold text-[#1F3D2B] flex items-center gap-1.5 transition shadow-xs"
            >
              <span>👤 Guides ({guides.length})</span>
            </button>

            {/* Manage Vehicles Dialog Button */}
            <button
              type="button"
              onClick={() => setIsVehicleModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#E5DAC6] hover:bg-gray-50 text-xs font-semibold text-[#1F3D2B] flex items-center gap-1.5 transition shadow-xs"
            >
              <span>🚙 Vehicles ({vehicles.length})</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Banners */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="font-bold ml-2">✕</button>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <span>✓ {successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="font-bold ml-2">✕</button>
          </div>
        )}

        {/* ── Main 3-Column Work Area ───────────────────────────────────────── */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 relative items-start">
          
          {/* ════ LEFT COLUMN: Activities List (approx 3 cols) ═══════════════ */}
          <div className="xl:col-span-3 bg-white rounded-2xl p-5 border border-[#E5DAC6] shadow-xs flex flex-col justify-between min-h-[580px]">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <h3 className="font-serif text-lg font-bold text-[#1F3D2B]">
                  Activities
                </h3>
                <button
                  type="button"
                  onClick={openAddActivity}
                  className="px-3 py-1.5 rounded-lg bg-[#D9A441] text-[#1F3D2B] text-xs font-semibold hover:bg-[#c99534] transition flex items-center gap-1"
                >
                  <span className="text-sm font-bold leading-none">+</span> Add activity
                </button>
              </div>

              {/* Activities Scroll List */}
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    No activities defined yet. Click "+ Add activity" above.
                  </div>
                ) : (
                  activities.map((act, idx) => {
                    const style = getActivityStyle(act.activity_id, idx);
                    return (
                      <div
                        key={act.activity_id}
                        className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                          act.is_active ? 'bg-[#FAF8F5] border-[#E8DFD0] hover:border-[#D9A441]' : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Dot / Activity Icon indicator */}
                          <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${style.dot}`} />
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-[#1F3D2B] truncate">
                              {act.activity_name}
                            </h4>
                            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                              ₹{Number(act.price).toLocaleString('en-IN')} / person
                              {!act.is_active && <span className="ml-1 text-red-500">(Inactive)</span>}
                            </p>
                          </div>
                        </div>

                        {/* Action Icons */}
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => openEditActivity(act)}
                            className="p-1.5 text-gray-400 hover:text-[#1F3D2B] hover:bg-white rounded-md transition"
                            title="Edit activity"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(act.activity_id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-md transition"
                            title="Delete / Deactivate activity"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bottom count footer */}
            <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 font-medium">
              {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
            </div>
          </div>

          {/* ════ CENTER COLUMN: Weekly Calendar Grid (approx 6-9 cols) ═══════ */}
          <div className={`${isSlotPanelOpen ? 'xl:col-span-6' : 'xl:col-span-9'} bg-white rounded-2xl p-5 border border-[#E5DAC6] shadow-xs flex flex-col transition-all duration-300 min-h-[580px]`}>
            
            {/* Calendar Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevWeek}
                  className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition"
                  title="Previous week"
                >
                  &larr;
                </button>
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-gray-200 bg-[#FAF8F5]">
                  <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span className="text-xs font-semibold text-[#1F3D2B]">
                    {weekDays[0].dayNumber} {weekDays[0].monthShort} – {weekDays[6].dayNumber} {weekDays[6].monthShort} {weekDays[6].dateObj.getFullYear()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleNextWeek}
                  className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition"
                  title="Next week"
                >
                  &rarr;
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => openAddSlot()}
                  className="px-3 py-1.5 rounded-lg bg-[#D9A441] text-[#1F3D2B] text-xs font-semibold hover:bg-[#c99534] transition flex items-center gap-1 shadow-xs"
                >
                  <span>+ Add slot</span>
                </button>
              </div>
            </div>

            {/* 7-Day Calendar Grid */}
            <div className="grid grid-cols-7 gap-2.5 flex-1 min-h-[420px]">
              {weekDays.map((col) => {
                const daySlots = slots.filter((s) => s.slot_date === col.dateStr);

                return (
                  <div
                    key={col.dateStr}
                    className={`flex flex-col rounded-xl p-2 border ${
                      col.isToday ? 'bg-[#F9F6EE] border-[#D9A441]' : 'bg-[#FCFBF8] border-gray-100'
                    }`}
                  >
                    {/* Day Header */}
                    <div className="text-center pb-2 border-b border-gray-200/60 mb-2">
                      <span className="text-[11px] font-semibold uppercase text-gray-400 block tracking-wider">
                        {col.dayName}
                      </span>
                      <span className={`text-sm font-bold block mt-0.5 ${col.isToday ? 'text-[#D9A441]' : 'text-gray-800'}`}>
                        {col.dayNumber}
                      </span>
                    </div>

                    {/* Day Slot Blocks */}
                    <div className="flex-1 space-y-2 overflow-y-auto">
                      {daySlots.length === 0 ? (
                        <div
                          onClick={() => openAddSlot(col.dateStr)}
                          className="h-full min-h-[80px] border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-500 hover:border-gray-400 cursor-pointer transition text-xs"
                          title="Click to schedule slot on this date"
                        >
                          +
                        </div>
                      ) : (
                        daySlots.map((slot) => {
                          const style = activityColorMap[slot.activity_id] || ACTIVITY_COLORS[0];
                          const timeStr = slot.slot_time.substring(0, 5);

                          return (
                            <div
                              key={slot.slot_id}
                              onClick={() => openEditSlot(slot)}
                              className={`p-2.5 rounded-xl border ${style.bg} ${style.border} ${style.text} cursor-pointer hover:shadow-md transition text-left relative group`}
                            >
                              {/* Time + Activity */}
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-bold text-[11px] tracking-tight">{timeStr}</span>
                                {!slot.is_active && (
                                  <span className="text-[9px] bg-red-100 text-red-700 px-1 rounded font-semibold">Off</span>
                                )}
                              </div>
                              <div className="font-bold text-[11px] leading-tight line-clamp-1 mb-1.5">
                                {slot.activity_name}
                              </div>

                              {/* Guide */}
                              <div className="text-[10px] text-gray-600 flex items-center gap-1 truncate mb-0.5">
                                <span className="opacity-70">👤</span> {slot.guide_name}
                              </div>

                              {/* Vehicle */}
                              <div className="text-[10px] text-gray-600 flex items-center gap-1 truncate mb-1">
                                <span className="opacity-70">🚗</span> {slot.vehicle_type}
                              </div>

                              {/* Seats Booked / Capacity */}
                              <div className="text-[10px] font-semibold pt-1 border-t border-black/5 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <span>👥</span> {slot.booked_seats}/{slot.capacity}
                                </span>
                                {slot.booked_seats >= slot.capacity ? (
                                  <span className="text-[9px] text-red-600 uppercase font-bold">Full</span>
                                ) : (
                                  <span className="text-[9px] text-emerald-700 font-medium">
                                    {slot.available_seats} left
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Activity Legend */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-4 text-xs text-gray-600">
              {activities.map((act, idx) => {
                const style = getActivityStyle(act.activity_id, idx);
                return (
                  <div key={act.activity_id} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                    <span className="text-[11px]">{act.activity_name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ════ RIGHT COLUMN: Add / Edit Slot Slide-Over Panel ══════════════ */}
          {isSlotPanelOpen && (
            <div className="xl:col-span-3 bg-white rounded-2xl p-5 border border-[#E5DAC6] shadow-sm flex flex-col min-h-[580px] animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <h3 className="font-serif text-lg font-bold text-[#1F3D2B]">
                  {editingSlot ? 'Edit slot' : 'Add slot'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSlotPanelOpen(false)}
                  className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              {slotFormError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {slotFormError}
                </div>
              )}

              <form onSubmit={handleSaveSlot} className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3.5">
                  {/* Activity */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Activity <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={slotForm.activity_id}
                      onChange={(e) => setSlotForm({ ...slotForm, activity_id: e.target.value })}
                      required
                      className="w-full text-xs rounded-xl border border-gray-200 p-2.5 focus:border-[#D9A441] focus:outline-none"
                    >
                      <option value="">Select activity</option>
                      {activities.map((act) => (
                        <option key={act.activity_id} value={act.activity_id}>
                          {act.activity_name} (₹{act.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Guide */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Guide <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={slotForm.guide_id}
                      onChange={(e) => setSlotForm({ ...slotForm, guide_id: e.target.value })}
                      required
                      className="w-full text-xs rounded-xl border border-gray-200 p-2.5 focus:border-[#D9A441] focus:outline-none"
                    >
                      <option value="">Select guide</option>
                      {guides.map((g) => (
                        <option key={g.guide_id} value={g.guide_id}>
                          {g.name} ({g.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Vehicle */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Vehicle <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={slotForm.vehicle_id}
                      onChange={(e) => handleVehicleChange(e.target.value)}
                      required
                      className="w-full text-xs rounded-xl border border-gray-200 p-2.5 focus:border-[#D9A441] focus:outline-none"
                    >
                      <option value="">Select vehicle</option>
                      {vehicles.map((v) => (
                        <option key={v.vehicle_id} value={v.vehicle_id}>
                          {v.vehicle_type} (Max {v.capacity} seats)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={slotForm.slot_date}
                      onChange={(e) => setSlotForm({ ...slotForm, slot_date: e.target.value })}
                      required
                      disabled={editingSlot && editingSlot.confirmed_bookings_count > 0}
                      className="w-full text-xs rounded-xl border border-gray-200 p-2.5 focus:border-[#D9A441] focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    {editingSlot && editingSlot.confirmed_bookings_count > 0 && (
                      <span className="text-[10px] text-amber-700 mt-1 block">
                        Locked: Confirmed bookings exist on this slot.
                      </span>
                    )}
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={slotForm.slot_time}
                      onChange={(e) => setSlotForm({ ...slotForm, slot_time: e.target.value })}
                      required
                      disabled={editingSlot && editingSlot.confirmed_bookings_count > 0}
                      className="w-full text-xs rounded-xl border border-gray-200 p-2.5 focus:border-[#D9A441] focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Capacity */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Capacity (seats) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={slotForm.capacity}
                      onChange={(e) => setSlotForm({ ...slotForm, capacity: e.target.value })}
                      required
                      disabled={editingSlot && editingSlot.confirmed_bookings_count > 0}
                      className="w-full text-xs rounded-xl border border-gray-200 p-2.5 focus:border-[#D9A441] focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <button
                    type="submit"
                    disabled={slotFormSaving}
                    className="w-full py-2.5 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-semibold text-xs hover:bg-[#c99534] transition disabled:opacity-50 shadow-xs"
                  >
                    {slotFormSaving ? 'Saving...' : editingSlot ? 'Save changes' : 'Add slot'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSlotPanelOpen(false)}
                      className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    {editingSlot && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(editingSlot.slot_id)}
                        className="px-3 py-2 rounded-xl border border-red-200 text-red-600 font-semibold text-xs hover:bg-red-50 transition"
                        title="Delete or deactivate slot"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* ════ MODAL: Add / Edit Activity ═════════════════════════════════════ */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E5DAC6] shadow-xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-serif text-lg font-bold text-[#1F3D2B]">
                {editingActivity ? 'Edit Activity' : 'Add New Activity'}
              </h3>
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Activity Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Morning 4x4 Jeep Safari"
                  value={activityForm.activity_name}
                  onChange={(e) => setActivityForm({ ...activityForm, activity_name: e.target.value })}
                  required
                  className="w-full text-xs rounded-xl border border-gray-200 p-2.5 focus:border-[#D9A441] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Price per Person (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="1800"
                    value={activityForm.price}
                    onChange={(e) => setActivityForm({ ...activityForm, price: e.target.value })}
                    required
                    className="w-full text-xs rounded-xl border border-gray-200 p-2.5 focus:border-[#D9A441] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Duration (Minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="180"
                    value={activityForm.duration_minutes}
                    onChange={(e) => setActivityForm({ ...activityForm, duration_minutes: e.target.value })}
                    required
                    className="w-full text-xs rounded-xl border border-gray-200 p-2.5 focus:border-[#D9A441] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Tell visitors about this safari experience..."
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                  className="w-full text-xs rounded-xl border border-gray-200 p-2.5 focus:border-[#D9A441] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">What to carry</label>
                <input
                  type="text"
                  placeholder="Government ID, binoculars, water bottle, neutral clothing"
                  value={activityForm.what_to_carry}
                  onChange={(e) => setActivityForm({ ...activityForm, what_to_carry: e.target.value })}
                  className="w-full text-xs rounded-xl border border-gray-200 p-2.5 focus:border-[#D9A441] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={activitySaving}
                  className="px-5 py-2 rounded-xl bg-[#D9A441] text-[#1F3D2B] text-xs font-semibold hover:bg-[#c99534] transition disabled:opacity-50"
                >
                  {activitySaving ? 'Saving...' : 'Save Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ MODAL: Guides Management ═══════════════════════════════════════ */}
      {isGuideModalOpen && (
        <GuidesModal
          sanctuaryId={selectedSanctuaryId}
          guides={guides}
          onClose={() => setIsGuideModalOpen(false)}
          onRefresh={() => loadData(selectedSanctuaryId, currentWeekMonday)}
        />
      )}

      {/* ════ MODAL: Vehicles Management ═════════════════════════════════════ */}
      {isVehicleModalOpen && (
        <VehiclesModal
          sanctuaryId={selectedSanctuaryId}
          vehicles={vehicles}
          onClose={() => setIsVehicleModalOpen(false)}
          onRefresh={() => loadData(selectedSanctuaryId, currentWeekMonday)}
        />
      )}
    </AdminLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponent: Guides Dialog
// ─────────────────────────────────────────────────────────────────────────────
function GuidesModal({ sanctuaryId, guides, onClose, onRefresh }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [experience, setExperience] = useState('5');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAddGuide = async (e) => {
    e.preventDefault();
    setError('');
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Guide phone number must be exactly 10 digits.');
      return;
    }
    setSaving(true);
    try {
      await client.post('/admin/guides', {
        sanctuary_id: sanctuaryId,
        name,
        phone: cleanPhone,
        experience,
      });
      setName('');
      setPhone('');
      setExperience('5');
      onRefresh();
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to add guide');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGuide = async (id) => {
    if (!window.confirm('Delete this guide?')) return;
    try {
      await client.delete(`/admin/guides/${id}`);
      onRefresh();
    } catch (err) {
      alert(err.data?.error || err.message || 'Cannot delete guide');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E5DAC6] shadow-xl animate-scaleUp">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <h3 className="font-serif text-lg font-bold text-[#1F3D2B]">
            Sanctuary Guides
          </h3>
          <button type="button" onClick={onClose} className="w-7 h-7 text-gray-400 hover:text-gray-700">✕</button>
        </div>

        {error && <div className="mb-3 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">{error}</div>}

        {/* Existing Guides List */}
        <div className="max-h-48 overflow-y-auto space-y-2 mb-4 pr-1">
          {guides.length === 0 ? (
            <div className="text-center text-xs text-gray-400 py-4">No guides registered yet.</div>
          ) : (
            guides.map((g) => (
              <div key={g.guide_id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs">
                <div>
                  <span className="font-semibold text-gray-800">{g.name}</span>
                  <span className="text-gray-400 ml-2 font-mono">{g.phone}</span>
                  <span className="text-gray-500 ml-2">({g.experience} yrs exp)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteGuide(g.guide_id)}
                  className="text-gray-400 hover:text-red-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Guide Form */}
        <form onSubmit={handleAddGuide} className="pt-3 border-t border-gray-100 space-y-3">
          <h4 className="text-xs font-bold text-[#1F3D2B] uppercase tracking-wider">Register New Guide</h4>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Guide Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="text-xs border rounded-lg p-2 focus:outline-none"
            />
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              placeholder="Phone (10 digits)"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required
              className="text-xs border rounded-lg p-2 focus:outline-none font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="Years of Experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              required
              className="text-xs border rounded-lg p-2 w-36 focus:outline-none"
            />
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-[#D9A441] text-[#1F3D2B] font-semibold text-xs rounded-lg hover:bg-[#c99534] transition"
            >
              {saving ? 'Adding...' : '+ Add Guide'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponent: Vehicles Dialog
// ─────────────────────────────────────────────────────────────────────────────
function VehiclesModal({ sanctuaryId, vehicles, onClose, onRefresh }) {
  const [vehicleType, setVehicleType] = useState('');
  const [capacity, setCapacity] = useState('6');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await client.post('/admin/vehicles', {
        sanctuary_id: sanctuaryId,
        vehicle_type: vehicleType,
        capacity,
      });
      setVehicleType('');
      setCapacity('6');
      onRefresh();
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to add vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Delete this vehicle?')) return;
    try {
      await client.delete(`/admin/vehicles/${id}`);
      onRefresh();
    } catch (err) {
      alert(err.data?.error || err.message || 'Cannot delete vehicle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E5DAC6] shadow-xl animate-scaleUp">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <h3 className="font-serif text-lg font-bold text-[#1F3D2B]">
            Sanctuary Vehicles
          </h3>
          <button type="button" onClick={onClose} className="w-7 h-7 text-gray-400 hover:text-gray-700">✕</button>
        </div>

        {error && <div className="mb-3 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">{error}</div>}

        {/* Existing Vehicles List */}
        <div className="max-h-48 overflow-y-auto space-y-2 mb-4 pr-1">
          {vehicles.length === 0 ? (
            <div className="text-center text-xs text-gray-400 py-4">No vehicles registered yet.</div>
          ) : (
            vehicles.map((v) => (
              <div key={v.vehicle_id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs">
                <div>
                  <span className="font-semibold text-gray-800">{v.vehicle_type}</span>
                  <span className="text-[#1F3D2B] bg-[#EAF3EA] px-2 py-0.5 rounded-md font-bold text-[10px] ml-2">
                    Max {v.capacity} seats
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteVehicle(v.vehicle_id)}
                  className="text-gray-400 hover:text-red-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Vehicle Form */}
        <form onSubmit={handleAddVehicle} className="pt-3 border-t border-gray-100 space-y-3">
          <h4 className="text-xs font-bold text-[#1F3D2B] uppercase tracking-wider">Register New Vehicle</h4>
          <input
            type="text"
            placeholder="Vehicle Type / Registration (e.g. 4x4 Safari Gypsy KA-09-1234)"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            required
            className="w-full text-xs border rounded-lg p-2 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              placeholder="Passenger Capacity"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
              className="text-xs border rounded-lg p-2 w-36 focus:outline-none"
            />
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-[#D9A441] text-[#1F3D2B] font-semibold text-xs rounded-lg hover:bg-[#c99534] transition"
            >
              {saving ? 'Adding...' : '+ Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
