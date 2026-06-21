import SimpleScoreInputs     from './inputs/SimpleScoreInputs.jsx';
import CalculatedScoreInputs  from './inputs/CalculatedScoreInputs.jsx';
import PeriodsScoreInputs     from './inputs/PeriodsScoreInputs.jsx';
import SetsScoreInputs        from './inputs/SetsScoreInputs.jsx';

interface SportScoreFormProps {
  config: Record<string, any> | null | undefined;
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
}

export default function SportScoreForm({ config, value, onChange }: SportScoreFormProps) {
  if (!config) return null;
  const props = { config, value: value ?? {}, onChange };

  switch (config.scoreType) {
    case 'calculated':           return <CalculatedScoreInputs {...(props as any)} />;
    case 'periods':              return <PeriodsScoreInputs    {...(props as any)} />;
    case 'sets':                 return <SetsScoreInputs       {...(props as any)} />;
    case 'individual_encounters': return null;
    case 'simple':
    default:                     return <SimpleScoreInputs     {...(props as any)} />;
  }
}
