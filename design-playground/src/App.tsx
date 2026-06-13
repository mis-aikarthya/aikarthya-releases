import { useEffect } from 'react';
import { Shell } from './app/Shell';
import { useEditor } from './store/editorStore';
import { ScreenModelSchema } from './model/schemas';
import profile from '../screens/profile.json';

export default function App() {
  const loadScreen = useEditor((s) => s.loadScreen);
  useEffect(() => { loadScreen(ScreenModelSchema.parse(profile)); }, [loadScreen]);
  return <Shell />;
}
