import React, { useState, useEffect } from 'react';
import ContainerInput from './components/ContainerInput';
import TeamSelector from './components/TeamSelector';
import CameraCapture from './components/CameraCapture';
import Login from './components/Login';
import { Team, AppSettings, RepairRecord, User } from './types';
import { REPAIR_TEAMS } from './constants';
import { dbService } from './utils';

const App: React.FC = () => {

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [settings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved
      ? JSON.parse(saved)
      : {
          googleScriptUrl:
            'https://script.google.com/macros/s/AKfycbzbjPA2yD7YcpZXNCeD20f8aI8mD9-XczQdq-sqDbbgJCUWFmpdUDvDeQ96kpashwLm/exec',
        };
  });

  const [teams] = useState<Team[]>(() => {
    const saved = localStorage.getItem('repairTeams');
    return saved ? JSON.parse(saved) : REPAIR_TEAMS;
  });

  const [containerNum, setContainerNum] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [records, setRecords] = useState<RepairRecord[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const savedRecords = await dbService.getAllRecords();
      setRecords(savedRecords);
    };
    loadData();
  }, []);

  const handleAddImage = (imgData: string) => {
    setImages((prev) => [...prev, imgData]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const syncRecordToSheet = async (record: RepairRecord): Promise<boolean> => {
    if (!settings.googleScriptUrl) return false;

    try {
      const response = await fetch(settings.googleScriptUrl, {
        method: 'POST',
        body: JSON.stringify({
          id: record.id,
          timestamp: new Date(record.timestamp).toISOString(),
          containerNumber: record.containerNumber,
          team: record.teamName,
          images: record.images,
          editor: user?.username || 'unknown',
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  };

  const handleSaveData = async () => {
    if (!containerNum || !selectedTeamId || images.length === 0) return;

    const teamName =
      teams.find((t) => t.id === selectedTeamId)?.name || 'Unknown';

    const newRecord: RepairRecord = {
      id: Date.now().toString(),
      containerNumber: containerNum,
      teamId: selectedTeamId,
      teamName,
      images,
      timestamp: Date.now(),
      status: 'pending',
      uploadedCount: 0,
    };

    await dbService.saveRecord(newRecord);
    setRecords((prev) => [newRecord, ...prev]);

    const success = await syncRecordToSheet(newRecord);

    const updated: RepairRecord = {
      ...newRecord,
      status: success ? 'synced' : 'error',
      uploadedCount: success ? newRecord.images.length : 0,
    };

    await dbService.saveRecord(updated);
    setRecords((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );

    setContainerNum('');
    setImages([]);
  };

  if (!user) return <Login onLogin={(u) => setUser(u)} />;

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-4">
      <ContainerInput
        value={containerNum}
        onChange={setContainerNum}
      />

      <TeamSelector
        teams={teams}
        selectedTeamId={selectedTeamId}
        onSelect={setSelectedTeamId}
      />

      <CameraCapture
        images={images}
        onAddImage={handleAddImage}
        onRemoveImage={handleRemoveImage}
        isActive={true}
        isCompleted={images.length > 0}
        isDisabled={false}
        onFocus={() => {}}
      />

      <button
        onClick={handleSaveData}
        className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold"
      >
        LƯU & GỬI
      </button>
    </div>
  );
};

export default App;
