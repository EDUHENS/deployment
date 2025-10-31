'use client';

interface DashboardSelectionProps {
  onSelect: (type: 'educator' | 'student') => void;
}

export default function DashboardSelection({ onSelect }: DashboardSelectionProps) {
  return (
    <div className="min-h-screen flex">
      {/* Educator Card */}
      <div 
        className="dashboard-card educator-card flex-1 cursor-pointer flex items-center justify-center"
        onClick={() => onSelect('educator')}
      >
        <h3 
          className="dashboard-text"
          style={{ 
            color: '#FFF',
            fontFamily: 'Helvetica Neue',
            fontSize: '200px',
            fontStyle: 'normal',
            fontWeight: 700,
            lineHeight: '150%',
            letterSpacing: '-10px'
          }}
        >
          Educator
        </h3>
      </div>

      {/* Student Card */}
      <div 
        className="dashboard-card student-card flex-1 cursor-pointer flex items-center justify-center"
        onClick={() => onSelect('student')}
      >
        <h3 
          className="dashboard-text"
          style={{ 
            color: '#FFF',
            fontFamily: 'Helvetica Neue',
            fontSize: '200px',
            fontStyle: 'normal',
            fontWeight: 700,
            lineHeight: '150%',
            letterSpacing: '-10px'
          }}
        >
          Learner
        </h3>
      </div>
    </div>
  );
}
