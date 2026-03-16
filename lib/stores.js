/**
 * Store Configuration
 * 
 * Each store has:
 * - id: Unique identifier (from USchedule)
 * - name: Display name
 * - address: Physical address
 * - platform: Booking platform (uschedule)
 * - alias: USchedule URL alias
 * - serviceTypeId: Practice Bays service type ID
 * - serviceId: 60-minute practice session service ID
 * 
 * Users can discover their store's IDs from the USchedule URL:
 * 1. Go to the store's booking page
 * 2. Open browser dev tools → Network tab
 * 3. Select "Practice Bays" → look for changefield request
 * 4. service_type_id and service_id will be in the payload
 */

const STORES = [
  {
    id: '1250',
    name: 'Novi, MI',
    address: '21061 Haggerty Rd, Novi, MI 48375',
    platform: 'uschedule',
    alias: 'pgatsnovi',
    serviceTypeId: '10491',  // Practice Bays
    serviceId: '43016'       // 60-Minute Practice Session
  },
  {
    id: '1270',
    name: 'Roseville, MN',
    address: 'Roseville, MN',
    platform: 'uschedule',
    alias: 'pgatsroseville',
    serviceTypeId: '10491',  // Practice Bays (typical)
    serviceId: '43016'       // 60-Minute Practice Session (typical)
  },
  {
    id: '1280',
    name: 'Kennesaw, GA',
    address: 'Kennesaw, GA',
    platform: 'uschedule',
    alias: 'pgatskennesaw',
    serviceTypeId: '10491',
    serviceId: '43016'
  },
  {
    id: '1290',
    name: 'Myrtle Beach, SC',
    address: 'Myrtle Beach, SC',
    platform: 'uschedule',
    alias: 'pgatsmyrtlebeach',
    serviceTypeId: '10491',
    serviceId: '43016'
  },
  {
    id: '1300',
    name: 'Orlando, FL',
    address: 'Orlando, FL',
    platform: 'uschedule',
    alias: 'pgatsorlando',
    serviceTypeId: '10491',
    serviceId: '43016'
  },
  {
    id: '1310',
    name: 'Scottsdale, AZ',
    address: 'Scottsdale, AZ',
    platform: 'uschedule',
    alias: 'pgatsscottsdale',
    serviceTypeId: '10491',
    serviceId: '43016'
  },
  {
    id: '1320',
    name: 'Frisco, TX',
    address: 'Frisco, TX',
    platform: 'uschedule',
    alias: 'pgatsfrisco',
    serviceTypeId: '10491',
    serviceId: '43016'
  },
  {
    id: '1330',
    name: 'Westminster, CO',
    address: 'Westminster, CO',
    platform: 'uschedule',
    alias: 'pgatswestminster',
    serviceTypeId: '10491',
    serviceId: '43016'
  }
];

/**
 * Get store by ID
 */
function getStoreById(id) {
  return STORES.find(s => s.id === id);
}

/**
 * Get store by alias
 */
function getStoreByAlias(alias) {
  return STORES.find(s => s.alias === alias);
}

module.exports = { STORES, getStoreById, getStoreByAlias };
