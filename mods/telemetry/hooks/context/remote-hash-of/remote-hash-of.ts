import { hexOf } from './hex-of'
import { normalizedRemoteOf } from './normalized-remote-of'
import { REMOTE_HASH_LENGTH } from './remote-hash-length'

/**
 * The rows' `rh`: the first hex digits of the SHA-256 of the session's
 * normalized origin remote, the key the CLI's own rows join a repository by.
 *
 * @param remote the origin remote as `$.session.repo()` answers it
 * @returns the hash, or undefined outside a recognized remote
 */
export async function remoteHashOf(
  remote: string | null | undefined,
): Promise<string | undefined> {
  const normalized = remote ? normalizedRemoteOf(remote) : undefined

  if (normalized === undefined) {
    return undefined
  }

  // TextEncoder returns a standalone Uint8Array. Copy into a fresh
  // ArrayBuffer-backed view so newer Node type definitions agree with
  // the DOM BufferSource type expected by SubtleCrypto.
  const encoded = new TextEncoder().encode(normalized)
  const digestInput = new Uint8Array(encoded.byteLength)
  digestInput.set(encoded)

  return hexOf(
    await crypto.subtle.digest('SHA-256', digestInput.buffer as ArrayBuffer),
  ).slice(0, REMOTE_HASH_LENGTH)
}
