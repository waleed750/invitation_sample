# Re-provisioning an offline IoT board over Bluetooth: how SyncN talks to KinCony controllers

Smart home controllers lose their Wi-Fi connection more often than anyone would like — a router reboot, a changed password, a network migration. When that happens, the device usually can't reach your backend anymore, and you're left with a board that's alive but unreachable. The only way back in, for most boards, is Bluetooth Low Energy (BLE): connect to it directly from a phone, hand it new Wi-Fi credentials, and wait for it to rejoin the network.

This is the story of how that flow works in SyncN's Flutter app for **KinCony boards** — the ESP32-based controllers behind SyncN's lighting, switch, and energy-monitoring hardware. It's a small feature on paper (scan, connect, send, wait) but it touches almost every hard problem in mobile BLE work: unreliable radios, asynchronous state, a device that talks in a completely different protocol than the rest of the app, and a UI that has to stay honest about what it actually knows.

## The shape of the problem

A KinCony board that's lost its Wi-Fi connection is, from the backend's point of view, just a row in a database that stopped reporting in. The phone is the only bridge back to it, and that bridge is BLE — a protocol built for occasional bursts of data between two devices that don't fully trust each other yet.

The flow has to answer four questions, in order:

1. **Which board is this?** BLE doesn't hand you a list of "your" devices — it hands you every nearby Bluetooth device with a name, and you have to filter to the ones that matter.
2. **How do I talk to it?** Once connected, a board exposes a menu of "characteristics" (think: named mailboxes you can write to or read from). You have to find the right one before you can say anything useful.
3. **What language does it speak?** Every hardware vendor is a little different here, and getting this wrong silently fails instead of throwing a clear error.
4. **Did it actually work?** BLE can tell you "the board accepted your message." It cannot tell you "the board is now on your Wi-Fi network and reachable from the internet." Those are two different facts, and conflating them is where a lot of provisioning flows quietly lie to their users.

The rest of this article walks through how each of those is handled.

## Step 1 — Finding the right boards

KinCony boards, like most BLE peripherals, broadcast an advertisement packet that includes a device name. SyncN boards are named with `SyncN` somewhere in the string — `SyncN_control`, `SyncN_712`, `SyncN_IR`, and so on. The scan filter is a simple case-insensitive match against that keyword, but the interesting part is *where* the name actually lives.

Flutter's BLE plugin (`flutter_blue_plus`) exposes a device's advertised name in three different places depending on the platform and how the scan result arrived: `advertisementData.advName`, `device.advName`, and `device.platformName`. On Android and iOS these don't always agree, and picking only one source meant some real boards simply never showed up in testing. The fix was to check all three, falling back through them in order, and only treat the device as unnamed if all three come back empty.

```dart
factory KinconyBleDeviceModel.fromScanResult(ScanResult result) {
  final advName = result.advertisementData.advName.trim();
  final deviceAdvName = result.device.advName.trim();
  final platformName = result.device.platformName.trim();

  final name = advName.isNotEmpty
      ? advName
      : deviceAdvName.isNotEmpty
          ? deviceAdvName
          : platformName;
  // ...
}
```

This is a small detail, but it's the kind of thing that only surfaces against real hardware — a simulator or a single test phone won't reveal that the three name sources disagree.

### Showing results as they arrive, not after the scan ends

A BLE scan doesn't return a list — it emits a stream of sightings, one board at a time, for as long as the scan runs (30 seconds by default here). The naive way to build this screen is to collect everything for those 30 seconds and then show a finished list. That's simple to write and unpleasant to use: if the board you want appears in the first two seconds, you're still staring at a spinner for the other 28.

Instead, the screen renders the growing list live. Every time the scan stream emits an updated set of matching boards, the UI re-renders with whatever has been found *so far*, and a small "Still scanning… N boards found" indicator stays visible the entire time — including before anything has been found at all, so the very first frame communicates that a live process is underway rather than a static, possibly-empty screen.

```dart
ProvisioningScanning(:final devices, :final selectedDeviceId) => Column(
    children: [
      ScanningLiveHeader(deviceCount: devices.length),
      if (devices.isNotEmpty)
        _DeviceList(devices: devices, selectedDeviceId: selectedDeviceId),
    ],
  ),
```

Each new row also animates in — a quick fade and a slight upward slide — timed to a `ValueKey` built from the board's Bluetooth MAC address. Boards already in the list keep their key and don't replay the animation on every rebuild; only a board that's new to this scan gets the "just arrived" treatment. It's a small piece of polish, but it reinforces the same idea as the live counter: this list is alive, and results are arriving continuously, not all at once at the end.

You can tap a board and connect to it the moment it appears — there's no reason to make someone wait out a fixed timer once they've already seen the board they're looking for.

## Step 2 — Speaking the board's language

Here's the detail that would trip up most integrations: **KinCony boards don't speak JSON**. The rest of the app's provisioning code — the Matter smart-lock flow, for instance — exchanges structured JSON payloads with its devices. KinCony boards expect a flat, comma-separated command string over their Nordic UART—style write characteristic:

```
SET,MyNetworkName,MyPassword123
```

And they reply the same way — plain text, typically just `OK` on success. Sending JSON to this board doesn't produce an error; it produces silence, because the board's firmware is looking for a string starting with `SET,` and nothing more sophisticated than that.

The payload model reflects this directly instead of hiding it behind an abstraction that assumes JSON everywhere:

```dart
factory KinconyBlePayloadModel.wifiCredentials({
  required String ssid,
  required String password,
}) {
  return KinconyBlePayloadModel.raw('SET,$ssid,$password');
}
```

Parsing the response is more defensive, because "plain text, usually" still has to survive whatever a given firmware revision decides to send back. The response parser tries JSON first (in case a newer firmware sends `{"status":"ok","ip":"192.168.1.42"}`), and if that fails, falls back to a plain-text heuristic — checking whether the decoded string contains `ok`, `success`, or `connected`, case-insensitively. If the bytes can't even be decoded as UTF-8, that's treated as its own explicit "malformed response" case rather than crashing or silently reporting failure.

### Finding the right mailbox without hardcoding it

Every BLE peripheral exposes its characteristics under UUIDs — long identifiers that are supposed to be documented by the hardware vendor. In practice, across different KinCony firmware batches, those UUIDs weren't reliable enough to hardcode. The fix was to discover them at connection time: once connected, the app walks the board's advertised services and characteristics, and picks out the ones that look writable and notifiable, rather than gating the entire flow on a specific UUID constant that might not match the board in someone's hand.

This is a real trade-off — auto-detection is less precise than a known-good UUID — but it's the difference between "works on the boards we tested with" and "works on the board the user actually has."

## Step 3 — The part that's easy to get wrong: knowing it actually worked

This is the crux of the whole feature, and it's worth being precise about the distinction it's built around.

**A successful BLE write only tells you the board accepted the message.** It does not tell you the board successfully joined the new Wi-Fi network, got an IP address, and can reach the internet. Those are two entirely separate systems: BLE is a direct radio link between the phone and the board; Wi-Fi connectivity is the board talking to a router and then to SyncN's backend over the internet. A board can happily say "OK" over Bluetooth to credentials that are wrong, misspelled, or point at a network with no internet access — the write still succeeds, and the board still ends up offline.

Treating "the board said OK" as "the board is online" is the single most common shortcut a provisioning flow can take, and it's the one that produces the worst support tickets: *"the app said it worked but my device still shows offline."*

So this flow deliberately splits into two phases:

1. **Send phase** — write the credentials over BLE, wait for the board's plain-text acknowledgment. This can take anywhere from under a second to the full response timeout (15 seconds) if the board is slow to reply.
2. **Verify phase** — once the board has acknowledged, ask the *actual source of truth*: the backend. The backend knows whether the device has connected to the cloud, because the device itself reports in once it's online. The app polls `GET /devices/{id}` — the same endpoint used to populate the device list — and checks the `connection_status` field it returns.

The verification window is 30 seconds, checked every 10 seconds — three checks total, timed to give a typical home router enough time to hand out a DHCP lease and let the board complete its handshake, without leaving the user staring at a spinner indefinitely.

```dart
static const Duration onlineCheckWindow = Duration(seconds: 30);
static const Duration onlineCheckInterval = Duration(seconds: 10);
```

The countdown card on screen isn't decorative — it's counting down the same 30-second window the backend polling loop is running against, with a live "checks: 2 of 3" readout, so what the user sees matches exactly what the app is actually doing behind the scenes.

```
BLE:      [ Send credentials ] → [ "OK" ]
                                      │
                                      ▼
Backend:                  [ 10s ] → check → offline, keep waiting
                           [ 20s ] → check → offline, keep waiting
                           [ 30s ] → check → online!  →  done
                                            (or: still offline → offer retry)
```

If all three checks come back offline, the flow doesn't retry silently or give up — it shows an explicit "still offline" state with two honest options: **check again** (restart the 30-second window, useful if the router was just slow) or **back to devices** (give up and let the user re-check the Wi-Fi details). Nothing is inferred or guessed; every state on screen corresponds to a fact the app actually knows.

### A wrinkle: the board usually disconnects from Bluetooth right when this matters most

There's a detail here that looks like a bug the first time you see it: as soon as a board successfully joins the new Wi-Fi network, it typically **drops its BLE connection** — its radio attention shifts to Wi-Fi, and the direct Bluetooth link the phone was using goes quiet. If the app treated every BLE disconnect as an error (which is the natural default — a dropped connection usually *is* bad news), it would kick the user back out of the screen at the exact moment the board is succeeding.

The fix is a narrow exception: while the app is in the verification phase, a BLE disconnect is expected and ignored. The app only cares about the disconnect signal *before* verification starts (where it does mean something went wrong) or *outside* of an active provisioning attempt entirely.

## Watching it work, honestly

One more principle worth naming, because it shaped several small decisions throughout: the UI never claims to know something the app hasn't actually confirmed. It doesn't say "device online" until the backend has said so. It doesn't hide the fact that a board dropped Bluetooth if that happens outside the expected window. It shows a live, growing scan list instead of a spinner that implies nothing is happening yet. Every animated flourish — the fade-in on a new board, the countdown ring — is attached to something real happening in the background, not decoration layered on top of a flow that's actually just waiting on a fixed timer.

That distinction — between what a device *says* over a wire and what's *actually true* — is really the whole article in one sentence. BLE can tell you a message was received. Only the backend, hearing from the device itself over the internet, can tell you the device is actually back.
