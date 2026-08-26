import os from 'node:os'
import { execFileSync } from 'node:child_process'

// Print the ONE network URL that another device can actually open.
//
// ── WHY ────────────────────────────────────────────────────────────────────
//
// `server.host: true` makes Vite advertise every non-internal IPv4 address it
// can see. On a developer machine that is usually three or four, and most of
// them are dead ends:
//
//   Network: http://192.168.56.1:5173/   VirtualBox host-only — no gateway
//   Network: http://172.29.0.1:5173/     Hyper-V / WSL vSwitch — no gateway
//   Network: http://192.168.0.214:5173/  the Wi-Fi card — the real one
//
// They are printed in adapter order, not usefulness order, so the first one is
// routinely a virtual adapter. Copy that onto a phone and it will never
// connect — and the failure looks identical to a firewall problem, a binding
// problem, or a broken app, which is exactly the wrong place to start looking.
//
// ── HOW IT DECIDES ─────────────────────────────────────────────────────────
//
// By DEFAULT ROUTE, not by adapter name. Filtering on names was the obvious
// approach and it does not work: on Windows `os.networkInterfaces()` returns
// the connection name, so VirtualBox's host-only adapter comes back as
// "Ethernet 3" and sails straight through a /VirtualBox|vEthernet/ filter.
//
// An interface with no default route cannot carry traffic to another device,
// whatever it is called — so the routing table is read and only interfaces
// that appear on a `0.0.0.0/0` route survive. That is the same question the
// operating system asks, which makes it the same answer.
//
// If the routing table cannot be read, it falls back to the name heuristic and
// prints every candidate rather than picking one and being confidently wrong.

const VIRTUAL_NAME = /^(vEthernet|VirtualBox|Host-Only|VMware|Hyper-V|Docker|br-|veth|utun|tap|tun|ZeroTier|Tailscale|Loopback|Npcap)/i

/** IPv4 addresses of interfaces that carry a default route. */
function routableAddresses() {
  try {
    if (process.platform === 'win32') {
      // "Active Routes:" rows are: destination netmask gateway interface metric
      const out = execFileSync('route', ['print', '-4'], { encoding: 'utf8', timeout: 4000 })
      const found = new Set()
      for (const line of out.split('\n')) {
        const cols = line.trim().split(/\s+/)
        if (cols.length >= 4 && cols[0] === '0.0.0.0' && cols[1] === '0.0.0.0') {
          found.add(cols[3])   // the interface address this route leaves by
        }
      }
      return found
    }
    // macOS / Linux: `netstat -rn` prints the default route's interface NAME,
    // so map names back to their addresses.
    const out = execFileSync('netstat', ['-rn'], { encoding: 'utf8', timeout: 4000 })
    const ifaces = new Set()
    for (const line of out.split('\n')) {
      const cols = line.trim().split(/\s+/)
      if (cols[0] === 'default' || cols[0] === '0.0.0.0') {
        const name = cols[cols.length - 1]
        if (name && !name.includes('.')) ifaces.add(name)
      }
    }
    const found = new Set()
    for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
      if (!ifaces.has(name)) continue
      for (const a of addrs ?? []) {
        const family = typeof a.family === 'string' ? a.family : `IPv${a.family}`
        if (family === 'IPv4' && !a.internal) found.add(a.address)
      }
    }
    return found
  } catch {
    return null   // unreadable — the caller falls back
  }
}

function candidates() {
  const out = []
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs ?? []) {
      const family = typeof a.family === 'string' ? a.family : `IPv${a.family}`
      if (family !== 'IPv4' || a.internal) continue
      // 169.254.x.x is what an adapter gives itself when DHCP failed — never
      // reachable from anywhere.
      if (a.address.startsWith('169.254.')) continue
      out.push({ name, address: a.address })
    }
  }
  return out
}

export default function lanUrlPlugin() {
  return {
    name: 'worklearn-lan-url',
    apply: 'serve',
    configureServer(server) {
      const original = server.printUrls.bind(server)
      server.printUrls = () => {
        original()

        const { https, port } = server.config.server
        const scheme = https ? 'https' : 'http'
        const log = server.config.logger

        const all = candidates()
        const routable = routableAddresses()
        const usable = routable
          ? all.filter((c) => routable.has(c.address))
          : all.filter((c) => !VIRTUAL_NAME.test(c.name))

        const dim = (s) => `\x1b[2m${s}\x1b[22m`
        log.info('')

        if (usable.length === 1) {
          const { address, name } = usable[0]
          log.info(
            `  \x1b[32m➜\x1b[39m  \x1b[1mOpen on another device\x1b[22m:  ` +
            `\x1b[36m${scheme}://${address}:\x1b[1m${port}\x1b[22m/\x1b[39m  ${dim(`(${name})`)}`
          )
          const dead = all.filter((c) => c.address !== address)
          if (dead.length) {
            log.info(dim(`     Ignore the other Network URLs — ${dead.map((d) => d.address).join(', ')} `
              + 'are virtual adapters with no route off this machine.'))
          }
        } else if (usable.length === 0) {
          log.info('  \x1b[33m➜\x1b[39m  No routable network adapter — this machine is reachable on localhost only.')
        } else {
          log.info('  \x1b[32m➜\x1b[39m  \x1b[1mOpen on another device\x1b[22m:')
          for (const c of usable) {
            log.info(`       \x1b[36m${scheme}://${c.address}:${port}/\x1b[39m  ${dim(`(${c.name})`)}`)
          }
        }

        log.info(dim('     The device must be on the same network. Guest Wi-Fi often blocks device-to-device.'))
        log.info('')
      }
    },
  }
}
