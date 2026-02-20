/**
 * @jest-environment jsdom
 */

// Mock Browser Environment Defaults
global.window = global;
global.document = window.document;
global.navigator = { onLine: true, vibrate: jest.fn() };

// Mock Data
window.CHECKLIST_DATA = [
  { id: 'item_1', nama: 'Sholat Subuh', poin: 10, kategori: 'ibadah' },
  { id: 'item_2', nama: 'Baca Quran', poin: 15, kategori: 'ibadah' }
];
window.CHECKLIST_CATEGORIES = ['ibadah'];
window.TOTAL_ITEMS = 2;

// Mock LocalStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Supabase Client
const mockUpsert = jest.fn().mockResolvedValue({ error: null });
const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockIn = jest.fn().mockResolvedValue({ data: [], error: null });

window.RAMC = {
  supabase: jest.fn(() => ({
    from: jest.fn(() => ({
      upsert: mockUpsert,
      select: mockSelect.mockReturnValue({ eq: mockEq.mockReturnValue({ in: mockIn }) })
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn()
    })),
    removeChannel: jest.fn()
  })),
  offline: false
};

// Helper to load script
function loadChecklistScript() {
  // We use require to load the script. Since it's an IIFE that modifies window,
  // we need to ensure window is set up first.
  jest.isolateModules(() => {
    require('../assets/js/checklist.js');
  });
}

describe('Checklist Feature Unit Tests', () => {
  let app;

  beforeAll(() => {
    // Setup DOM elements required by script
    document.body.innerHTML = `
      <div id="toast"></div>
      <div id="dayLabel"></div>
      <div id="datePill"></div>
      <button id="prevDayBtn"></button>
      <button id="nextDayBtn"></button>
      <button id="todayBtn"></button>
      <div id="nengCount"></div><div id="nengPct"></div><div id="nengPts"></div><div id="nengBar"></div><div id="nengSub"></div>
      <div id="aaCount"></div><div id="aaPct"></div><div id="aaPts"></div><div id="aaBar"></div><div id="aaSub"></div>
      <div id="totalPoints"></div><div id="totalCompleted"></div>
      <div id="categoriesWrap"></div>
      <canvas id="confettiCanvas"></canvas>
      <canvas id="starsCanvas"></canvas>
    `;
    
    loadChecklistScript();
    app = window.__ChecklistApp;
  });

  beforeEach(() => {
    localStorage.clear();
    app.state.progress.neng.clear();
    app.state.progress.aa.clear();
    app.state.syncQueue.clear();
    mockUpsert.mockClear();
    jest.clearAllMocks();
  });

  test('calculateStats should return correct initial values', () => {
    const stats = app.calculateStats();
    expect(stats.total).toBe(2);
    expect(stats.neng.done).toBe(0);
    expect(stats.neng.pct).toBe(0);
    expect(stats.neng.pts).toBe(0);
  });

  test('onToggle should update state optimistically', () => {
    // Act
    app.onToggle('neng', 'item_1');
    
    // Assert State
    expect(app.state.progress.neng.has('item_1')).toBe(true);
    expect(app.state.progress.neng.get('item_1').selesai).toBe(true);
    
    // Assert Stats
    const stats = app.calculateStats();
    expect(stats.neng.done).toBe(1);
    expect(stats.neng.pct).toBe(50); // 1/2 * 100
    expect(stats.neng.pts).toBe(10);
  });

  test('onToggle should queue sync request', () => {
    // Act
    app.onToggle('neng', 'item_1');
    
    // Assert Queue
    expect(app.state.syncQueue.size).toBe(1);
    const key = `neng:${app.state.day}:item_1`;
    expect(app.state.syncQueue.has(key)).toBe(true);
    
    // Assert LocalStorage Sync
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  test('processSyncQueue should send data to Supabase', async () => {
    // Arrange
    app.addToSyncQueue({ nama: 'neng', hari_ke: 1, item_id: 'item_1', selesai: true });
    expect(app.state.syncQueue.size).toBe(1);

    // Act
    await app.processSyncQueue();

    // Assert
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ nama: 'neng', item_id: 'item_1', selesai: true }),
      expect.any(Object)
    );
    expect(app.state.syncQueue.size).toBe(0); // Should be cleared after success
  });

  test('processSyncQueue should retry on failure', async () => {
    // Arrange
    mockUpsert.mockRejectedValueOnce(new Error('Network Error'));
    app.addToSyncQueue({ nama: 'neng', hari_ke: 1, item_id: 'item_1', selesai: true });

    // Act
    await app.processSyncQueue();

    // Assert
    expect(mockUpsert).toHaveBeenCalled();
    expect(app.state.syncQueue.size).toBe(1); // Should remain in queue
  });

  test('updateProgress should update DOM elements', () => {
    // Arrange
    app.state.progress.neng.set('item_1', { id: 'item_1', selesai: true, poin: 10 });
    
    // Act
    app.updateProgress();
    
    // Assert DOM
    expect(document.getElementById('nengCount').textContent).toBe('1/2');
    expect(document.getElementById('nengPct').textContent).toBe('50%');
    expect(document.getElementById('nengBar').style.width).toBe('50%');
  });
});
