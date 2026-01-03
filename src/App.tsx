import { AppLayout } from './components/layout/AppLayout';
import { useNavigationStore } from './store/navigationStore';
import { Dashboard } from './components/sync/Dashboard';
import { Settings } from './components/settings/Settings';
import { MediaHub } from './components/media/MediaHub';
import { SmartBackup } from './components/backup/SmartBackup';
import { ConflictsViewer } from './components/sync/ConflictsViewer';

function App() {
  const { activeModule } = useNavigationStore();

  const renderContent = () => {
    switch (activeModule) {
      case 'sync':
        return <Dashboard />;
      case 'media':
        return <MediaHub />;
      case 'backup':
        return <SmartBackup />;
      case 'settings':
        return <Settings />;
      case 'conflicts':
        return <ConflictsViewer />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <header className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent capitalize">
            {activeModule.replace('dev', 'DevSuite').replace('sync', 'Sync Center').replace('media', 'Media Hub').replace('backup', 'Smart Backup').replace('conflicts', 'Conflict Resolution')}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Manage your local synchronized environment.</p>
        </header>
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );
}

export default App;
