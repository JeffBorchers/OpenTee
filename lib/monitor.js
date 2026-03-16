/**
 * USchedule Monitor Engine
 * Self-contained module for monitoring USchedule practice bay availability
 * 
 * Ported from pga-bay-sniper/uschedule-monitor.cjs
 * Changes:
 * - No hardcoded targets — uses user preferences
 * - No hardcoded store — uses store config
 * - Callback-based alerts instead of Telegram
 * - No OpenClaw gateway dependency (optional auto-booking)
 */

const https = require('https');

class UScheduleMonitor {
  constructor(config) {
    // Required config
    this.storeAlias = config.storeAlias;
    this.serviceTypeId = config.serviceTypeId;
    this.serviceId = config.serviceId;
    this.preferences = config.preferences || {};
    this.credentials = config.credentials || {};
    
    // Callbacks
    this.onSlotFound = config.onSlotFound || (() => {});
    this.onAlert = config.onAlert || (() => {});
    this.onLog = config.onLog || (() => {});
    
    // State
    this.running = false;
    this.lastCheck = null;
    this.slotsFound = 0;
    this.mode = 'stopped';
    this.logs = [];
    this.sessionCookies = '';
    this.intervalId = null;
    this.bookedSlots = [];
  }
  
  // --- Logging ---
  log(msg) {
    const ts = new Date().toLocaleString('en-US', { timeZone: 'America/Detroit' });
    const line = `[${ts}] ${msg}`;
    this.logs.unshift(line);
    if (this.logs.length > 100) this.logs.pop();
    this.onLog(msg);
  }
  
  // --- Time helpers ---
  getESTNow() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Detroit' }));
  }
  
  getCheckMode() {
    const est = this.getESTNow();
    const h = est.getHours();
    const m = est.getMinutes();
    const mins = h * 60 + m;
    
    // Drop Hunt: 2:45 AM - 3:30 AM EST
    const dropStart = 2 * 60 + 45;
    const dropEnd = 3 * 60 + 30;
    // Post-Drop: 3:30 AM - 8:00 AM EST
    const postEnd = 8 * 60;
    
    if (mins >= dropStart && mins < dropEnd) return 'drop-hunt';
    if (mins >= dropEnd && mins < postEnd) return 'post-drop';
    return 'maintenance';
  }
  
  getIntervalForMode(mode) {
    switch (mode) {
      case 'drop-hunt': return { base: 60000, jitter: 10000 };      // ~1 min
      case 'post-drop': return { base: 300000, jitter: 30000 };    // ~5 min
      default: return { base: 1800000, jitter: 60000 };            // ~30 min
    }
  }
  
  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
  
  // --- HTTP helpers ---
  parseCookies(headers) {
    const setCookies = headers['set-cookie'] || [];
    const cookies = {};
    
    if (this.sessionCookies) {
      this.sessionCookies.split('; ').forEach(c => {
        const [k, v] = c.split('=');
        if (k && v) cookies[k] = v;
      });
    }
    
    setCookies.forEach(sc => {
      const parts = sc.split(';')[0];
      const [k, v] = parts.split('=');
      if (k && v) cookies[k.trim()] = v.trim();
    });
    
    return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
  }
  
  httpsGet(urlPath) {
    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'clients.uschedule.com',
        path: urlPath,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Cookie': this.sessionCookies
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          this.sessionCookies = this.parseCookies(res.headers);
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        });
      });
      req.on('error', reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error('GET timeout')); });
      req.end();
    });
  }
  
  httpsPost(urlPath, jsonBody) {
    return new Promise((resolve, reject) => {
      const bodyStr = JSON.stringify(jsonBody);
      const req = https.request({
        hostname: 'clients.uschedule.com',
        path: urlPath,
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
          'Cookie': this.sessionCookies,
          'Accept': '*/*',
          'Origin': 'https://clients.uschedule.com',
          'Referer': `https://clients.uschedule.com/${this.storeAlias}/booking`,
          'X-Requested-With': 'XMLHttpRequest'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          this.sessionCookies = this.parseCookies(res.headers);
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        });
      });
      req.on('error', reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error('POST timeout')); });
      req.write(bodyStr);
      req.end();
    });
  }
  
  // --- Session management ---
  async ensureSession() {
    if (!this.sessionCookies) {
      this.log('🔄 Creating new session...');
      await this.httpsGet(`/${this.storeAlias}/booking`);
      await this.sleep(500);
    }
    
    // ALWAYS re-select service type and service before checking
    await this.httpsPost(`/${this.storeAlias}/booking/changefield`, [
      { Name: 'service_type_id', Value: this.serviceTypeId }
    ]);
    await this.sleep(300);
    await this.httpsPost(`/${this.storeAlias}/booking/changefield`, [
      { Name: 'service_id', Value: this.serviceId }
    ]);
    await this.sleep(300);
  }
  
  // --- Slot parsing ---
  parseSlots(html) {
    const slots = [];
    const itemRegex = /next_avail_item[^>]*data-time="(\d+)"[^>]*data-empid="([^"]*)"[^>]*>[\s\S]*?<strong>([^<]+)<\/strong>[\s\S]*?<div>([^<]+)<\/div>/g;
    let match;
    
    while ((match = itemRegex.exec(html)) !== null) {
      slots.push({
        timeCode: match[1],
        empId: match[2] || '0',
        dateText: match[3].trim(),
        service: match[4].trim()
      });
    }
    
    const lastAvailMatch = html.match(/lastAvailTime\s*=\s*'(\d+)'/);
    const lastAvailTime = lastAvailMatch ? lastAvailMatch[1] : null;
    
    return { slots, lastAvailTime };
  }
  
  parseTimeCode(code) {
    const month = parseInt(code.slice(0, 2));
    const day = parseInt(code.slice(2, 4));
    const year = parseInt(code.slice(4, 8));
    const hour = parseInt(code.slice(8, 10));
    const min = parseInt(code.slice(10, 12));
    const d = new Date(year, month - 1, day, hour, min);
    return { date: d, dayOfWeek: d.getDay(), hour, min };
  }
  
  isPracticeSession(slot) {
    return slot.service.includes('Practice') || slot.service.includes('29.99');
  }
  
  // --- Target matching ---
  isUserTarget(timeCode) {
    const { dayOfWeek, hour } = this.parseTimeCode(timeCode);
    const prefs = this.preferences;
    
    if (!prefs.days || !prefs.times) return false;
    
    // Map day index to day key
    const dayMap = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };
    const dayKey = dayMap[dayOfWeek];
    
    if (!prefs.days.includes(dayKey)) return false;
    
    // Map hour to time key
    const hourToKey = {
      6: '6am', 7: '7am', 8: '8am', 9: '9am', 10: '10am', 11: '11am',
      12: '12pm', 13: '1pm', 14: '2pm', 15: '3pm', 16: '4pm', 17: '5pm',
      18: '6pm', 19: '7pm', 20: '8pm', 21: '9pm'
    };
    
    const timeKey = hourToKey[hour];
    if (!timeKey || !prefs.times.includes(timeKey)) return false;
    
    return true;
  }
  
  // --- Main check ---
  async checkOnce() {
    const mode = this.getCheckMode();
    this.mode = mode;
    
    const modeLabels = {
      'drop-hunt': '🎯 DROP HUNT',
      'post-drop': '🔍 POST-DROP',
      'maintenance': '💤 MAINTENANCE'
    };
    
    this.log(`--- Check (${modeLabels[mode]}) ---`);
    
    try {
      await this.ensureSession();
      
      const resp = await this.httpsGet(`/${this.storeAlias}/booking`);
      
      if (resp.status !== 200) {
        this.log(`❌ HTTP ${resp.status} — resetting session`);
        this.sessionCookies = '';
        return [];
      }
      
      let html = resp.body;
      
      // Validate we're seeing practice sessions
      const { slots: initialSlots } = this.parseSlots(html);
      if (initialSlots.length > 0 && !initialSlots.some(s => this.isPracticeSession(s))) {
        this.log(`⚠️ Slots don't look like Practice Sessions — resetting`);
        this.sessionCookies = '';
        await this.ensureSession();
        const retry = await this.httpsGet(`/${this.storeAlias}/booking`);
        html = retry.body;
      }
      
      // Parse slots
      let { slots, lastAvailTime } = this.parseSlots(html);
      
      // Paginate — "Show More Results"
      let pages = 0;
      this.log(`📄 Initial: ${slots.length} slots`);
      
      while (lastAvailTime && pages < 20) {
        await this.sleep(800);
        await this.httpsPost(`/${this.storeAlias}/booking/changefield`, [
          { Name: 'more_next_avail', Value: lastAvailTime }
        ]);
        await this.sleep(400);
        
        const nextPage = await this.httpsGet(`/${this.storeAlias}/booking`);
        const nextParsed = this.parseSlots(nextPage.body);
        
        if (nextParsed.slots.length === 0 || nextParsed.lastAvailTime === lastAvailTime) {
          break;
        }
        
        const existingCodes = new Set(slots.map(s => s.timeCode));
        for (const s of nextParsed.slots) {
          if (!existingCodes.has(s.timeCode)) {
            slots.push(s);
          }
        }
        
        lastAvailTime = nextParsed.lastAvailTime;
        pages++;
      }
      
      // Filter to practice sessions only
      slots = slots.filter(s => this.isPracticeSession(s));
      
      if (slots.length === 0) {
        this.log('⚫ No practice bay availability');
        this.lastCheck = new Date();
        return [];
      }
      
      // Find target matches
      const targetSlots = slots.filter(s => this.isUserTarget(s.timeCode));
      
      this.log(`🟢 ${slots.length} slot(s) found, ${targetSlots.length} match preferences`);
      
      slots.forEach(s => {
        const isTarget = this.isUserTarget(s.timeCode);
        this.log(`  ${isTarget ? '🎯' : '📅'} ${s.dateText} — ${s.service}`);
      });
      
      // Alert on target matches
      if (targetSlots.length > 0) {
        targetSlots.forEach(slot => {
          if (!this.bookedSlots.includes(slot.timeCode)) {
            this.slotsFound++;
            this.onSlotFound({
              timeCode: slot.timeCode,
              dateText: slot.dateText,
              service: slot.service,
              storeAlias: this.storeAlias
            });
          }
        });
      }
      
      this.lastCheck = new Date();
      return slots;
      
    } catch (e) {
      this.log(`❌ Error: ${e.message}`);
      this.sessionCookies = '';
      return [];
    }
  }
  
  // --- Control ---
  start() {
    if (this.running) return;
    
    this.running = true;
    this.mode = this.getCheckMode();
    this.log('🚀 Monitor started');
    
    // Run first check immediately
    this.checkOnce().catch(e => this.log(`Check error: ${e.message}`));
    
    // Schedule recurring checks
    const scheduleNext = () => {
      if (!this.running) return;
      
      const mode = this.getCheckMode();
      const { base, jitter } = this.getIntervalForMode(mode);
      const wait = base + (Math.random() * jitter * 2 - jitter);
      
      this.log(`Next check in ~${Math.round(wait / 60000 * 10) / 10} min`);
      
      this.intervalId = setTimeout(async () => {
        if (this.running) {
          await this.checkOnce().catch(e => this.log(`Check error: ${e.message}`));
          scheduleNext();
        }
      }, Math.max(30000, wait));
    };
    
    scheduleNext();
  }
  
  stop() {
    this.running = false;
    this.mode = 'stopped';
    
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    
    this.log('🛑 Monitor stopped');
  }
  
  getStatus() {
    return {
      running: this.running,
      lastCheck: this.lastCheck ? this.lastCheck.toISOString() : null,
      slotsFound: this.slotsFound,
      mode: this.mode
    };
  }
  
  getLogs(limit = 50) {
    return this.logs.slice(0, limit);
  }
  
  markBooked(timeCode) {
    if (!this.bookedSlots.includes(timeCode)) {
      this.bookedSlots.push(timeCode);
    }
  }
}

module.exports = { UScheduleMonitor };
