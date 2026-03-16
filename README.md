# OpenTee 🏌️

Your open-source tee time and practice bay booking software.

## Quick Start (Self-Hosted)

1. Clone the repo
   ```bash
   git clone https://github.com/JeffBorchers/OpenTee.git
   cd OpenTee
   npm install
   ```

2. Start the server
   ```bash
   npm start
   ```

3. Open http://localhost:3458 in your browser

4. Create an account and follow the setup wizard

5. Enter your USchedule credentials (they stay on your machine)

6. Pick your store, preferred days/times, and start monitoring

## How It Works

OpenTee monitors your PGA Tour Superstore's booking system for available practice bay slots that match your preferences. When a slot opens up, you get alerted immediately.

### Monitoring Modes
- **Drop Hunt** (2:45-3:30 AM EST): Checks every minute during the window when new slots typically appear
- **Post-Drop** (3:30-8:00 AM EST): Checks every 5 minutes to catch any stragglers
- **Maintenance** (rest of day): Checks every 30 minutes for cancellations

### Supported Stores
- Novi, MI
- Roseville, MN
- Kennesaw, GA
- Myrtle Beach, SC
- Orlando, FL
- Scottsdale, AZ
- Frisco, TX
- Westminster, CO

> **Note:** Store service IDs are set to typical values. If your store uses different IDs, you can discover them by:
> 1. Going to your store's booking page on USchedule
> 2. Opening browser dev tools → Network tab
> 3. Selecting "Practice Bays"
> 4. Looking for the `changefield` request - the `service_type_id` and `service_id` will be in the payload

## Self-Hosted vs Hosted

| Feature | Self-Hosted (Free) | Hosted (Coming Soon) |
|---------|-------------------|---------------------|
| Price | Free forever | $2-5 per booking |
| Setup | You run the server | We run it for you |
| Credentials | Stay on your machine | Encrypted on our servers |
| Updates | Manual (git pull) | Automatic |

## Security

- Your USchedule credentials are encrypted with AES-256-GCM
- Credentials never leave your machine
- All data is stored locally in JSON files
- No external services or telemetry

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Stores
- `GET /api/stores` - List all supported stores

### Preferences
- `GET /api/preferences` - Get user preferences
- `POST /api/preferences` - Save preferences

### Credentials
- `GET /api/credentials/status` - Check if credentials are saved
- `POST /api/credentials/save` - Save USchedule credentials (encrypted)
- `POST /api/credentials/test` - Test if credentials work

### Monitor
- `POST /api/monitor/start` - Start monitoring
- `POST /api/monitor/stop` - Stop monitoring
- `GET /api/monitor/status` - Get monitor status
- `GET /api/monitor/logs` - Get recent monitor logs

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings/:id/cancel` - Cancel a booking

### Activity
- `GET /api/activity` - Get recent activity

## Tech Stack
- Node.js + Express
- Vanilla JS (no framework)
- JSON file storage
- PWA (installable on phone)

## Development

```bash
# Install dependencies
npm install

# Start in development mode (with auto-reload)
npx nodemon server.js

# Run tests
npm test
```

## Project Structure

```
OpenTee/
├── server.js           # Main Express server
├── lib/
│   ├── monitor.js      # USchedule monitoring engine
│   └── stores.js       # Store configuration
├── public/
│   ├── app.html        # PWA dashboard
│   ├── login.html      # Login/register page
│   ├── index.html      # Landing page
│   ├── style.css       # Shared styles
│   └── manifest.json   # PWA manifest
├── data/               # Local data storage (created on first run)
│   ├── users.json
│   ├── preferences.json
│   ├── credentials.json
│   ├── bookings.json
│   └── activity.json
└── package.json
```

## Adding New Stores

Edit `lib/stores.js` to add new stores:

```javascript
{
  id: '1234',                    // Unique ID
  name: 'City, State',           // Display name
  address: 'Full address',       // Physical address
  platform: 'uschedule',         // Platform (only uschedule supported)
  alias: 'pgatscityname',        // USchedule URL alias
  serviceTypeId: '10491',        // Practice Bays service type ID
  serviceId: '43016'             // 60-min practice session ID
}
```

## Troubleshooting

### "No USchedule credentials saved"
Go to Settings and enter your PGA Tour Superstore login credentials.

### "No store selected"
Go to the Monitor tab and select your preferred store.

### Monitor not finding slots
- Check your preferred days and times match when slots might be available
- Verify your store's service IDs are correct
- Check the monitor logs in the API for detailed output

### Session expires frequently
The monitor automatically re-creates sessions, but if you're seeing frequent disconnects, try restarting the monitor.

## License
MIT

---

Built with ☕ for golfers who want more time on the range.
