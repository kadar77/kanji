import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { HomePage } from '@/pages/HomePage'
import { CardsPage } from '@/pages/CardsPage'
import { CardDeckPage } from '@/pages/CardDeckPage'
import { CardDetailPage } from '@/pages/CardDetailPage'
import { TestsPage } from '@/pages/TestsPage'
import { TestRunPage } from '@/pages/TestRunPage'
import { TestResultsPage } from '@/pages/TestResultsPage'
import { GamePage } from '@/pages/GamePage'
import { GameSetupPage } from '@/pages/GameSetupPage'
import { GamePlayPage } from '@/pages/GamePlayPage'
import { GameResultsPage } from '@/pages/GameResultsPage'
import { MemoryPage } from '@/pages/MemoryPage'
import { HayaoshiPage } from '@/pages/HayaoshiPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { PrivacyPage } from '@/pages/PrivacyPage'
import { TermsPage } from '@/pages/TermsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="cards" element={<CardsPage />} />
          <Route path="cards/:system/:level" element={<CardDeckPage />} />
          <Route path="cards/:system/:level/:id" element={<CardDetailPage />} />
          <Route path="tests" element={<TestsPage />} />
          <Route path="tests/run" element={<TestRunPage />} />
          <Route path="tests/results" element={<TestResultsPage />} />
          <Route path="game" element={<GamePage />} />
          <Route path="game/quick" element={<GameSetupPage />} />
          <Route path="game/results" element={<GameResultsPage />} />
          <Route path="game/memory" element={<MemoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
        </Route>
        <Route path="game/play" element={<GamePlayPage />} />
        <Route path="game/hayaoshi" element={<HayaoshiPage />} />
      </Routes>
    </BrowserRouter>
  )
}
