/**
 * PGA Tour Superstore Locations — USchedule Platform
 * 
 * All verified locations with real Practice Bay service type IDs.
 * Service IDs (individual session types) are auto-discovered at runtime.
 * 
 * To find new stores: check https://clients.uschedule.com/{alias}/booking
 */

const STORES = [
  // MICHIGAN
  { id: 'pgatsnovi', name: 'Novi, MI', address: '21061 Haggerty Rd, Novi, MI 48375', platform: 'uschedule', alias: 'pgatsnovi', serviceTypeId: '10491' },

  // GEORGIA
  { id: 'pgatskennesaw', name: 'Kennesaw, GA', address: 'Kennesaw, GA', platform: 'uschedule', alias: 'pgatskennesaw', serviceTypeId: '3833' },

  // FLORIDA
  { id: 'pgatsorlando', name: 'Orlando, FL', address: 'Orlando, FL', platform: 'uschedule', alias: 'pgatsorlando', serviceTypeId: '3824' },
  { id: 'pgatstampa', name: 'Tampa, FL', address: 'Tampa, FL', platform: 'uschedule', alias: 'pgatstampa', serviceTypeId: '7591' },
  { id: 'pgatsjacksonville', name: 'Jacksonville, FL', address: 'Jacksonville, FL', platform: 'uschedule', alias: 'pgatsjacksonville', serviceTypeId: null },
  { id: 'pgatssarasota', name: 'Sarasota, FL', address: 'Sarasota, FL', platform: 'uschedule', alias: 'pgatssarasota', serviceTypeId: '5990' },

  // ARIZONA
  { id: 'pgatsscottsdale', name: 'Scottsdale, AZ', address: 'Scottsdale, AZ', platform: 'uschedule', alias: 'pgatsscottsdale', serviceTypeId: '3858' },

  // COLORADO
  { id: 'pgatswestminster', name: 'Westminster, CO', address: 'Westminster, CO', platform: 'uschedule', alias: 'pgatswestminster', serviceTypeId: '5932' },

  // TEXAS
  { id: 'pgatssanantonio', name: 'San Antonio, TX', address: 'San Antonio, TX', platform: 'uschedule', alias: 'pgatssanantonio', serviceTypeId: '7449' },
  { id: 'pgatshouston', name: 'Houston, TX', address: 'Houston, TX', platform: 'uschedule', alias: 'pgatshouston', serviceTypeId: '7363' },
  { id: 'pgatsaustin', name: 'Austin, TX', address: 'Austin, TX', platform: 'uschedule', alias: 'pgatsaustin', serviceTypeId: '5880' },

  // NORTH CAROLINA
  { id: 'pgatscharlotte', name: 'Charlotte, NC', address: 'Charlotte, NC', platform: 'uschedule', alias: 'pgatscharlotte', serviceTypeId: '7784' },
  { id: 'pgatsraleigh', name: 'Raleigh, NC', address: 'Raleigh, NC', platform: 'uschedule', alias: 'pgatsraleigh', serviceTypeId: '9332' },

  // OHIO
  { id: 'pgatscolumbus', name: 'Columbus, OH', address: 'Columbus, OH', platform: 'uschedule', alias: 'pgatscolumbus', serviceTypeId: '6440' },

  // INDIANA
  { id: 'pgatsindianapolis', name: 'Indianapolis, IN', address: 'Indianapolis, IN', platform: 'uschedule', alias: 'pgatsindianapolis', serviceTypeId: '5614' },

  // NEW JERSEY
  { id: 'pgatsparamus', name: 'Paramus, NJ', address: 'Paramus, NJ', platform: 'uschedule', alias: 'pgatsparamus', serviceTypeId: '3903' },

  // KENTUCKY
  { id: 'pgatslouisville', name: 'Louisville, KY', address: 'Louisville, KY', platform: 'uschedule', alias: 'pgatslouisville', serviceTypeId: '10987' },

  // MISSOURI
  { id: 'pgatsstlouis', name: 'St. Louis, MO', address: 'St. Louis, MO', platform: 'uschedule', alias: 'pgatsstlouis', serviceTypeId: '11132' },
];

module.exports = { STORES };
