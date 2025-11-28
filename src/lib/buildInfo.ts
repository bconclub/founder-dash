// Build information - updated at build time
// This file can be updated by CI/CD during deployment

export const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString()

// Format date in a deterministic way that doesn't change between server and client
function formatDateDeterministic(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[date.getUTCMonth()]
  const day = date.getUTCDate()
  const year = date.getUTCFullYear()
  const hours = date.getUTCHours()
  const minutes = date.getUTCMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  const displayMinutes = minutes.toString().padStart(2, '0')
  
  return `${month} ${day}, ${year}, ${displayHours}:${displayMinutes} ${ampm}`
}

export function getBuildDate(): string {
  try {
    const buildDate = new Date(BUILD_TIME)
    return formatDateDeterministic(buildDate)
  } catch {
    // Fallback to current date if parsing fails
    return formatDateDeterministic(new Date())
  }
}

