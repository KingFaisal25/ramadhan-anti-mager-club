/**
 * @jest-environment jsdom
 */

// Mock Browser Environment
global.window = global;
global.document = window.document;
global.navigator = { onLine: true };

// Mock Data
window.CHECKLIST_DATA = [
  { id: 'item_1', nama: 'Sholat Subuh', poin: 10 },
  { id: 'item_2', nama: 'Baca Quran', poin: 15 }
];
window.CHECKLIST_BY_ID = new Map(window.CHECKLIST_DATA.map(i => [i.id, i]));
window.TOTAL_ITEMS = 2;
window.JADWAL = { 1: { imsak: '04:00', subuh: '04:10', maghrib: '18:00' } };

// Mock LocalStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    clear: () => { store = {}; },
    store // Access for verification
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Supabase
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockLte = jest.fn();
const mockChannel = jest.fn();

window.RAMC = {
  supabase: jest.fn(() => ({
    from: jest.fn(() => ({
      select: mockSelect.mockReturnValue({ 
        eq: mockEq.mockReturnValue({ then: jest.fn() }), // simplified chain
        lte: mockLte
      })
    })),
    channel: mockChannel,
    removeChannel: jest.fn()
  })),
  offline: false
};

// Setup chain responses
mockSelect.mockReturnValue({
  eq: mockEq,
  lte: mockLte
});

// Helper to load script
function loadDashboardScript() {
  jest.isolateModules(() => {
    require('../assets/js/dashboard.js');
  });
}

describe('Dashboard Reactivity Tests', () => {
  let app;

  beforeAll(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="toast"></div>
      <div id="dayLabel"></div>
      <div id="dateSub"></div>
      <div id="greetingPill"></div>
      <div id="dailyQuote"></div>
      <div id="monthSub"></div>
      <div id="liveHint"></div>
      <div id="sholatSchedule"></div>
      <div id="iftarCountdown"></div>
      <div id="iftarSub"></div>
      <div id="nengPct"></div><div id="aaPct"></div>
      <div id="todayBar"></div>
      <div id="todayWinner"></div><div id="todaySub"></div>
      <div id="nengMonthPts"></div><div id="aaMonthPts"></div>
      <div id="nengAvg"></div><div id="aaAvg"></div>
      <div id="monthWinner"></div>
      <canvas id="starsCanvas"></canvas>
    `;
    loadDashboardScript();
    app = window.__DashboardApp;
  });

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    app.state.day = 1;
    // Reset mocks default behavior
    mockEq.mockResolvedValue({ data: [], error: null });
    mockLte.mockResolvedValue({ data: [], error: null });
  });

  test('mergeData should prioritize local optimistic updates over server data', () => {
    const serverData = [
      { nama: 'neng', item_id: 'item_1', selesai: false, hari_ke: 1 }, // Server says not done
      { nama: 'neng', item_id: 'item_2', selesai: true, hari_ke: 1 }
    ];
    
    const localData = [
      { nama: 'neng', item_id: 'item_1', selesai: true, hari_ke: 1 } // Local says done (optimistic)
    ];

    const merged = app.mergeData(serverData, localData);
    
    // Should have 2 items
    expect(merged.length).toBe(2);
    
    // Item 1 should be TRUE (from local)
    const item1 = merged.find(i => i.item_id === 'item_1');
    expect(item1.selesai).toBe(true);
    
    // Item 2 should be TRUE (from server, untouched locally)
    const item2 = merged.find(i => i.item_id === 'item_2');
    expect(item2.selesai).toBe(true);
  });

  test('getLocalChecklistData should correctly parse localStorage', () => {
    // Setup local storage
    const checklistData = [
      ['item_1', { nama: 'neng', item_id: 'item_1', selesai: true }]
    ];
    localStorage.setItem('ramc_prog_v3:neng:1', JSON.stringify(checklistData));
    
    const data = app.getLocalChecklistData(1);
    
    expect(data.length).toBe(1);
    expect(data[0].item_id).toBe('item_1');
    expect(data[0].selesai).toBe(true);
  });

  test('loadToday should merge server and local data', async () => {
    // Mock Server Data
    mockEq.mockResolvedValue({ 
      data: [{ nama: 'neng', item_id: 'item_1', selesai: false, hari_ke: 1 }],
      error: null 
    });
    
    // Mock Local Data
    const checklistData = [
      ['item_1', { nama: 'neng', item_id: 'item_1', selesai: true }]
    ];
    localStorage.setItem('ramc_prog_v3:neng:1', JSON.stringify(checklistData));
    
    const result = await app.loadToday();
    
    // Should reflect local data (TRUE)
    const item = result.find(i => i.item_id === 'item_1');
    expect(item.selesai).toBe(true);
    
    // Verify loading hint updated
    expect(document.getElementById('liveHint').textContent).toContain('Data terupdate');
  });

  test('refresh should update DOM with merged data', async () => {
     // Mock Server Data
    mockEq.mockResolvedValue({ 
      data: [{ nama: 'neng', item_id: 'item_1', selesai: false, hari_ke: 1 }],
      error: null 
    });
    
    // Mock Local Data (Optimistic Update)
    const checklistData = [
      ['item_1', { nama: 'neng', item_id: 'item_1', selesai: true }]
    ];
    localStorage.setItem('ramc_prog_v3:neng:1', JSON.stringify(checklistData));
    
    await app.refresh();
    
    // DOM should show 50% (1 of 2 items done)
    // Total items = 2. Done = 1.
    expect(document.getElementById('nengPct').textContent).toBe('50%');
  });
});
