import { clientA } from './clients/clientA.js'
import { clientB } from './clients/clientB.js'

const CLIENTS_BY_ID = {
  [clientA.id]: clientA,
  [clientB.id]: clientB,
}

export function listClients() {
  return Object.values(CLIENTS_BY_ID)
}

export function getClientConfig(clientId) {
  const cfg = CLIENTS_BY_ID[clientId]
  if (!cfg) {
    console.warn('[CONFIG]', 'Unknown clientId', clientId, 'fallback to clientA')
    return CLIENTS_BY_ID[clientA.id]
  }
  return cfg
}

export function getRandomClientId() {
  const ids = Object.keys(CLIENTS_BY_ID)
  return ids[Math.floor(Math.random() * ids.length)]
}

