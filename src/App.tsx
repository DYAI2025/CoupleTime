import './i18n'
import { SessionProvider } from './contexts/SessionContext'
import { SessionView } from './components/SessionView'

function App() {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SessionView />
      </div>
    </SessionProvider>
  )
}

export default App
