import { redirect } from 'next/navigation'

export default function Home() {
  // Directly redirect to dashboard
  // The middleware will automatically trap unauthenticated users and send them to /login
  redirect('/workspace')
}
