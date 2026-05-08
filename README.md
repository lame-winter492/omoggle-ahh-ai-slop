# omoggle-ahh-ai-slop

MVP random match queue app with Elo updates.

## Features (current)
- Nickname registration
- Real-time queue using Socket.IO
- Random 1v1 match pairing
- Demo score analysis placeholder (1-10) for each player
- Elo update after each match (winner gains, loser loses)
- Re-queue flow for continuous play

## Run locally
```bash
cd omoggle-ahh-ai-slop
npm install
npm start
```

Server starts on `http://0.0.0.0:3000`.

## Try it on iPad
1. Start the app on your computer using `npm start`.
2. Make sure your computer and iPad are on the same Wi-Fi network.
3. On your computer, find your LAN IP (for example `192.168.1.23`):
   - macOS: `ipconfig getifaddr en0` (or `en1`)
   - Linux: `hostname -I`
4. On your iPad Safari, open:
   - `http://<YOUR_LAN_IP>:3000`  
   - Example: `http://192.168.1.23:3000`
5. If it does not load, allow incoming connections in your firewall for Node.js/port 3000.

## Notes
- This is a base MVP. It does **not** include production moderation, authentication, persistence, or real video chat yet.
- The score analysis is a gameplay placeholder and should be replaced with a production system that is:
  - privacy-preserving (clear consent + minimal retention),
  - unbiased/validated across demographics,
  - transparent and appealable (users can challenge outcomes),
  - protected by moderation and abuse safeguards.
