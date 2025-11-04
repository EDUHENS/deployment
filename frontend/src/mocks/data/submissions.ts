import type { StudentSubmission } from '../../features/educator-experience/types';

// TODO(db): Replace mock submissions with API-backed data.
// - Use GET /tasks/:id/submissions (or similar) to fetch per-task submissions
// - Keep this file only as a fallback for local/demo usage

const studentNames = [
  'James Rodriguez', 'Hang Nguyen', 'Emma Johnson', 'Sofia Laaksonen', 'Liam Smith',
  'Aino Korhonen', 'Marcus Chen', 'Isabella Garcia', 'Oliver Thompson', 'Zara Ahmed',
  'Erik Johansson', 'Maya Patel', 'Alex Kim', 'Sophie Martin', 'David Wilson',
  'Luna Rodriguez', 'Noah Anderson', 'Ava Brown', 'Lucas Miller', 'Chloe Davis',
  'William Taylor', 'Grace Lee', 'Henry White', 'Mia Harris', 'Jack Clark',
  'Ella Lewis', 'Benjamin Walker', 'Charlotte Hall', 'Samuel Young', 'Amelia King',
  'Thomas Anderson'
];

const statuses: StudentSubmission['status'][] = ['pending', 'approved', 'needs_revision'];
const assessments: StudentSubmission['aiAssessment']['overall'][] = ['pass', 'fail'];

const createRandomTime = () => {
  const hour = String(Math.floor(Math.random() * 12) + 8).padStart(2, '0');
  const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  return `${hour}:${minute}`;
};

const createAttachment = (name: string, type: 'pdf' | 'github'): { type: 'pdf' | 'github'; name: string; size: string } => ({
  type,
  name,
  size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`
});

export const buildMockSubmissions = (): StudentSubmission[] =>
  studentNames.map((name, index) => {
    const date = `2025-11-${String(index + 1).padStart(2, '0')}`;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const overall = assessments[Math.floor(Math.random() * assessments.length)];
    return {
      id: index + 1,
      studentName: name,
      submissionDate: `${date} ${createRandomTime()}`,
      status,
      aiAssessment: {
        overall,
        details: [
          'Component implementation shows good understanding of React principles.',
          'Props are being used effectively for component communication.',
          'Code structure is well-organized and documented.'
        ]
      },
      attachments: [
        createAttachment(`Submission_${name.replace(' ', '_')}.pdf`, 'pdf'),
        createAttachment(`project-${name.toLowerCase().replace(' ', '-')}.github`, 'github')
      ],
      studentNote: `This is submission ${index + 1} for testing pagination functionality. The project demonstrates understanding of React component architecture and prop usage.`
    };
  });
